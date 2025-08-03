# StarNutrition - Starbucks Austria Nutrition Information

A modern, mobile-first web application that displays nutritional information for Starbucks Austria beverages. Users can search for drinks, filter by size and milk variants, view detailed nutrition information, and favorite specific combinations.

🔗 **[Live Demo](https://aduggleby.github.io/StarNutrition/)**

## ✨ Features

### 🎨 **Beautiful Modern Interface**
- **Mobile-First Design**: Optimized for touch with finger-friendly interactions
- **Smooth Animations**: Fluid transitions and micro-interactions for delightful UX
- **Glassmorphism Effects**: Modern backdrop blur and translucent elements
- **Progressive Disclosure**: Clean interface that reveals features as needed
- **Custom Modals**: Professional dialogs for nutrition details and confirmations

### 🔍 **Smart Search & Filtering**
- **Search-Driven Experience**: No information shown until user searches
- **Dynamic Icons**: Search icon transforms to clear button when typing
- **Real-time Filtering**: Instant results with size and milk type filters
- **Contextual Filters**: Filters only appear when relevant (during search)

### ⭐ **Granular Favorites System**
- **Specific Combinations**: Favorite exact drink/size/milk combinations
- **Visual Indicators**: Clear favorite status in nutrition modals
- **Persistent Storage**: Favorites saved in browser localStorage
- **Bulk Management**: Clear all favorites with custom confirmation modal

### 📊 **Rich Nutrition Display**
- **Detailed Modal View**: Beautiful full-screen nutrition information
- **Key Metrics Highlighted**: Calories and caffeine prominently displayed
- **Comprehensive Data**: All nutrition facts in organized grid layout
- **Color-Coded Sections**: Easy visual hierarchy for quick scanning

### 🛡️ **Data Transparency**
- **Source Attribution**: Clear data source information with direct PDF links
- **Disclaimer Modal**: Comprehensive disclaimer shown on first visit
- **Processing Transparency**: Timestamps and automated extraction disclosure
- **Data Information Link**: Easy access to source and disclaimer info

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd StarNutrition

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Search**: Enter a drink name to see available options
2. **Filter**: Use size and milk type filters that appear during search
3. **View Details**: Click any drink variant for full nutrition information
4. **Favorite**: Star specific combinations in the nutrition modal
5. **Data Info**: Click "Data Information" in header for source details

### Data Extraction
```bash
# Extract latest nutrition data
npm run extract

# Test extraction on sample pages
npm run extract:test
```

## 📁 Project Structure

```
StarNutrition/
├── index.html              # Main application HTML
├── src/
│   ├── main.js             # Application logic
│   └── style.css           # Custom styles and Tailwind imports
├── public/
│   └── nutrition_data.json # Processed nutrition data
├── extract_nutrition.py    # PDF extraction script
├── nutrition_data.json     # Source nutrition data
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🔧 Technical Details

### Frontend Stack
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS v4 with custom design system
- **Build Tool**: Vite for development and production builds
- **Storage**: Browser localStorage for favorites and preferences

### Data Processing
- **PDF Extraction**: Python with `pdfplumber` library
- **Source Verification**: MD5 hash checking for data updates
- **Data Structure**: Hierarchical drink → size → milk variant → nutrition
- **Validation**: Automated testing on sample pages

### Key Features Implementation
- **Search-First UX**: No data shown until user searches
- **Dynamic UI**: Filters and icons change based on user interaction
- **Modal System**: Custom modals for nutrition, disclaimers, and confirmations
- **Progressive Enhancement**: Clean fallbacks for all interactions

## 📊 Data Schema

```json
{
  "drinks": [
    {
      "id": "unique_drink_id",
      "name": "Drink Name",
      "sizes": [
        {
          "size": "Size Name",
          "milkVariants": [
            {
              "milkType": "Milk Type",
              "nutrition": {
                "calories": 150,
                "fat": "6g",
                "carbs": "22g", 
                "protein": "8g",
                "sugar": "20g",
                "salt": "0.26g",
                "caffeine": "89.1"
              }
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "source": "PDF URL",
    "extracted_at": "ISO timestamp",
    "total_drinks": 157
  }
}
```

## 🌐 Browser Support

- ✅ **Chrome/Edge**: Full support with all features
- ✅ **Firefox**: Full support with all features  
- ✅ **Safari**: Full support including iOS PWA features
- ✅ **Mobile**: Optimized touch experience across all platforms

## 📱 Mobile Features

- **iOS PWA Prompt**: Smart installation guidance for iOS users
- **Haptic Feedback**: Subtle vibrations on supported devices
- **Safe Area Support**: Proper spacing for notched devices
- **Touch Optimized**: 44px minimum touch targets throughout

## 🔒 Privacy & Data

- **No Tracking**: No analytics or user tracking
- **Local Storage Only**: All data stored locally in browser
- **Source Transparency**: Clear attribution to official Starbucks data
- **Disclaimer System**: Comprehensive disclaimers with user acceptance

## 📄 Dependencies

### Runtime
- **Vite**: Fast build tool and dev server
- **Tailwind CSS v4**: Utility-first CSS framework

### Data Extraction
- **Python 3.7+**: Runtime environment
- **requests**: HTTP requests for PDF download
- **pdfplumber**: PDF text and table extraction

## 🚀 Development

### Adding Features
1. Update `src/main.js` for new functionality
2. Modify `index.html` for UI changes
3. Update `src/style.css` for styling
4. Test on mobile and desktop

### Custom Domain Setup
See [CUSTOM_DOMAIN.md](CUSTOM_DOMAIN.md) for detailed instructions on mapping your own domain to this GitHub Pages site.

### Data Updates

#### Automated Updates
- **Monthly**: GitHub Actions automatically checks for updates on the 1st of each month
- **Manual**: Trigger updates anytime via Actions tab → "Manual Nutrition Data Update"

#### Local Updates
The extraction script automatically:
- Downloads the latest PDF from Starbucks Austria
- Checks for changes using MD5 verification
- Extracts and structures nutrition data
- Validates extraction accuracy

```bash
# Run locally
npm run extract        # Full extraction
npm run extract:test   # Test mode
```

## 📜 License

This project is for educational and personal use. Nutrition data belongs to Starbucks Corporation. The application provides automated extraction and display of publicly available information with full source attribution.

## 🙏 Disclaimer

This application automatically extracts nutrition data from official Starbucks Austria PDF documents. While we strive for accuracy, automated processing may contain errors. Always consult official Starbucks sources for the most current and accurate nutritional information.