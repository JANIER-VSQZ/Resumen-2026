import React from 'react';

const METRICS = [
  ['departments', 'DEPARTAMENTOS PUBLICADOS'],
  ['communities', 'COMUNIDADES REGISTRADAS'],
  ['activities', 'ACTIVIDADES DOCUMENTADAS'],
  ['beneficiaries', 'PERSONAS REGISTRADAS'],
];

export default function MapMetrics({ metrics }) {
  return (
    <section className="metrics" aria-label="Cifras de registros publicados">
      {METRICS.map(([field, label], index) => (
        <div className="metric" key={field}>
          <div className="metric-label">0{index + 1} / {label}</div>
          <strong>{metrics[field] == null ? '—' : Number(metrics[field]).toLocaleString('es-HN')}</strong>
          <small>{metrics[field] == null ? 'DATO PENDIENTE' : 'SEGÚN REGISTROS PUBLICADOS'}</small>
        </div>
      ))}
    </section>
  );
}
