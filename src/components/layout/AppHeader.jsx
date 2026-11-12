import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function AppHeader({ view, fullscreen, onToggleFullscreen }) {
  return (
    <header className={'topbar is-' + view}>
      <div className="righttools">
        <button className="iconbutton" title="Pantalla completa (F)" aria-label={fullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'} onClick={onToggleFullscreen}>
          {fullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
        </button>
      </div>
    </header>
  );
}
