import { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import Header from "./components/Header/Header";
import Meaning from "./components/Meanig/Meaning";
import Navbar from "./components/Navbar/Navbar";

const getStorageTheme = () => {
  let theme = 'light-theme';
  if (localStorage.getItem('theme')) {
    theme = localStorage.getItem('theme');
  }
  return theme;
};
const getStorageFont = () => {
  let font = 'display';
  if (localStorage.getItem('font')) {
    font = localStorage.getItem('font');
  }
  return font;
}
const getStorageSearch = () => {
  let search = 'welcome';
  if (localStorage.getItem('search')) {
    search = localStorage.getItem('search');
  }
  return search;
}

function App() {
  const inputRef = useRef('');
  const [theme, setTheme] = useState(getStorageTheme());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [audioError, setAudioError] = useState(false);
  const [currentSearch, setCurrentSearch] = useState(getStorageSearch());
  const [searchVal, setSearchVal] = useState('');
  const [meanings, setMeanings] = useState([]);
  const [phonetics, setPhonetics] = useState({
    text: '',
    accent: '',
    audio: ''
  });
  const [isPaused, setIsPaused] = useState(false);
  const [font, setFont] = useState(getStorageFont());

  const toggleTheme = () => {
    if (theme === 'light-theme') {
      setTheme('dark-theme');
    } else {
      setTheme('light-theme');
    }
}

  const handlePlayEvent = () => {
    const wordAudio = document.getElementById('word-audio');
    const src = wordAudio.getAttribute('src');
    if (src !== '') {
      setIsPaused(!isPaused);
      wordAudio.play();
    } else {
      setAudioError(true);
    }
  }

  const submitHandler = (e) => {
    e.preventDefault();
    setCurrentSearch(searchVal.toLowerCase());
    inputRef.current.value = '';
    setAudioError(false);
  }

  const handleRecievedVal = (value) => {
    if (value) {
      setCurrentSearch(value);
      setAudioError(false);
    }
  }

  const handleRecievedFont = (font) => {
    setFont(font);
  }

  const fetchMeaning = async () => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${currentSearch}`;
    const response = await fetch(url);
    try {
      const meaning = await response.json();
      if (!response.ok) {
        throw new Error(meaning.title +` for the word , "${currentSearch}". `+ meaning.resolution);
      }
      setMeanings(meaning[0].meanings);
      setErrorMessage('');
      setLoading(false);
      setPhonetics({
        text: meaning[0].word,
        accent: `${meaning[0].phonetic ? meaning[0].phonetic : meaning[0].phonetics.find(phonetic => phonetic.text !== '')}`,
        audio: '',
      });
      meaning[0].phonetics.forEach((phonetic, index) => {
        if (phonetic.audio !== '' && phonetic.text !== '') {
          setPhonetics({
            text: meaning[0].word,
            accent: `${meaning[0].phonetics[index].text ? meaning[0].phonetics[index].text : phonetic.text}`,
            audio: phonetic.audio,
          });
        }
      });
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchMeaning(); // eslint-disable-next-line
  }, [currentSearch]);

  useEffect(() => {
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  }, [errorMessage]);

  useEffect(() => {
    const wordAudio = document.getElementById('word-audio');
    wordAudio.addEventListener('ended', () => {
      setIsPaused(!isPaused);
    })
    // eslint-disable-next-line
  }, [isPaused]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
    localStorage.setItem('font', font);
  }, [theme, font]);

  useEffect(() => {
    localStorage.setItem('search', currentSearch);
  }, [currentSearch]);

  return (
    <main className="body-main" style={{fontFamily: font}}>
      <audio src={phonetics.audio} type='audio/mpeg' id="word-audio" />
      <Navbar onClick={toggleTheme} getCurrentFont={handleRecievedFont} currentFont={font} />
      <form action="submit" className="search-form" onSubmit={submitHandler}>
        <input ref={inputRef} type="text" placeholder="search" onChange={(e) => setSearchVal(e.target.value)} />
        <button type="submit"><FaSearch id="search" /></button>
      </form>
      <Header loading={loading}
        errorMessage={errorMessage}
        phonetics={phonetics}
        clickEvent={handlePlayEvent}
        isPaused={isPaused}
        search={currentSearch}
        playError={audioError}
      />
      {!loading && !errorMessage && <Meaning meanings={meanings} getValue={handleRecievedVal} />}
    </main>
  );
}

export default App;
