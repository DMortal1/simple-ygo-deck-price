import React, { useState } from 'react';
import { parseYDK } from './utils/api';
import CardTable from './components/CardTable';
import CardSearch from './components/CardSearch';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
    const [deck, setDeck] = useState({ mainDeck: [], extraDeck: [], sideDeck: [] });
    const [viewMode, setViewMode] = useState('table');
    const [error, setError] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [cardData, setCardData] = useState([]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const deckData = parseYDK(e.target.result);
                    setDeck(deckData);
                    setError(null);
                    
                    // Fetch card data for all cards in the deck
                    const allCardIds = [...deckData.mainDeck, ...deckData.extraDeck, ...deckData.sideDeck];
                    const uniqueCardIds = [...new Set(allCardIds)];
                    
                    // Fetch card data for each unique card ID
                    Promise.all(uniqueCardIds.map(cardId => 
                        fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`)
                            .then(response => response.json())
                            .then(data => data.data[0])
                    )).then(cards => {
                        setCardData(cards);
                    }).catch(error => {
                        console.error('Error fetching card data:', error);
                        setError('Error fetching card data. Please try again.');
                    });
                } catch (error) {
                    console.error('Error parsing YDK file:', error);
                    setError('Error parsing YDK file. Please make sure it is a valid YDK file.');
                }
            };
            reader.readAsText(file);
        }
    };

    const exportToYDK = () => {
        let ydkContent = '#created by ...\n#main\n';
        deck.mainDeck.forEach(cardId => {
            ydkContent += `${cardId}\n`;
        });
        ydkContent += '#extra\n';
        deck.extraDeck.forEach(cardId => {
            ydkContent += `${cardId}\n`;
        });
        ydkContent += '!side\n';
        deck.sideDeck.forEach(cardId => {
            ydkContent += `${cardId}\n`;
        });

        const blob = new Blob([ydkContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'deck.ydk');
    };

    const handleAddCard = (cardId) => {
        setDeck(prevDeck => ({
            ...prevDeck,
            mainDeck: [...prevDeck.mainDeck, cardId]
        }));
    };

    return (
        <div className="app">
            <header>
                <h1>Yu-Gi-Oh! Deck Viewer</h1>
                <div className="controls">
                    <input
                        type="file"
                        accept=".ydk"
                        onChange={handleFileUpload}
                        className="file-input"
                    />
                    <button onClick={() => setShowSearch(!showSearch)}>
                        {showSearch ? 'Hide Search' : 'Show Search'}
                    </button>
                    <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
                        Switch to {viewMode === 'table' ? 'Grid' : 'Table'} View
                    </button>
                    <button onClick={exportToYDK} disabled={!deck.mainDeck.length}>
                        Export to YDK
                    </button>
                </div>
            </header>

            {error && <div className="error">{error}</div>}

            {showSearch && (
                <div className="search-container">
                    <CardSearch onAddCard={handleAddCard} />
                </div>
            )}

            <main>
                {deck.mainDeck.length > 0 ? (
                    <>
                        <div className="deck-totals">
                            <h2>Deck Price Totals</h2>
                            <div className="totals-grid">
                                <div className="total-card">
                                    <h3><a href="#main-deck">Main Deck</a></h3>
                                    <p>Cards: {deck.mainDeck.length}</p>
                                    <p>TCG: ${deck.mainDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                    <p>OCG: ${deck.mainDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                </div>
                                <div className="total-card">
                                    <h3><a href="#extra-deck">Extra Deck</a></h3>
                                    <p>Cards: {deck.extraDeck.length}</p>
                                    <p>TCG: ${deck.extraDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                    <p>OCG: ${deck.extraDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                </div>
                                <div className="total-card">
                                    <h3><a href="#side-deck">Side Deck</a></h3>
                                    <p>Cards: {deck.sideDeck.length}</p>
                                    <p>TCG: ${deck.sideDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                    <p>OCG: ${deck.sideDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0).toFixed(2)}</p>
                                </div>
                                <div className="total-card">
                                    <h3>Total Deck</h3>
                                    <p>Cards: {deck.mainDeck.length + deck.extraDeck.length + deck.sideDeck.length}</p>
                                    <p>TCG: ${(deck.mainDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0) +
                                    deck.extraDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0) +
                                    deck.sideDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                    }, 0)).toFixed(2)}</p>
                                    <p>OCG: ${(deck.mainDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0) +
                                    deck.extraDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0) +
                                    deck.sideDeck.reduce((sum, cardId) => {
                                        const card = cardData.find(c => c.id === cardId);
                                        return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                    }, 0)).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="deck-section" id="main-deck">
                            <h2>Main Deck ({deck.mainDeck.length} cards)</h2>
                            <div className="section-totals">
                                <p>TCG Total: ${deck.mainDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                                <p>OCG Total: ${deck.mainDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                            </div>
                            <CardTable deck={deck.mainDeck} viewMode={viewMode} deckType="main" />
                        </div>

                        <div className="deck-section" id="extra-deck">
                            <h2>Extra Deck ({deck.extraDeck.length} cards)</h2>
                            <div className="section-totals">
                                <p>TCG Total: ${deck.extraDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                                <p>OCG Total: ${deck.extraDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                            </div>
                            <CardTable deck={deck.extraDeck} viewMode={viewMode} deckType="extra" />
                        </div>

                        <div className="deck-section" id="side-deck">
                            <h2>Side Deck ({deck.sideDeck.length} cards)</h2>
                            <div className="section-totals">
                                <p>TCG Total: ${deck.sideDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.card_prices?.[0]?.tcgplayer_price || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                                <p>OCG Total: ${deck.sideDeck.reduce((sum, cardId) => {
                                    const card = cardData.find(c => c.id === cardId);
                                    return sum + ((card?.ocgPrice || 0) * (card?.quantity || 1));
                                }, 0).toFixed(2)}</p>
                            </div>
                            <CardTable deck={deck.sideDeck} viewMode={viewMode} deckType="side" />
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <p>Upload a YDK file or search for cards to build your deck</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
