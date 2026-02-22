#!/usr/bin/env node
// Tab manager for Chrome debug instances.
// Usage:
//   node tabs.js save   <port> <file>   — save open tab URLs to file
//   node tabs.js restore <port> <file>  — restore tabs from file
//   node tabs.js list   <port>          — list open tabs

const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const [, , command, port, filePath] = process.argv;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${data}`)); }
      });
    }).on("error", reject);
  });
}

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;

    function send(method, params = {}) {
      const msgId = ++id;
      return new Promise((res) => {
        const handler = (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.id === msgId) {
            ws.removeListener("message", handler);
            res(msg.result);
          }
        };
        ws.on("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.on("open", () => resolve({ send, close: () => ws.close() }));
    ws.on("error", reject);
  });
}

async function getPageTabs(portNum) {
  const targets = await httpGet(`http://127.0.0.1:${portNum}/json`);
  return targets.filter((t) => t.type === "page" && !t.url.startsWith("chrome://"));
}

async function save() {
  const tabs = await getPageTabs(port);
  const urls = tabs.map((t) => t.url);
  fs.writeFileSync(filePath, JSON.stringify(urls, null, 2));
  console.log(`Saved ${urls.length} tab(s) to ${filePath}`);
}

async function restore() {
  if (!fs.existsSync(filePath)) {
    console.log("No saved tabs file found");
    return;
  }

  const urls = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!urls.length) {
    console.log("No tabs to restore");
    return;
  }

  // Get browser-level websocket for Target.createTarget
  const version = await httpGet(`http://127.0.0.1:${port}/json/version`);
  const browser = await cdp(version.webSocketDebuggerUrl);

  // Get existing tabs to close the default blank tab after restoring
  const existingTabs = await getPageTabs(port);
  const blankTab = existingTabs.find(
    (t) => t.url === "chrome://newtab/" || t.url === "about:blank"
  );

  // Create tabs for each saved URL
  for (const url of urls) {
    await browser.send("Target.createTarget", { url });
  }

  // Close the blank default tab if it exists
  if (blankTab) {
    await browser.send("Target.closeTarget", { targetId: blankTab.id });
  }

  browser.close();

  // Clean up saved file
  fs.unlinkSync(filePath);
  console.log(`Restored ${urls.length} tab(s)`);
}

async function list() {
  const tabs = await getPageTabs(port);
  if (!tabs.length) {
    // Also show chrome:// tabs
    const all = await httpGet(`http://127.0.0.1:${port}/json`);
    const pages = all.filter((t) => t.type === "page");
    if (!pages.length) {
      console.log("No tabs open");
      return;
    }
    pages.forEach((t) => {
      console.log(`  ${t.title.substring(0, 50).padEnd(50)}  ${t.url.substring(0, 70)}`);
    });
    return;
  }
  tabs.forEach((t) => {
    console.log(`  ${t.title.substring(0, 50).padEnd(50)}  ${t.url.substring(0, 70)}`);
  });
}

async function main() {
  switch (command) {
    case "save":    await save(); break;
    case "restore": await restore(); break;
    case "list":    await list(); break;
    default:
      console.error("Usage: tabs.js <save|restore|list> <port> [file]");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
