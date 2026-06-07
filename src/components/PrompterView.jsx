import { useEffect, useRef, useState, useCallback } from 'react';
import { parseLRC } from '../utils/parseLRC';
import { useTimer } from '../hooks/useTimer';

export default function PrompterView({ song, onBack }) {
  const lines = parseLRC(song.lrc);
  const duration = lines.length ? lines[lines.length - 1].time + 10 : 300;

  const { elapsed, running, play, pause, reset, seek } = useTimer();
  const [autoScroll, setAutoScroll] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1

  const activeIndex = lines.reduce((acc, line, i) => (line.time <= elapsed ? i : acc), -1);

  const lineRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = lineRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, autoScroll]);

  function handleLineClick(time) {
    seek(time);
    setAutoScroll(true);
  }

  function handleScrub(e) {
    seek(parseFloat(e.target.value));
  }

  const startWithCountdown = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        play();
        setAutoScroll(true);
      } else {
        setCountdown(count);
      }
    }, 800);
  }, [play]);

  function togglePlay() {
    if (running) {
      pause();
    } else if (countdown !== null) {
      // cancel countdown
      setCountdown(null);
    } else {
      startWithCountdown();
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div className="prompter">
      {countdown !== null && (
        <div className="countdown-overlay">
          <span key={countdown} className="countdown-number">{countdown}</span>
        </div>
      )}
      <div className="prompter-header">
        <button className="btn btn--ghost" onClick={() => { reset(); onBack(); }}>
          ← Back
        </button>
        <div className="prompter-title">
          <span className="prompter-song-title">{song.title}</span>
          <span className="prompter-song-artist">{song.artist}</span>
        </div>
        <button
          className={`btn btn--ghost ${autoScroll ? 'active' : ''}`}
          onClick={() => setAutoScroll((v) => !v)}
          title="Toggle auto-scroll"
        >
          {autoScroll ? '⇅ Auto' : '⇅ Manual'}
        </button>
      </div>

      <div
        className="prompter-lyrics"
        ref={containerRef}
        onWheel={() => setAutoScroll(false)}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            className={`lyric-block ${i === activeIndex ? 'lyric-block--active' : ''} ${i < activeIndex ? 'lyric-block--past' : ''}`}
            onClick={() => handleLineClick(line.time)}
          >
            <span className="lyric-timestamp">{formatTime(line.time)}</span>
            {line.chord && <span className="lyric-chord">{line.chord}</span>}
            <span className="lyric-text">{line.text || <>&nbsp;</>}</span>
          </div>
        ))}
      </div>

      <div className="transport">
        <div className="transport-scrubber">
          <span className="transport-time">{formatTime(elapsed)}</span>
          <input
            type="range"
            className="scrubber"
            min={0}
            max={duration}
            step={0.1}
            value={Math.min(elapsed, duration)}
            onChange={handleScrub}
            onMouseDown={() => setAutoScroll(false)}
            onTouchStart={() => setAutoScroll(false)}
          />
          <span className="transport-time">{formatTime(duration)}</span>
        </div>
        <div className="transport-buttons">
          <button className="btn-transport" onClick={() => { seek(elapsed - 5); }} title="−5s">⏪</button>
          <button className="btn-transport btn-transport--reset" onClick={reset} title="Reset">⏮</button>
          <button className="btn-transport btn-transport--play" onClick={togglePlay}>
            {running ? '⏸' : '▶'}
          </button>
          <button className="btn-transport" onClick={() => { seek(elapsed + 5); }} title="+5s">⏩</button>
        </div>
      </div>
    </div>
  );
}
