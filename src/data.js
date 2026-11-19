import initialContent from './content.json';
import hondurasGeo from './assets/honduras-departments.json';
import { validateContent } from './content';
import { prepareMap } from './geometry';
import { buildProjectCatalog } from './projects';

export const content = validateContent(initialContent);
export const mapFeatures = prepareMap(hondurasGeo);
export const projects = buildProjectCatalog(content.projects);
