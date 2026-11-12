import React from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';

export default function ViewerToolbar({ photo, zoom, onScale, onReset, onClose }) {
  return (
    <div className="viewer-topbar">
      <div><span className="section-marker">EL TERRITORIO EN IMÁGENES</span><strong>{photo.community || 'Archivo fotográfico'}</strong></div>
      <div className="viewer-tools">
        <button aria-label="Reducir fotografía" onClick={() => onScale(zoom - .5)} disabled={zoom <= 1}><Minus size={18} /></button>
        <button aria-label="Restablecer fotografía" onClick={onReset} className="zoom-value">{Math.round(zoom * 100)}% <RotateCcw size={13} /></button>
        <button aria-label="Ampliar fotografía" onClick={() => onScale(zoom + .5)} disabled={zoom >= 4}><Plus size={18} /></button>
        <button className="closebutton" aria-label="Cerrar fotografía" onClick={onClose} data-autofocus><X size={21} /></button>
      </div>
    </div>
  );
}
