/**
 * Parses an LRC string (with optional inline chord tags) into structured lines.
 * Supports: [mm:ss.xx][C:Chord]Lyric text
 * Returns: [{ time: number (seconds), text: string, chord: string|null }]
 */
export function parseLRC(lrc) {
  if (!lrc) return [];

  const lines = [];
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](?:\[C:([^\]]*)\])?(.*)$/;

  for (const raw of lrc.split('\n')) {
    const match = raw.trim().match(lineRegex);
    if (!match) continue;

    const [, mm, ss, cs, chord, text] = match;
    const centiseconds = cs.length === 3 ? parseInt(cs) / 1000 : parseInt(cs) / 100;
    const time = parseInt(mm) * 60 + parseInt(ss) + centiseconds;

    lines.push({
      time,
      text: text.trim(),
      chord: chord || null,
    });
  }

  return lines.sort((a, b) => a.time - b.time);
}
