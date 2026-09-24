import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import App from './App';
beforeEach(() => { localStorage.clear(); });
afterEach(() => { jest.restoreAllMocks(); });
test('saves and removes a word from the collection', () => {
 render(<App />);
 fireEvent.click(screen.getByRole('button', { name: 'Save word' }));
 fireEvent.click(screen.getByRole('button', { name: /Saved words/ }));
 expect(screen.getByText('Words worth keeping.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Remove serendipity' }));
 expect(JSON.parse(localStorage.getItem('lexicon-saved'))).toEqual([]);
});
test('searches and displays an API result', async () => {
 global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ word:'hello', meanings:[{ partOfSpeech:'exclamation', definitions:[{definition:'A greeting.'}] }] }] });
 render(<App />);
 fireEvent.change(screen.getByRole('textbox'), { target:{value:'hello'} });
 fireEvent.click(screen.getByRole('button', { name:'Explore' }));
 expect(await screen.findByText('A greeting.')).toBeInTheDocument();
 expect(global.fetch).toHaveBeenCalledWith('https://freedictionaryapi.com/api/v1/entries/en/hello', expect.objectContaining({ headers: { Accept: 'application/json' } }));
 await waitFor(() => expect(JSON.parse(localStorage.getItem('lexicon-recent'))).toEqual(['hello']));
});

test('ignores corrupt stored collections and unavailable storage', () => {
 localStorage.setItem('lexicon-saved', '{}');
 localStorage.setItem('lexicon-recent', '[null, 123]');
 jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
 render(<App />);
 fireEvent.click(screen.getByRole('button', { name: 'Save word' }));
 expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
});

test('rejects malformed definitions without crashing', async () => {
 global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ word: 'test', meanings: [{ partOfSpeech: 'noun' }] }] });
 render(<App />);
 fireEvent.click(screen.getByRole('button', { name: 'resilience' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('No definitions found');
});

test('an older response cannot overwrite the newest search', async () => {
 let resolveOld;
 global.fetch = jest.fn().mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
 render(<App />);
 fireEvent.click(screen.getByRole('button', { name: 'resilience' }));
 fireEvent.click(screen.getByRole('button', { name: 'Meet the word' }));
 resolveOld({ ok: true, json: async () => [{ word: 'old', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'Outdated result.' }] }] }] });
 await waitFor(() => expect(JSON.parse(localStorage.getItem('lexicon-recent'))).toEqual(['serendipity']));
 expect(screen.queryByText('Outdated result.')).not.toBeInTheDocument();
});

test('shows a timeout and permits retry', async () => {
 jest.useFakeTimers();
 global.fetch = jest.fn().mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
  signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
 }));
 try {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'resilience' }));
  await act(async () => { jest.advanceTimersByTime(6000); });
  await act(async () => { jest.advanceTimersByTime(6000); });
  expect(await screen.findByRole('alert')).toHaveTextContent('took too long');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
 } finally { jest.useRealTimers(); }
});
test('shows a recoverable network error', async () => {
 global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
 render(<App />);
 fireEvent.change(screen.getByRole('textbox'), {target:{value:'test'}});
 fireEvent.click(screen.getByRole('button', {name:'Explore'}));
 await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check your connection'));
 expect(screen.getByRole('button', {name:'Try again'})).toBeInTheDocument();
});
