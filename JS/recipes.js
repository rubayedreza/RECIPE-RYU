/**
 * This script handles the language translation, recipe generation,
 * and other interactive elements for the Recipes page.
 */
document.addEventListener('DOMContentLoaded', () => {
    let translations = {};
    let lastResults = [];
    // Initialize favourite recipes from localStorage
    let favouriteRecipes = JSON.parse(localStorage.getItem('favouriteRecipes')) || [];

    // API keys configuration
    const apiConfig = {
        spoonacularKey: '4f19491518524db4902110e1582e3405',
        apiNinjasKey: 'YOUR_API_NINJAS_API_KEY', // Remember to replace with your actual key
    };

    /**
     * Fetches and applies translations for the given language.
     * @param {string} language - The language code (e.g., 'en', 'es').
     */
    async function translatePage(language) {
        const path = `../languages/${language}.json?v=${new Date().getTime()}`; // Cache-busting
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

    /**
     * Sets the application language, updates UI, and saves the preference.
     * @param {string} langCode - The language code to switch to.
     */
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

    /**
     * Injects dynamic CSS for recipe card styling.
     */
    function injectFunStyles() {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        const style = document.createElement('style');
        style.innerHTML = `
            .recipe-output-section { overflow-y: visible !important; max-height: none !important; background-color: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            .recipe-card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.12); animation: fadeIn 0.6s ease-in-out; text-align: left; width: 100%; border: 1px solid rgba(0,0,0,0.05); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .recipe-banner { position: relative; height: 350px; }
            .recipe-banner img { width: 100%; height: 100%; object-fit: cover; }
            .recipe-banner-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 30px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%); color: white; display: flex; flex-direction: column; justify-content: flex-end; }
            .recipe-banner-overlay h3 { margin: 0 0 8px 0; font-family: 'Playfair Display', serif; font-size: 3.2em; text-shadow: 2px 2px 10px rgba(0,0,0,0.8); color: #fff; line-height: 1.2; }
            .recipe-banner-overlay p { margin: 0 0 15px 0; font-style: italic; opacity: 1; font-size: 1.1em; font-family: 'Lato', sans-serif; color: #fff; text-shadow: 1px 1px 6px rgba(0,0,0,0.9); }
            .back-button { position: absolute; top: 20px; left: 20px; background-color: rgba(255, 255, 255, 0.9); border: none; border-radius: 20px; padding: 8px 15px; cursor: pointer; font-weight: 600; color: #333; display: flex; align-items: center; gap: 5px; transition: all 0.3s ease; backdrop-filter: blur(5px); z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .back-button:hover { background-color: white; transform: scale(1.05); }
            .youtube-button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 20px; font-weight: 600; font-size: 0.9em; transition: background-color 0.3s ease, transform 0.3s ease; align-self: flex-start; }
            .youtube-button:hover { background-color: #c40000; transform: scale(1.05); }
            .recipe-favourite-btn { position: absolute; top: 20px; right: 20px; background-color: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; backdrop-filter: blur(5px); z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .recipe-favourite-btn:hover { transform: scale(1.1); }
            .recipe-favourite-btn svg { width: 22px; height: 22px; color: #e53e3e; fill: none; }
            .recipe-favourite-btn.active svg { fill: #e53e3e; }
            .recipe-card-body { padding: 35px; font-family: 'Lato', sans-serif; }
            .recipe-ingredients, .recipe-instructions { margin-bottom: 40px; }
            .recipe-ingredients h4, .recipe-instructions h4 { display: flex; align-items: center; gap: 12px; font-size: 1.8em; color: #2c3e50; margin: 0 0 25px 0; font-family: 'Playfair Display', serif; border-bottom: 2px solid #6a93cb; padding-bottom: 10px; }
            .recipe-ingredients ul { list-style: none; padding-left: 0; column-count: 2; column-gap: 40px; }
            .recipe-ingredients li { padding: 12px 0; border-bottom: 1px solid #e9ecef; font-size: 1.05em; -webkit-column-break-inside: avoid; page-break-inside: avoid; break-inside: avoid; display: flex; align-items: center; }
            .recipe-ingredients li::before { content: '✓'; color: #6a93cb; font-weight: bold; margin-right: 12px; font-size: 1.2em; }
            .recipe-instructions ol { list-style: none; padding-left: 50px; counter-reset: instruction-counter; position: relative; }
            .recipe-instructions ol::before { content: ''; position: absolute; left: 19px; top: 15px; bottom: 15px; width: 2px; background: #e0e8f0; z-index: 1; }
            .recipe-instructions li { counter-increment: instruction-counter; margin-bottom: 30px; font-size: 1.1em; line-height: 1.8; position: relative; padding-left: 20px; }
            .recipe-instructions li::before { content: counter(instruction-counter, decimal-leading-zero); font-family: 'Lato', sans-serif; font-size: 1.1em; font-weight: 700; color: white; background: linear-gradient(135deg, #8e44ad, #6a93cb); border-radius: 50%; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; position: absolute; left: -50px; top: 0; z-index: 2; box-shadow: 0 4px 10px rgba(106, 147, 203, 0.4); }
            .results-list { text-align: left; }
            .result-item { display: flex; align-items: center; gap: 15px; padding: 12px; margin-bottom: 10px; border-radius: 12px; background-color: rgba(255, 255, 255, 0.7); cursor: pointer; transition: all 0.2s ease-in-out; position: relative; }
            .result-item:hover { background-color: white; transform: scale(1.03); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
            .category-section { margin-bottom: 40px; text-align: center; }
            .category-buttons-grid, .alphabet-browser-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
            .category-button, .alphabet-link { background-color: #fff; border: 1px solid #d0d8e0; border-radius: 20px; padding: 8px 18px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; text-decoration: none; color: #333; }
            .category-button:hover, .alphabet-link:hover { background-color: #6a93cb; color: white; border-color: #6a93cb; }
            .button-group { display: flex; gap: 15px; justify-content: center; }
            .generate-button.secondary { background: #6c757d; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .generate-button.secondary:hover { background: #5a6268; }
            .source-badge { position: absolute; top: 10px; right: 10px; font-size: 0.7em; padding: 3px 8px; border-radius: 10px; background-color: #6a93cb; color: white; font-weight: 600; }
            @media (max-width: 768px) { .recipe-banner { height: 250px; } .recipe-banner-overlay h3 { font-size: 2.2em; } .recipe-ingredients ul { column-count: 1; } }
        `;
        document.head.appendChild(style);
    }

    // --- Data Adaptation Functions ---

    function adaptTheMealDBToStandard(meal) {
        let ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`<li><strong>${meal[`strMeasure${i}`]}</strong> ${meal[`strIngredient${i}`]}</li>`);
            }
        }
        return {
            id: meal.idMeal,
            title: meal.strMeal,
            image: meal.strMealThumb,
            area: meal.strArea || 'International',
            category: meal.strCategory,
            instructions: meal.strInstructions,
            youtubeUrl: meal.strYoutube,
            ingredientsList: `<ul>${ingredients.join('')}</ul>`,
            source: 'TheMealDB',
        };
    }

    function adaptApiNinjasToStandard(recipe) {
        const ingredients = recipe.ingredients.split('|').map(ing => `<li>${ing.trim()}</li>`);
        return {
            id: `api-ninjas-${recipe.title.replace(/\s/g, '-')}`,
            title: recipe.title,
            image: null,
            area: 'N/A',
            category: recipe.servings ? `${recipe.servings} servings` : 'N/A',
            instructions: recipe.instructions,
            youtubeUrl: null,
            ingredientsList: `<ul>${ingredients.join('')}</ul>`,
            source: 'API-Ninjas',
        };
    }

    function adaptSpoonacularToStandard(recipe) {
        const ingredients = recipe.extendedIngredients?.map(ing => `<li>${ing.original}</li>`) || [];
        return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            area: recipe.cuisines?.join(', ') || 'Various',
            category: recipe.dishTypes?.join(', ') || 'General',
            instructions: recipe.instructions || 'No instructions provided in search result. Click to view full details.',
            youtubeUrl: null,
            ingredientsList: `<ul>${ingredients.join('')}</ul>`,
            source: 'Spoonacular',
        };
    }

    /**
     * Parses instruction text from any API into a consistent array of steps.
     * @param {string} text - The raw instructions text from the API.
     * @returns {string[]} An array of recipe steps.
     */
    function parseInstructions(text) {
        if (!text) return [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        if (tempDiv.querySelector('li')) {
            const steps = Array.from(tempDiv.querySelectorAll('li')).map(li => li.textContent.trim());
            return steps.filter(step => step.length > 0);
        }
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1 && /^\d+\.\s*/.test(lines[0])) {
             return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
        }
        if (lines.length > 1) {
            return lines;
        }
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        return sentences.map(sentence => sentence.trim());
    }

    // --- UI Display Functions ---

    function displayRecipe(recipe) {
        const recipeOutput = document.getElementById('recipeOutput');
        
        if (recipe.source === 'Spoonacular' && recipe.instructions.startsWith('No instructions')) {
            fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiConfig.spoonacularKey}`)
                .then(res => res.json())
                .then(detailedRecipe => {
                    displayRecipe(adaptSpoonacularToStandard(detailedRecipe));
                })
                .catch(err => {
                    recipeOutput.innerHTML = `<p style="color: red;">Could not load full details for this recipe.</p>`;
                });
            recipeOutput.innerHTML = `<p>Loading full recipe details...</p>`;
            return;
        }

        const isFavourited = favouriteRecipes.includes(recipe.id.toString());
        const instructionSteps = parseInstructions(recipe.instructions);
        const instructionsHtml = instructionSteps.map(step => `<li>${step}</li>`).join('');
        const youtubeButtonHtml = recipe.youtubeUrl ? `<a href="${recipe.youtubeUrl}" target="_blank" class="youtube-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.188-.01.911-.074 1.957l-.008.104-.022.26-.01.104c-.048.519-.119 1.023-.22 1.402a2.01 2.01 0 0 1-1.415 1.42c-1.16.308-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v5.582l4.157-2.79c-.24-.157-.487-.312-.734-.467L6.4 5.209z"/></svg> Watch on YouTube</a>` : '';
        const backButtonHtml = lastResults.length > 0 ? `<button id="backToResultsBtn" class="back-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg> Back</button>` : '';
        const favouriteButtonHtml = `<button class="recipe-favourite-btn ${isFavourited ? 'active' : ''}" data-recipe-id="${recipe.id}" title="Favourite this recipe"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
        const imageUrl = recipe.image || 'https://placehold.co/600x350/e0e8f0/2c3e50?text=Image+Not+Available';

        recipeOutput.innerHTML = `
            <div class="recipe-card">
                <div class="recipe-banner">
                    ${backButtonHtml}
                    ${favouriteButtonHtml}
                    <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='https://placehold.co/600x350/e0e8f0/2c3e50?text=Image+Error'">
                    <div class="recipe-banner-overlay">
                        <h3>${recipe.title}</h3>
                        <p>${recipe.area} | ${recipe.category}</p>
                        ${youtubeButtonHtml}
                    </div>
                </div>
                <div class="recipe-card-body">
                    <div class="recipe-ingredients"><h4 data-translate-key="ingredients-title">Ingredients</h4>${recipe.ingredientsList}</div>
                    <div class="recipe-instructions"><h4 data-translate-key="instructions-title">Instructions</h4><ol>${instructionsHtml}</ol></div>
                </div>
            </div>`;
        translatePage(localStorage.getItem('selectedLanguage') || 'en');
    }

    function displayResultsList(recipes) {
        const recipeOutput = document.getElementById('recipeOutput');
        recipeOutput.innerHTML = `<h3 data-translate-key="results-found" data-translate-count="${recipes.length}">We found ${recipes.length} recipes. Please select one:</h3>`;

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-list';

        recipes.forEach(recipe => {
            const mealItem = document.createElement('div');
            mealItem.className = 'result-item';
            mealItem.addEventListener('click', () => displayRecipe(recipe));

            const imageUrl = recipe.image || 'https://placehold.co/60/e0e8f0/2c3e50?text=...';
            const thumbUrl = recipe.source === 'TheMealDB' ? `${imageUrl}/preview` : imageUrl;

            mealItem.innerHTML = `
                <img src="${thumbUrl}" alt="${recipe.title}" width="60" height="60" style="border-radius: 50%; object-fit: cover;" onerror="this.src='https://placehold.co/60/e0e8f0/2c3e50?text=...'">
                <span>${recipe.title}</span>
                <span class="source-badge">${recipe.source}</span>
            `;
            resultsContainer.appendChild(mealItem);
        });

        recipeOutput.appendChild(resultsContainer);
        translatePage(localStorage.getItem('selectedLanguage') || 'en');
    }

    // --- Data Fetching & Browsing Functions ---

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

    async function fetchRecipesByCategory(categoryName) {
        const recipeOutput = document.getElementById('recipeOutput');
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';
        recipeOutput.innerHTML = '';

        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoryName}`);
            const data = await response.json();

            if (!data.meals) {
                recipeOutput.innerHTML = `<p>Sorry, no recipes were found in the "${categoryName}" category.</p>`;
                loadingIndicator.style.display = 'none';
                return;
            }
            
            const fullMealPromises = data.meals.map(summaryMeal =>
                fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${summaryMeal.idMeal}`)
                .then(res => res.json())
                .then(detail => detail.meals[0])
            );
            
            const fullMeals = await Promise.all(fullMealPromises);
            
            lastResults = fullMeals.map(adaptTheMealDBToStandard);
            displayResultsList(lastResults);

        } catch (error) {
            console.error(`Error fetching recipes for category ${categoryName}:`, error);
            recipeOutput.innerHTML = `<p style="color: red;">Could not load recipes for this category.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // --- Event Listener Setup ---
    
    /**
     * Sets up all event listeners for the page.
     */
    function initializeEventListeners() {
        const generateBtn = document.getElementById('generateRecipeBtn');
        const randomBtn = document.getElementById('randomRecipeBtn');
        const recipeOutput = document.getElementById('recipeOutput');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const languageSelector = document.querySelector('.language-selector');

        if (languageSelector) {
            const selectedLanguageDisplay = languageSelector.querySelector('.selected-language');
            const languageOptionsDropdown = languageSelector.querySelector('.language-options');

            selectedLanguageDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                languageOptionsDropdown.classList.toggle('show');
            });

            languageOptionsDropdown.addEventListener('click', (e) => {
                const target = e.target.closest('li');
                if (target) {
                    const newLang = target.querySelector('img').dataset.lang;
                    setLanguage(newLang);
                    languageOptionsDropdown.classList.remove('show');
                }
            });

            window.addEventListener('click', () => {
                if (languageOptionsDropdown.classList.contains('show')) {
                    languageOptionsDropdown.classList.remove('show');
                }
            });
        }

        recipeOutput.addEventListener('click', (event) => {
            if (event.target.closest('#backToResultsBtn')) {
                displayResultsList(lastResults);
            }

            const favouriteBtn = event.target.closest('.recipe-favourite-btn');
            if (favouriteBtn) {
                const recipeId = favouriteBtn.dataset.recipeId;
                favouriteBtn.classList.toggle('active');
                const isFavourited = favouriteRecipes.includes(recipeId);
                
                if (isFavourited) {
                    favouriteRecipes = favouriteRecipes.filter(id => id !== recipeId);
                } else {
                    favouriteRecipes.push(recipeId);
                }
                localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteRecipes));
            }
        });
        
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                const query = document.getElementById('recipeSearchInput').value.trim();
                if (!query) {
                    recipeOutput.innerHTML = `<p>Please enter a recipe name or ingredient.</p>`;
                    return;
                }

                loadingIndicator.style.display = 'block';
                recipeOutput.innerHTML = `<p>Searching all sources for "${query}"...</p>`;
                
                const mealDbPromise = fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`).then(res => res.json());
                const spoonacularPromise = fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&addRecipeInformation=false&number=5&apiKey=${apiConfig.spoonacularKey}`).then(res => res.json());
                const apiNinjasPromise = fetch(`https://api.api-ninjas.com/v1/recipe?query=${query}`, { headers: { 'X-Api-Key': apiConfig.apiNinjasKey } }).then(res => res.json());

                const results = await Promise.allSettled([mealDbPromise, spoonacularPromise, apiNinjasPromise]);
                
                let combinedRecipes = [];

                if (results[0].status === 'fulfilled' && results[0].value.meals) {
                    combinedRecipes.push(...results[0].value.meals.map(adaptTheMealDBToStandard));
                }
                if (results[1].status === 'fulfilled' && results[1].value.results) {
                    combinedRecipes.push(...results[1].value.results.map(adaptSpoonacularToStandard));
                }
                if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
                    combinedRecipes.push(...results[2].value.map(adaptApiNinjasToStandard));
                }
                
                loadingIndicator.style.display = 'none';

                if (combinedRecipes.length > 0) {
                    lastResults = combinedRecipes;
                    displayResultsList(combinedRecipes);
                } else {
                    recipeOutput.innerHTML = `<p>Sorry, no recipes found for "${query}" from any source.</p>`;
                }
            });
        }
        
        if (randomBtn) {
            randomBtn.addEventListener('click', async () => {
                loadingIndicator.style.display = 'block';
                recipeOutput.innerHTML = '';
                try {
                    const response = await fetch(`https://api.spoonacular.com/recipes/random?number=1&apiKey=${apiConfig.spoonacularKey}`);
                    if (!response.ok) throw new Error("Spoonacular failed");
                    const result = await response.json();
                    if (result.recipes && result.recipes.length > 0) {
                        displayRecipe(adaptSpoonacularToStandard(result.recipes[0]));
                    } else {
                        throw new Error("Spoonacular returned no recipes");
                    }
                } catch (error) {
                    console.warn('Spoonacular random failed, trying TheMealDB:', error);
                    try {
                        const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
                        const result = await response.json();
                        displayRecipe(adaptTheMealDBToStandard(result.meals[0]));
                    } catch (finalError) {
                         recipeOutput.innerHTML = `<p style="color: red;">Could not fetch a random recipe from any source.</p>`;
                    }
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            });
        }
        
        // REMOVED: Event listener for the favourite icon is no longer needed.
    }

    /**
     * Initializes the entire page.
     */
    function initializePage() {
        const savedLang = localStorage.getItem('selectedLanguage') || 'en';
        setLanguage(savedLang);
        injectFunStyles();
        displayCategories();
        initializeEventListeners();

        // ... other initialization logic like scroll handlers
    }

    // Start the application
    initializePage();
    
    // --- Scroll and Sidebar Effects ---
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
