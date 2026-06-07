import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oagqkgjgzauwgklpwsfc.supabase.co',
  'sb_publishable_lIhITdSahKCr5Q1uXauSYQ_2-3UAPYd'
);

const SONGS = [
  { title: 'Get Lucky', artist: 'Martin Miller' },
  { title: 'Duvet', artist: 'Bôa' },
  { title: 'Rolling In The Deep', artist: 'Greta Van Fleet' },
  { title: 'Somewhere Only We Know', artist: 'Keane' },
  { title: 'Dreams', artist: 'The Cranberries' },
  { title: 'Proud Mary', artist: 'Creedence Clearwater Revival' },
  { title: "I'm Still Standing", artist: 'Elton John' },
  { title: 'Get Back', artist: 'The Beatles' },
  { title: 'Heart Of Glass', artist: 'Blondie' },
  { title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper' },
  { title: 'Hold the Line', artist: 'TOTO' },
  { title: 'The Power Of Love', artist: 'Huey Lewis & The News' },
  { title: 'Dancing with Myself', artist: 'Billy Idol' },
  { title: 'All Star', artist: 'Smash Mouth' },
  { title: 'Take on Me', artist: 'a-ha' },
  { title: 'Take Me Out', artist: 'Franz Ferdinand' },
  { title: 'Sex on Fire', artist: 'Kings of Leon' },
  { title: 'Learn to Fly', artist: 'Foo Fighters' },
  { title: 'Starlight', artist: 'Muse' },
  { title: 'Times Like These', artist: 'Foo Fighters' },
  { title: 'Last Nite', artist: 'The Strokes' },
  { title: 'Blitzkrieg Bop', artist: 'Ramones' },
  { title: 'All The Small Things', artist: 'blink-182' },
  { title: 'Basket Case', artist: 'Green Day' },
  { title: "Don't Stop Me Now", artist: 'Queen' },
  { title: 'Even Flow', artist: 'Pearl Jam' },
  { title: 'Jump', artist: 'Van Halen' },
];

async function searchLRCLIB(title, artist) {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  const res = await fetch(`https://lrclib.net/api/search?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const seen = new Set();
  const hits = data
    .filter(item => item.syncedLyrics)
    .sort((a, b) => {
      const al = artist.toLowerCase();
      return (a.artistName.toLowerCase() === al ? 0 : 1) - (b.artistName.toLowerCase() === al ? 0 : 1);
    })
    .filter(item => {
      const key = `${item.trackName.toLowerCase()}||${item.artistName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return hits[0] || null;
}

async function run() {
  console.log('🔍 Searching LRCLIB for all songs...\n');

  const found = [];
  const missing = [];

  for (const song of SONGS) {
    const hit = await searchLRCLIB(song.title, song.artist);
    if (hit) {
      found.push({
        id: `lrclib-${hit.id}`,
        title: hit.trackName,
        artist: hit.artistName,
        source: 'local',
        lrc: hit.syncedLyrics,
      });
      console.log(`✅ ${song.title} — ${hit.artistName}`);
    } else {
      missing.push(song);
      console.log(`❌ ${song.title} — ${song.artist} (no synced lyrics)`);
    }
    await new Promise(r => setTimeout(r, 150)); // be polite to the API
  }

  console.log(`\n📦 Inserting ${found.length} songs into Supabase...`);
  const { error: songsErr } = await supabase.from('songs').upsert(found);
  if (songsErr) { console.error('Songs error:', songsErr.message); process.exit(1); }

  const setlistId = `setlist-mad-dogs-${Date.now()}`;
  const { error: slErr } = await supabase.from('setlists').insert({
    id: setlistId,
    name: 'Mad Dogs',
    event: null,
    date: null,
    song_ids: found.map(s => s.id),
  });
  if (slErr) { console.error('Setlist error:', slErr.message); process.exit(1); }

  console.log(`\n🎸 Set list "Mad Dogs" created with ${found.length} songs!`);
  if (missing.length) {
    console.log(`\n⚠️  No synced lyrics found for:`);
    missing.forEach(s => console.log(`   - ${s.title} (${s.artist})`));
  }
}

run();
