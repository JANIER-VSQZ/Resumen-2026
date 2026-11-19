import React from 'react';
import Modal from '../common/Modal';
import { PHOTO_VIEWER_ENABLED } from '../../config';

export default function HelpModal({ onClose }) {
  return (
    <Modal title="Una memoria construida en comunidad." id="help-title" className="help-modal" onClose={onClose}>
      <p>Selecciona el mapa de la portada para comenzar. El mapa general ocupa la pantalla y permite filtrar por proyecto y actividad principal. Haz clic en un departamento: si tiene un proyecto, se abre directamente su detalle; si tiene varios, se muestran todos completos en la misma página, con sus mapas, actividades, logros y fotografías. También puedes abrir «Ver detalle del proyecto» desde el panel.</p>
      <div className="keyboard-list">
        <div><kbd>→</kbd> Alternar Inicio / Mapa</div>
        <div><kbd>←</kbd> Alternar Inicio / Mapa o volver al mapa general</div>
        <div><kbd>F</kbd> Pantalla completa</div>
        <div><kbd>ESC</kbd> Cerrar ventanas</div>
      </div>
      <p>En Inicio y Mapa, tanto ← como → alternan entre esas dos pantallas. En los detalles individuales y en la vista conjunta de un departamento, ← vuelve al mapa general y → conserva la vista. Usa Tab y Enter para seleccionar proyectos y departamentos con el teclado. Las flechas conservan su función habitual dentro de los filtros.</p>
      <p>Cada detalle conserva su propio mapa, actividades, logros e imágenes. La vista de un departamento mantiene ese territorio; vuelve al mapa general para consultar otro. Al abrir un proyecto completo desde el panel, puedes seleccionar departamentos y utilizar «Mostrar todos los departamentos» para recuperar todo su contenido. «Volver al mapa» conserva los filtros del mapa general. En móvil, «Ver proyectos» despliega los accesos a los detalles.</p>
      <p>Las fotografías y sus descripciones se muestran directamente en la vista de cada proyecto. En los campos de búsqueda y filtros, las flechas conservan su función habitual.</p>
      <p>En el mapa, usa + y − para ampliar y arrastra para desplazarte.</p>
      {PHOTO_VIEWER_ENABLED && <>
        <p>Dentro del visor, las flechas cambian de fotografía y Esc vuelve al proyecto.</p>
        <p>En el visor, desliza para cambiar de fotografía o toca una miniatura. Puedes ampliar con los controles o con dos dedos.</p>
      </>}
      <p>El mapa, las fuentes y las fotografías incluidas funcionan sin conexión.</p>
    </Modal>
  );
}
