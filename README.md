# Dictionary App

## Description

The Dictionary App is a web application built using React and the Dictionary API. It features a beautiful and user-friendly interface with an option to toggle between light and dark theme, allowing users to search for words and obtain extensive meanings, audio pronunciations, synonyms, and antonyms. Users can also explore new words by clicking on the related words shown in the result.

## Features

- **Search Functionality:** Search for any word to get its extensive meaning.
- **Audio Pronunciation:** Listen to the correct pronunciation of the searched word.
- **Synonyms and Antonyms:** Discover synonyms and antonyms of the searched word.
- **Interactive Words:** Click on related words to view its details.
- **Font Selection:** Choose from variety of fonts as per your preference

## Installation

### Prerequisites

- Node.js and npm installed

### Steps

1. Clone the repository:
    ```sh
    git clone https://github.com/Ram0O7/dictionary-app.git
    ```
2. Navigate to the project directory:
    ```sh
    cd dictionary-app
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

4. Run the development server:
    ```sh
    npm start
    ```
5. Open your browser and navigate to `http://localhost:3000`.

### API requests and production

Development and production use the same HTTPS endpoint at
`https://freedictionaryapi.com/api/v1/entries/en/<word>`. This service supports
browser CORS, so GitHub Pages requires no backend, proxy, API key, or environment
variable. The old CRA-only proxy has been removed; restart `npm start` after updating.

The client converts the provider's entries/senses into the UI's definition format,
including examples, synonyms, and IPA pronunciation. Listen uses browser speech
synthesis when the provider has no audio recording. Data comes from Wiktionary
under CC BY-SA 4.0; provider, source, and license links are displayed in the app.

Failed, rate-limited, malformed, timed-out, or missing results are retried against
`https://api.dictionaryapi.dev/api/v2/entries/en/<word>`. Each provider has a
six-second timeout. New searches cancel the previous request. Both providers are
external services: if both are unavailable, the app shows a retryable error.
FreeDictionaryAPI.com currently documents a limit of 1,000 requests/hour/IP.

An optional build-time `REACT_APP_DICTIONARY_API_BASE` overrides the primary
endpoint. It must return either supported provider format and allow your browser
origin; a relative endpoint requires a real server route and will not work on
GitHub Pages. Do not set it to the previous development proxy path.

Validate and publish the updated production bundle:

```sh
npm test -- --watchAll=false
npm run build
npm run deploy
```

`npm run deploy` rebuilds and publishes `build/` to the configured GitHub Pages
repository. Source changes do not update an already published site until deployed.
After publishing, search for a word other than the built-in daily word and check
that its definitions appear. The daily word alone does not test the API.

Provider documentation: https://freedictionaryapi.com/

## Usage

1. Open the app in your browser.
2. Use the search bar to find a word and view its detailed information.
3. Listen to the audio pronunciation of the word.
4. Explore synonyms and antonyms.
5. Click on related words to explore further

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
    ```sh
    git checkout -b feature/your-feature-name
    ```
3. Make your changes and commit them:
    ```sh
    git commit -am 'Add new feature'
    ```
4. Push to the branch:
    ```sh
    git push origin feature/your-feature-name
    ```
5. Open a pull request.

## Credits

- **Frontend Mentor:** Thanks to [Frontend Mentor](https://www.frontendmentor.io) for the design inspiration.

## Contact

- **Email:** [ram706860@gmail.com](mailto:ram706860@gmail.com)
- **LinkedIn:** [linkedin.com/in/ramkrishn-rai](https://linkedin.com/in/ramkrishn-rai)

---

Enjoy exploring words with the Dictionary App!
