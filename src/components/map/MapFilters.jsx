import React from 'react';
import FilterSelect from '../common/FilterSelect';
import FilterChips from '../common/FilterChips';

export default function MapFilters({ explorer }) {
  const { filters, options, hasFilters, visibleDepartments, publishedCount, demoCount } = explorer;
  return (
    <>
      <section className="map-filters" aria-label="Filtros del mapa">
        {['project', 'axis'].map(field => (
          <FilterSelect key={field} field={field} value={filters[field]} options={options[field]} onChange={value => explorer.updateFilters({ ...filters, [field]: value })} />
        ))}
        <span className="map-results" role="status">
          {hasFilters ? `${visibleDepartments.length} departamentos coinciden` : `${publishedCount} publicados · ${demoCount} de demostración`}
        </span>
      </section>
      <FilterChips filters={filters} onChange={explorer.setFilters} onClear={explorer.clearFilters} clearLabel="Limpiar filtros" label="Filtros activos del mapa" className="map-filter-chips" />
    </>
  );
}
