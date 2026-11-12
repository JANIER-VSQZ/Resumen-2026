export function getAdjacentScreen(current, direction) {
  if (current.view === 'cover') return { view: 'map' };
  if (current.view === 'map') return { view: 'cover' };
  if (current.view === 'detail' && direction < 0) return { view: 'map' };
  // Los departamentos se abren seleccionándolos en el mapa.
  return null;
}

export function shouldIgnoreShortcut(event) {
  const target = event.target;
  return event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey ||
    event.altKey || event.shiftKey || target?.isContentEditable || Boolean(target?.closest?.(
      'input, textarea, select, [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]',
    ));
}
