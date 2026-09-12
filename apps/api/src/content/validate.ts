import { StaticContentRepository } from '../adapters/static-content/static-content.repository.js';

const content = StaticContentRepository.fromFile(new URL('./data/content.v1.json', import.meta.url)).getContent();
console.log(`Validated content ${content.contentVersion}: ${content.tracks.length} tracks, ${content.lessons.length} lessons, ${content.vocabulary.length} vocabulary entries, ${content.sentences.length} sentences.`);
