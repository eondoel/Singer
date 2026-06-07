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
      const artistLower = (artist || '').toLowerCase();
      return (a.artistName.toLowerCase() === artistLower ? 0 : 1) -
             (b.artistName.toLowerCase() === artistLower ? 0 : 1);
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

export default function SearchPanel({ setlists, onSelect, onSave, onAddToSetlist }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingTo, setAddingTo] = useState(null); // song id showing setlist picker

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setAddingTo(null);
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
          {loading ? '…' : '🔍 Search'}
        </button>
      </form>
      <p className="search-hint">Searches LRCLIB for synced lyrics — Enter or tap Search</p>

      {error && <p className="search-error">{error}</p>}
      {loading && <p className="search-loading">Searching…</p>}

      {results.length > 0 && (
        <div className="results-section">
          <p className="results-label">🌐 {results.length} results</p>
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
                    🎸 Chords/Tab
                  </a>
                )}
              </div>
              <div className="song-row-actions" style={{ flexDirection: 'column', gap: 4 }}>
                <button
                  className="btn btn--small btn--primary"
                  onClick={() => onSelect(song)}
                >
                  Open
                </button>
                {setlists.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn btn--small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingTo(addingTo === song.id ? null : song.id);
                      }}
                    >
                      + Set List
                    </button>
                    {addingTo === song.id && (
                      <div className="setlist-picker">
                        {setlists.map((sl) => (
                          <button
                            key={sl.id}
                            className="setlist-picker-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSave(song);
                              onAddToSetlist(sl.id, song);
                              setAddingTo(null);
                            }}
                          >
                            {sl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="search-empty-state">
          <p>Search online for any song to get synced lyrics.</p>
          <p>To add chords, use the <strong>🎸 Chords/Tab</strong> link and add them manually via <strong>+ Add Song</strong>.</p>
        </div>
      )}
    </div>
  );
}
