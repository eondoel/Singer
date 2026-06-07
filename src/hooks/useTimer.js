import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * RAF-based high-res timer.
 * Returns { elapsed, running, play, pause, reset, seek }
 */
export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const startTimeRef = useRef(null);   // performance.now() when play was pressed
  const baseElapsedRef = useRef(0);    // accumulated elapsed before last pause
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    const now = performance.now();
    const total = baseElapsedRef.current + (now - startTimeRef.current) / 1000;
    setElapsed(total);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    startTimeRef.current = performance.now();
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    baseElapsedRef.current += (performance.now() - startTimeRef.current) / 1000;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    baseElapsedRef.current = 0;
    startTimeRef.current = null;
    setElapsed(0);
    setRunning(false);
  }, []);

  const seek = useCallback((seconds) => {
    baseElapsedRef.current = Math.max(0, seconds);
    if (running) {
      startTimeRef.current = performance.now();
    }
    setElapsed(Math.max(0, seconds));
  }, [running]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return { elapsed, running, play, pause, reset, seek };
}
