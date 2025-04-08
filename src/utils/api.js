import axios from 'axios';
import * as cheerio from 'cheerio';

// Rate limiting setup
const RATE_LIMIT = 10; // requests per second
let lastRequestTime = 0;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const rateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 1000 / RATE_LIMIT) {
        await delay(1000 / RATE_LIMIT - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
};

export const getCardData = async (cardId) => {
    await rateLimit();
    try {
        const response = await axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
        return response.data.data[0];
    } catch (error) {
        console.error('Error fetching card data:', error);
        return null;
    }
};

export const getOCGPrice = async (cardName) => {
    await rateLimit();
    try {
        const searchUrl = `https://www.tcgrepublic.com/product/search?keyword=${encodeURIComponent(cardName)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);
        
        // This is a simplified example - you'll need to adjust the selectors based on the actual website structure
        const priceElement = $('.product-price').first();
        const price = priceElement.text().trim().replace(/[^0-9.]/g, '');
        return parseFloat(price) || 0;
    } catch (error) {
        console.error('Error fetching OCG price:', error);
        return 0;
    }
};

export const parseYDK = (ydkContent) => {
    const lines = ydkContent.split('\n');
    const mainDeck = [];
    const extraDeck = [];
    const sideDeck = [];
    let currentSection = 'main';

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '#main') {
            currentSection = 'main';
        } else if (trimmedLine === '#extra') {
            currentSection = 'extra';
        } else if (trimmedLine === '!side') {
            currentSection = 'side';
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
            const cardId = parseInt(trimmedLine);
            if (!isNaN(cardId)) {
                switch (currentSection) {
                    case 'main':
                        mainDeck.push(cardId);
                        break;
                    case 'extra':
                        extraDeck.push(cardId);
                        break;
                    case 'side':
                        sideDeck.push(cardId);
                        break;
                }
            }
        }
    }

    return { mainDeck, extraDeck, sideDeck };
}; 