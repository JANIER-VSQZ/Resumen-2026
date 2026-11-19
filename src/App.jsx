import React, { useCallback, useEffect, useRef, useState } from 'react';
import { content, mapFeatures, projects } from './data';
import { PHOTO_VIEWER_ENABLED } from './config';
import { getAdjacentScreen, getDepartmentDestination, getScreenFromHash, getScreenHref } from './navigation';
import useFullscreen from './hooks/useFullscreen';
import usePresentationKeyboard from './hooks/usePresentationKeyboard';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import HelpModal from './components/help/HelpModal';
import PhotoViewer from './components/photos/PhotoViewer';
import CoverPage from './pages/CoverPage';
import ProjectsPage from './pages/ProjectsPage';
import MapPage from './pages/MapPage';
import DepartmentProjectsPage from './pages/DepartmentProjectsPage';
import { getDepartmentProjects } from './projects';

export default function App() {
  const [screen, setScreen] = useState(() => getScreenFromHash(window.location.hash, projects));
  const [lightbox, setLightbox] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [mapFilters, setMapFilters] = useState({ project: '', axis: '' });
  const [departmentLocked, setDepartmentLocked] = useState(() => Boolean(screen.department));
  const firstView = useRef(true);
  const { fullscreen, toggleFullscreen } = useFullscreen();
  const { view, selected } = screen;
  const project = projects.find(item => item.id === selected);

  useEffect(() => {
    const syncScreen = () => {
      const next = getScreenFromHash(window.location.hash, projects);
      setScreen(next);
      setDepartmentLocked(Boolean(next.department));
      setShowHelp(false);
      setLightbox(null);
    };
    window.addEventListener('hashchange', syncScreen);
    return () => window.removeEventListener('hashchange', syncScreen);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!firstView.current) document.getElementById('main-content')?.focus({ preventScroll: true });
    firstView.current = false;
  }, [view, selected]);

  const goTo = useCallback(next => { window.location.hash = getScreenHref(next); }, []);
  const goHome = () => goTo({ view: 'cover' });
  const goToMap = () => goTo({ view: 'projects' });
  const openPhoto = PHOTO_VIEWER_ENABLED ? (photos, index) => setLightbox({ photos, index }) : undefined;
  const openDepartment = useCallback((department, candidates) => {
    goTo(getDepartmentDestination(candidates, department));
  }, [goTo]);
  const changeProjectDepartment = useCallback(department => {
    const next = { view: 'map', selected, ...(department ? { department } : {}) };
    setScreen(next);
    window.history.replaceState(null, '', getScreenHref(next));
  }, [selected]);
  const navigate = useCallback(direction => {
    const next = getAdjacentScreen(screen, direction);
    if (next) goTo(next);
  }, [screen, goTo]);

  usePresentationKeyboard({ disabled: PHOTO_VIEWER_ENABLED && Boolean(lightbox), onNavigate: navigate, onFullscreen: toggleFullscreen });

  return (
    <div className="app">
      <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Ir al contenido</a>
      <AppHeader view={view} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />
      {view === 'cover' && <CoverPage content={content} features={mapFeatures} onExplore={goToMap} />}
      {view === 'projects' && (
        <ProjectsPage
          projects={projects}
          content={content}
          features={mapFeatures}
          filters={mapFilters}
          onFilterChange={setMapFilters}
          onOpenDepartment={openDepartment}
          onHome={goHome}
        />
      )}
      {view === 'department-projects' && (
        <DepartmentProjectsPage
          department={screen.department}
          projects={getDepartmentProjects(projects, screen.department, mapFilters)}
          hasFilters={Boolean(mapFilters.project || mapFilters.axis)}
          period={content.period}
          features={mapFeatures}
          thumbnails={content.mapThumbnails.detail}
          onOpenPhoto={openPhoto}
          onClearFilters={() => setMapFilters({ project: '', axis: '' })}
          onBack={goToMap}
          onHome={goHome}
        />
      )}
      {view === 'map' && project && (
        <MapPage
          key={project.id}
          project={project}
          period={content.period}
          features={mapFeatures}
          thumbnails={content.mapThumbnails.detail}
          department={screen.department}
          departmentLocked={departmentLocked}
          onDepartmentChange={changeProjectDepartment}
          onBack={goToMap}
          onHome={goHome}
          onOpenPhoto={openPhoto}
        />
      )}
      <AppFooter onHelp={() => setShowHelp(true)} />
      {PHOTO_VIEWER_ENABLED && lightbox && <PhotoViewer photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
