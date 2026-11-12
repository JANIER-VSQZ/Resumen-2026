import { useCallback, useEffect, useRef, useState } from 'react';
import { shouldIgnoreShortcut } from '../navigation';

const clamp = (number, min, max) => Math.max(min, Math.min(max, number));

export default function usePhotoViewer({ photos, initialIndex, dialogRef }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const navigate = useCallback(delta => setIndex(current => (current + delta + photos.length) % photos.length), [photos.length]);
  const reset = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const setScale = useCallback(value => {
    const scale = clamp(value, 1, 4);
    setZoom(scale);
    if (scale === 1) setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => { reset(); setFailed(false); }, [index, reset]);
  useEffect(() => {
    const keydown = event => {
      if (shouldIgnoreShortcut(event)) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
      if (['+', '='].includes(event.key)) setZoom(current => clamp(current + .5, 1, 4));
      if (event.key === '-') setZoom(current => clamp(current - .5, 1, 4));
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [navigate]);

  const boundedOffset = useCallback((x, y, scale) => {
    const image = imageRef.current;
    const box = stageRef.current.getBoundingClientRect();
    const ratio = image?.naturalWidth && image?.naturalHeight ? Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight) : 1;
    const maxX = Math.max(0, ((image?.naturalWidth || box.width) * ratio * scale - box.width) / 2);
    const maxY = Math.max(0, ((image?.naturalHeight || box.height) * ratio * scale - box.height) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  useEffect(() => { setOffset(current => boundedOffset(current.x, current.y, zoom)); }, [zoom, boundedOffset]);
  useEffect(() => {
    [photos[(index + 1) % photos.length], photos[(index - 1 + photos.length) % photos.length]].forEach(photo => {
      const image = new Image();
      image.src = photo.src;
    });
    dialogRef.current.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index, photos, dialogRef]);

  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stageRef.current.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    const positions = [...pointers.current.values()];
    gesture.current = {
      start: positions[0], offset, zoom, pinched: positions.length > 1,
      distance: positions.length > 1 ? Math.hypot(positions[1][0] - positions[0][0], positions[1][1] - positions[0][1]) : null,
    };
  }

  function pointerMove(event) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    const positions = [...pointers.current.values()];
    const start = gesture.current;
    if (positions.length > 1 && start.distance) setScale(start.zoom * Math.hypot(positions[1][0] - positions[0][0], positions[1][1] - positions[0][1]) / start.distance);
    else if (start.zoom > 1) setOffset(boundedOffset(start.offset.x + event.clientX - start.start[0], start.offset.y + event.clientY - start.start[1], start.zoom));
  }

  function pointerUp(event) {
    const start = gesture.current;
    if (start && !start.pinched && start.zoom === 1 && event.type !== 'pointercancel') {
      const dx = event.clientX - start.start[0];
      const dy = event.clientY - start.start[1];
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? 1 : -1);
    }
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) gesture.current = null;
  }

  return {
    index, setIndex, photo: photos[index], zoom, offset, failed, setFailed,
    stageRef, imageRef, navigate, reset, setScale,
    pointerHandlers: { onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: pointerUp, onPointerCancel: pointerUp },
  };
}
