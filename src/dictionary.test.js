import { lookupWord, PRIMARY_API, FALLBACK_API, REQUEST_TIMEOUT } from './dictionary';

const legacy = [{ word: 'hello', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A greeting.' }] }] }];
const modern = {
  word: 'hello', entries: [{ language: { code: 'en' }, partOfSpeech: 'interjection',
    pronunciations: [{ type: 'ipa', text: '/hello/' }], synonyms: ['hi'],
    senses: [{ definition: 'A greeting.', examples: ['Hello, everyone.'],
      subsenses: [{ definition: 'A telephone greeting.' }] }] }]
};
const ok = data => ({ ok: true, json: async () => data });
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.useRealTimers(); delete process.env.REACT_APP_DICTIONARY_API_BASE; });

test('normalizes the live provider format including nested senses', async () => {
  fetch.mockResolvedValue(ok(modern));
  const entry = await lookupWord('hello');
  expect(fetch.mock.calls[0][0]).toBe(`${PRIMARY_API}/hello`);
  expect(entry.meanings[0]).toMatchObject({ synonyms: ['hi'], definitions: [
    { definition: 'A greeting.', example: 'Hello, everyone.' },
    { definition: 'A telephone greeting.' }
  ] });
  expect(entry.phonetics).toEqual([{ text: '/hello/' }]);
  expect(entry.sourceUrls[0]).toBe('https://en.wiktionary.org/wiki/hello');
});

test.each([
  ['network', () => Promise.reject(new TypeError('Failed to fetch'))],
  ['server', () => Promise.resolve({ ok: false, status: 503 })],
  ['rate limit', () => Promise.resolve({ ok: false, status: 429 })],
  ['missing', () => Promise.resolve(ok({ word: 'hello', entries: [] }))],
  ['malformed', () => Promise.resolve(ok({ entries: null }))],
  ['invalid JSON', () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError(); } })]
])('recovers from primary %s failure through the fallback', async (_, fail) => {
  fetch.mockImplementationOnce(fail).mockResolvedValueOnce(ok(legacy));
  expect((await lookupWord('hello')).word).toBe('hello');
  expect(fetch.mock.calls[1][0]).toBe(`${FALLBACK_API}/hello`);
});

test('falls back when the primary hangs, including during response body reading', async () => {
  jest.useFakeTimers();
  fetch.mockImplementationOnce((url, { signal }) => Promise.resolve({ ok: true,
    json: () => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
  })).mockResolvedValueOnce(ok(legacy));
  const pending = lookupWord('hello');
  await Promise.resolve();
  jest.advanceTimersByTime(REQUEST_TIMEOUT);
  expect((await pending).word).toBe('hello');
});

test('cancelled searches never start a fallback', async () => {
  const controller = new AbortController();
  fetch.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }));
  const pending = lookupWord('hello', controller.signal);
  controller.abort();
  await expect(pending).rejects.toHaveProperty('name', 'AbortError');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('reports missing words only after both providers confirm absence', async () => {
  fetch.mockResolvedValueOnce(ok({ word: 'nonsense', entries: [] })).mockResolvedValueOnce({ ok: false, status: 404 });
  await expect(lookupWord('nonsense')).rejects.toThrow('Check the spelling');
});

test('a failed backup does not turn an outage into a spelling error', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 404 }).mockRejectedValueOnce(new TypeError());
  await expect(lookupWord('hello')).rejects.toThrow('Check your connection');
});

test('encodes words and honors a custom legacy endpoint', async () => {
  process.env.REACT_APP_DICTIONARY_API_BASE = 'https://example.com/dictionary/';
  fetch.mockResolvedValue(ok(legacy));
  await lookupWord('happy accident/a?');
  expect(fetch.mock.calls[0][0]).toBe('https://example.com/dictionary/happy%20accident%2Fa%3F');
});

test('reports rate limits when neither provider can respond', async () => {
  fetch.mockResolvedValue({ ok: false, status: 429 });
  await expect(lookupWord('hello')).rejects.toThrow('request limit');
});
