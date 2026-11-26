import React from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';

export default function ProjectInformation({ project }) {
  return (
    <aside className="project-info" aria-label={'Información de ' + project.name}>
      {project.axis && (
        <header className="project-info-heading">
          <h4>{project.axis}</h4>
        </header>
      )}
      {project.summary && <p className="project-summary">{project.summary}</p>}
      <section className="info-block project-communities">
        <h4><MapPin size={14} aria-hidden="true" />Comunidades de intervención</h4>
        <ul>{project.communities.map(name => <li key={name}>{name}</li>)}</ul>
      </section>
      <div className="detail-information">
        <details className="info-block project-activities">
          <summary>Actividades destacadas del año<ChevronDown size={16} aria-hidden="true" /></summary>
          <ol>
            {project.activities.map((activity, position) => (
              <li key={position}><span>{String(position + 1).padStart(2, '0')}</span><p>{activity}</p></li>
            ))}
          </ol>
        </details>
        <details className="info-block project-achievements">
          <summary>Logros del proyecto<ChevronDown size={16} aria-hidden="true" /></summary>
          <ul>
            {project.achievements.map((achievement, position) => (
              <li key={position}><Check size={15} aria-hidden="true" /><p>{achievement}</p></li>
            ))}
          </ul>
        </details>
      </div>
    </aside>
  );
}
