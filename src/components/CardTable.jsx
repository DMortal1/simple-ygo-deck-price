import React, { useState, useEffect } from 'react';
import { getCardData, getOCGPrice } from '../utils/api';

const CardTable = ({ deck, viewMode }) => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'type', direction: 'asc' });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Check for mobile on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    React.useEffect(() => {
        const loadCards = async () => {
            setLoading(true);
            const cardPromises = deck.map(async (cardId) => {
                const cardData = await getCardData(cardId);
                if (cardData) {
                    const ocgPrice = await getOCGPrice(cardData.name);
                    return {
                        ...cardData,
                        ocgPrice,
                        tcgPrice: cardData.card_prices?.[0]?.tcgplayer_price || 0,
                        quantity: 1
                    };
                }
                return null;
            });

            const loadedCards = await Promise.all(cardPromises);
            const validCards = loadedCards.filter(card => card !== null);
            
            const cardCounts = {};
            validCards.forEach(card => {
                cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
            });

            const uniqueCards = validCards.filter((card, index, self) => 
                index === self.findIndex(c => c.id === card.id)
            ).map(card => ({
                ...card,
                quantity: cardCounts[card.id]
            }));

            // Sort by type and level after loading
            const sortedCards = uniqueCards.sort((a, b) => {
                // First sort by type
                if (a.type < b.type) return -1;
                if (a.type > b.type) return 1;
                
                // If types are equal, sort by level
                const aLevel = a.level || a.rank || a.linkval || 0;
                const bLevel = b.level || b.rank || b.linkval || 0;
                return aLevel - bLevel;
            });

            setCards(sortedCards);
            setLoading(false);
        };

        loadCards();
    }, [deck]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCards = React.useMemo(() => {
        if (!sortConfig.key) return cards;

        return [...cards].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle special cases
            if (sortConfig.key === 'tcgPrice' || sortConfig.key === 'ocgPrice') {
                aValue = a[sortConfig.key] * a.quantity;
                bValue = b[sortConfig.key] * b.quantity;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [cards, sortConfig]);

    // Helper function to determine if a card is a monster
    const isMonster = (cardType) => {
        return cardType && (
            cardType.includes('Monster') || 
            cardType.includes('Fusion') || 
            cardType.includes('Synchro') || 
            cardType.includes('Xyz') || 
            cardType.includes('Link') ||
            cardType.includes('Pendulum')
        );
    };

    // Helper function to display ATK/DEF values properly
    const displayStatValue = (card, stat) => {
        // For monster cards, show 0 as "0", not "-"
        if (isMonster(card.type)) {
            return card[stat] === 0 ? "0" : (card[stat] || "-");
        }
        // For non-monster cards (spells/traps), always show "-"
        return "-";
    };

    const totalTCGPrice = cards.reduce((sum, card) => sum + (card.tcgPrice * card.quantity), 0);
    const totalOCGPrice = cards.reduce((sum, card) => sum + (card.ocgPrice * card.quantity), 0);

    if (loading) {
        return <div>Loading cards...</div>;
    }

    // Always use grid view for mobile devices
    if (viewMode === 'grid' || isMobile) {
        return (
            <div className="card-grid">
                {sortedCards.map(card => (
                    <div
                        key={card.id}
                        className="card-grid-item"
                    >
                        <img src={card.card_images[0].image_url} alt={card.name} />
                        <div className="card-info">
                            <h3>{card.name}</h3>
                            <p>Type: {card.type}</p>
                            {card.attribute && <p>Attribute: {card.attribute}</p>}
                            {card.race && <p>Monster Type: {card.race}</p>}
                            {(card.level || card.rank || card.linkval) && 
                                <p>Level/Rank/Link: {card.level || card.rank || card.linkval}</p>
                            }
                            {isMonster(card.type) && (
                                <p>ATK/DEF: {displayStatValue(card, 'atk')}/{displayStatValue(card, 'def')}</p>
                            )}
                            <p>Quantity: {card.quantity}</p>
                            <p>TCG Price: ${card.tcgPrice} (Total: ${(card.tcgPrice * card.quantity).toFixed(2)})</p>
                            <p>OCG Price: ${card.ocgPrice} (Total: ${(card.ocgPrice * card.quantity).toFixed(2)})</p>
                        </div>
                    </div>
                ))}
                <div className="card-grid-totals">
                    <h3>Totals</h3>
                    <p>TCG Total: ${totalTCGPrice.toFixed(2)}</p>
                    <p>OCG Total: ${totalOCGPrice.toFixed(2)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="card-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')}>Image</th>
                        <th onClick={() => handleSort('name')}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('archetype')}>Archetype {sortConfig.key === 'archetype' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('type')}>Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('attribute')}>Attribute {sortConfig.key === 'attribute' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('race')}>Monster Type {sortConfig.key === 'race' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('level')}>Level / Rank / Link {sortConfig.key === 'level' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('atk')}>ATK {sortConfig.key === 'atk' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('def')}>DEF {sortConfig.key === 'def' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('quantity')}>Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('tcgPrice')}>TCG Unit Price {sortConfig.key === 'tcgPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('tcgPrice')}>TCG Total {sortConfig.key === 'tcgPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('ocgPrice')}>OCG Unit Price {sortConfig.key === 'ocgPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleSort('ocgPrice')}>OCG Total {sortConfig.key === 'ocgPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedCards.map(card => (
                        <tr key={card.id}>
                            <td>
                                <img src={card.card_images[0].image_url} alt={card.name} className="card-image" />
                            </td>
                            <td>{card.name}</td>
                            <td>{card.archetype || '-'}</td>
                            <td>{card.type}</td>
                            <td>{card.attribute || '-'}</td>
                            <td>{card.race || '-'}</td>
                            <td>{card.level || card.rank || card.linkval || '-'}</td>
                            <td>{displayStatValue(card, 'atk')}</td>
                            <td>{displayStatValue(card, 'def')}</td>
                            <td>{card.quantity}</td>
                            <td>${card.tcgPrice}</td>
                            <td>${(card.tcgPrice * card.quantity).toFixed(2)}</td>
                            <td>${card.ocgPrice}</td>
                            <td>${(card.ocgPrice * card.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="total-row">
                        <td colSpan="10"><strong>Total</strong></td>
                        <td colSpan="2"><strong>${totalTCGPrice.toFixed(2)}</strong></td>
                        <td colSpan="2"><strong>${totalOCGPrice.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default CardTable; 