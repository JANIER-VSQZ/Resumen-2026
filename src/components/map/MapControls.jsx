import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

export default function MapControls({ zoom, onZoom, onReset }) {
  return (
    <div className="map-zoom" role="group" aria-label="Escala del mapa">
      <button aria-label="Ampliar mapa" onClick={() => onZoom(1.5)} disabled={zoom >= 5}><Plus size={18} /></button>
      <button aria-label="Reducir mapa" onClick={() => onZoom(1 / 1.5)} disabled={zoom <= 1}><Minus size={18} /></button>
      <button aria-label="Mostrar todo Honduras" onClick={onReset}><RotateCcw size={16} /></button>
    </div>
  );
}
