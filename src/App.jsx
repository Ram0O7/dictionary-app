import { useEffect, useRef, useState } from 'react';
import { lookupWord } from './dictionary';
import { FiArrowUpRight, FiArrowRight, FiBookmark, FiBookOpen, FiSearch, FiVolume2, FiClock, FiX, FiSun, FiMoon, FiCheck } from 'react-icons/fi';
const featured = {
  word: 'serendipity',
  phonetic: '/ˌser.ənˈdɪp.ə.ti/',
  meanings: [{
    partOfSpeech: 'noun',
    definitions: [{
      definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
      example: 'A fortunate stroke of serendipity brought the two old friends together.'
    }, {
      definition: 'The faculty of making fortunate discoveries by accident.',
      example: 'Her discovery of the little bookshop was pure serendipity.'
    }],
    synonyms: ['chance', 'good fortune', 'luck', 'happy accident']
  }],
  sourceUrls: ['https://en.wiktionary.org/wiki/serendipity']
};
const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(fallback)) return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string' && item.trim()))] : fallback;
    return typeof value === typeof fallback ? value : fallback;
  } catch {
    return fallback;
  }
};
const persist = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled or full. */ }
};
export default function App() {
  const [entry, setEntry] = useState(featured),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [audioMessage, setAudioMessage] = useState('');
  const [saved, setSaved] = useState(() => read('lexicon-saved', [])),
    [recent, setRecent] = useState(() => read('lexicon-recent', [])),
    [view, setView] = useState('dictionary'),
    [dark, setDark] = useState(() => read('lexicon-dark', false)),
    [playing, setPlaying] = useState(false);
  const input = useRef(),
    request = useRef(),
    audio = useRef(),
    playback = useRef(0);
  useEffect(() => {
    persist('lexicon-saved', saved);
  }, [saved]);
  useEffect(() => {
    persist('lexicon-recent', recent);
  }, [recent]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    persist('lexicon-dark', dark);
  }, [dark]);
  useEffect(() => {
    const shortcut = e => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
      request.current?.abort();
      request.current = null;
      playback.current += 1;
      audio.current?.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);
  async function search(value) {
    const word = value.trim().toLowerCase();
    if (!word) {
      input.current?.focus();
      return;
    }
    request.current?.abort();
    playback.current += 1;
    audio.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setAudioMessage('');
    setQuery(word);
    setView('dictionary');
    setError('');
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      let result = featured;
      if (word !== 'serendipity') {
        result = await lookupWord(word, controller.signal);
      }
      if (controller.signal.aborted || request.current !== controller) return;
      setEntry(result);
      setRecent(old => [word, ...old.filter(w => w !== word)].slice(0, 6));
    } catch (err) {
      if (request.current !== controller) return;
      if (controller.signal.aborted) setError('The dictionary took too long to respond. Please try again.');
      else setError(err instanceof TypeError ? 'We couldn’t connect. Check your connection and try again.' : err.message);
    } finally {
      if (request.current === controller) setLoading(false);
    }
  }
  function pronounce() {
    if (playing) return;
    const currentPlayback = ++playback.current;
    setAudioMessage('');
    const url = entry.phonetics?.find(p => p.audio)?.audio;
    const failed = () => {
      if (playback.current !== currentPlayback) return;
      setPlaying(false);
      setAudioMessage('Pronunciation is unavailable. Please try again.');
    };
    if (url) {
      const clip = new Audio(url);
      audio.current = clip;
      setPlaying(true);
      clip.onended = () => { if (playback.current === currentPlayback) setPlaying(false); };
      clip.onerror = failed;
      clip.play().catch(failed);
    } else if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(entry.word);
      speech.lang = 'en-GB';
      speech.rate = .85;
      speech.onend = () => { if (playback.current === currentPlayback) setPlaying(false); };
      speech.onerror = failed;
      setPlaying(true);
      window.speechSynthesis.speak(speech);
    } else failed();
  }
  const isSaved = saved.includes(entry.word);
  const synonyms = [...new Set(entry.meanings.flatMap(m => [...(m.synonyms || []), ...m.definitions.flatMap(d => d.synonyms || [])]))].slice(0, 8);
  return <div className="app-shell">
  <header className="site-header"><button className="brand" onClick={() => setView('dictionary')} aria-label="Lexicon home"><span className="brand-icon"><FiBookOpen /></span>lexicon<span className="brand-dot">.</span></button><nav aria-label="Main navigation"><button className={view === 'dictionary' ? 'active' : ''} onClick={() => setView('dictionary')}>Dictionary</button><button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}><FiBookmark /> Saved words <span className="count">{saved.length}</span></button></nav><button className="theme-button" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <FiSun /> : <FiMoon />}</button></header>
  <main><section className="intro"><div className="eyebrow"><span /> A LITTLE CURIOSITY GOES A LONG WAY</div><h1>Find the word.<br className="mobile-break" /> <em>Discover the world.</em></h1><p>A home for words, their meanings, and the places they take you.</p></section>
  <form className="search-box" onSubmit={e => {
        e.preventDefault();
        search(query);
      }}><FiSearch /><input ref={input} aria-label="Search for a word" placeholder="What word is on your mind?" value={query} onChange={e => setQuery(e.target.value)} />{query ? <button type="button" className="clear-search" aria-label="Clear search" onClick={() => {
          setQuery('');
          input.current.focus();
        }}><FiX /></button> : <kbd>/</kbd>}<button className="search-submit" type="submit">Explore <FiArrowRight /></button></form>
  <div className="suggestions"><span>A little inspiration</span>{['sonder', 'ephemeral', 'resilience', 'petrichor'].map(w => <button key={w} onClick={() => search(w)}>{w}<FiArrowUpRight /></button>)}</div>
  <div className="content-grid"><section className="dictionary-panel" aria-live="polite" aria-busy={loading}>
  {view === 'saved' ? <div className="collection"><div className="eyebrow">YOUR PERSONAL DICTIONARY</div><h2>Words worth keeping.</h2><p>{saved.length ? 'A collection of discoveries. Revisit a word to explore it again.' : 'Save a word with the bookmark button. Your collection starts with a little curiosity.'}</p>{saved.map(w => <div className="saved-row" key={w}><button onClick={() => search(w)}>{w}<FiArrowUpRight /></button><button aria-label={`Remove ${w}`} onClick={() => setSaved(saved.filter(item => item !== w))}><FiX /></button></div>)}</div> : loading ? <div className="status-panel"><span className="loader" /><h2>A new discovery awaits.</h2><p>Finding the meaning of “{query}”…</p></div> : error ? <div className="status-panel"><FiSearch size={30} /><h2>Let’s try another word.</h2><p role="alert">{error}</p><button onClick={() => search(query)}>Try again <FiArrowRight /></button></div> : <>
  <div className="entry-top"><span className="eyebrow">{entry.word === 'serendipity' ? 'THE BEAUTY OF AN UNEXPECTED DISCOVERY' : 'A NEW WORD, A NEW PERSPECTIVE'}</span><button className={`save-button ${isSaved ? 'is-saved' : ''}`} onClick={() => setSaved(old => isSaved ? old.filter(w => w !== entry.word) : [...old, entry.word])}>{isSaved ? <FiCheck /> : <FiBookmark />}{isSaved ? 'Saved' : 'Save word'}</button></div>
  <h2 className="entry-word">{entry.word}<span>.</span></h2><div className="pronunciation"><span>{entry.phonetic || entry.phonetics?.find(p => p.text)?.text || 'English'}</span><span className="small-divider" /><button onClick={pronounce} disabled={playing}><FiVolume2 />{playing ? 'Playing…' : 'Listen'}</button></div>{audioMessage && <p role="status" className="audio-message">{audioMessage}</p>}
  {entry.meanings.map((m, i) => <section className="meaning" key={i}><div className="meaning-heading"><span>{m.partOfSpeech}</span><div /></div><ol>{m.definitions.map((d, j) => <li key={j}><span className="definition-number">{String(j + 1).padStart(2, '0')}</span><div><p>{d.definition}</p>{d.example && <blockquote>“{d.example}”</blockquote>}</div></li>)}</ol></section>)}
  {synonyms.length > 0 && <div className="related"><span className="eyebrow">IN GOOD COMPANY</span><div>{synonyms.map(w => <button key={w} onClick={() => search(w)}>{w}<FiArrowUpRight /></button>)}</div></div>}
  <div className="source"><FiBookOpen /><span>Wiktionary · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></span><a href={entry.sourceUrls?.[0] || `https://en.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`} target="_blank" rel="noreferrer">Explore the source <FiArrowUpRight /></a></div></>}
  </section><aside><section className="daily-card"><div className="daily-label"><span className="sunburst">✳</span><span>THE DAILY DISCOVERY</span><span>01</span></div><div className="orbit-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><span className="star star-one">✦</span><span className="star star-two">✦</span><span className="orbit-dot" /></div><span className="eyebrow">A WORD TO WANDER WITH</span><h2>serendipity</h2><p className="daily-part">noun · /ˌser.ənˈdɪp.ə.ti/</p><p>Sometimes, the best things are the ones you weren’t looking for.</p><button onClick={() => search('serendipity')}>Meet the word <FiArrowUpRight /></button></section>
  <section className="recent"><div className="aside-title"><h3><FiClock /> Your recent discoveries</h3>{recent.length > 0 && <button onClick={() => setRecent([])}>Clear</button>}</div>{recent.length ? recent.map(w => <button className="recent-word" key={w} onClick={() => search(w)}>{w}<FiArrowUpRight /></button>) : <p>Your next favorite word is a search away. Your discoveries will appear here.</p>}</section><div className="little-note"><span>“</span><p>The limits of my language mean<br /> the limits of my world.<small>LUDWIG WITTGENSTEIN</small></p></div></aside></div>
  <footer><span className="footer-brand">lexicon.</span><span>For the endlessly curious.</span><a href="https://freedictionaryapi.com/" target="_blank" rel="noreferrer">Powered by FreeDictionaryAPI.com <FiArrowUpRight /></a></footer></main></div>;
}
