import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { hasContent } from '../../content';
import MapPreview from '../map/MapPreview';

export default function CoverHero({ subtitle, departments, features, hasDemos, onExplore, onHelp }) {
  return (
    <section className="cover-hero" aria-labelledby="cover-title">
      <div className="cover-copy">
        <img className="cover-logo institutional-logo" src="/assets/asonog-logo.png" alt="Logotipo de ASONOG" />
        <div className="eyebrow"><span className="dot" /> Memoria institucional</div>
        <h1 className="page-title page-title--cover" id="cover-title">Nuestra labor<span><em>2026.</em></span></h1>
        <p>{subtitle}</p>
      </div>
      <div className="cover-map-block">
        <MapPreview features={features} departments={departments} hasContent={name => hasContent(departments[name])} onExplore={onExplore} />
      </div>
    </section>
  );
}
