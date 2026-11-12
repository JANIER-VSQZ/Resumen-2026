import React from 'react';
import { photoPosition } from '../../content';

export default function ViewerThumbnails({ photos, index, onSelect }) {
  return (
    <div className="viewer-bottom">
      <span className="viewer-hint">Desliza para cambiar · Doble toque para ampliar</span>
      <div className="viewer-thumbnails" aria-label="Seleccionar fotografía">
        {photos.map((photo, position) => (
          <button key={position} aria-label={`Ver fotografía ${position + 1}`} aria-current={index === position ? 'true' : undefined} onClick={() => onSelect(position)}>
            <img src={photo.thumbnail || photo.src} alt="" loading="lazy" style={{ objectPosition: photoPosition(photo) }} />
          </button>
        ))}
      </div>
    </div>
  );
}
