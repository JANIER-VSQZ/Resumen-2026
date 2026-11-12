import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { formatDate } from '../../content';

export default function ViewerCaption({ photo, index, total }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  useEffect(() => setDescriptionOpen(false), [photo]);
  return (
    <figcaption>
      <div className="viewer-metadata">
        <strong><MapPin size={14} />{photo.community || 'Comunidad sin registrar'}</strong>
        <span>{formatDate(photo.date)}</span>
        <small aria-live="polite">{index + 1} / {total}</small>
      </div>
      <div className="viewer-tags">{photo.project && <span>{photo.project}</span>}{photo.axis && <span>{photo.axis}</span>}</div>
      {photo.description && (
        <div className="viewer-description">
          <p className={descriptionOpen ? '' : 'is-collapsed'}>{photo.description}</p>
          {photo.description.length > 180 && <button onClick={() => setDescriptionOpen(value => !value)} aria-expanded={descriptionOpen}>{descriptionOpen ? 'Leer menos' : 'Leer descripción completa'}</button>}
        </div>
      )}
    </figcaption>
  );
}
