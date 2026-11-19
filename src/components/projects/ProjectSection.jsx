import React, { useId } from 'react';
import ProjectInformation from './ProjectInformation';
import ProjectGallery from './ProjectGallery';

export default function ProjectSection({ project, photos, index, period, community, location, headingLevel = 3, onOpenPhoto }) {
  const id = useId();
  const Heading = 'h' + headingLevel;
  return (
    <article className="project-section" aria-labelledby={id + '-title'} data-project={project.id}>
      <header className="project-heading">
        <div>
          <span className="section-marker">{location ? 'Trabajo en territorio' : 'Proyecto'} · {period}</span>
          <Heading className="project-section-title" id={id + '-title'}>{location || project.name}</Heading>
        </div>
      </header>
      <div className="project-layout">
        <ProjectInformation project={project} community={community} id={id + '-information'} expandedByDefault={Boolean(location)} />
        <ProjectGallery project={project} photos={photos} id={id + '-gallery'} onOpenPhoto={onOpenPhoto} />
      </div>
    </article>
  );
}
