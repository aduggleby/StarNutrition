// Import styles for Vite to process
import './style.css';

// StarNutrition App - Enhanced with Modern UX Patterns

class StarNutritionApp {
    constructor() {
        this.nutritionData = null;
        this.filteredDrinks = [];
        this.currentFilters = {
            search: '',
            size: 'All',      // Default to All
            milkType: 'All'   // Default to All
        };
        this.starredDrinks = this.loadStarredDrinks();
        this.sizeUsageStats = this.loadSizeUsageStats();
        this.debounceTimer = null;
        this.isLoading = false;
        this.confirmationCallback = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadNutritionData();
            this.setupEventListeners();
            this.populateDataSourceInfo();
            this.populateFilters();
            this.updateSearchIcon(); // Set initial search icon state
            this.filterAndDisplayDrinks(); // Use filter method instead of direct display
            this.updateStarredSection();
            this.hideLoading();
            this.checkDisclaimerAcceptance();
            this.checkForIOSInstallPrompt();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load nutrition data. Please refresh the page.');
        }
    }

    async loadNutritionData() {
        try {
            const response = await fetch(import.meta.env.BASE_URL + 'nutrition_data.json');
            if (!response.ok) {
                throw new Error('Failed to fetch nutrition data');
            }
            this.nutritionData = await response.json();
            this.filteredDrinks = [...this.nutritionData.drinks];
        } catch (error) {
            console.error('Error loading nutrition data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search input with debouncing
        const searchInput = document.getElementById('drink-search');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.updateSearchIcon();
                this.filterAndDisplayDrinks();
                this.updateStarredSection(); // Hide/show favorites based on search
            }, 300);
        });

        // Search icon/clear button
        document.getElementById('search-icon-btn').addEventListener('click', () => {
            this.clearSearch();
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-backdrop').addEventListener('click', () => {
            this.closeModal();
        });

        // Star button in modal
        document.getElementById('modal-star-btn').addEventListener('click', () => {
            this.toggleStarCurrentDrink();
        });

        // Clear starred drinks
        document.getElementById('clear-starred').addEventListener('click', () => {
            this.showConfirmationModal('Clear all favorites?', 'This action cannot be undone.', () => {
                this.clearAllStarredDrinks();
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Check which modal is open and close it
                const nutritionModal = document.getElementById('nutrition-modal');
                const confirmationModal = document.getElementById('confirmation-modal');
                const disclaimerModal = document.getElementById('disclaimer-modal');
                
                if (!nutritionModal.classList.contains('hidden')) {
                    this.closeModal();
                } else if (!confirmationModal.classList.contains('hidden')) {
                    this.hideConfirmationModal();
                } else if (!disclaimerModal.classList.contains('hidden')) {
                    // Don't allow escaping disclaimer on first visit
                    const hasAccepted = localStorage.getItem('disclaimer-accepted');
                    if (hasAccepted) {
                        this.hideDisclaimerModal();
                    }
                }
            }
        });

        // Handle scroll for sticky header effects
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 100));

        // Prevent zoom on double tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // iOS Install Prompt close button
        document.getElementById('ios-install-close').addEventListener('click', () => {
            this.hideIOSInstallPrompt();
        });

        // Data Information link
        document.getElementById('data-info-link').addEventListener('click', () => {
            this.showDisclaimerModal();
        });

        // Disclaimer modal accept button
        document.getElementById('disclaimer-accept').addEventListener('click', () => {
            this.acceptDisclaimer();
        });

        // Confirmation modal buttons
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.hideConfirmationModal();
        });

        document.getElementById('confirm-ok').addEventListener('click', () => {
            if (this.confirmationCallback) {
                this.confirmationCallback();
                this.confirmationCallback = null;
            }
            this.hideConfirmationModal();
        });
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    handleScroll() {
        const header = document.querySelector('header');
        const scrolled = window.scrollY > 20;
        
        if (scrolled) {
            header.classList.add('shadow-lg');
        } else {
            header.classList.remove('shadow-lg');
        }
    }

    populateDataSourceInfo() {
        if (!this.nutritionData || !this.nutritionData.metadata) {
            return;
        }

        const metadata = this.nutritionData.metadata;
        
        // Update source link in disclaimer modal
        const disclaimerSourceLink = document.getElementById('disclaimer-source-link');
        if (metadata.source) {
            disclaimerSourceLink.href = metadata.source;
        }
    }

    populateFilters() {
        this.populateSizeFilter();
        this.populateMilkFilter();
    }

    populateSizeFilter() {
        const sizeOptions = document.getElementById('size-options');
        const sizes = this.getAllSizes();
        
        sizeOptions.innerHTML = sizes.map(size => `
            <button 
                class="size-filter-btn flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-press focus-ring touch-target ${size === this.currentFilters.size ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50'}"
                data-size="${size}"
            >
                ${size}
            </button>
        `).join('');

        // Add click handlers
        sizeOptions.querySelectorAll('.size-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateFilterState(sizeOptions, e.target, 'size-filter-btn');
                this.currentFilters.size = e.target.dataset.size;
                this.trackSizeUsage(e.target.dataset.size);
                this.filterAndDisplayDrinks();
                this.hapticFeedback();
            });
        });
    }

    populateMilkFilter() {
        const milkOptions = document.getElementById('milk-options');
        const milkTypes = this.getAllMilkTypes();
        
        milkOptions.innerHTML = milkTypes.map(milk => `
            <button 
                class="milk-filter-btn flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-press focus-ring touch-target ${milk === this.currentFilters.milkType ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50'}"
                data-milk="${milk}"
            >
                ${milk}
            </button>
        `).join('');

        // Add click handlers
        milkOptions.querySelectorAll('.milk-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateFilterState(milkOptions, e.target, 'milk-filter-btn');
                this.currentFilters.milkType = e.target.dataset.milk;
                this.filterAndDisplayDrinks();
                this.hapticFeedback();
            });
        });
    }

    updateFilterState(container, activeBtn, btnClass) {
        // Reset all buttons
        container.querySelectorAll(`.${btnClass}`).forEach(b => {
            b.className = `${btnClass} flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-press focus-ring touch-target bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50`;
        });
        
        // Activate selected button
        activeBtn.className = `${btnClass} flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-press focus-ring touch-target bg-green-600 text-white shadow-md`;
    }

    hapticFeedback() {
        // Provide haptic feedback on supported devices
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    getAllSizes() {
        const sizes = new Set();
        this.nutritionData.drinks.forEach(drink => {
            drink.sizes.forEach(size => {
                sizes.add(size.size);
            });
        });
        
        // Define priority order: All first, then standard sizes, then by usage stats
        const standardSizes = ['Tall', 'Grande', 'Venti'];
        const allSizes = Array.from(sizes);
        const otherSizes = allSizes.filter(size => !standardSizes.includes(size));
        
        // Sort other sizes by usage stats (most used first), then alphabetically
        otherSizes.sort((a, b) => {
            const usageA = this.sizeUsageStats[a] || 0;
            const usageB = this.sizeUsageStats[b] || 0;
            if (usageA !== usageB) {
                return usageB - usageA; // Descending by usage
            }
            return a.localeCompare(b); // Alphabetical fallback
        });
        
        return ['All', ...standardSizes, ...otherSizes].filter(size => size === 'All' || allSizes.includes(size));
    }

    getAllMilkTypes() {
        const milkTypes = new Set();
        this.nutritionData.drinks.forEach(drink => {
            drink.sizes.forEach(size => {
                size.milkVariants.forEach(variant => {
                    milkTypes.add(variant.milkType);
                });
            });
        });
        return ['All', ...Array.from(milkTypes).sort()];
    }

    filterAndDisplayDrinks() {
        // Don't show any drinks if there's no search term
        if (!this.currentFilters.search || this.currentFilters.search.trim() === '') {
            this.filteredDrinks = [];
            this.displayDrinks();
            this.updateResultsCount();
            this.hideFilters();
            return;
        }

        this.showFilters();

        this.filteredDrinks = this.nutritionData.drinks.filter(drink => {
            // Filter by search term
            if (!drink.name.toLowerCase().includes(this.currentFilters.search)) {
                return false;
            }

            // Filter by size (allow "All")
            if (this.currentFilters.size && this.currentFilters.size !== 'All' &&
                !drink.sizes.some(size => size.size === this.currentFilters.size)) {
                return false;
            }

            // Filter by milk type (allow "All")
            if (this.currentFilters.milkType && this.currentFilters.milkType !== 'All' &&
                !drink.sizes.some(size => 
                    size.milkVariants.some(variant => variant.milkType === this.currentFilters.milkType)
                )) {
                return false;
            }

            return true;
        });

        this.displayDrinks();
        this.updateResultsCount();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('results-count');
        resultsCount.textContent = `${this.filteredDrinks.length} drinks`;
    }

    displayDrinks() {
        const drinksList = document.getElementById('drinks-list');
        const noResults = document.getElementById('no-results');
        const noResultsTitle = document.getElementById('no-results-title');
        const noResultsText = document.getElementById('no-results-text');

        if (this.filteredDrinks.length === 0) {
            drinksList.innerHTML = '';
            noResults.classList.remove('hidden');
            
            // Update message based on whether there's a search term
            if (!this.currentFilters.search || this.currentFilters.search.trim() === '') {
                noResultsTitle.textContent = 'Start searching';
                noResultsText.textContent = 'Enter a drink name in the search box above to find nutrition information.';
            } else {
                noResultsTitle.textContent = 'No drinks found';
                noResultsText.textContent = 'Try adjusting your search or filter criteria to find more drinks.';
            }
            return;
        }

        noResults.classList.add('hidden');
        drinksList.innerHTML = this.filteredDrinks.map(drink => this.createDrinkCard(drink)).join('');

        // Add event listeners to the new elements
        this.attachDrinkCardListeners();
    }

    createDrinkCard(drink) {
        const availableSizes = this.getAvailableSizesForFilters(drink);
        
        return `
            <div class="drink-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                <div class="p-4">
                    <div class="mb-3">
                        <h3 class="font-semibold text-gray-900 text-lg leading-tight">${drink.name}</h3>
                    </div>
                    
                    <div class="space-y-2">
                        ${availableSizes.map(size => this.createSizeOptions(drink, size)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getAvailableSizesForFilters(drink) {
        return drink.sizes.filter(size => {
            // Filter by current size filter (allow "All")
            if (this.currentFilters.size && this.currentFilters.size !== 'All' && 
                size.size !== this.currentFilters.size) {
                return false;
            }

            // Filter by current milk filter (allow "All")
            if (this.currentFilters.milkType && this.currentFilters.milkType !== 'All' &&
                !size.milkVariants.some(variant => variant.milkType === this.currentFilters.milkType)) {
                return false;
            }

            return true;
        });
    }

    createSizeOptions(drink, size) {
        const availableMilkVariants = (this.currentFilters.milkType && this.currentFilters.milkType !== 'All')
            ? size.milkVariants.filter(variant => variant.milkType === this.currentFilters.milkType)
            : size.milkVariants;

        return availableMilkVariants.map(variant => {
            const calories = variant.nutrition.calories || 'N/A';
            const caffeine = variant.nutrition.caffeine || 'N/A';
            
            return `
                <button 
                    class="size-variant-btn w-full p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition-all duration-200 btn-press focus-ring touch-target group"
                    data-drink-id="${drink.id}"
                    data-size="${size.size}"
                    data-milk="${variant.milkType}"
                >
                    <div class="flex justify-between items-center">
                        <div class="text-left">
                            <div class="font-medium text-gray-900 mb-1">${size.size} • ${variant.milkType}</div>
                            <div class="text-sm text-gray-500">
                                <span class="inline-flex items-center bg-white px-2 py-1 rounded-lg text-xs font-medium text-gray-700 mr-2">
                                    ${calories} cal
                                </span>
                                <span class="inline-flex items-center bg-white px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                                    ${caffeine} mg caffeine
                                </span>
                            </div>
                        </div>
                        <div class="text-green-600 group-hover:text-green-700 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    }

    attachDrinkCardListeners() {
        // Size variant buttons
        document.querySelectorAll('.size-variant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const drinkId = e.currentTarget.dataset.drinkId;
                const size = e.currentTarget.dataset.size;
                const milkType = e.currentTarget.dataset.milk;
                this.showNutritionModal(drinkId, size, milkType);
                this.hapticFeedback();
            });
        });
    }

    showNutritionModal(drinkId, size, milkType) {
        const drink = this.nutritionData.drinks.find(d => d.id === drinkId);
        const sizeData = drink.sizes.find(s => s.size === size);
        const variant = sizeData.milkVariants.find(v => v.milkType === milkType);

        if (!drink || !sizeData || !variant) {
            console.error('Drink data not found');
            return;
        }

        // Update modal content
        document.getElementById('modal-drink-name').textContent = drink.name;
        document.getElementById('modal-drink-details').textContent = `${size} • ${milkType}`;
        
        const nutrition = variant.nutrition;
        document.getElementById('modal-calories').textContent = nutrition.calories || 'N/A';
        document.getElementById('modal-caffeine').textContent = nutrition.caffeine || 'N/A';
        document.getElementById('modal-fat').textContent = nutrition.fat ? `${nutrition.fat}g` : 'N/A';
        document.getElementById('modal-saturated-fat').textContent = nutrition.saturated_fat ? `${nutrition.saturated_fat}g` : 'N/A';
        document.getElementById('modal-carbs').textContent = nutrition.carbs ? `${nutrition.carbs}g` : 'N/A';
        document.getElementById('modal-sugar').textContent = nutrition.sugar ? `${nutrition.sugar}g` : 'N/A';
        document.getElementById('modal-protein').textContent = nutrition.protein ? `${nutrition.protein}g` : 'N/A';
        document.getElementById('modal-salt').textContent = nutrition.salt ? `${nutrition.salt}g` : 'N/A';

        // Update star button
        const isStarred = this.starredDrinks.some(starred => 
            starred.id === drinkId && starred.size === size && starred.milkType === milkType
        );
        
        const starBtn = document.getElementById('modal-star-btn');
        const starText = document.getElementById('star-text');
        
        starBtn.dataset.drinkId = drinkId;
        starBtn.dataset.size = size;
        starBtn.dataset.milkType = milkType;
        
        if (isStarred) {
            starText.innerHTML = '<span class="mr-2">⭐</span>Remove from Favorites';
            starBtn.className = 'flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 btn-press focus-ring flex items-center justify-center';
        } else {
            starText.innerHTML = '<span class="mr-2">⭐</span>Add to Favorites';
            starBtn.className = 'flex-1 h-12 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold rounded-xl transition-all duration-200 btn-press focus-ring flex items-center justify-center';
        }

        // Show modal with animation
        const modal = document.getElementById('nutrition-modal');
        modal.classList.remove('hidden');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus the close button for accessibility
        setTimeout(() => {
            document.getElementById('close-modal').focus();
        }, 300);
    }

    closeModal() {
        const modal = document.getElementById('nutrition-modal');
        modal.classList.add('hidden');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
    }

    toggleStarCurrentDrink() {
        const starBtn = document.getElementById('modal-star-btn');
        const drinkId = starBtn.dataset.drinkId;
        const size = starBtn.dataset.size;
        const milkType = starBtn.dataset.milkType;
        
        this.toggleStarSpecificVariant(drinkId, size, milkType);
        
        // Update modal star button
        this.showNutritionModal(drinkId, size, milkType);
        
        this.hapticFeedback();
    }


    toggleStarSpecificVariant(drinkId, size, milkType) {
        const drink = this.nutritionData.drinks.find(d => d.id === drinkId);
        const sizeData = drink.sizes.find(s => s.size === size);
        const variant = sizeData.milkVariants.find(v => v.milkType === milkType);

        if (!drink || !sizeData || !variant) return;

        const existingIndex = this.starredDrinks.findIndex(starred => 
            starred.id === drinkId && starred.size === size && starred.milkType === milkType
        );

        if (existingIndex !== -1) {
            // Remove from starred
            this.starredDrinks.splice(existingIndex, 1);
        } else {
            // Add to starred
            const starredDrink = {
                id: drinkId,
                name: drink.name,
                size: size,
                milkType: milkType,
                nutrition: variant.nutrition
            };
            
            this.starredDrinks.push(starredDrink);
        }

        this.saveStarredDrinks();
        this.updateStarredSection();
        this.displayDrinks(); // Refresh to update star icons
    }

    updateStarredSection() {
        const starredSection = document.getElementById('starred-section');
        const starredContainer = document.getElementById('starred-drinks');

        // Hide favorites when searching or if no favorites exist
        if (this.starredDrinks.length === 0 || this.currentFilters.search.trim() !== '') {
            starredSection.classList.add('hidden');
            return;
        }

        starredSection.classList.remove('hidden');
        starredContainer.innerHTML = this.starredDrinks.map(drink => this.createStarredDrinkCard(drink)).join('');

        // Add click handlers for starred drinks
        starredContainer.querySelectorAll('.starred-drink-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const drinkId = e.currentTarget.dataset.drinkId;
                const size = e.currentTarget.dataset.size;
                const milkType = e.currentTarget.dataset.milkType;
                this.showNutritionModal(drinkId, size, milkType);
                this.hapticFeedback();
            });
        });
    }

    createStarredDrinkCard(starredDrink) {
        const calories = starredDrink.nutrition.calories || 'N/A';
        const caffeine = starredDrink.nutrition.caffeine || 'N/A';
        
        return `
            <button 
                class="starred-drink-btn w-full text-left p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 card-hover focus-ring touch-target"
                data-drink-id="${starredDrink.id}"
                data-size="${starredDrink.size}"
                data-milk-type="${starredDrink.milkType}"
            >
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-900 mb-1">${starredDrink.name}</div>
                        <div class="text-sm text-gray-600 mb-2">${starredDrink.size} • ${starredDrink.milkType}</div>
                        <div class="flex gap-2">
                            <span class="inline-flex items-center bg-white px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                                ${calories} cal
                            </span>
                            <span class="inline-flex items-center bg-white px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                                ${caffeine} mg caffeine
                            </span>
                        </div>
                    </div>
                    <div class="flex-shrink-0 ml-4">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                </div>
            </button>
        `;
    }

    clearAllStarredDrinks() {
        this.starredDrinks = [];
        this.saveStarredDrinks();
        this.updateStarredSection();
        this.displayDrinks();
        this.showToast('All favorites cleared', 'success');
    }

    showConfirmationModal(title, message, onConfirm) {
        // Set modal content
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        
        // Store callback
        this.confirmationCallback = onConfirm;
        
        // Show modal
        const modal = document.getElementById('confirmation-modal');
        modal.classList.remove('hidden');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus the cancel button for accessibility
        setTimeout(() => {
            document.getElementById('confirm-cancel').focus();
        }, 300);
    }

    hideConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        modal.classList.add('hidden');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
        
        // Clear callback
        this.confirmationCallback = null;
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center transform translate-y-0 transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        
        toast.innerHTML = `
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    loadStarredDrinks() {
        try {
            const saved = localStorage.getItem('starredDrinks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading starred drinks:', error);
            return [];
        }
    }

    saveStarredDrinks() {
        try {
            localStorage.setItem('starredDrinks', JSON.stringify(this.starredDrinks));
        } catch (error) {
            console.error('Error saving starred drinks:', error);
        }
    }

    loadSizeUsageStats() {
        try {
            const saved = localStorage.getItem('sizeUsageStats');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading size usage stats:', error);
            return {};
        }
    }

    saveSizeUsageStats() {
        try {
            localStorage.setItem('sizeUsageStats', JSON.stringify(this.sizeUsageStats));
        } catch (error) {
            console.error('Error saving size usage stats:', error);
        }
    }

    trackSizeUsage(size) {
        this.sizeUsageStats[size] = (this.sizeUsageStats[size] || 0) + 1;
        this.saveSizeUsageStats();
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 300);
    }

    showError(message) {
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorToast.classList.remove('hidden');
        
        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 5000);
    }

    checkForIOSInstallPrompt() {
        // Check if it's iOS Safari and not already installed
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone === true;
        const hasShownPrompt = localStorage.getItem('ios-install-prompt-shown');

        // Only show if: iOS Safari, not standalone, not shown before, and no active search
        if (isIOS && isSafari && !isStandalone && !hasShownPrompt && this.currentFilters.search.trim() === '') {
            // Show after 3 seconds delay
            setTimeout(() => {
                this.showIOSInstallPrompt();
            }, 3000);
        }
    }

    showIOSInstallPrompt() {
        const prompt = document.getElementById('ios-install-prompt');
        prompt.classList.remove('hidden');
        
        // Mark as shown
        localStorage.setItem('ios-install-prompt-shown', 'true');
    }

    hideIOSInstallPrompt() {
        const prompt = document.getElementById('ios-install-prompt');
        prompt.classList.add('hidden');
    }

    checkDisclaimerAcceptance() {
        // Check if user has already accepted the disclaimer
        const hasAccepted = localStorage.getItem('disclaimer-accepted');
        
        if (!hasAccepted) {
            // Show disclaimer modal on first visit
            this.showDisclaimerModal();
        }
    }

    showDisclaimerModal() {
        const modal = document.getElementById('disclaimer-modal');
        modal.classList.remove('hidden');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus the accept button for accessibility
        setTimeout(() => {
            document.getElementById('disclaimer-accept').focus();
        }, 300);
    }

    acceptDisclaimer() {
        // Save acceptance to localStorage
        localStorage.setItem('disclaimer-accepted', 'true');
        
        // Hide the modal
        this.hideDisclaimerModal();
    }

    hideDisclaimerModal() {
        const modal = document.getElementById('disclaimer-modal');
        modal.classList.add('hidden');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
    }

    hideFilters() {
        const filtersSection = document.getElementById('filters-section');
        if (filtersSection) {
            filtersSection.classList.add('hidden');
        }
    }

    showFilters() {
        const filtersSection = document.getElementById('filters-section');
        if (filtersSection) {
            filtersSection.classList.remove('hidden');
        }
    }

    updateSearchIcon() {
        const searchIcon = document.getElementById('search-icon');
        const clearIcon = document.getElementById('clear-icon');
        const hasText = this.currentFilters.search && this.currentFilters.search.trim() !== '';

        if (hasText) {
            searchIcon.classList.add('hidden');
            clearIcon.classList.remove('hidden');
        } else {
            searchIcon.classList.remove('hidden');
            clearIcon.classList.add('hidden');
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('drink-search');
        const hasText = this.currentFilters.search && this.currentFilters.search.trim() !== '';
        
        if (hasText) {
            // Clear the search
            searchInput.value = '';
            this.currentFilters.search = '';
            this.updateSearchIcon();
            this.filterAndDisplayDrinks();
            this.updateStarredSection();
            this.hapticFeedback();
            
            // Focus back on search input
            searchInput.focus();
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StarNutritionApp();
});