# Yu-Gi-Oh! Deck Viewer

A web application for viewing and managing Yu-Gi-Oh! decks. This application allows users to import decks from YDK files, view card details, and export decks back to YDK format.

## Features

- Import decks from YDK files
- View deck cards in table or grid format
- Search and add cards to your deck
- View detailed card information on hover
- Display TCG and OCG card prices
- Export decks to YDK format
- Responsive design for different screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/simple-ygo-deck-price.git
cd simple-ygo-deck-price
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Importing a Deck**
   - Click the "Choose File" button
   - Select a YDK file from your computer
   - The deck will be loaded and displayed

2. **Viewing Cards**
   - Cards can be viewed in either table or grid format
   - Hover over a card to see detailed information
   - Switch between views using the "Switch View" button

3. **Searching for Cards**
   - Click the "Show Search" button
   - Enter a card name in the search box
   - Click "Add to Deck" to add a card to your deck

4. **Exporting a Deck**
   - Click the "Export to YDK" button
   - The deck will be downloaded as a YDK file

## API Usage

This application uses the following APIs:
- YGOPRODeck API for card data and TCG prices
- TCGRepublic website for OCG prices

Please note that both APIs are rate-limited to 10 requests per second.

## Technologies Used

- React
- Vite
- Axios
- Cheerio
- FileSaver.js

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YGOPRODeck for providing the card database API
- TCGRepublic for OCG price data
