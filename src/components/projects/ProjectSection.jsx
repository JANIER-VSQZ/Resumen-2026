import React, { useId } from 'react';
import ProjectInformation from './ProjectInformation';
import ProjectGallery from './ProjectGallery';

export default function ProjectSection({ project, photos, index, period, community, onOpenPhoto }) {
  const id = useId();
  return (
    <article className="project-section" aria-labelledby={id + '-title'} data-project={project.id}>
      <header className="project-heading">
        <div>
          <span className="section-marker">{String(index + 1).padStart(2, '0')} / Proyecto · {period}</span>
          <h3 id={id + '-title'}>{project.name}</h3>
        </div>
        {project.axis && <span className="project-axis">{project.axis}</span>}
      </header>
      <div className="project-layout">
        <ProjectInformation project={project} community={community} id={id + '-information'} />
        <ProjectGallery project={project} photos={photos} id={id + '-gallery'} onOpenPhoto={onOpenPhoto} />
      </div>
    </article>
  );
}
