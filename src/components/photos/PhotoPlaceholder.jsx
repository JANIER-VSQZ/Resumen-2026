import React from 'react';
import { Camera } from 'lucide-react';

export default function PhotoPlaceholder({ photo, as: Container = 'div' }) {
  return (
    <Container className="photo-placeholder">
      <Camera size={32} strokeWidth={1.3} aria-hidden="true" />
      <strong>Fotografía pendiente de incorporar</strong>
      <span>{photo?.community || 'Pronto compartiremos las imágenes de este territorio.'}</span>
    </Container>
  );
}
