/**
 * This script handles fetching, displaying, and viewing favourite recipes.
 */
document.addEventListener('DOMContentLoaded', () => {
    const favouritesContainer = document.getElementById('favouritesContainer');
    const favouriteRecipes = JSON.parse(localStorage.getItem('favouriteRecipes')) || [];

    // --- Data Adaptation Functions (from recipes.js) ---
    // These functions ensure that data from different APIs is handled consistently.

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

    function adaptSpoonacularToStandard(recipe) {
        const ingredients = recipe.extendedIngredients?.map(ing => `<li>${ing.original}</li>`) || [];
        return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            area: recipe.cuisines?.join(', ') || 'Various',
            category: recipe.dishTypes?.join(', ') || 'General',
            instructions: recipe.instructions,
            youtubeUrl: null, // Spoonacular details don't usually have a direct YouTube link
            ingredientsList: `<ul>${ingredients.join('')}</ul>`,
            source: 'Spoonacular',
        };
    }

    function parseInstructions(text) {
        if (!text) return [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        if (tempDiv.querySelector('li')) {
            return Array.from(tempDiv.querySelectorAll('li')).map(li => li.textContent.trim()).filter(step => step.length > 0);
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

    /**
     * Fetches the details for a single recipe from the available APIs.
     * @param {string} id - The ID of the recipe to fetch.
     * @returns {Promise<object|null>} A promise that resolves the standardized recipe object or null.
     */
    async function fetchRecipeDetails(id) {
        try {
            // Check if it's a numeric ID (likely TheMealDB or Spoonacular)
            if (!isNaN(id)) {
                // Try TheMealDB first
                let response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
                let data = await response.json();
                if (data.meals) {
                    return adaptTheMealDBToStandard(data.meals[0]);
                }
                
                // Fallback to Spoonacular
                response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=4f19491518524db4902110e1582e3405`);
                data = await response.json();
                if (data && !data.status) {
                    return adaptSpoonacularToStandard(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch recipe details:', error);
        }
        return null;
    }

    /**
     * Displays the full recipe details in a modal overlay.
     * @param {object} recipe - The standardized recipe object to display.
     */
    function displayRecipeInModal(recipe) {
        const modal = document.createElement('div');
        modal.className = 'recipe-modal-overlay';
        
        const isFavourited = favouriteRecipes.includes(recipe.id.toString());
        const instructionSteps = parseInstructions(recipe.instructions);
        const instructionsHtml = instructionSteps.map(step => `<li>${step}</li>`).join('');
        const youtubeButtonHtml = recipe.youtubeUrl ? `<a href="${recipe.youtubeUrl}" target="_blank" class="youtube-button">Watch on YouTube</a>` : '';
        const favouriteButtonHtml = `<button class="recipe-favourite-btn ${isFavourited ? 'active' : ''}" data-recipe-id="${recipe.id}" title="Favourite this recipe"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
        const imageUrl = recipe.image || 'https://placehold.co/600x350/e0e8f0/2c3e50?text=Image+Not+Available';

        modal.innerHTML = `
            <div class="recipe-modal-content">
                <button class="close-modal-btn">&times;</button>
                <div class="recipe-card">
                    <div class="recipe-banner">
                        ${favouriteButtonHtml}
                        <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='https://placehold.co/600x350/e0e8f0/2c3e50?text=Image+Error'">
                        <div class="recipe-banner-overlay">
                            <h3>${recipe.title}</h3>
                            <p>${recipe.area} | ${recipe.category}</p>
                            ${youtubeButtonHtml}
                        </div>
                    </div>
                    <div class="recipe-card-body">
                        <div class="recipe-ingredients"><h4>Ingredients</h4>${recipe.ingredientsList}</div>
                        <div class="recipe-instructions"><h4>Instructions</h4><ol>${instructionsHtml}</ol></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Event listener to close the modal
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        });

        // Event listener for the favourite button inside the modal
        modal.querySelector('.recipe-favourite-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const recipeId = btn.dataset.recipeId;
            btn.classList.toggle('active');
            const isNowFavourited = favouriteRecipes.includes(recipeId);
            
            if (isNowFavourited) {
                favouriteRecipes = favouriteRecipes.filter(id => id !== recipeId);
            } else {
                favouriteRecipes.push(recipeId);
            }
            localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteRecipes));
            // Refresh the background list after a short delay
            setTimeout(displayFavourites, 300);
        });
    }

    /**
     * Fetches and displays all favourited recipes in the grid.
     */
    async function displayFavourites() {
        if (favouriteRecipes.length === 0) {
            favouritesContainer.innerHTML = '<p>You have no favourite recipes yet. Go add some!</p>';
            return;
        }

        favouritesContainer.innerHTML = '<p>Loading your favourite recipes...</p>';
        const recipeCards = [];

        for (const id of favouriteRecipes) {
            // We only need summary data for the cards, so we can use a simpler fetch here if available
            // But for consistency, we'll fetch details and extract what we need.
            const recipe = await fetchRecipeDetails(id);
            if (recipe) {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'favourite-card';
                recipeCard.dataset.recipeId = recipe.id;
                
                recipeCard.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='https://placehold.co/300x200/e0e8f0/2c3e50?text=Image+Error'">
                    <div class="favourite-card-content">
                        <h3>${recipe.title}</h3>
                        <p>${recipe.category}</p>
                    </div>
                `;
                recipeCards.push(recipeCard);
            }
        }

        favouritesContainer.innerHTML = '';
        if (recipeCards.length > 0) {
            recipeCards.forEach(card => favouritesContainer.appendChild(card));
        } else {
            favouritesContainer.innerHTML = '<p>Could not load details for your favourite recipes.</p>';
        }
    }

    /**
     * Injects the necessary CSS for the modal and recipe details.
     */
    function injectModalStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .recipe-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px);
                z-index: 1000; display: flex; align-items: center; justify-content: center;
                animation: fadeInModal 0.3s ease;
            }
            @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
            .recipe-modal-content {
                width: 90%; max-width: 800px; max-height: 90vh;
                overflow-y: auto; background: #f0f4f8; border-radius: 20px;
                position: relative;
            }
            .close-modal-btn {
                position: absolute; top: 15px; right: 20px;
                background: rgba(0,0,0,0.5); color: white; border: none;
                border-radius: 50%; width: 35px; height: 35px;
                font-size: 24px; line-height: 35px; text-align: center;
                cursor: pointer; z-index: 15; transition: background 0.2s ease;
            }
            .close-modal-btn:hover { background: rgba(0,0,0,0.8); }

            /* Re-using styles from recipes.js for consistency */
            .recipe-card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.12); text-align: left; width: 100%; border: 1px solid rgba(0,0,0,0.05); }
            .recipe-banner { position: relative; height: 350px; }
            .recipe-banner img { width: 100%; height: 100%; object-fit: cover; }
            .recipe-banner-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 30px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%); color: white; display: flex; flex-direction: column; justify-content: flex-end; }
            .recipe-banner-overlay h3 { margin: 0 0 8px 0; font-family: 'Playfair Display', serif; font-size: 3.2em; text-shadow: 2px 2px 10px rgba(0,0,0,0.8); color: #fff; line-height: 1.2; }
            .recipe-banner-overlay p { margin: 0 0 15px 0; font-style: italic; opacity: 1; font-size: 1.1em; font-family: 'Lato', sans-serif; color: #fff; text-shadow: 1px 1px 6px rgba(0,0,0,0.9); }
            .youtube-button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 20px; font-weight: 600; font-size: 0.9em; transition: background-color 0.3s ease, transform 0.3s ease; align-self: flex-start; }
            .youtube-button:hover { background-color: #c40000; transform: scale(1.05); }
            .recipe-favourite-btn { position: absolute; top: 20px; right: 20px; background-color: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; backdrop-filter: blur(5px); z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .recipe-favourite-btn:hover { transform: scale(1.1); }
            .recipe-favourite-btn svg { width: 22px; height: 22px; color: #e53e3e; }
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
        `;
        document.head.appendChild(style);
    }

    // Add event listener to the container to handle clicks on cards
    favouritesContainer.addEventListener('click', async (e) => {
        const card = e.target.closest('.favourite-card');
        if (card) {
            const recipeId = card.dataset.recipeId;
            if (recipeId) {
                // Show a temporary loading state inside the modal
                const modal = document.createElement('div');
                modal.className = 'recipe-modal-overlay';
                modal.innerHTML = `<p style="color:white; font-size: 1.2em;">Loading recipe...</p>`;
                document.body.appendChild(modal);

                const recipe = await fetchRecipeDetails(recipeId);
                
                // Remove the loading modal
                document.body.removeChild(modal);

                if (recipe) {
                    displayRecipeInModal(recipe);
                } else {
                    alert('Sorry, could not load the recipe details.');
                }
            }
        }
    });

    // --- Initial Page Load ---
    injectModalStyles();
    displayFavourites();
});
