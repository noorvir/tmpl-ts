chrome.runtime.onInstalled.addListener(() => {
  console.log('Acme Chrome Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.url);
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  if (request.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ 
        url: tabs[0]?.url,
        title: tabs[0]?.title 
      });
    });
    return true; // Keep the message channel open for async response
  }
});

export {};