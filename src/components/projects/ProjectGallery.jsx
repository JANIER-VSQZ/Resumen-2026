import React from 'react';
import { Camera } from 'lucide-react';
import GalleryPhoto from '../photos/GalleryPhoto';

export default function ProjectGallery({ project, photos, id, onOpenPhoto }) {
  return (
    <section className="gallery-section" aria-labelledby={id}>
      <div className="gallery-heading">
        <h4 id={id}>Fotografías del proyecto</h4>
        <span className="gallery-count" role="status"><Camera size={14} />{photos.length === project.photos.length ? `${photos.length} fotografías` : `${photos.length} de ${project.photos.length} fotografías`}</span>
      </div>
      <div className="gallery-grid">
        {photos.length ? photos.map((photo, position) => (
          <GalleryPhoto key={photo.id || photo.src + position} photo={photo} featured={position === 0} onClick={onOpenPhoto ? () => onOpenPhoto(photos, position) : undefined} />
        )) : (
          <div className="gallery-empty" role="status">
            <Camera size={24} /><strong>Fotografías pendientes de incorporar</strong>
            <p>Las fotografías de este proyecto se mostrarán aquí cuando estén disponibles.</p>
          </div>
        )}
      </div>
    </section>
  );
}
