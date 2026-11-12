import { useEffect, useRef, useState } from 'react';

const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
const INITIAL_CAMERA = { zoom: 1, x: 500, y: 317.5 };
const bounded = current => ({
  zoom: clamp(current.zoom, 1, 5),
  x: clamp(current.x, 500 / current.zoom, 1000 - 500 / current.zoom),
  y: clamp(current.y, 317.5 / current.zoom, 635 - 317.5 / current.zoom),
});

export default function useMapCamera({ features, matches, onOpen }) {
  const [camera, setCamera] = useState(INITIAL_CAMERA);
  const svgRef = useRef(null);
  const gesture = useRef(null);
  const points = useRef(new Map());
  const moved = useRef(false);
  const reset = () => setCamera(INITIAL_CAMERA);
  const zoom = factor => setCamera(current => bounded({ ...current, zoom: clamp(current.zoom * factor, 1, 5) }));
  useEffect(() => setCamera(INITIAL_CAMERA), [features]);

  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    points.current.set(event.pointerId, [event.clientX, event.clientY]);
    svgRef.current.setPointerCapture(event.pointerId);
    moved.current = false;
    const positions = [...points.current.values()];
    gesture.current = {
      camera, start: positions[0],
      distance: positions.length === 2 ? Math.hypot(positions[1][0] - positions[0][0], positions[1][1] - positions[0][1]) : null,
    };
  }

  function pointerMove(event) {
    if (!points.current.has(event.pointerId) || !gesture.current) return;
    points.current.set(event.pointerId, [event.clientX, event.clientY]);
    const positions = [...points.current.values()];
    const start = gesture.current;
    const dx = positions[0][0] - start.start[0];
    const dy = positions[0][1] - start.start[1];
    if (Math.hypot(dx, dy) > 5 || positions.length > 1) moved.current = true;
    if (positions.length === 2 && start.distance) {
      const distance = Math.hypot(positions[1][0] - positions[0][0], positions[1][1] - positions[0][1]);
      setCamera(bounded({ ...start.camera, zoom: start.camera.zoom * distance / start.distance }));
    } else if (start.camera.zoom > 1) {
      const rect = svgRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / (1000 / start.camera.zoom), rect.height / (635 / start.camera.zoom));
      setCamera(bounded({ ...start.camera, x: start.camera.x - dx / scale, y: start.camera.y - dy / scale }));
    }
  }

  function pointerUp(event) {
    points.current.delete(event.pointerId);
    // Una selección abre el departamento; arrastrar solo desplaza el mapa.
    if (!moved.current && event.type !== 'pointercancel') {
      const node = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-department]');
      if (node && matches(node.dataset.department)) onOpen(node.dataset.department);
    }
    gesture.current = null;
  }

  return {
    camera, svgRef, zoom, reset,
    viewBox: `${camera.x - 500 / camera.zoom} ${camera.y - 317.5 / camera.zoom} ${1000 / camera.zoom} ${635 / camera.zoom}`,
    pointerHandlers: { onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: pointerUp, onPointerCancel: pointerUp },
  };
}
