import React from 'react';

export const FILTER_FIELDS = {
  project: { label: 'Proyecto', placeholder: 'Todos los proyectos' },
  community: { label: 'Comunidad', placeholder: 'Todas las comunidades' },
  axis: { label: 'Eje de intervención', placeholder: 'Todos los ejes' },
};

export default function FilterSelect({ field, value, options, onChange }) {
  const { label, placeholder } = FILTER_FIELDS[field];
  return (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
