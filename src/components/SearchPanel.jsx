import { useState } from 'react';

async function fetchLRCLIB(query) {
  const [title, ...rest] = query.split(' - ');
  const artist = rest.join(' - ');
  const params = new URLSearchParams({ track_name: title, artist_name: artist || '' });
  const res = await fetch(`https://lrclib.net/api/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set();
  return data
    .filter((item) => item.syncedLyrics)
    .sort((a, b) => {
      // prefer exact artist match
      const artistLower = (artist || '').toLowerCase();
      const aMatch = a.artistName.toLowerCase() === artistLower ? 0 : 1;
      const bMatch = b.artistName.toLowerCase() === artistLower ? 0 : 1;
      return aMatch - bMatch;
    })
    .filter((item) => {
      const key = `${item.trackName.toLowerCase()}||${item.artistName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      id: `lrclib-${item.id}`,
      title: item.trackName,
      artist: item.artistName,
      source: 'search',
      lrc: item.syncedLyrics,
      songsterrUrl: null,
    }));
}

async function fetchSongsterr(query) {
  try {
    const res = await fetch(
      `https://www.songsterr.com/a/wa/suggest?s=${encodeURIComponent(query)}&size=3`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      songsterrUrl: `https://www.songsterr.com/a/wsa/${item.artist.nameWithoutSpaces}-${item.nameWithoutSpaces}-tab-s${item.id}t0`,
      title: item.title,
      artist: item.artist?.name || '',
    }));
  } catch {
    return [];
  }
}

export default function SearchPanel({ songs, onSelect, onSave }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const localFiltered = query.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      )
    : songs;

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const [lrcResults, tabResults] = await Promise.all([
        fetchLRCLIB(query),
        fetchSongsterr(query),
      ]);

      const merged = lrcResults.map((song) => {
        const tab = tabResults.find(
          (t) =>
            t.title.toLowerCase() === song.title.toLowerCase() ||
            t.artist.toLowerCase() === song.artist.toLowerCase()
        );
        return { ...song, songsterrUrl: tab?.songsterrUrl || null };
      });

      setResults(merged);
      if (merged.length === 0) setError('No synced lyrics found. Try "Title - Artist".');
    } catch {
      setError('Search failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='"Song Title - Artist"'
        />
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? '…' : '🔍 Search Online'}
        </button>
      </form>
      <p className="search-hint">Searches LRCLIB for synced lyrics — press the button or hit Enter</p>

      {error && <p className="search-error">{error}</p>}

      {loading && <p className="search-loading">Searching online…</p>}

      {results.length > 0 && (
        <div className="results-section">
          <p className="results-label">🌐 Online results</p>
          {results.map((song) => (
            <div key={song.id} className="song-row song-row--result">
              <div className="song-row-info" onClick={() => onSelect(song)}>
                <span className="song-title">{song.title}</span>
                <span className="song-artist">{song.artist}</span>
                {song.songsterrUrl && (
                  <a
                    className="tab-link"
                    href={song.songsterrUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🎸 Tab
                  </a>
                )}
              </div>
              <div className="song-row-actions">
                <button
                  className="btn btn--small"
                  onClick={(e) => { e.stopPropagation(); onSave(song); }}
                >
                  Save
                </button>
                <button
                  className="btn btn--small btn--primary"
                  onClick={() => onSelect(song)}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="local-section">
        <p className="results-label">📂 Your repertoire{query.trim() ? ' — filtered' : ''}</p>
        {localFiltered.length === 0 && (
          <p className="empty-state" style={{padding: '16px 0'}}>No matches in your repertoire.</p>
        )}
        {localFiltered.map((song) => (
          <div key={song.id} className="song-row" onClick={() => onSelect(song)}>
            <div className="song-row-info">
              <span className="song-title">{song.title}</span>
              <span className="song-artist">{song.artist}</span>
            </div>
            <span className={`source-tag source-tag--${song.source}`}>
              {song.source === 'local' ? 'saved' : 'search'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
