import React, { useState, useEffect } from 'react';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [notification, setNotification] = useState({ message: '', isVisible: false });

    // Check for mobile view on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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

    const handleAddCard = async (cardId, deckType = 'main') => {
        // Fetch card data for validation if not already in cardData
        let cardToAdd;
        if (!cardData.find(card => card.id === cardId)) {
            try {
                const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
                const data = await response.json();
                cardToAdd = data.data[0];
                // Add to cardData state
                setCardData(prevCardData => [...prevCardData, cardToAdd]);
            } catch (error) {
                console.error('Error fetching card data:', error);
                return; // Don't proceed if card data can't be fetched
            }
        } else {
            cardToAdd = cardData.find(card => card.id === cardId);
        }

        // Helper function to determine if a card belongs in the extra deck
        const isExtraDeckCard = (cardType) => {
            return cardType.includes('Fusion') || 
                   cardType.includes('Synchro') || 
                   cardType.includes('Xyz') || 
                   cardType.includes('Link') || 
                   (cardType.includes('Pendulum') && (
                       cardType.includes('Xyz') || 
                       cardType.includes('Synchro') || 
                       cardType.includes('Fusion') || 
                       cardType.includes('Link')
                   ));
        };

        // Add the card to the corresponding deck section with validation
        setDeck(prevDeck => {
            // Create a copy of the deck to update
            const updatedDeck = { ...prevDeck };
            
            // Add the card to the specified deck section with validation
            const cardType = cardToAdd.type;
            
            switch (deckType) {
                case 'main':
                    // Don't add Extra Deck cards to Main Deck
                    if (!isExtraDeckCard(cardType)) {
                        updatedDeck.mainDeck = [...updatedDeck.mainDeck, cardId];
                    } else {
                        console.warn('Cannot add Extra Deck card to Main Deck');
                        showNotification(`${cardToAdd.name} can only be added to the Extra Deck`);
                    }
                    break;
                case 'extra':
                    // Only add Extra Deck cards to Extra Deck
                    if (isExtraDeckCard(cardType)) {
                        updatedDeck.extraDeck = [...updatedDeck.extraDeck, cardId];
                    } else {
                        console.warn('Cannot add Main Deck card to Extra Deck');
                        showNotification(`${cardToAdd.name} can only be added to the Main Deck`);
                    }
                    break;
                case 'side':
                    // Any card can go in Side Deck
                    updatedDeck.sideDeck = [...updatedDeck.sideDeck, cardId];
                    break;
                default:
                    console.warn('Invalid deck type specified');
            }
            
            return updatedDeck;
        });
    };

    const handleViewModeToggle = () => {
        setViewMode(prevMode => prevMode === 'table' ? 'grid' : 'table');
    };

    // Get the effective view mode (always grid on mobile)
    const effectiveViewMode = isMobile ? 'grid' : viewMode;

    // Show notification message
    const showNotification = (message) => {
        setNotification({ message, isVisible: true });
        setTimeout(() => {
            setNotification({ message: '', isVisible: false });
        }, 3000);
    };

    return (
        <div className="app">
            <header>
                <h1>Yu-Gi-Oh! Deck Viewer</h1>
                <div className="controls">
                    <div className="file-upload-container">
                        <input
                            type="file"
                            accept=".ydk"
                            onChange={handleFileUpload}
                            className="file-input"
                        />
                    </div>
                    <div className="button-container">
                        <button onClick={() => setShowSearch(!showSearch)}>
                            {showSearch ? 'Hide Search' : 'Show Search'}
                        </button>
                        <button onClick={handleViewModeToggle} disabled={isMobile}>
                            {isMobile ? 'Grid View' : `Switch to ${viewMode === 'table' ? 'Grid' : 'Table'} View`}
                        </button>
                        <button onClick={exportToYDK} disabled={!deck.mainDeck.length}>
                            Export to YDK
                        </button>
                    </div>
                </div>
            </header>

            {error && <div className="error">{error}</div>}

            {notification.isVisible && (
                <div className="notification">
                    {notification.message}
                </div>
            )}

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
                            <CardTable deck={deck.mainDeck} viewMode={effectiveViewMode} deckType="main" />
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
                            <CardTable deck={deck.extraDeck} viewMode={effectiveViewMode} deckType="extra" />
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
                            <CardTable deck={deck.sideDeck} viewMode={effectiveViewMode} deckType="side" />
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
