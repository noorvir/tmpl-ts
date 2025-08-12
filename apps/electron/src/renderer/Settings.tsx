import React, { useEffect, useState } from 'react';

export const Settings: React.FC = () => {
  const [hotkey, setHotkey] = useState('');
  const [autoclose, setAutoclose] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.overlayAPI.getSettings().then(s => {
      setHotkey(s.hotkey);
      setAutoclose(s.autocloseAfterPaste);
    });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await window.overlayAPI.setSettings({ hotkey, autocloseAfterPaste: autoclose });
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Global Hotkey</span>
        <input value={hotkey} onChange={e => setHotkey(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white' }} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={autoclose} onChange={e => setAutoclose(e.target.checked)} />
        <span>Auto-close after paste</span>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={saving} onClick={save} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Save</button>
      </div>
      {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
    </div>
  );
};