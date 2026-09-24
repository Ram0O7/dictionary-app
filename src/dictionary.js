const validEntry = entry => typeof entry?.word === 'string' && Array.isArray(entry.meanings) && entry.meanings.length > 0 &&
  entry.meanings.every(m => typeof m?.partOfSpeech === 'string' && Array.isArray(m.definitions) && m.definitions.length > 0 &&
    m.definitions.every(d => typeof d?.definition === 'string' && (d.example == null || typeof d.example === 'string') &&
      (d.synonyms == null || (Array.isArray(d.synonyms) && d.synonyms.every(s => typeof s === 'string')))) &&
    (m.synonyms == null || (Array.isArray(m.synonyms) && m.synonyms.every(s => typeof s === 'string')))) &&
  (entry.phonetic == null || typeof entry.phonetic === 'string') &&
  (entry.phonetics == null || (Array.isArray(entry.phonetics) && entry.phonetics.every(p => p &&
    (p.text == null || typeof p.text === 'string') && (p.audio == null || typeof p.audio === 'string')))) &&
  (entry.sourceUrls == null || (Array.isArray(entry.sourceUrls) && entry.sourceUrls.every(url => typeof url === 'string' && /^https?:\/\//i.test(url))));

export const PRIMARY_API = 'https://freedictionaryapi.com/api/v1/entries/en';
export const FALLBACK_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
export const REQUEST_TIMEOUT = 6000;
const list = value => Array.isArray(value) ? value : [];
const strings = value => list(value).filter(item => typeof item === 'string');

// Keep provider-specific response formats out of the rendering code.
function normalize(data) {
  if (Array.isArray(data)) return data.find(validEntry);
  if (typeof data?.word !== 'string' || !Array.isArray(data.entries)) return undefined;
  const entries = data.entries.filter(entry => entry?.language?.code === 'en');
  const definitions = senses => list(senses).flatMap(sense => sense ? [
    ...(typeof sense.definition === 'string' && sense.definition.trim() ? [{
      definition: sense.definition,
      example: strings(sense.examples)[0],
      synonyms: strings(sense.synonyms)
    }] : []),
    ...definitions(sense.subsenses)
  ] : []);
  const result = {
    word: data.word,
    phonetics: entries.flatMap(entry => list(entry.pronunciations)
      .filter(p => p?.type === 'ipa' && typeof p.text === 'string')
      .map(p => ({ text: p.text }))),
    meanings: entries.map(entry => ({
      partOfSpeech: entry.partOfSpeech,
      definitions: definitions(entry.senses),
      synonyms: strings(entry.synonyms)
    })).filter(meaning => typeof meaning.partOfSpeech === 'string' && meaning.definitions.length),
    sourceUrls: [`https://en.wiktionary.org/wiki/${encodeURIComponent(data.word)}`]
  };
  return validEntry(result) ? result : undefined;
}

class LookupError extends Error {
  constructor(kind) { super(kind); this.kind = kind; }
}

async function fetchEntry(base, word, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${base.replace(/\/+$/, '')}/${encodeURIComponent(word)}`, {
      headers: { Accept: 'application/json' }, signal: controller.signal
    });
    if (!response.ok) throw new LookupError(response.status === 404 ? 'missing' : response.status === 429 ? 'limited' : 'unavailable');
    const data = await response.json();
    const result = normalize(data);
    if (!result) {
      const empty = Array.isArray(data) ? data.length === 0 : Array.isArray(data?.entries) && data.entries.length === 0;
      throw new LookupError(empty ? 'missing' : 'invalid');
    }
    return result;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (timedOut) throw new LookupError('timeout');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function lookupWord(word, signal) {
  const configured = process.env.REACT_APP_DICTIONARY_API_BASE?.trim();
  const providers = [...new Set([configured || PRIMARY_API, FALLBACK_API])];
  const failures = [];
  for (const provider of providers) {
    try {
      const entry = await fetchEntry(provider, word, signal);
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return entry;
    } catch (error) {
      if (signal?.aborted) throw error;
      failures.push(error);
    }
  }
  const kinds = failures.map(error => error.kind);
  if (kinds.every(kind => kind === 'missing')) throw new Error(`We couldn’t find “${word}”. Check the spelling or try another word.`);
  if (kinds.includes('timeout')) throw new Error('The dictionary took too long to respond. Please try again.');
  if (kinds.includes('limited')) throw new Error('The dictionary request limit was reached. Please try again later.');
  if (kinds.every(kind => kind === 'invalid')) throw new Error('No definitions found. Try another word.');
  throw new Error('We couldn’t connect to the dictionary services. Check your connection and try again.');
}
