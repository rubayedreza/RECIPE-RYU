/**
 * This script handles the language translation, 3D model rendering, and all interactive elements
 * for the Landing page.
 */
document.addEventListener('DOMContentLoaded', () => {
    // A global object to store the currently loaded translation strings.
    let translations = {};

    // --- 1. TRANSLATION LOGIC ---

    /**
     * Fetches a language JSON file and updates all text elements on the page.
     * @param {string} language - The language code (e.g., 'en', 'es', 'bn').
     */
    async function translatePage(language) {
        // Add a timestamp to prevent browsers from loading a stale language file.
        const path = `../languages/${language}.json?v=${new Date().getTime()}`;
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.error(`Could not load language file: ${language}.json. The file may be missing or have an error.`);
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

    // --- 2. CENTRAL LANGUAGE CONTROL ---

    /**
     * The single, authoritative function for setting the website's language.
     * @param {string} langCode - The language code to switch to.
     */
    function setLanguage(langCode) {
        // A. Save the choice in localStorage to remember it across pages.
        localStorage.setItem('selectedLanguage', langCode);

        // B. Update the language selector UI to show the correct flag.
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
        
        // C. ALWAYS call translatePage to apply the new language text.
        translatePage(langCode);
    }
    
    // --- 3. INITIALIZATION AND EVENT LISTENERS ---

    /**
     * Sets up all event listeners for the page.
     */
    function initializeEventListeners() {
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
    }
    
    /**
     * Initializes the page when it first loads.
     */
    function initializePage() {
        const savedLang = localStorage.getItem('selectedLanguage') || 'en';
        setLanguage(savedLang);
        initializeEventListeners();
    }

    // Start everything
    initializePage();

    // --- REVISED: Interactive 3D Model Scroll/Zoom Logic ---
    // This approach is more robust. It waits for the <model-viewer> custom element
    // to be fully defined and ready before trying to interact with it.
    customElements.whenDefined('model-viewer').then(() => {
        const modelViewer = document.getElementById('kitchenModel');

        if (modelViewer) {
            // A flag to ensure the wheel listener is only added once.
            let wheelListenerAttached = false;

            // The 'load' event fires when the model is loaded and ready for interaction.
            modelViewer.addEventListener('load', () => {
                if (wheelListenerAttached) {
                    return; // Don't attach the listener again if the model reloads.
                }

                modelViewer.addEventListener('wheel', (event) => {
                    // Get the canvas from the model-viewer's shadow DOM.
                    const canvas = modelViewer.shadowRoot.querySelector('canvas');
                    if (!canvas) return;
                    
                    const rect = canvas.getBoundingClientRect();

                    // Calculate mouse position relative to the canvas.
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // Use the model-viewer API to check if the cursor is over the model's geometry.
                    const hit = modelViewer.positionAndNormalFromPoint(x, y);

                    // If 'hit' is null, the cursor is on the background.
                    if (hit === null) {
                        // Prevent the default zoom behavior.
                        event.preventDefault();

                        // Manually scroll the main page.
                        window.scrollBy({
                            top: event.deltaY,
                            left: 0,
                            behavior: 'auto'
                        });
                    }
                    // If 'hit' is not null, the cursor is on the model, so we allow
                    // the default 'camera-controls' to handle the zoom.
                }, { passive: false }); // 'passive: false' is required for preventDefault().

                wheelListenerAttached = true;
            });
        }
    }).catch(error => {
        console.error("Error initializing model-viewer logic:", error);
    });


    // --- All other existing logic (header, scrollbar, sidebar hover) ---
    const mainHeader = document.getElementById('mainHeader');
    const scrollIndicator = document.getElementById('scrollIndicator');
    let lastScrollTop = 0;
    const headerHeight = mainHeader ? mainHeader.offsetHeight : 0;
    const body = document.body;
    const scrollbarThumb = document.querySelector('.custom-scrollbar-thumb');
    const scrollbarTrack = document.querySelector('.custom-scrollbar-track');
    let scrollTimeout;

    function updateScrollbar() {
        if (!scrollbarThumb || !scrollbarTrack) return;
        const contentHeight = body.scrollHeight;
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
        if (mainHeader) {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScrollTop > lastScrollTop && currentScrollTop > headerHeight) {
                mainHeader.classList.add('header-hidden');
            } else if (currentScrollTop < lastScrollTop) {
                mainHeader.classList.remove('header-hidden');
            }
            lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        }
        if (scrollIndicator) {
            scrollIndicator.classList.toggle('scroll-indicator-hidden', window.scrollY > 50);
        }
        if (body) body.classList.add('scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (body) body.classList.remove('scrolling');
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
            });
            sidebar.addEventListener('mouseleave', () => {
                glassHoverBox.style.opacity = '0';
            });
        }
    }
});
