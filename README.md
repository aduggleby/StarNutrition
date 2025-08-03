# StarNutrition

A web application that displays nutritional information for Starbucks® Austria beverages. Search drinks, filter by size and milk type, and save your favorites.

🔗 **[Live Demo](https://aduggleby.github.io/StarNutrition/)**

## Overview

StarNutrition extracts nutrition data from the official Starbucks® Austria PDF and presents it in an easy-to-use mobile-friendly interface. Users can:
- Search for drinks by name
- Filter by size and milk variants
- View detailed nutrition information
- Save favorite drink combinations

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.7+ (for data extraction)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/aduggleby/StarNutrition.git
cd StarNutrition

# Install dependencies
npm install

# Install Python dependencies for extraction
pip install requests pdfplumber
```

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## Data Extraction

The nutrition data is automatically extracted from Starbucks® Austria's official PDF:

```bash
# Extract latest nutrition data
npm run extract

# Test extraction on sample pages
npm run extract:test
```

The extraction script:
- Downloads the PDF from Starbucks® Austria
- Verifies changes using MD5 checksums
- Extracts and structures nutrition data
- Validates accuracy before saving

## Development

### Project Structure
```
StarNutrition/
├── index.html              # Main HTML file
├── src/
│   ├── main.js            # Application logic
│   └── style.css          # Styles with Tailwind CSS
├── public/
│   └── nutrition_data.json # Extracted nutrition data
├── extract_nutrition.py    # PDF extraction script
└── vite.config.js         # Build configuration
```

### Key Technologies
- **Frontend**: Vanilla JavaScript, Tailwind CSS v4
- **Build Tool**: Vite
- **Deployment**: GitHub Pages with Actions
- **Data Extraction**: Python with pdfplumber

### Automated Updates
- **Monthly**: GitHub Actions automatically checks for data updates on the 1st of each month
- **Manual**: Trigger updates via the Actions tab

## Disclaimer

**Trademark Notice**: Starbucks® is a registered trademark of Starbucks Corporation. This project is not affiliated with, endorsed by, or sponsored by Starbucks Corporation.

**Data Accuracy**: This application automatically extracts nutrition data from publicly available Starbucks® Austria PDF documents. While we strive for accuracy, the automated extraction process may contain errors. Always consult official Starbucks® sources for the most current nutritional information.

**No Liability**: This project is for educational and personal use only. We assume no responsibility for the accuracy, completeness, or fitness of this information for any particular purpose.

## Created By

Created by [@alexduggleby.com](https://bsky.app/profile/alexduggleby.com) on Bluesky

## License

This project is open source. The nutrition data belongs to Starbucks Corporation.