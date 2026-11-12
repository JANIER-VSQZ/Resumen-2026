import initialContent from './content.json';
import hondurasGeo from './assets/honduras-departments.json';
import { normalizeContent } from './content';
import { prepareMap } from './geometry';

export const content = normalizeContent(initialContent);
export const mapFeatures = prepareMap(hondurasGeo);
