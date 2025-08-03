#!/usr/bin/env python3
"""
Starbucks Austria Nutrition Data Extractor

Downloads and extracts nutrition information from Starbucks Austria PDF,
converts it to structured JSON format for the web application.
"""

import requests
import hashlib
import json
import os
import re
import sys
from typing import Dict, List, Any, Optional
import pdfplumber
from pathlib import Path

class NutritionExtractor:
    def __init__(self, pdf_url: str, output_file: str = "nutrition_data.json"):
        self.pdf_url = pdf_url
        self.output_file = output_file
        self.pdf_file = "starbucks_nutrition.pdf"
        self.md5_file = "starbucks_nutrition.md5"
        
    def calculate_md5(self, file_path: str) -> str:
        """Calculate MD5 hash of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def should_download_pdf(self) -> bool:
        """Check if PDF needs to be downloaded based on MD5."""
        if not os.path.exists(self.pdf_file):
            print("PDF file not found, will download.")
            return True
            
        if not os.path.exists(self.md5_file):
            print("MD5 file not found, will re-download PDF.")
            return True
            
        current_md5 = self.calculate_md5(self.pdf_file)
        try:
            with open(self.md5_file, 'r') as f:
                stored_md5 = f.read().strip()
            
            if current_md5 == stored_md5:
                print(f"PDF unchanged (MD5: {current_md5}), using existing file.")
                return False
            else:
                print(f"PDF changed (old: {stored_md5}, new: {current_md5}), will re-download.")
                return True
        except:
            print("Error reading MD5 file, will re-download PDF.")
            return True
    
    def download_pdf(self) -> bool:
        """Download the PDF file."""
        try:
            print(f"Downloading PDF from {self.pdf_url}")
            response = requests.get(self.pdf_url, stream=True)
            response.raise_for_status()
            
            with open(self.pdf_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Calculate and store MD5
            md5_hash = self.calculate_md5(self.pdf_file)
            with open(self.md5_file, 'w') as f:
                f.write(md5_hash)
            
            print(f"PDF downloaded successfully (MD5: {md5_hash})")
            return True
            
        except Exception as e:
            print(f"Error downloading PDF: {e}")
            return False
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text.strip())
    
    def extract_nutrition_from_page(self, page) -> List[Dict[str, Any]]:
        """Extract nutrition information from a single page."""
        try:
            # Extract tables from the page
            tables = page.extract_tables()
            nutrition_data = []
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                # Find header row - look for standard nutrition headers
                header_row = None
                for i, row in enumerate(table):
                    if row and any(cell and ('kcal' in str(cell).lower() or 'energy' in str(cell).lower()) for cell in row):
                        header_row = i
                        break
                
                if header_row is None:
                    continue
                
                headers = [self.clean_text(str(cell)) if cell else "" for cell in table[header_row]]
                
                # Process data rows after header
                for row in table[header_row + 1:]:
                    if not row or not any(row):
                        continue
                    
                    row_data = [self.clean_text(str(cell)) if cell else "" for cell in row]
                    
                    # Skip rows that are section headers or empty
                    if (not row_data[0] or 
                        len(row_data[0]) < 3 or 
                        row_data[0] in ['Espresso Drinks', 'Cold Coffee', 'Hot Chocolates', 'Frappuccino', 'Refreshment', 'Hot Teas', 'Tea Latte']):
                        continue
                    
                    # Extract drink info
                    drink_info = self.parse_drink_row(row_data, headers)
                    if drink_info:
                        nutrition_data.append(drink_info)
            
            return nutrition_data
            
        except Exception as e:
            print(f"Error extracting nutrition from page: {e}")
            return []
    
    def parse_drink_row(self, row_data: List[str], headers: List[str]) -> Optional[Dict[str, Any]]:
        """Parse a single drink row into structured data."""
        try:
            if len(row_data) < 3:  # Need at least product, size, and one nutrition value
                return None
            
            drink_name_raw = row_data[0]
            size_raw = row_data[1] if len(row_data) > 1 else ""
            
            if not drink_name_raw or len(drink_name_raw) < 3:
                return None
            
            # Parse size from second column
            size = self.parse_size(size_raw)
            
            # Parse milk type from drink name
            milk_type = self.parse_milk_type(drink_name_raw)
            
            # Clean drink name (remove milk type indicators)
            clean_name = self.clean_drink_name(drink_name_raw)
            
            # Extract nutrition values based on header positions
            nutrition = {}
            for i, header in enumerate(headers):
                if i < len(row_data) and header and row_data[i]:
                    header_lower = header.lower().replace('\n', ' ')
                    value = row_data[i]
                    
                    if 'kcal' in header_lower:
                        nutrition['calories'] = self.parse_numeric_value(value)
                    elif 'energy' in header_lower and 'kj' in header_lower:
                        nutrition['energy_kj'] = self.parse_numeric_value(value)
                    elif 'fat' in header_lower and 'saturated' not in header_lower:
                        nutrition['fat'] = value
                    elif 'saturated' in header_lower:
                        nutrition['saturated_fat'] = value
                    elif 'carbo' in header_lower or 'carb' in header_lower:
                        nutrition['carbs'] = value
                    elif 'sugar' in header_lower:
                        nutrition['sugar'] = value
                    elif 'protein' in header_lower:
                        nutrition['protein'] = value
                    elif 'salt' in header_lower:
                        nutrition['salt'] = value
                    elif 'fiber' in header_lower or 'fibre' in header_lower:
                        nutrition['fiber'] = value
                    elif 'caffeine' in header_lower:
                        nutrition['caffeine'] = value
            
            return {
                'name': clean_name,
                'size': size,
                'milk_type': milk_type,
                'nutrition': nutrition,
                'raw_name': drink_name_raw
            }
            
        except Exception as e:
            print(f"Error parsing drink row: {e}")
            return None
    
    def parse_size(self, size_str: str) -> str:
        """Parse size from size string."""
        if not size_str:
            return "Unknown"
        
        size_lower = size_str.lower()
        
        if 'short' in size_lower:
            return "Short"
        elif 'tall' in size_lower:
            return "Tall"
        elif 'grande' in size_lower:
            return "Grande"
        elif 'venti' in size_lower:
            return "Venti"
        elif 'single' in size_lower:
            return "Single"
        elif 'double' in size_lower:
            return "Double"
        else:
            return size_str.title()
    
    def parse_milk_type(self, drink_name: str) -> str:
        """Parse milk type from drink name."""
        if not drink_name:
            return "Standard"
        
        name_lower = drink_name.lower()
        
        # Check for specific milk types in order of specificity
        if 'lactose-free milk' in name_lower or 'lactose free milk' in name_lower:
            return "Lactose-free Milk"
        elif 'semi skimmed milk' in name_lower or 'semi-skimmed milk' in name_lower:
            return "Semi-skimmed Milk"
        elif 'whole milk' in name_lower:
            return "Whole Milk"
        elif 'low-fat milk' in name_lower or 'low fat milk' in name_lower:
            return "Low-fat Milk"
        elif 'skimmed milk' in name_lower or 'skim milk' in name_lower:
            return "Skimmed Milk"
        elif 'oat drink' in name_lower or 'oat milk' in name_lower:
            return "Oat Milk"
        elif 'almond drink' in name_lower or 'almond milk' in name_lower:
            return "Almond Milk"
        elif 'soya drink' in name_lower or 'soy milk' in name_lower:
            return "Soy Milk"
        elif 'coconut drink' in name_lower or 'coconut milk' in name_lower:
            return "Coconut Milk"
        else:
            return "Standard"
    
    def clean_drink_name(self, drink_name: str) -> str:
        """Clean drink name by removing milk type indicators."""
        if not drink_name:
            return ""
        
        # Remove milk type suffixes - expanded list
        milk_suffixes = [
            '- lactose-free milk', '- lactose free milk',
            '- semi skimmed milk', '- semi-skimmed milk',
            '- whole milk', '- low-fat milk', '- low fat milk', 
            '- skimmed milk', '- skim milk',
            '- oat drink', '- oat milk',
            '- almond drink', '- almond milk',
            '- soya drink', '- soy milk',
            '- coconut drink', '- coconut milk'
        ]
        
        clean_name = drink_name
        for suffix in milk_suffixes:
            clean_name = re.sub(re.escape(suffix), '', clean_name, flags=re.IGNORECASE)
        
        # Clean up extra spaces and dashes
        clean_name = re.sub(r'\s*-\s*$', '', clean_name)
        clean_name = re.sub(r'\s+', ' ', clean_name.strip())
        
        return clean_name
    
    def get_base_drink_name(self, drink_name: str) -> str:
        """Get the base drink name without any milk type indicators."""
        if not drink_name:
            return ""
        
        # More comprehensive cleaning for edge cases
        base_name = drink_name
        
        # Remove common milk type patterns that might have been missed
        milk_patterns = [
            r'\s*-\s*lactose[-\s]?free\s+milk\s*',
            r'\s*-\s*semi\s+skimmed\s+milk\s*',
            r'\s*-\s*skimmed\s+milk\s*',
            r'\s*-\s*whole\s+milk\s*',
            r'\s*-\s*low[-\s]?fat\s+milk\s*',
            r'\s*-\s*oat\s+drink\s*',
            r'\s*-\s*almond\s+drink\s*',
            r'\s*-\s*soya\s+drink\s*',
            r'\s*-\s*coconut\s+drink\s*',
            r'\s*-\s*plant[-\s]?based\s+milk\s*',
            r'\s*-\s*dairy[-\s]?free\s*',
        ]
        
        for pattern in milk_patterns:
            base_name = re.sub(pattern, '', base_name, flags=re.IGNORECASE)
        
        # Clean up any remaining trailing dashes or spaces
        base_name = re.sub(r'\s*-\s*$', '', base_name)
        base_name = re.sub(r'\s+', ' ', base_name.strip())
        
        return base_name
    
    def generate_drink_id(self, drink_name: str) -> str:
        """Generate a clean ID for a drink."""
        if not drink_name:
            return "unknown"
        
        # Convert to lowercase, replace spaces and special chars with underscores
        drink_id = drink_name.lower()
        drink_id = re.sub(r'[®™©]', '', drink_id)  # Remove trademark symbols
        drink_id = re.sub(r'[^\w\s-]', '', drink_id)  # Remove special chars except word chars, spaces, hyphens
        drink_id = re.sub(r'[-\s]+', '_', drink_id)  # Replace spaces and hyphens with underscores
        drink_id = re.sub(r'_+', '_', drink_id)  # Collapse multiple underscores
        drink_id = drink_id.strip('_')  # Remove leading/trailing underscores
        
        return drink_id or "unknown"
    
    def parse_numeric_value(self, value: str) -> Optional[int]:
        """Extract numeric value from string."""
        try:
            if not value:
                return None
            # Extract digits from string
            numbers = re.findall(r'\d+', str(value))
            return int(numbers[0]) if numbers else None
        except:
            return None
    
    def validate_extraction(self, nutrition_data: List[Dict], start_page: int, end_page: int) -> bool:
        """Validate extraction by checking specific drinks on pages 2-4."""
        print(f"\n=== Validation for pages {start_page}-{end_page} ===")
        
        if not nutrition_data:
            print("No nutrition data extracted!")
            return False
        
        # Show sample of extracted data
        print(f"Extracted {len(nutrition_data)} drink entries")
        
        # Show first few entries for manual verification
        for i, drink in enumerate(nutrition_data[:5]):
            print(f"\nDrink {i+1}:")
            print(f"  Name: {drink['name']}")
            print(f"  Size: {drink['size']}")
            print(f"  Milk: {drink['milk_type']}")
            print(f"  Calories: {drink['nutrition'].get('calories', 'N/A')}")
            print(f"  Raw: {drink['raw_name']}")
        
        # Check for variety in sizes and milk types
        sizes = set(drink['size'] for drink in nutrition_data)
        milk_types = set(drink['milk_type'] for drink in nutrition_data)
        
        print(f"\nData variety:")
        print(f"  Sizes found: {sorted(sizes)}")
        print(f"  Milk types found: {sorted(milk_types)}")
        
        has_variety = len(sizes) > 1 and len(milk_types) > 1
        print(f"  Good variety: {has_variety}")
        
        return len(nutrition_data) > 0 and has_variety
    
    def extract_test_pages(self, start_page: int = 2, end_page: int = 4) -> bool:
        """Extract and validate data from test pages."""
        if not os.path.exists(self.pdf_file):
            if not self.download_pdf():
                return False
        
        try:
            with pdfplumber.open(self.pdf_file) as pdf:
                print(f"PDF has {len(pdf.pages)} pages")
                
                all_nutrition_data = []
                
                for page_num in range(start_page - 1, min(end_page, len(pdf.pages))):
                    print(f"\nProcessing page {page_num + 1}...")
                    page = pdf.pages[page_num]
                    page_data = self.extract_nutrition_from_page(page)
                    
                    if page_data:
                        all_nutrition_data.extend(page_data)
                        print(f"  Extracted {len(page_data)} entries from page {page_num + 1}")
                    else:
                        print(f"  No data extracted from page {page_num + 1}")
                
                # Validate extraction
                is_valid = self.validate_extraction(all_nutrition_data, start_page, end_page)
                
                # Save test data
                test_output = f"test_nutrition_data_{start_page}-{end_page}.json"
                with open(test_output, 'w', encoding='utf-8') as f:
                    json.dump(all_nutrition_data, f, indent=2, ensure_ascii=False)
                
                print(f"\nTest data saved to {test_output}")
                return is_valid
                
        except Exception as e:
            print(f"Error during test extraction: {e}")
            return False
    
    def extract_full_pdf(self) -> bool:
        """Extract nutrition data from the complete PDF."""
        if self.should_download_pdf():
            if not self.download_pdf():
                return False
        
        try:
            with pdfplumber.open(self.pdf_file) as pdf:
                print(f"Processing complete PDF ({len(pdf.pages)} pages)...")
                
                all_nutrition_data = []
                
                # Process from page 2 onwards
                for page_num in range(1, len(pdf.pages)):  # 0-indexed, so page 1 = page 2
                    print(f"Processing page {page_num + 1}...")
                    page = pdf.pages[page_num]
                    page_data = self.extract_nutrition_from_page(page)
                    
                    if page_data:
                        all_nutrition_data.extend(page_data)
                        print(f"  Extracted {len(page_data)} entries")
                
                # Organize data by drink name
                organized_data = self.organize_nutrition_data(all_nutrition_data)
                
                # Save to JSON
                with open(self.output_file, 'w', encoding='utf-8') as f:
                    json.dump(organized_data, f, indent=2, ensure_ascii=False)
                
                print(f"\nComplete nutrition data saved to {self.output_file}")
                print(f"Total drinks: {len(organized_data.get('drinks', []))}")
                
                return True
                
        except Exception as e:
            print(f"Error during full extraction: {e}")
            return False
    
    def organize_nutrition_data(self, raw_data: List[Dict]) -> Dict[str, Any]:
        """Organize raw nutrition data into structured format."""
        drinks_map = {}
        
        for item in raw_data:
            # Use the cleaned name from the item, not the raw name
            clean_drink_name = item['name']  # This should already be the cleaned name
            original_raw_name = item.get('raw_name', clean_drink_name)
            
            # If the name still contains milk type info, clean it further
            # This handles cases where cleaning wasn't perfect
            base_drink_name = self.get_base_drink_name(clean_drink_name)
            
            size = item['size']
            milk_type = item['milk_type']
            nutrition = item['nutrition']
            
            if base_drink_name not in drinks_map:
                drinks_map[base_drink_name] = {
                    'id': self.generate_drink_id(base_drink_name),
                    'name': base_drink_name,
                    'sizes': {}
                }
            
            if size not in drinks_map[base_drink_name]['sizes']:
                drinks_map[base_drink_name]['sizes'][size] = {
                    'size': size,
                    'milkVariants': {}
                }
            
            # Create a unique key for this milk variant to avoid duplicates
            milk_key = f"{milk_type}_{size}"
            drinks_map[base_drink_name]['sizes'][size]['milkVariants'][milk_key] = {
                'milkType': milk_type,
                'nutrition': nutrition
            }
        
        # Convert to list format
        drinks = []
        for drink_data in drinks_map.values():
            # Convert sizes dict to list
            sizes = []
            for size_data in drink_data['sizes'].values():
                # Convert milk variants dict to list
                milk_variants = list(size_data['milkVariants'].values())
                sizes.append({
                    'size': size_data['size'],
                    'milkVariants': milk_variants
                })
            
            drinks.append({
                'id': drink_data['id'],
                'name': drink_data['name'],
                'sizes': sizes
            })
        
        return {
            'drinks': sorted(drinks, key=lambda x: x['name']),
            'metadata': {
                'source': self.pdf_url,
                'extracted_at': __import__('datetime').datetime.now().isoformat(),
                'total_drinks': len(drinks)
            }
        }


def main():
    """Main function to run the extraction."""
    pdf_url = "https://www.starbucks.at/sites/starbucks-at-pwa/files/2025-04/AT%20Beverage%20Nutrition%20Summer.pdf"
    
    extractor = NutritionExtractor(pdf_url)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("Running test extraction on pages 2-4...")
        success = extractor.extract_test_pages(2, 4)
        if success:
            print("\nTest extraction completed successfully!")
        else:
            print("\nTest extraction failed!")
        return success
    
    elif len(sys.argv) > 1 and sys.argv[1] == "--full":
        print("Running full PDF extraction...")
        success = extractor.extract_full_pdf()
        if success:
            print("\nFull extraction completed successfully!")
        else:
            print("\nFull extraction failed!")
        return success
    
    else:
        print("Usage:")
        print("  python extract_nutrition.py --test   # Test on pages 2-4")
        print("  python extract_nutrition.py --full   # Extract complete PDF")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)