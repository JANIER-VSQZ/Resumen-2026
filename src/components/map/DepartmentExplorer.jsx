import React from 'react';
import { ArrowRight, Camera, MapPin, Search } from 'lucide-react';
import { hasContent, photoMatches } from '../../content';

function DepartmentListItem({ name, department, filters, onOpen, onHover }) {
  const content = hasContent(department);
  const status = department?.demo ? 'Demostración' : content ? `${department.projects?.length || 0} proyectos` : 'Sin información publicada';
  return (
    <button onClick={() => onOpen(name)} onMouseEnter={() => onHover(name)} onMouseLeave={() => onHover(null)}>
      <span className={'territory-icon' + (department?.demo ? ' demo-icon' : content ? ' published-icon' : '')}><MapPin size={16} /></span>
      <span><strong>{name}</strong><small>{status}</small></span>
      {content ? <span className="list-photo-count"><Camera size={12} />{(department.photos || []).filter(photo => photoMatches(photo, filters)).length}</span> : <ArrowRight size={14} />}
    </button>
  );
}

export default function DepartmentExplorer({ departments, explorer, onOpen }) {
  return (
    <aside className="explore-panel">
      <div className="panel-top"><span>ENCUENTRA UN TERRITORIO</span><MapPin size={17} /></div>
      <label className="department-search">
        <Search size={16} />
        <input type="search" placeholder="Buscar departamento" aria-label="Buscar departamento" value={explorer.query} onChange={event => explorer.updateQuery(event.target.value)} />
      </label>
      <label className="only-content">
        <input type="checkbox" checked={explorer.onlyContent} onChange={event => explorer.setOnlyContent(event.target.checked)} /> Solo departamentos con contenido
      </label>
      {explorer.visibleDepartments.length ? (
        <div className="dept-list">
          {explorer.visibleDepartments.map(name => (
            <DepartmentListItem key={name} name={name} department={departments[name]} filters={explorer.filters} onOpen={onOpen} onHover={explorer.setHovered} />
          ))}
        </div>
      ) : (
        <div className="map-empty" role="status">
          <Search size={26} /><strong>No hay departamentos con esta selección</strong>
          <p>Prueba otro nombre, proyecto o eje.</p>
          <button className="clear-filters" onClick={explorer.clearFilters}>Mostrar todos los departamentos</button>
        </div>
      )}
      <div className="panel-foot">
        {explorer.hasFilters && <button className="clear-filters" onClick={explorer.clearFilters}>Restablecer búsqueda y filtros</button>}
        <span>{explorer.entryCount} territorios para explorar · Los filtros se conservan al volver.</span>
      </div>
    </aside>
  );
}
