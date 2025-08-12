import React, { useEffect, useState } from "react";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Overlay from "./components/Overlay";

function Main(): React.JSX.Element {
  const [text, setText] = useState("");
  const [clipboardText, setClipboardText] = useState("");
  const [hotkey, setHotkey] = useState("");

  useEffect(() => {
    window.api.getHotkey().then(setHotkey).catch(() => undefined);
  }, []);

  const handleCopy = async () => {
    await window.api.writeClipboard(text);
  };
  const handlePaste = async () => {
    const t = await window.api.readClipboard();
    setClipboardText(t);
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Desktop App</h1>
      <div className="mt-4 grid gap-3">
        <div className="text-sm text-muted-foreground">Global hotkey: {hotkey || "(not set)"}</div>
        <div className="flex gap-2">
          <Button onClick={() => window.api.showOverlay()}>Show Overlay</Button>
          <Button variant="secondary" onClick={() => window.api.toggleRecording()}>Toggle Recording</Button>
          <Button variant="outline" onClick={() => window.api.openSettings()}>Open Settings</Button>
        </div>
        <div className="mt-4">
          <Label htmlFor="copy">Copy/Paste Test</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input id="copy" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type text to copy" />
            <Button onClick={handleCopy}>Copy</Button>
            <Button variant="secondary" onClick={handlePaste}>Paste</Button>
          </div>
          {clipboardText && <div className="mt-2 text-sm">Clipboard: {clipboardText}</div>}
        </div>
      </div>
    </div>
  );
}

function Settings(): React.JSX.Element {
  const [hotkey, setHotkey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.getHotkey().then(setHotkey).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await window.api.setHotkey(hotkey);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div className="mt-4 grid gap-3">
        <Label htmlFor="hk">Global Hotkey (Electron accelerator)</Label>
        <Input id="hk" value={hotkey} onChange={(e) => setHotkey(e.target.value)} placeholder="e.g. CommandOrControl+Shift+R" />
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant="secondary" onClick={() => window.api.goHome()}>Back</Button>
        </div>
      </div>
    </div>
  );
}

export default function App(): React.JSX.Element {
  const [mode, setMode] = useState<"main" | "overlay" | "settings">("main");

  useEffect(() => {
    const applyMode = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "overlay") setMode("overlay");
      else if (hash === "settings") setMode("settings");
      else setMode("main");
    };
    applyMode();
    window.addEventListener("hashchange", applyMode);
    return () => window.removeEventListener("hashchange", applyMode);
  }, []);

  if (mode === "overlay") return <Overlay />;
  if (mode === "settings") return <Settings />;
  return <Main />;
}
