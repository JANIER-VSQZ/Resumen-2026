import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react';
import { DEPARTMENTS } from '../content';
import { filterProjectCatalog } from '../projects';
import { getScreenHref } from '../navigation';
import TerritoryMap from '../components/map/TerritoryMap';

export default function ProjectsPage({ projects, content, features, filters, onFilterChange, onOpenDepartment, onHome }) {
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 900px)').matches);
  const filtered = useMemo(() => filterProjectCatalog(projects, filters), [projects, filters]);
  const coverage = useMemo(() => new Set(filtered.flatMap(project => project.departments)), [filtered]);
  const hasFilters = Boolean(filters.project || filters.axis);
  const axes = useMemo(() => [...new Set(projects.filter(project => !filters.project || project.id === filters.project).flatMap(project => project.entries.map(entry => entry.project.axis)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [projects, filters.project]);
  const matches = useCallback(name => (!filters.project && !filters.axis) || coverage.has(name), [filters, coverage]);
  const departments = useMemo(() => Object.fromEntries(DEPARTMENTS.map(name => {
    const local = filtered.filter(project => project.departments.includes(name));
    const published = local.some(project => !project.demo);
    return [name, {
      mapThumbnail: content.mapThumbnails.interactive?.[name] || '',
      verified: published,
      demo: !published && local.some(project => project.demo),
      projects: local.map(project => ({ id: project.id, name: project.name })),
    }];
  })), [filtered, content.mapThumbnails.interactive]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => setExpanded(!media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function changeFilters(next) {
    onFilterChange(next);
    setHovered(null);
    setExpanded(true);
  }

  function changeProject(id) {
    const validAxis = projects.filter(project => !id || project.id === id).some(project => project.entries.some(entry => entry.project.axis === filters.axis));
    changeFilters({ project: id, axis: validAxis ? filters.axis : '' });
  }

  function selectDepartment(name) {
    onOpenDepartment(name, filtered);
  }

  return (
    <main className="projectsview map-explorer-page" id="main-content" tabIndex={-1} aria-labelledby="page-title">
      <TerritoryMap features={features} departments={departments} matches={matches} hovered={hovered} onHover={setHovered} onOpen={selectDepartment} />
      <header className="map-explorer-heading">
        <h1 className="page-title page-title--map" id="page-title">
          <span className="map-title-context"></span>
          Resumen <span>proyectos </span>
          <span><em>{content.period}.</em></span>
        </h1>
        
      </header>
      <aside className="map-project-panel" aria-label="Filtros y proyectos del mapa">
        <div className="map-project-panel-heading">
          <h2><SlidersHorizontal size={19} aria-hidden="true" />Explorar proyectos</h2>
          {hasFilters && <button className="map-clear-filters" onClick={() => changeFilters({ project: '', axis: '' })}>Limpiar filtros</button>}
        </div>
        <div className="overview-filters">
          <label htmlFor="overview-project">Proyecto
            <span className="overview-select-wrap">
              <select id="overview-project" value={filters.project} onChange={event => changeProject(event.target.value)}>
                <option value="">Todos los proyectos</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </span>
          </label>
          <label htmlFor="overview-axis">Actividad principal
            <span className="overview-select-wrap">
              <select id="overview-axis" value={filters.axis} onChange={event => changeFilters({ ...filters, axis: event.target.value })}>
                <option value="">Todas las actividades</option>
                {axes.map(axis => <option key={axis} value={axis}>{axis}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </span>
          </label>
        </div>
        <div className="overview-results-heading">
          <h2 id="overview-results-title">Proyectos disponibles</h2>
          <p role="status">{filtered.length} {filtered.length === 1 ? 'proyecto' : 'proyectos'} · {coverage.size} {coverage.size === 1 ? 'departamento' : 'departamentos'}</p>
        </div>
        <button className="overview-results-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="overview-project-results">{expanded ? 'Ocultar proyectos' : 'Ver proyectos'}<ChevronDown size={17} aria-hidden="true" /></button>
        <div className="overview-project-results" id="overview-project-results" hidden={!expanded}>
          {filtered.length ? <nav aria-labelledby="overview-results-title">
            <ul className="overview-project-list">{filtered.map(project => (
              <li key={project.id}>
                <a className="map-project-result" data-project-link={project.id} href={getScreenHref({ view: 'map', selected: project.id })}>
                  <h3>{project.name}</h3>
                  <p><MapPin size={15} aria-hidden="true" />{project.departments.join(' · ')}</p>
                  {project.demo && <span className="overview-demo-label">Demostración</span>}
                  <span className="map-project-result-action">Ver detalle del proyecto</span>
                </a>
              </li>
            ))}</ul>
          </nav> : <div className="overview-empty" role="status">
            <strong>{projects.length ? 'No hay proyectos para esta selección' : 'Proyectos pendientes de incorporar'}</strong>
            <p>{projects.length ? 'Cambia los filtros o selecciona otro departamento del mapa.' : 'Los proyectos publicados aparecerán aquí.'}</p>
          </div>}
        </div>
      </aside>
      <button className="overview-home-brand" onClick={onHome} aria-label="Ir a portada"><img className="institutional-logo" src="/assets/asonog-logo.png" alt="ASONOG" /></button>
    </main>
  );
}
