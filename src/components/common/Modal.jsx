import React from 'react';
import { X } from 'lucide-react';
import useDialog from '../../hooks/useDialog';

export default function Modal({ title, id, className = '', onClose, children }) {
  const ref = useDialog(onClose);
  return (
    <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={ref} className={className} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <div className="modal-head">
          <h2 id={id}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar ventana"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
