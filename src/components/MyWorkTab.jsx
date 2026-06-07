export default function MyWorkTab({ setlists, onOpenSetlist, onDeleteSetlist, onCreateSetlist }) {
  return (
    <div className="my-work-tab">
      <div className="my-work-header">
        <button className="btn btn--primary" onClick={onCreateSetlist}>+ New Set List</button>
      </div>

      {setlists.length === 0 ? (
        <p className="empty-state">No set lists yet. Create one for your next gig.</p>
      ) : (
        setlists.map((sl) => (
          <div key={sl.id} className="setlist-card" onClick={() => onOpenSetlist(sl)}>
            <div className="setlist-card-info">
              <span className="setlist-card-name">{sl.name}</span>
              {sl.event && <span className="setlist-card-event">{sl.event}</span>}
              {sl.date && (
                <span className="setlist-card-date">
                  {new Date(sl.date + 'T00:00:00').toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <div className="setlist-card-meta">
              <span className="setlist-card-count">{sl.songIds.length} songs</span>
              <button
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); onDeleteSetlist(sl.id); }}
                title="Delete set list"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
