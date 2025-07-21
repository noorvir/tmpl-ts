import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@acme/ui/button';
import { Input } from '@acme/ui/input';
import { Label } from '@acme/ui/label';
import './popup.css';

const Popup: React.FC = () => {
  const [tabInfo, setTabInfo] = useState<{ url?: string; title?: string }>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get current tab info
    chrome.runtime.sendMessage({ type: 'GET_TAB_INFO' }, (response) => {
      setTabInfo(response);
    });
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0]!.id!, { 
          type: 'POPUP_MESSAGE', 
          message: message.trim() 
        });
      });
      setMessage('');
    }
  };

  return (
    <div className="w-80 p-4 bg-background text-foreground">
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Acme Extension</h1>
        
        <div className="space-y-2">
          <Label htmlFor="current-tab">Current Tab</Label>
          <div className="text-sm text-muted-foreground">
            <div className="truncate">{tabInfo.title || 'Loading...'}</div>
            <div className="truncate text-xs">{tabInfo.url || ''}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Send Message to Page</Label>
          <Input
            id="message"
            type="text"
            placeholder="Enter a message..."
            value={message}
            onChange={(e) => setMessage((e.target as HTMLInputElement).value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="w-full"
          >
            Send Message
          </Button>
        </div>

        <div className="border-t pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              chrome.tabs.create({ url: 'https://github.com' });
            }}
          >
            Open GitHub
          </Button>
        </div>
      </div>
    </div>
  );
};

// Initialize the popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}