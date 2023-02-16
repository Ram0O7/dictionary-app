import React from 'react';
import { FaPlay } from "react-icons/fa";
import { FaPause } from "react-icons/fa";
import './Header.scss';

const Header = ({loading, errorMessage, phonetics, clickEvent, isPaused}) => {
    return (
        <>
            {loading ?
                <h2 style={{ textAlign: 'center', padding: '4rem 0' }}>Loading...</h2>
                :
                !errorMessage && <header>
                    <div className="phonetics">
                        <h1 className="word">{phonetics.text}</h1>
                        <p className="accent">{phonetics.accent}</p>
                    </div>
                    <div className="audio" onClick={clickEvent}>
                        {isPaused ? <FaPause className="play-btn" /> : <FaPlay className="play-btn" />}
                    </div>
                </header>
            }
            {errorMessage && <p style={{ textAlign: 'center', marginTop: '5rem', lineHeight: '1.5rem', color: '#f00' }}>{errorMessage}</p>}
        </>
    )
}

export default Header;
