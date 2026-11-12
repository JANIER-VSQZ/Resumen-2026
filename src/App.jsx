import React, { useCallback, useEffect, useRef, useState } from 'react';
import { content, mapFeatures } from './data';
import { PHOTO_VIEWER_ENABLED } from './config';
import { hasContent, isPublished } from './content';
import { getAdjacentScreen } from './navigation';
import useFullscreen from './hooks/useFullscreen';
import useMapExplorer from './hooks/useMapExplorer';
import usePresentationKeyboard from './hooks/usePresentationKeyboard';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import HelpModal from './components/help/HelpModal';
import PhotoViewer from './components/photos/PhotoViewer';
import CoverPage from './pages/CoverPage';
import MapPage from './pages/MapPage';
import DepartmentDetail from './pages/DepartmentDetail';

export default function App() {
  const [view, setView] = useState('cover');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ community: '', project: '', axis: '' });
  const [lightbox, setLightbox] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const firstView = useRef(true);
  const { fullscreen, toggleFullscreen } = useFullscreen();
  const explorer = useMapExplorer(content.departments);
  const { filters: mapFilters, setPreview, clearSelection } = explorer;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!firstView.current) document.getElementById('main-content')?.focus({ preventScroll: true });
    firstView.current = false;
  }, [view, selected]);

  const enterDepartment = useCallback(name => {
    if (!hasContent(content.departments[name])) {
      setPreview(name);
      return;
    }
    setSelected(name);
    setFilters({ community: '', ...mapFilters });
    setView('detail');
    clearSelection();
  }, [mapFilters, setPreview, clearSelection]);

  const navigate = useCallback(direction => {
    const next = getAdjacentScreen({ view }, direction);
    if (!next) return;
    setShowHelp(false);
    clearSelection();
    setView(next.view);
  }, [view, clearSelection]);

  usePresentationKeyboard({ disabled: PHOTO_VIEWER_ENABLED && Boolean(lightbox), onNavigate: navigate, onFullscreen: toggleFullscreen });
  const detail = content.departments[selected] || {};

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Ir al contenido</a>
      <AppHeader
        view={view}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      {view === 'cover' && (
        <CoverPage content={content} features={mapFeatures} hasDemos={explorer.demoCount > 0} onExplore={() => setView('map')} onHelp={() => setShowHelp(true)} />
      )}
      {view === 'map' && (
        <MapPage content={content} features={mapFeatures} explorer={explorer} onHome={() => setView('cover')} onOpenDepartment={enterDepartment} />
      )}
      {view === 'detail' && (
        <DepartmentDetail
          key={selected}
          name={selected}
          detail={detail}
          period={content.period}
          verified={isPublished(detail)}
          filters={filters}
          onFilterChange={setFilters}
          onHome={() => setView('cover')}
          onBack={() => setView('map')}
          onOpenPhoto={PHOTO_VIEWER_ENABLED ? (photos, index) => setLightbox({ photos, index }) : undefined}
        />
      )}
      <AppFooter onHelp={() => setShowHelp(true)} />
      {PHOTO_VIEWER_ENABLED && lightbox && <PhotoViewer photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
