import React from 'react';

const CardDetails = ({ card }) => {
    if (!card) return null;

    return (
        <div className="card-details">
            <img src={card.card_images[0].image_url} alt={card.name} />
            <div className="details-content">
                <h3>{card.name}</h3>
                <p><strong>Type:</strong> {card.type}</p>
                {card.attribute && <p><strong>Attribute:</strong> {card.attribute}</p>}
                {card.race && <p><strong>Monster Type:</strong> {card.race}</p>}
                {card.level && <p><strong>Level:</strong> {card.level}</p>}
                {card.rank && <p><strong>Rank:</strong> {card.rank}</p>}
                {card.linkval && <p><strong>Link Rating:</strong> {card.linkval}</p>}
                {card.atk && <p><strong>ATK:</strong> {card.atk}</p>}
                {card.def && <p><strong>DEF:</strong> {card.def}</p>}
                {card.archetype && <p><strong>Archetype:</strong> {card.archetype}</p>}
                <p><strong>Description:</strong> {card.desc}</p>
                <p><strong>TCG Price:</strong> ${card.card_prices?.[0]?.tcgplayer_price || 'N/A'}</p>
            </div>
        </div>
    );
};

export default CardDetails; 