import { useEffect, useRef } from 'react';

const clamp = value => Math.max(-1, Math.min(1, value));

export default function useMapHover() {
  const ref = useRef(null);
  const frame = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reducedMotion = useRef(null);

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    ref.current?.style.removeProperty('--cover-map-pointer-x');
    ref.current?.style.removeProperty('--cover-map-pointer-y');
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = preference;
    preference.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    return () => {
      preference.removeEventListener('change', reset);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, []);

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || reducedMotion.current?.matches) return;
    const box = ref.current?.getBoundingClientRect();
    if (!box?.width || !box.height) return;

    // El contenedor permanece fijo para que el movimiento no altere el cálculo.
    pointer.current = {
      x: clamp((event.clientX - box.left) / box.width * 2 - 1),
      y: clamp((event.clientY - box.top) / box.height * 2 - 1),
    };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      ref.current?.style.setProperty('--cover-map-pointer-x', String(pointer.current.x));
      ref.current?.style.setProperty('--cover-map-pointer-y', String(pointer.current.y));
    });
  }

  return { ref, onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}
