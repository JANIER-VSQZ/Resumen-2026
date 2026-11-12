import React, { useEffect, useState } from 'react';
import { Maximize2, Star } from 'lucide-react';
import { formatDate, photoPosition } from '../../content';
import PhotoPlaceholder from './PhotoPlaceholder';

export default function GalleryPhoto({ photo, onClick, featured }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.src]);
  const interactive = Boolean(onClick);
  const Container = interactive ? 'button' : 'figure';
  const Frame = interactive ? 'span' : 'div';
  const Caption = interactive ? 'span' : 'figcaption';
  const Description = interactive ? 'span' : 'p';
  const responsive = photo.thumbnail && photo.width && photo.thumbnailWidth;
  return (
    <Container
      className={'gallery-img' + (featured ? ' featured-photo' : '') + (interactive ? ' is-interactive' : '')}
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-label={interactive ? 'Ampliar fotografía: ' + (photo.community || 'Fotografía institucional') : undefined}
    >
      <Frame className="photo-frame">
        {!photo.src || failed ? <PhotoPlaceholder photo={photo} as={interactive ? 'span' : 'div'} /> : <img
          src={photo.thumbnail || photo.src}
          srcSet={responsive ? `${photo.thumbnail} ${photo.thumbnailWidth}w, ${photo.src} ${photo.width}w` : undefined}
          sizes={responsive ? '(max-width: 900px) 45vw, (max-width: 1200px) 30vw, 22vw' : undefined}
          alt={photo.description || photo.community || 'Fotografía institucional'}
          loading={featured ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition: photoPosition(photo) }}
          onError={() => setFailed(true)}
        />}
        {interactive && <span className="photo-zoom" aria-hidden="true"><Maximize2 size={16} /></span>}
        {photo.featured && <span className="photo-featured-label"><Star size={11} /> Destacada</span>}
      </Frame>
      <Caption className="photo-caption">
        <strong>{photo.community || 'Comunidad sin registrar'}</strong>
        <small>{formatDate(photo.date)}</small>
        <span>{photo.project || 'Archivo del territorio'}</span>
        {photo.description && <Description className="photo-description">{photo.description}</Description>}
      </Caption>
    </Container>
  );
}
