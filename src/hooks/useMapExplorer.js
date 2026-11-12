import { useCallback, useMemo, useState } from 'react';
import { DEPARTMENTS, hasContent, isPublished, normalize, photoMatches } from '../content';

const EMPTY_FILTERS = { project: '', axis: '' };

export default function useMapExplorer(departments) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [onlyContent, setOnlyContent] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [preview, setPreview] = useState(null);

  const entries = useMemo(() => Object.entries(departments).filter(([, department]) => hasContent(department)), [departments]);
  const options = useMemo(() => {
    const projects = entries.flatMap(([, department]) => department.projects || []);
    const unique = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    return {
      project: unique(projects.map(project => project.name)),
      axis: unique(projects.map(project => project.axis)),
    };
  }, [entries]);

  const matches = useCallback(name => {
    const department = departments[name];
    if (query && !normalize(name).includes(normalize(query))) return false;
    if (onlyContent && !hasContent(department)) return false;
    if (!filters.project && !filters.axis) return true;
    if (!hasContent(department)) return false;
    if (!filters.axis && department.projects?.some(project => project.name === filters.project)) return true;
    return (department.photos || []).some(photo => photoMatches(photo, filters));
  }, [departments, query, onlyContent, filters]);

  const visibleDepartments = useMemo(() => DEPARTMENTS.filter(matches).sort((a, b) =>
    Number(hasContent(departments[b])) - Number(hasContent(departments[a])) || a.localeCompare(b, 'es'),
  ), [departments, matches]);

  const clearSelection = useCallback(() => { setHovered(null); setPreview(null); }, []);
  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
    setOnlyContent(false);
    clearSelection();
  }, [clearSelection]);
  const updateFilters = useCallback(value => { setFilters(value); clearSelection(); }, [clearSelection]);
  const updateQuery = useCallback(value => { setQuery(value); setPreview(null); }, []);

  return {
    filters, setFilters, updateFilters, query, updateQuery, onlyContent, setOnlyContent,
    hovered, setHovered, preview, setPreview, clearSelection, clearFilters,
    options, matches, visibleDepartments,
    hasFilters: Boolean(filters.project || filters.axis || query || onlyContent),
    entryCount: entries.length,
    publishedCount: entries.filter(([, department]) => isPublished(department)).length,
    demoCount: entries.filter(([, department]) => department.demo).length,
  };
}
