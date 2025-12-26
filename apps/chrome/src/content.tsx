import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@acme/ui/button";

// Content script component
const ContentWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  // Listen for messages from popup
  React.useEffect(() => {
    const messageListener = (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => {
      if (request.type === "POPUP_MESSAGE") {
        setMessages((prev) => [...prev, request.message]);
        setIsVisible(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setIsVisible(false), 3000);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 10000,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        maxWidth: "300px",
      }}
    >
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Acme Extension</h3>
        {messages.map((message, index) => (
          <div key={index} className="rounded bg-gray-100 p-2 text-sm">
            {message}
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setIsVisible(false)}>
          Close
        </Button>
      </div>
    </div>
  );
};

// Create and inject the widget
const createWidget = () => {
  // Check if widget already exists
  const existingWidget = document.getElementById("acme-extension-widget");
  if (existingWidget) {
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "acme-extension-widget";
  container.style.all = "initial";
  document.body.appendChild(container);

  // Create shadow DOM for style isolation
  const shadowRoot = container.attachShadow({ mode: "open" });
  const shadowContainer = document.createElement("div");
  shadowRoot.appendChild(shadowContainer);

  // Inject basic styles
  const style = document.createElement("style");
  style.textContent = `
    * {
      box-sizing: border-box;
    }
  `;
  shadowRoot.appendChild(style);

  // Render React component
  const root = createRoot(shadowContainer);
  root.render(<ContentWidget />);
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createWidget);
} else {
  createWidget();
}

export {};
