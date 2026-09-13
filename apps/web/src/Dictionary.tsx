import { useState, type FormEvent } from 'react';
import type { Locale } from '@ching/contracts';
import { copy } from './i18n.js';
import { api, dictionarySchema } from './schemas.js';
import type { z } from 'zod';

type Entry = z.infer<typeof dictionarySchema>['entries'][number];

interface DictionaryProps {
  locale: Locale;
}

export function Dictionary({ locale }: DictionaryProps) {
  const c = copy(locale);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setBusy(true);
    setError(false);

    try {
      const data = await api(`dictionary?query=${encodeURIComponent(query)}`, dictionarySchema);
      setEntries(data.entries);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">{c.reference}</p>
      <h1>{c.dictionary}</h1>

      <form onSubmit={handleSearch}>
        <label htmlFor="query">{c.search}</label>
        <div className="search-row">
          <input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
            required
            placeholder={c.searchHint}
          />
          <button className="primary" disabled={busy || !query.trim()}>
            {busy ? c.loading : c.search}
          </button>
        </div>
      </form>

      {error && <p role="alert">{c.error}</p>}

      <div aria-live="polite">
        {entries?.length === 0 && <p>{c.noEntries}</p>}
        {entries?.map((entry) => (
          <DictionaryEntry key={entry.id} entry={entry} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function DictionaryEntry({ entry, locale }: { entry: Entry; locale: Locale }) {
  const isTraditional = locale === 'zh-Hant';
  const headword = isTraditional ? (entry.traditional ?? entry.simplified) : entry.simplified;
  const sourceLabel = entry.sourceId === 'cc-cedict' ? 'CC-CEDICT · CC BY-SA 4.0' : 'Ching';

  return (
    <article className="dictionary-entry">
      <h2 lang={isTraditional ? 'zh-Hant' : 'zh-Hans'}>
        {headword} <small>{entry.pinyin}</small>
      </h2>
      <p>{entry.definitions.join('; ')}</p>
      <small>{sourceLabel}</small>
    </article>
  );
}