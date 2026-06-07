import { useEffect, useRef, useState, useCallback } from 'react';
import { parseLRC } from '../utils/parseLRC';
import { useTimer } from '../hooks/useTimer';

export default function PrompterView({ song, onBack, setlists = [], onAddToSetlist }) {
  const lines = parseLRC(song.lrc);
  const duration = lines.length ? lines[lines.length - 1].time + 10 : 300;

  const { elapsed, running, play, pause, reset, seek } = useTimer();
  const [autoScroll, setAutoScroll] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1
  const [showSetlistPicker, setShowSetlistPicker] = useState(false);

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
          <i className="fi fi-rr-arrow-left"></i> Back
        </button>
        <div className="prompter-title">
          <span className="prompter-song-title">{song.title}</span>
          <span className="prompter-song-artist">{song.artist}</span>
          {setlists.length > 0 && (
            <div className="prompter-setlist-picker-wrap">
              <button
                className="btn btn--small btn--ghost prompter-add-btn"
                onClick={() => setShowSetlistPicker((v) => !v)}
              >
                <i className="fi fi-rr-add"></i> Set List
              </button>
              {showSetlistPicker && (
                <div className="setlist-picker setlist-picker--centered">
                  <p className="setlist-picker-label">Add to set list</p>
                  {setlists.map((sl) => (
                    <button
                      key={sl.id}
                      className="setlist-picker-item"
                      onClick={() => {
                        onAddToSetlist?.(sl.id, song);
                        setShowSetlistPicker(false);
                      }}
                    >
                      {sl.name}
                      {sl.event ? <span className="setlist-picker-sub"> · {sl.event}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className={`btn btn--ghost ${autoScroll ? 'active' : ''}`}
          onClick={() => setAutoScroll((v) => !v)}
          title="Toggle auto-scroll"
        >
          <i className="fi fi-rr-arrows"></i> {autoScroll ? 'Auto' : 'Manual'}
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
            className={`lyric-block ${i === activeIndex ? 'lyric-block--active' : ''} ${i < activeIndex ? 'lyric-block--past' : ''} ${!line.text ? 'lyric-block--instrumental' : ''}`}
            onClick={() => handleLineClick(line.time)}
          >
            <span className="lyric-timestamp">{formatTime(line.time)}</span>
            {line.chord && <span className="lyric-chord">{line.chord}</span>}
            {line.text
              ? <span className="lyric-text">{line.text}</span>
              : <span className="lyric-instrumental"><i className="fi fi-sr-note"></i></span>
            }
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
            onMouseUp={() => setAutoScroll(true)}
            onTouchStart={() => setAutoScroll(false)}
            onTouchEnd={() => setAutoScroll(true)}
          />
          <span className="transport-time">{formatTime(duration)}</span>
        </div>
        <div className="transport-buttons">
          <button className="btn-transport" onClick={() => { seek(elapsed - 5); }} title="−5s"><i className="fi fi-sr-rewind"></i></button>
          <button className="btn-transport btn-transport--reset" onClick={reset} title="Reset"><i className="fi fi-sr-step-backward"></i></button>
          <button className="btn-transport btn-transport--play" onClick={togglePlay}>
            {running ? <i className="fi fi-sr-pause"></i> : <i className="fi fi-sr-play"></i>}
          </button>
          <button className="btn-transport" onClick={() => { seek(elapsed + 5); }} title="+5s"><i className="fi fi-sr-forward"></i></button>
        </div>
      </div>
    </div>
  );
}
