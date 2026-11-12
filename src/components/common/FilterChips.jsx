import React from 'react';
import { X } from 'lucide-react';

export default function FilterChips({ filters, onChange, onClear, clearLabel = 'Limpiar todos', label = 'Filtros activos', className = '' }) {
  const active = Object.entries(filters).filter(([, value]) => value);
  if (!active.length) return null;

  return (
    <div className={['filter-chips', className].filter(Boolean).join(' ')} aria-label={label}>
      {active.map(([field, value]) => (
        <button key={field} onClick={() => onChange({ ...filters, [field]: '' })} aria-label={`Quitar filtro ${value}`}>
          {value}<X size={13} />
        </button>
      ))}
      <button className="clear-filters" onClick={onClear}>{clearLabel}</button>
    </div>
  );
}
