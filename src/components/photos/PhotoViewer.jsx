import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useDialog from '../../hooks/useDialog';
import usePhotoViewer from '../../hooks/usePhotoViewer';
import ViewerToolbar from './ViewerToolbar';
import ViewerStage from './ViewerStage';
import ViewerCaption from './ViewerCaption';
import ViewerThumbnails from './ViewerThumbnails';

export default function PhotoViewer({ photos, initialIndex, onClose }) {
  const ref = useDialog(onClose);
  const viewer = usePhotoViewer({ photos, initialIndex, dialogRef: ref });

  return (
    <div ref={ref} className="lightbox" role="dialog" aria-modal="true" aria-label="Fotografía ampliada" tabIndex={-1}>
      <div className="viewer-shell">
        <ViewerToolbar photo={viewer.photo} zoom={viewer.zoom} onScale={viewer.setScale} onReset={viewer.reset} onClose={onClose} />
        <figure>
          <ViewerStage viewer={viewer} />
          {photos.length > 1 && <>
            <button className="light-nav previous-photo" aria-label="Fotografía anterior" onClick={() => viewer.navigate(-1)}><ChevronLeft /></button>
            <button className="light-nav next-photo" aria-label="Fotografía siguiente" onClick={() => viewer.navigate(1)}><ChevronRight /></button>
          </>}
          <ViewerCaption photo={viewer.photo} index={viewer.index} total={photos.length} />
        </figure>
        <ViewerThumbnails photos={photos} index={viewer.index} onSelect={viewer.setIndex} />
      </div>
    </div>
  );
}
