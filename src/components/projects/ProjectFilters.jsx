import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import FilterSelect from '../common/FilterSelect';
import FilterChips from '../common/FilterChips';

export default function ProjectFilters({ projects, filters, onChange, onClear }) {
  const options = field => [...new Set(projects.flatMap(project =>
    field === 'project' ? [project.name] : field === 'axis' ? [project.axis] : project.communities,
  ).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <div className="project-filters">
      <div className="filters" aria-label="Filtros de proyectos y fotografías">
        <SlidersHorizontal size={16} aria-hidden="true" />
        {['project', 'community', 'axis'].map(field => (
          <FilterSelect key={field} field={field} value={filters[field]} options={options(field)} onChange={value => onChange({ ...filters, [field]: value })} />
        ))}
      </div>
      <FilterChips filters={filters} onChange={onChange} onClear={onClear} />
    </div>
  );
}
