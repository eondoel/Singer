import { useState } from 'react';

const PLACEHOLDER_LRC = `[00:00.00][C:Am]First line of the song
[00:05.00][C:F]Second line here
[00:10.00][C:C]Third line...`;

export default function AddSongModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lrc, setLrc] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required.');
    if (!lrc.trim()) return setError('LRC lyrics are required.');
    onAdd({
      id: `local-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      source: 'local',
      lrc: lrc.trim(),
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Song</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
          />
          <label className="form-label">Artist</label>
          <input
            className="form-input"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
          />
          <label className="form-label">
            LRC Lyrics *{' '}
            <span className="form-hint">
              Format: [mm:ss.xx][C:Chord]Lyric line
            </span>
          </label>
          <textarea
            className="form-textarea"
            value={lrc}
            onChange={(e) => setLrc(e.target.value)}
            placeholder={PLACEHOLDER_LRC}
            rows={10}
          />
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Add to Repertoire</button>
          </div>
        </form>
      </div>
    </div>
  );
}
