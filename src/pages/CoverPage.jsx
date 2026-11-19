import React from 'react';
import CoverHero from '../components/cover/CoverHero';

export default function CoverPage({ content, features, onExplore }) {
  return (
    <main className="cover" id="main-content" tabIndex={-1}>
      <CoverHero subtitle={content.subtitle} departments={content.departments} features={features} onExplore={onExplore} />
    </main>
  );
}
