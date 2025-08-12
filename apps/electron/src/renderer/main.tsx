import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings } from './Settings';

const useTimer = (active: boolean) => {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    let id: number | null = null;
    if (active) {
      setStart(Date.now());
      id = window.setInterval(() => setNow(Date.now()), 200);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [active]);
  const elapsedMs = start ? now - start : 0;
  const mm = Math.floor(elapsedMs / 60000).toString().padStart(2, '0');
  const ss = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [hotkey, setHotkey] = useState('');
  const [autoclose, setAutoclose] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const timer = useTimer(sessionActive);

  useEffect(() => {
    // Load settings
    window.overlayAPI.getSettings().then(s => {
      setHotkey(s.hotkey);
      setAutoclose(s.autocloseAfterPaste);
    });

    window.overlayAPI.onSessionStarted(() => {
      setSessionActive(true);
      setText('');
      setTimeout(() => textRef.current?.focus(), 10);
    });

    window.overlayAPI.onPasteResult((p) => {
      if (p.status === 'ok') {
        setToast('Pasted');
        if (autoclose) {
          setSessionActive(false);
        }
      } else if (p.status === 'copy_only') {
        setToast(p.message || 'Copied to clipboard');
      } else if (p.status === 'error') {
        setToast(p.message || 'Error');
      }
      // keep overlay open unless autoclose
      if (!autoclose) setSessionActive(false);
      setTimeout(() => setToast(null), 1500);
    });

    window.overlayAPI.onPermissionsRequired((_p) => {
      setToast('Enable Accessibility permissions for paste');
    });
  }, [autoclose]);

  useEffect(() => {
    window.overlayAPI.textUpdated({ text, length: text.length });
  }, [text]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(12px)',
    background: 'rgba(20,20,20,0.72)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  }), []);

  const cardStyle: React.CSSProperties = {
    width: 480,
    height: 200,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(30,30,30,0.9)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    position: 'relative',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Timer: {timer}</div>
          <div style={{ marginLeft: 'auto', opacity: 0.8, fontSize: 12 }}>Hotkey: {hotkey}</div>
          <button onClick={() => setShowSettings(s => !s)} title="Settings" style={{ marginLeft: 8, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>⚙</button>
        </div>
        <textarea
          ref={textRef}
          placeholder="Type here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            resize: 'none',
            outline: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            padding: 8,
            borderRadius: 8,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{text.length} chars</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.overlayAPI.stopRequested()}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >Stop and Paste</button>
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >Copy Only</button>
          </div>
        </div>
        {toast && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 12, opacity: 0.9 }}>
            {toast}
          </div>
        )}
        {showSettings && (
          <div style={{ position: 'absolute', top: 44, right: 12, width: 300, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 12 }}>
            <Settings />
          </div>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);