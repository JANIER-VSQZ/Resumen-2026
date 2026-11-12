import React from 'react';
import { BookOpen, Sprout, Users } from 'lucide-react';

const themes = [
  { Icon: Users, className: 'theme-people', title: 'Las personas primero', description: 'Comunidades en el centro de cada acción.' },
  { Icon: Sprout, className: 'theme-land', title: 'Territorios que conectan', description: 'Un encuentro con nuestra labor local.' },
  { Icon: BookOpen, className: 'theme-stories', title: 'Una memoria compartida', description: 'Experiencias para recordar y aprender.' },
];

export default function CoverThemes() {
  return (
    <section className="cover-themes" aria-label="Nuestra memoria institucional">
      <div className="theme-intro"><span className="section-marker">Lo que nos mueve</span><h2>Cada historia cuenta.</h2></div>
      {themes.map(({ Icon, className, title, description }) => (
        <div className="theme-item" key={title}>
          <span className={'theme-icon ' + className}><Icon size={23} /></span>
          <div><h3>{title}</h3><p>{description}</p></div>
        </div>
      ))}
    </section>
  );
}
