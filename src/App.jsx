import { useState, useEffect } from 'react';
import { SAMPLE_SONGS } from './data/sampleSongs';
import SearchPanel from './components/SearchPanel';
import PrompterView from './components/PrompterView';
import AddSongModal from './components/AddSongModal';
import './index.css';

const STORAGE_KEY = 'setlist-songs';

function loadSongs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSongs(songs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

export default function App() {
  const [songs, setSongs] = useState(() => loadSongs() ?? SAMPLE_SONGS);
  const [activeSong, setActiveSong] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('repertoire');

  useEffect(() => {
    saveSongs(songs.filter((s) => s.source === 'local'));
  }, [songs]);

  function handleSelect(song) {
    setActiveSong(song);
  }

  function handleSave(song) {
    const toSave = { ...song, source: 'local' };
    setSongs((prev) => {
      if (prev.find((s) => s.id === toSave.id)) return prev;
      return [...prev, toSave];
    });
  }

  function handleDelete(id) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }

  function handleAdd(song) {
    setSongs((prev) => [...prev, song]);
  }

  if (activeSong) {
    return <PrompterView song={activeSong} onBack={() => setActiveSong(null)} />;
  }

  const localSongs = songs.filter((s) => s.source === 'local');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-logo">🎤 Setlist</h1>
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'repertoire' ? 'tab-btn--active' : ''}`}
            onClick={() => setTab('repertoire')}
          >
            Repertoire
          </button>
          <button
            className={`tab-btn ${tab === 'search' ? 'tab-btn--active' : ''}`}
            onClick={() => setTab('search')}
          >
            Search
          </button>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          + Add
        </button>
      </header>

      <main className="app-main">
        {tab === 'repertoire' ? (
          <div className="list-view">
            {localSongs.length === 0 && (
              <p className="empty-state">No songs yet. Add one or search above.</p>
            )}
            {localSongs.map((song) => (
              <div key={song.id} className="song-row" onClick={() => handleSelect(song)}>
                <div className="song-row-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
                <div className="song-row-actions">
                  <span className="source-tag source-tag--local">saved</span>
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SearchPanel
            songs={localSongs}
            onSelect={handleSelect}
            onSave={handleSave}
          />
        )}
      </main>

      {showModal && (
        <AddSongModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
