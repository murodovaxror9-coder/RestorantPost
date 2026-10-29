import { useEffect, useRef } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

export default function useIdleLogout(minutes, onIdle) {
  const timer = useRef(null);

  useEffect(() => {
    if (!minutes) return undefined;
    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(onIdle, minutes * 60000);
    };
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);
}
