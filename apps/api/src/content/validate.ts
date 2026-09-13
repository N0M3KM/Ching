import {hskContentRepository} from '../adapters/hsk-content.repository.js';

const content = hskContentRepository().getContent();
console.log(`Validated content ${content.contentVersion}: ${content.tracks.length} tracks, ${content.lessons.length} lessons, ${content.vocabulary.length} vocabulary entries, ${content.sentences.length} sentences.`);
