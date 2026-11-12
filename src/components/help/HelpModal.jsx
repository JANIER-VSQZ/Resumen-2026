import React from 'react';
import Modal from '../common/Modal';
import { PHOTO_VIEWER_ENABLED } from '../../config';

export default function HelpModal({ onClose }) {
  return (
    <Modal title="Una memoria construida en comunidad." id="help-title" className="help-modal" onClose={onClose}>
      <p>Recorre Honduras para conocer las fotografías, proyectos y resultados de cada departamento. Los registros publicados se distinguen de los ejemplos de demostración.</p>
      <div className="keyboard-list">
        <div><kbd>→</kbd> Alternar Inicio / Mapa</div>
        <div><kbd>←</kbd> Alternar Inicio / Mapa o volver al mapa</div>
        <div><kbd>F</kbd> Pantalla completa</div>
        <div><kbd>ESC</kbd> Cerrar ventanas</div>
      </div>
      <p>En Inicio y Mapa, tanto ← como → alternan entre esas dos pantallas. Selecciona un departamento en el mapa para abrir sus proyectos. Dentro de un departamento, ← vuelve al mapa y → no cambia de pantalla. Las flechas también funcionan sobre los botones y enlaces; cuando cambian de pantalla, cierran esta ventana.</p>
      <p>Las fotografías y sus descripciones se muestran directamente en la vista de cada proyecto. En los campos de búsqueda y filtros, las flechas conservan su función habitual.</p>
      <p>En el mapa, usa + y − para ampliar y arrastra para desplazarte.</p>
      {PHOTO_VIEWER_ENABLED && <>
        <p>Dentro del visor, las flechas cambian de fotografía y Esc vuelve a la ficha del departamento.</p>
        <p>En el visor, desliza para cambiar de fotografía o toca una miniatura. Puedes ampliar con los controles o con dos dedos.</p>
      </>}
      <p>El mapa, las fuentes y las fotografías incluidas funcionan sin conexión.</p>
    </Modal>
  );
}
