/**
 * This script handles the language translation, recipe generation,
 * and other interactive elements for the Recipes page.
 * This version is updated to use TheMealDB API and display a fun recipe card.
 */
document.addEventListener('DOMContentLoaded', () => {
    let translations = {};
    // This variable will hold the results of the last search
    let lastResults = [];

    // --- 1. TRANSLATION LOGIC (Unchanged) ---

    async function translatePage(language) {
        const path = `../languages/${language}.json?v=${new Date().getTime()}`;
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.error(`Could not load language file: ${language}.json`);
                return;
            }
            translations = await response.json();
            document.querySelectorAll('[data-translate-key]').forEach(element => {
                const key = element.dataset.translateKey;
                const translation = translations[key];
                if (translation) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translation;
                    } else {
                        element.innerHTML = translation;
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching or applying translations:', error);
        }
    }

    // --- 2. CENTRAL LANGUAGE CONTROL (Unchanged) ---

    function setLanguage(langCode) {
        localStorage.setItem('selectedLanguage', langCode);
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector) {
            const selectedImgDisplay = languageSelector.querySelector('.selected-language img');
            const allOptions = languageSelector.querySelectorAll('.language-options li');
            let targetOption = null;
            allOptions.forEach(opt => {
                opt.classList.remove('selected');
                if (opt.querySelector('img').dataset.lang === langCode) {
                    targetOption = opt;
                }
            });
            if (targetOption) {
                const newImg = targetOption.querySelector('img');
                selectedImgDisplay.src = newImg.src;
                selectedImgDisplay.dataset.lang = newImg.dataset.lang;
                selectedImgDisplay.alt = newImg.alt;
                targetOption.classList.add('selected');
            }
        }
        translatePage(langCode);
    }

    // --- 3. RECIPE GENERATION LOGIC (Updated for Premium Recipe Card) ---

    /**
     * Injects the necessary CSS for the premium recipe card styling into the document's head.
     */
    function injectFunStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .recipe-output-section { overflow-y: visible !important; max-height: none !important; background-color: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            .recipe-card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.12); animation: fadeIn 0.6s ease-in-out; text-align: left; width: 100%; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .recipe-banner { position: relative; height: 350px; }
            .recipe-banner img { width: 100%; height: 100%; object-fit: cover; }
            .recipe-banner-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 25px; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%); color: white; }
            .recipe-banner-overlay h3 { margin: 0 0 5px 0; font-family: 'Montserrat', sans-serif; font-size: 2.5em; text-shadow: 2px 2px 8px rgba(0,0,0,0.7); }
            .recipe-banner-overlay p { margin: 0 0 15px 0; font-style: italic; opacity: 0.9; }
            .back-button { position: absolute; top: 20px; left: 20px; background-color: rgba(255, 255, 255, 0.9); border: none; border-radius: 20px; padding: 8px 15px; cursor: pointer; font-weight: 600; color: #333; display: flex; align-items: center; gap: 5px; transition: all 0.3s ease; backdrop-filter: blur(5px); z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .back-button:hover { background-color: white; transform: scale(1.05); }
            .youtube-button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 20px; font-weight: 600; font-size: 0.9em; transition: background-color 0.3s ease, transform 0.3s ease; }
            .youtube-button:hover { background-color: #c40000; transform: scale(1.05); }
            .recipe-card-body { padding: 30px; }
            .recipe-ingredients, .recipe-instructions { margin-bottom: 35px; }
            .recipe-ingredients h4, .recipe-instructions h4 { display: flex; align-items: center; gap: 10px; font-size: 1.5em; color: #343a40; margin: 0 0 20px 0; font-family: 'Montserrat', sans-serif; }
            .recipe-ingredients ul { list-style: none; padding-left: 0; column-count: 2; column-gap: 30px; }
            .recipe-ingredients li { padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 1em; -webkit-column-break-inside: avoid; page-break-inside: avoid; break-inside: avoid; }
            .recipe-instructions p { line-height: 1.8; font-size: 1.05em; color: #495057; }
            .results-list { text-align: left; }
            .result-item { display: flex; align-items: center; gap: 15px; padding: 12px; margin-bottom: 10px; border-radius: 12px; background-color: rgba(255, 255, 255, 0.7); cursor: pointer; transition: all 0.2s ease-in-out; }
            .result-item:hover { background-color: white; transform: scale(1.03); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
            .category-section { margin-bottom: 40px; text-align: center; }
            .category-buttons-grid, .alphabet-browser-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
            .category-button, .alphabet-link { background-color: #fff; border: 1px solid #d0d8e0; border-radius: 20px; padding: 8px 18px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; text-decoration: none; color: #333; }
            .category-button:hover, .alphabet-link:hover { background-color: #6a93cb; color: white; border-color: #6a93cb; }
            .button-group { display: flex; gap: 15px; justify-content: center; }
            .generate-button.secondary { background: #6c757d; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .generate-button.secondary:hover { background: #5a6268; }
            @media (max-width: 768px) { .recipe-banner { height: 250px; } .recipe-banner-overlay h3 { font-size: 1.8em; } .recipe-ingredients ul { column-count: 1; } }
        `;
        document.head.appendChild(style);
    }

    /**
     * Takes a full recipe object from TheMealDB API and formats it into a fun HTML card.
     * @param {object} recipe - The recipe object from the API response.
     */
    function displayRecipe(recipe) {
        const recipeOutput = document.getElementById('recipeOutput');
        
        let ingredientsList = '';
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredientsList += `<li><strong>${measure}</strong> ${ingredient}</li>`;
            } else {
                break; 
            }
        }

        const instructions = recipe.strInstructions.replace(/\r?\n/g, '<br><br>');

        const youtubeLink = recipe.strYoutube;
        const youtubeButtonHtml = youtubeLink ? `<a href="${youtubeLink}" target="_blank" class="youtube-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.188-.01.911-.074 1.957l-.008.104-.022.26-.01.104c-.048.519-.119 1.023-.22 1.402a2.01 2.01 0 0 1-1.415 1.42c-1.16.308-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v5.582l4.157-2.79c-.24-.157-.487-.312-.734-.467L6.4 5.209z"/></svg> Watch on YouTube</a>` : '';
        const backButtonHtml = lastResults.length > 1 ? `<button id="backToResultsBtn" class="back-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg> Back</button>` : '';

        recipeOutput.innerHTML = `
            <div class="recipe-card">
                <div class="recipe-banner">
                    ${backButtonHtml}
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                    <div class="recipe-banner-overlay">
                        <h3>${recipe.strMeal}</h3>
                        <p>${recipe.strArea} | ${recipe.strCategory}</p>
                        ${youtubeButtonHtml}
                    </div>
                </div>
                <div class="recipe-card-body">
                    <div class="recipe-ingredients"><h4>Ingredients</h4><ul>${ingredientsList}</ul></div>
                    <div class="recipe-instructions"><h4>Instructions</h4><p>${instructions}</p></div>
                </div>
            </div>`;
    }

    /**
     * Displays a list of meals when multiple results are found.
     * @param {Array} meals - An array of full recipe objects from the API.
     */
    function displayResultsList(meals) {
        const recipeOutput = document.getElementById('recipeOutput');
        recipeOutput.innerHTML = `<h3>We found ${meals.length} recipes. Please select one:</h3>`;
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-list';

        meals.forEach(meal => {
            const mealItem = document.createElement('div');
            mealItem.className = 'result-item';
            mealItem.addEventListener('click', () => displayRecipe(meal));
            
            mealItem.innerHTML = `<img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}" width="60" height="60" style="border-radius: 50%; object-fit: cover;"/><span>${meal.strMeal}</span>`;
            resultsContainer.appendChild(mealItem);
        });

        recipeOutput.appendChild(resultsContainer);
    }
    
    // --- NEW: Functions for new API features ---

    /**
     * Creates the A-Z links for browsing recipes by the first letter.
     */
    function displayAlphabetBrowser() {
        const container = document.getElementById('alphabet-browser');
        if (!container) return;
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        alphabet.forEach(letter => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'alphabet-link';
            link.textContent = letter;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                fetchRecipesByLetter(letter);
            });
            container.appendChild(link);
        });
    }

    /**
     * Fetches and displays recipes starting with a specific letter.
     * @param {string} letter - The letter to search for.
     */
    async function fetchRecipesByLetter(letter) {
        const recipeOutput = document.getElementById('recipeOutput');
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';
        recipeOutput.innerHTML = '';

        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
            const data = await response.json();
            
            if (data.meals) {
                lastResults = data.meals;
                displayResultsList(data.meals);
            } else {
                lastResults = [];
                recipeOutput.innerHTML = `<p>Sorry, no recipes found starting with the letter "${letter}".</p>`;
            }
        } catch (error) {
            console.error(`Error fetching recipes for letter ${letter}:`, error);
            recipeOutput.innerHTML = `<p style="color: red;">Could not load recipes.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Fetches all meal categories and creates buttons for them.
     */
    async function displayCategories() {
        const container = document.getElementById('category-buttons');
        if (!container) return;
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
            const data = await response.json();
            data.categories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'category-button';
                button.textContent = category.strCategory;
                button.addEventListener('click', () => fetchRecipesByCategory(category.strCategory));
                container.appendChild(button);
            });
        } catch (error) {
            console.error("Could not fetch categories:", error);
        }
    }

    /**
     * Fetches and displays all recipes for a given category.
     * @param {string} categoryName - The name of the category to fetch.
     */
    async function fetchRecipesByCategory(categoryName) {
        const recipeOutput = document.getElementById('recipeOutput');
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';
        recipeOutput.innerHTML = '';

        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoryName}`);
            const data = await response.json();
            
            const fullMealPromises = data.meals.map(summaryMeal => 
                fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${summaryMeal.idMeal}`)
                .then(res => res.json())
                .then(detail => detail.meals[0])
            );
            
            const fullMeals = await Promise.all(fullMealPromises);
            
            lastResults = fullMeals;
            displayResultsList(fullMeals);

        } catch (error) {
            console.error(`Error fetching recipes for category ${categoryName}:`, error);
            recipeOutput.innerHTML = `<p style="color: red;">Could not load recipes for this category.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }


    /**
     * Sets up the event listener for all recipe generation buttons.
     */
    function initializeRecipeGenerator() {
        const generateBtn = document.getElementById('generateRecipeBtn');
        const randomBtn = document.getElementById('randomRecipeBtn');
        const recipeOutput = document.getElementById('recipeOutput');

        recipeOutput.addEventListener('click', (event) => {
            if (event.target.closest('#backToResultsBtn')) {
                displayResultsList(lastResults);
            }
        });
        
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                const searchInput = document.getElementById('recipeSearchInput');
                const loadingIndicator = document.getElementById('loadingIndicator');
                const query = searchInput.value;

                if (!query.trim()) {
                    recipeOutput.innerHTML = `<p>${translations['error-enter-name'] || "Please enter a recipe name or ingredient to search."}</p>`;
                    return;
                }

                loadingIndicator.style.display = 'block';
                recipeOutput.innerHTML = '';

                try {
                    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
                    const result = await response.json();

                    if (result.meals && result.meals.length > 0) {
                        lastResults = result.meals;
                        if (result.meals.length === 1) {
                            displayRecipe(result.meals[0]);
                        } else {
                            displayResultsList(result.meals);
                        }
                    } else {
                        lastResults = []; 
                        recipeOutput.innerHTML = `<p>Sorry, no recipes found for "${query}". Please try another search.</p>`;
                    }
                } catch (error) {
                    console.error('Error fetching recipe list:', error);
                    recipeOutput.innerHTML = `<p style="color: red;">An error occurred while searching for recipes.</p>`;
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            });
        }
        
        if (randomBtn) {
            randomBtn.addEventListener('click', async () => {
                const loadingIndicator = document.getElementById('loadingIndicator');
                loadingIndicator.style.display = 'block';
                recipeOutput.innerHTML = '';
                try {
                    const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
                    const result = await response.json();
                    lastResults = []; 
                    displayRecipe(result.meals[0]);
                } catch (error) {
                    console.error('Error fetching random recipe:', error);
                    recipeOutput.innerHTML = `<p style="color: red;">Could not fetch a random recipe.</p>`;
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            });
        }
    }

    // --- 4. INITIALIZATION AND OTHER LISTENERS ---
    
    function initializePage() {
        const savedLang = localStorage.getItem('selectedLanguage') || 'en';
        setLanguage(savedLang);
        injectFunStyles();
        displayAlphabetBrowser(); // NEW: Add the alphabet browser
        displayCategories(); 
        initializeRecipeGenerator();
    }

    initializePage();

    // --- All other existing logic (header, scrollbar, sidebar hover) ---
    const mainHeader = document.getElementById('mainHeader');
    let lastScrollTop = 0;
    const headerHeight = mainHeader ? mainHeader.offsetHeight : 0;
    const body = document.body;
    const scrollbarThumb = document.querySelector('.custom-scrollbar-thumb');
    const scrollbarTrack = document.querySelector('.custom-scrollbar-track');
    let scrollTimeout;

    function updateScrollbar() {
        if (!scrollbarThumb || !scrollbarTrack) return;
        const contentHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        if (contentHeight <= viewportHeight) {
            if (scrollbarTrack) scrollbarTrack.style.opacity = '0';
            return;
        }
        const trackHeight = scrollbarTrack.clientHeight;
        const thumbHeight = Math.max(20, trackHeight * (viewportHeight / contentHeight));
        const scrollPercent = window.scrollY / (contentHeight - viewportHeight);
        const thumbPosition = scrollPercent * (trackHeight - thumbHeight);
        scrollbarThumb.style.height = `${thumbHeight}px`;
        scrollbarThumb.style.top = `${thumbPosition}px`;
    }

    window.addEventListener('scroll', () => {
        if (!mainHeader) return;
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollTop > lastScrollTop && currentScrollTop > headerHeight) {
            mainHeader.classList.add('header-hidden');
        } else if (currentScrollTop < lastScrollTop) {
            mainHeader.classList.remove('header-hidden');
        }
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        body.classList.add('scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            body.classList.remove('scrolling');
        }, 1500);
        updateScrollbar();
    });
    
    window.addEventListener('resize', updateScrollbar);
    updateScrollbar();

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const sidebarLinks = sidebar.querySelectorAll('a');
        const glassHoverBox = document.getElementById('glassHoverBox');
        if (glassHoverBox) {
            function positionGlassBox(linkElement) {
                const linkRect = linkElement.getBoundingClientRect();
                const sidebarRect = sidebar.getBoundingClientRect();
                const paddingX = 25;
                const paddingY = 15;
                glassHoverBox.style.width = `${linkRect.width + paddingX}px`;
                glassHoverBox.style.height = `${linkRect.height + paddingY}px`;
                glassHoverBox.style.top = `${linkRect.top - sidebarRect.top - (paddingY / 2)}px`;
                glassHoverBox.style.left = `${linkRect.left - sidebarRect.left - (paddingX / 2)}px`;
                glassHoverBox.style.opacity = '1';
            }
            glassHoverBox.style.opacity = '0';
            glassHoverBox.style.transition = 'all 0.2s ease-out';
            sidebarLinks.forEach(link => {
                link.addEventListener('mouseenter', () => positionGlassBox(link));
                link.addEventListener('mouseleave', () => {
                    glassHoverBox.style.opacity = '0';
                });
            });
        }
    }
});
