import { useState, useEffect, useCallback } from 'react';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { supabase } from './lib/supabase';
import SearchPanel from './components/SearchPanel';
import PrompterView from './components/PrompterView';
import AddSongModal from './components/AddSongModal';
import MyWorkTab from './components/MyWorkTab';
import SetlistView from './components/SetlistView';
import CreateSetlistModal from './components/CreateSetlistModal';
import './index.css';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSong, setActiveSong] = useState(null);
  const [activeSetlist, setActiveSetlist] = useState(null);
  const [tab, setTab] = useState('work');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);

  // ── Load from Supabase on mount ──────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: songsData }, { data: setlistsData }] = await Promise.all([
      supabase.from('songs').select('*').order('created_at'),
      supabase.from('setlists').select('*').order('created_at'),
    ]);

    const remoteSongs = songsData || [];
    const remoteSetlists = (setlistsData || []).map((sl) => ({
      ...sl,
      songIds: sl.song_ids || [],
    }));

    // Migrate localStorage songs to Supabase on first run
    if (remoteSongs.length === 0) {
      const local = (() => {
        try { return JSON.parse(localStorage.getItem('setlist-songs') || '[]'); } catch { return []; }
      })();
      const seed = local.length ? local : SAMPLE_SONGS;
      if (seed.length) {
        await supabase.from('songs').upsert(seed.map(({ id, title, artist, source, lrc }) => ({ id, title, artist, source, lrc })));
        setSongs(seed);
      }
    } else {
      setSongs(remoteSongs);
    }

    setSetlists(remoteSetlists);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Songs ────────────────────────────────────────────────────
  async function saveSong(song) {
    const toSave = { id: song.id, title: song.title, artist: song.artist, source: 'local', lrc: song.lrc };
    setSongs((prev) => prev.find((s) => s.id === toSave.id) ? prev : [...prev, toSave]);
    await supabase.from('songs').upsert(toSave);
  }

  async function addSong(song) {
    setSongs((prev) => [...prev, song]);
    await supabase.from('songs').upsert({ id: song.id, title: song.title, artist: song.artist, source: song.source, lrc: song.lrc });
  }

  // ── Set Lists ────────────────────────────────────────────────
  async function createSetlist(sl) {
    const row = { id: sl.id, name: sl.name, event: sl.event || null, date: sl.date || null, song_ids: [] };
    setSetlists((prev) => [...prev, { ...sl, songIds: [] }]);
    await supabase.from('setlists').insert(row);
  }

  async function deleteSetlist(id) {
    setSetlists((prev) => prev.filter((sl) => sl.id !== id));
    if (activeSetlist?.id === id) setActiveSetlist(null);
    await supabase.from('setlists').delete().eq('id', id);
  }

  async function addSongToSetlist(setlistId, song) {
    await saveSong(song);
    setSetlists((prev) => prev.map((sl) => {
      if (sl.id !== setlistId) return sl;
      if (sl.songIds.includes(song.id)) return sl;
      const newIds = [...sl.songIds, song.id];
      supabase.from('setlists').update({ song_ids: newIds }).eq('id', setlistId);
      return { ...sl, songIds: newIds };
    }));
  }

  async function removeSongFromSetlist(setlistId, songId) {
    setSetlists((prev) => prev.map((sl) => {
      if (sl.id !== setlistId) return sl;
      const newIds = sl.songIds.filter((id) => id !== songId);
      supabase.from('setlists').update({ song_ids: newIds }).eq('id', setlistId);
      return { ...sl, songIds: newIds };
    }));
  }

  async function reorderSetlist(setlistId, newOrder) {
    setSetlists((prev) => prev.map((sl) =>
      sl.id === setlistId ? { ...sl, songIds: newOrder } : sl
    ));
    setActiveSetlist((prev) => prev ? { ...prev, songIds: newOrder } : prev);
    await supabase.from('setlists').update({ song_ids: newOrder }).eq('id', setlistId);
  }

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (activeSong) {
    return (
      <PrompterView
        song={activeSong}
        onBack={() => setActiveSong(null)}
        setlists={setlists}
        onAddToSetlist={addSongToSetlist}
      />
    );
  }

  if (activeSetlist) {
    const fresh = setlists.find((sl) => sl.id === activeSetlist.id) || activeSetlist;
    return (
      <SetlistView
        setlist={fresh}
        songs={songs}
        onBack={() => setActiveSetlist(null)}
        onReorder={reorderSetlist}
        onRemoveSong={removeSongFromSetlist}
        onSelectSong={setActiveSong}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-logo"><i className="fi fi-sr-microphone"></i> Setlist</h1>
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'work' ? 'tab-btn--active' : ''}`} onClick={() => setTab('work')}>
            My Work
          </button>
          <button className={`tab-btn ${tab === 'search' ? 'tab-btn--active' : ''}`} onClick={() => setTab('search')}>
            Search
          </button>
        </div>
        <button className="btn btn--ghost btn--icon-only" onClick={() => setShowAddModal(true)} title="Add song manually">
          + Song
        </button>
      </header>

      <main className="app-main">
        {tab === 'work' ? (
          <MyWorkTab
            setlists={setlists}
            onOpenSetlist={setActiveSetlist}
            onDeleteSetlist={deleteSetlist}
            onCreateSetlist={() => setShowCreateSetlist(true)}
          />
        ) : (
          <SearchPanel
            setlists={setlists}
            onSelect={setActiveSong}
            onSave={saveSong}
            onAddToSetlist={addSongToSetlist}
          />
        )}
      </main>

      {showAddModal && <AddSongModal onAdd={addSong} onClose={() => setShowAddModal(false)} />}
      {showCreateSetlist && <CreateSetlistModal onAdd={createSetlist} onClose={() => setShowCreateSetlist(false)} />}
    </div>
  );
}
