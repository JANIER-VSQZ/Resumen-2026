import React from 'react';

export default function ViewerStage({ viewer }) {
  const { photo, zoom, offset, failed, setFailed, stageRef, imageRef, setScale, pointerHandlers } = viewer;
  return (
    <div ref={stageRef} className={'viewer-stage' + (zoom > 1 ? ' is-zoomed' : '')} {...pointerHandlers} onDoubleClick={() => setScale(zoom === 1 ? 2 : 1)}>
      {failed ? <p className="viewer-error">No se pudo abrir esta fotografía. Puedes continuar con las siguientes.</p> : (
        <img ref={imageRef} src={photo.src} alt={photo.description || photo.community || 'Fotografía institucional'} draggable="false" onError={() => setFailed(true)} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
      )}
    </div>
  );
}
