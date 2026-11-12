import React from 'react';
import { Keyboard } from 'lucide-react';

export default function AppFooter({ onHelp }) {
  return (
    <footer className="global-footer">
      <span>© ASONOG · ASOCIACIÓN DE ORGANISMOS NO GUBERNAMENTALES</span>
      <span>MEMORIA INSTITUCIONAL / 2026</span>
      <span className="map-credit">Cartografía: <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></span>
      <button onClick={onHelp}><Keyboard size={15} /> CONTROLES</button>
    </footer>
  );
}
