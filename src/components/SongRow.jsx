export default function SongRow({ song, onSelect, onDelete }) {
  return (
    <div className="song-row" onClick={() => onSelect(song)}>
      <div className="song-row-info">
        <span className="song-title">{song.title}</span>
        <span className="song-artist">{song.artist}</span>
      </div>
      <div className="song-row-actions">
        <span className={`source-tag source-tag--${song.source}`}>
          {song.source === 'local' ? 'saved' : 'search'}
        </span>
        {song.source === 'local' && (
          <button
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); onDelete(song.id); }}
            title="Delete song"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
