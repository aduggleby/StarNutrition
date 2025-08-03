# Claude Rules for StarNutrition Project

This document contains important rules, patterns, and best practices for maintaining and developing the StarNutrition project.

## Project Overview
StarNutrition is a web application that displays nutritional information for Starbucks® Austria beverages. It features a search-first interface, filtering capabilities, and a favorites system.

## Important Technical Details

### Build and Development
- **Build Tool**: Vite with Tailwind CSS v4
- **CSS Processing**: Import CSS via JavaScript (`import './style.css'`) for Vite to process
- **Base Path**: Set in vite.config.js as `/StarNutrition/` for GitHub Pages
- **Development**: Use `npm run dev` for local development
- **Building**: Use `npm run build` for production builds

### GitHub Pages Deployment
- Deployed via GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Uses GitHub Pages v4 with artifacts approach
- Workflow permissions required:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- Public folder must NOT be gitignored for workflows to work

### Data Extraction
- **Script**: `extract_nutrition.py` extracts from Starbucks® Austria PDF
- **Key Fix**: Use `get_base_drink_name()` method to properly group drink variants
- **MD5 Checking**: Script checks MD5 to avoid unnecessary re-downloads
- **Force Flag**: `--force` flag skips MD5 check for manual runs
- **Commands**:
  - `npm run extract` - Full extraction
  - `npm run extract:test` - Test extraction (pages 2-4)

### GitHub Actions Workflows
1. **Monthly Extraction** (`monthly-extraction.yml`)
   - Runs on 1st of each month at 2 AM UTC
   - Requires `contents: write` permission
   - Creates issues on failure

2. **Manual Extraction** (`manual-extraction.yml`)
   - Workflow dispatch with test mode option
   - Always uses `--force` flag
   - Test mode doesn't commit changes

3. **Deploy** (`deploy.yml`)
   - Triggers on push to master
   - Builds with Vite
   - Deploys to GitHub Pages

## UI/UX Rules

### Search-First Interface
- Show NO results until user enters search text
- Hide size/milk filters when no search is active
- Show "All" option in filters when search is active
- Search icon transforms to clear button when text is entered

### Filtering
- Size options: All, Short, Tall, Grande, Venti
- Milk options: All, Standard, Semi-skimmed, Oat, Almond, Soy, etc.
- Filters only visible when search is active

### Favorites System
- Store in localStorage as `starredDrinks`
- Format: `drinkId:size:milkType`
- Can only favorite specific drink/size/milk combinations
- NOT whole drink categories

### Modals
- Use custom modals, NOT browser `confirm()` dialogs
- Disclaimer modal shown on first visit
- Confirmation modal for clearing favorites
- Nutrition modal for detailed information

## Legal and Compliance

### Trademark Requirements
- ALWAYS use registered trademark symbol: Starbucks®
- Include trademark disclaimer in:
  - README.md
  - Disclaimer modal
  - GitHub workflows
  - Python scripts
- Standard disclaimer text:
  ```
  Starbucks® is a registered trademark of Starbucks Corporation. 
  This project is not affiliated with, endorsed by, or sponsored by Starbucks Corporation.
  ```

### License
- MIT License with copyright year 2025
- Nutrition data belongs to Starbucks Corporation

## Code Style and Patterns

### JavaScript
- Vanilla JavaScript (no frameworks)
- Use ES6+ features (arrow functions, template literals, etc.)
- Mobile-first responsive design
- Touch-friendly interface (min 44px touch targets)

### CSS
- Tailwind CSS v4 via Vite plugin
- Import in main.js: `import './style.css'`
- Use utility classes, avoid custom CSS
- Gradient header: `bg-gradient-to-br from-green-600 to-green-800`

### Git Commits
- Clear, descriptive commit messages
- Include bullet points for multiple changes
- Use emojis sparingly (🤖 for automated commits)

## Common Issues and Solutions

### Issue: Styles not loading on GitHub Pages
**Solution**: Import CSS in JavaScript and use Vite for building

### Issue: Workflow permission denied
**Solution**: Add proper permissions to workflow files

### Issue: Public folder being gitignored
**Solution**: Use `git add -f public/nutrition_data.json` in workflows

### Issue: Drinks appearing multiple times
**Solution**: Use `get_base_drink_name()` to properly group by base drink name

## Testing and Validation

### Before Committing
- Run `npm run dev` to test locally
- Check that search and filters work correctly
- Verify favorites persist in localStorage
- Test on mobile viewport

### Data Extraction Testing
- Use `npm run extract:test` to validate extraction logic
- Check for variety in sizes and milk types
- Verify drink grouping is correct

## Future Considerations
- Keep the interface simple and focused
- Maintain fast load times
- Ensure accessibility on mobile devices
- Regular updates via GitHub Actions
- Monitor for PDF structure changes

## Contact
Created by [@alexduggleby.com](https://bsky.app/profile/alexduggleby.com) on Bluesky