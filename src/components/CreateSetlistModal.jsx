import { useState } from 'react';

export default function CreateSetlistModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [event, setEvent] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    onAdd({
      id: `setlist-${Date.now()}`,
      name: name.trim(),
      event: event.trim(),
      date: date || null,
      songIds: [],
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Set List</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Saturday Gig"
            autoFocus
          />
          <label className="form-label">Event / Venue</label>
          <input
            className="form-input"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="e.g. The Blue Moon Bar"
          />
          <label className="form-label">Date</label>
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Create Set List</button>
          </div>
        </form>
      </div>
    </div>
  );
}
