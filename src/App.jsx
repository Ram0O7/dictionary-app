import { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";
import { FaPause } from "react-icons/fa";
import Meaning from "./components/Meanig/Meaning";
import Navbar from "./components/Navbar/Navbar";

function App() {
  const inputRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSearch, setCurrentSearch] = useState('hello');
  const [searchVal, setSearchVal] = useState('');
  const [phonetics, setPhonetics] = useState({
    text: '',
    accent: '',
    audio: ''
  });
  const [isPaused, setIsPaused] = useState(false);

  const handlePlayEvent = () => {
    const wordAudio = document.getElementById('word-audio');
    const src = wordAudio.getAttribute('src');
    if (src !== '') {
      setIsPaused(!isPaused);
      wordAudio.play();
    }
  }

  const submitHandler = (e) => {
    e.preventDefault();
    setLoading(true);
    setCurrentSearch(searchVal.toLowerCase());
    inputRef.current.value = '';
  }

  const fetchMeaning = async () => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${currentSearch}`;
    const response = await fetch(url);
    try {
      const meaning = await response.json();
      console.log(meaning);
      if (!response.ok) {
        setLoading(false);
        throw new Error('sorry pal! we couldn\'t find definitions for the word you were looking for. ');
      }
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
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    fetchMeaning();
  }, [currentSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  }, [errorMessage]);

  useEffect(() => {
    const wordAudio = document.getElementById('word-audio');
    wordAudio.addEventListener('ended', () => {
      setIsPaused(!isPaused);
    })
  }, [handlePlayEvent]);

  return (
    <main className="body-main">
      <audio src={phonetics.audio} type='audio/mpeg' id="word-audio" />
      <Navbar />
      <form action="submit" className="search-form" onSubmit={submitHandler}>
        <input ref={inputRef} type="text" placeholder="hello" onChange={(e) => setSearchVal(e.target.value)} />
        <button type="submit"><FaSearch id="search" /></button>
      </form>
      {loading ?
        <h2 style={{ textAlign: 'center', padding: '4rem 0' }}>Loading...</h2>
        :
        !errorMessage && <header>
          <div className="phonetics">
            <h1 className="word">{phonetics.text}</h1>
            <p className="accent">{phonetics.accent}</p>
          </div>
          <div className="audio" onClick={handlePlayEvent}>
            {isPaused ? <FaPause className="play-btn" /> : <FaPlay className="play-btn" />}
          </div>
        </header>
      }
      {errorMessage && <p style={{ textAlign: 'center', marginTop:'5rem', lineHeight: '1.5rem', color: '#f00' }}>{errorMessage}</p>}
      <Meaning />
    </main>
  );
}

export default App;
