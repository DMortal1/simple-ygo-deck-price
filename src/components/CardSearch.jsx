import React, { useState } from 'react';

const CardSearch = ({ onAddCard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    
    const RESULTS_PER_PAGE = 12;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setCurrentPage(1); // Reset to first page on new search
        try {
            const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            const searchResults = data.data || [];
            setResults(searchResults);
            setTotalResults(searchResults.length);
        } catch (error) {
            console.error('Error searching cards:', error);
            setResults([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
    
    const paginatedResults = results.slice(
        (currentPage - 1) * RESULTS_PER_PAGE, 
        currentPage * RESULTS_PER_PAGE
    );

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="card-search">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for a card..."
                    className="search-input"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {results.length > 0 && (
                <>
                    <div className="search-results-info">
                        Showing {paginatedResults.length} of {totalResults} results (Page {currentPage} of {totalPages})
                    </div>
                    <div className="search-results">
                        {paginatedResults.map(card => (
                            <div key={card.id} className="search-result-item">
                                <img src={card.card_images[0].image_url} alt={card.name} />
                                <div className="result-info">
                                    <h3>{card.name}</h3>
                                    <p>{card.type}</p>
                                    <button onClick={() => onAddCard(card.id)}>
                                        Add to Deck
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick={goToPrevPage} 
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        <span className="page-indicator">{currentPage} / {totalPages}</span>
                        <button 
                            onClick={goToNextPage} 
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CardSearch; 