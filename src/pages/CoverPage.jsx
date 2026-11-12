import React from 'react';
import CoverHero from '../components/cover/CoverHero';
import CoverThemes from '../components/cover/CoverThemes';

export default function CoverPage({ content, features, hasDemos, onExplore, onHelp }) {
  return (
    <main className="cover" id="main-content" tabIndex={-1}>
      <CoverHero subtitle={content.subtitle} departments={content.departments} features={features} hasDemos={hasDemos} onExplore={onExplore} onHelp={onHelp} />
      {/* <CoverThemes /> */}
    </main>
  );
}
