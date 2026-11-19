import React, { useState } from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';

export default function ProjectInformation({ project, id }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <aside className={'project-info' + (expanded ? ' info-expanded' : '')} aria-label={'Información de ' + project.name} tabIndex={0}>
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
      <button className="information-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={id}>
        {expanded ? 'Ocultar actividades y logros' : 'Ver actividades y logros'}<ChevronDown size={16} />
      </button>
      <div id={id} className="detail-information">
        <section className="info-block project-activities">
          <h4>Actividades destacadas del año</h4>
          <ol>
            {project.activities.map((activity, position) => (
              <li key={position}><span>{String(position + 1).padStart(2, '0')}</span><p>{activity}</p></li>
            ))}
          </ol>
        </section>
        <section className="info-block project-achievements">
          <h4>Logros del proyecto</h4>
          <ul>
            {project.achievements.map((achievement, position) => (
              <li key={position}><Check size={15} aria-hidden="true" /><p>{achievement}</p></li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
