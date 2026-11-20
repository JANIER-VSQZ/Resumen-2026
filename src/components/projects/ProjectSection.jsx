import React, { useId } from 'react';
import ProjectInformation from './ProjectInformation';
import ProjectGallery from './ProjectGallery';

export default function ProjectSection({ project, period, location, headingLevel = 3, onOpenPhoto, embed = false }) {
  const id = useId();
  const Heading = 'h' + headingLevel;
  return (
    <article className="project-section " aria-labelledby={id + '-title'} data-project={project.id}>
      <header className="project-heading project-map-heading">
        {embed && <h2 className="page-title project-nav-title" >{project.name}</h2>}
          
          <span className="section-marker">Trabajo en territorio · {period}</span>
          <Heading className="project-section-title" id={id + '-title'}>{location}</Heading>
      </header>
      <div className="project-layout">
        <ProjectInformation project={project} id={id + '-information'} />
        <ProjectGallery photos={project.photos} id={id + '-gallery'} onOpenPhoto={onOpenPhoto} />
      </div>
    </article>
  );

  
}
