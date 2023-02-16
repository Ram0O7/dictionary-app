import React from 'react';
import './Meaning.scss';

const Meaning = ({ meanings }) => {
    
    return (
        <section className='section-main'>
            {meanings.map((meaning, index) => {
                const { partOfSpeech, definitions, synonyms, antonyms } = meaning;
                return (<div className="meaning" key={index}>
                    <div className="part-of-speech"><h3>{partOfSpeech}</h3><hr /></div>
                    <p className="type-header">Meaning</p>
                    <ul className="definitions">
                        {definitions.map((meaning, index) => {
                            const { definition } = meaning;
                            return (
                                <li className="definition" key={index}>{definition}</li>
                            )
                        })}
                    </ul>
                    {synonyms.length > 0
                        && <div className="synonyms">
                            <span className='type-header'>Synonyms </span>
                            <div className='btn-container'>
                                {synonyms.map((synonym,index) => {
                                    return (<button key={index} className='more-btn'>{synonym}, </button>)
                                })}
                            </div>
                        </div>}
                    {antonyms.length > 0 &&
                        <div className="antonyms">
                            <span className='type-header'>Antonyms </span>
                            <div className='btn-container'>
                                {antonyms.map((antonym,index) => {
                                    return (<button key={index} className='more-btn'>{antonym}, </button>)
                                })}
                            </div>
                        </div>}
                </div>)
            })}
        </section>
    )
}

export default React.memo(Meaning);
