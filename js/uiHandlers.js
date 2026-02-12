// js/uiHandlers.js v6.0 (Full v6.0 Multi-Profile Support)

let allElements = {};
let currentLang = 'en';
let ghUnitMode = 'dh'; // 'dh' (degrees) or 'ppm'
let khUnitMode = 'dh'; // 'dh' (degrees) or 'ppm'
let volumeMode = 'direct'; // 'direct' or 'lbh'
let dimUnit = 'cm'; // 'cm', 'in', or 'ft'
let currentProfile = 'freshwater'; // v6.0: active profile
let substrateUnit = 'cm'; // v6.0: substrate dimension unit

/** Initializes all DOM element references into a central object. */
function initDOMReferences() {
    const ids = [
        'themeToggle', 'langToggle', 'timestamp', 'errors', 'changelogModal', 'closeChangelog',
        'recommendations', 'paramAmmonia', 'statusAmmonia', 'paramNitrate', 'statusNitrate',
        'paramNitrite', 'statusNitrite', 'paramGh', 'statusGh', 'paramKh', 'statusKh',
        'ghUnit', 'khUnit',
        'volume', 'unit', 'khCurrent', 'khTarget', 'khPurity', 'khco3Result', 'khSplit', 'copyKhco3',
        'ghCurrent', 'ghTarget', 'equilibriumResult', 'eqSplit', 'copyEquil',
        'phCurrent', 'phTarget', 'nrKh', 'neutralResult', 'nrSplit', 'copyNR',
        'acidCurrentKh', 'acidTargetKh', 'acidResult', 'acidSplit', 'copyAcid',
        'phGoldCurrent', 'phGoldTarget', 'goldResult', 'goldSplit', 'copyGold',
        // v5.0 elements
        'menuToggle', 'menuOverlay', 'menuPanel', 'closeMenu',
        'menuThemeLight', 'menuThemeDark', 'menuLangEn', 'menuLangKn',
        'menuDownloadCsv', 'menuReset', 'menuChangelog',
        'directVolumeSection', 'lbhVolumeSection',
        'dimLength', 'dimBreadth', 'dimHeight', 'calculatedVolume',
        'safeResult', 'copySafe', 'aptResult', 'copyApt', 'nitrateEstimate',
        // v6.0 new params
        'paramPh', 'statusPh', 'paramTemp',
        'paramPotassium', 'paramIron',
        'paramSalinity', 'statusSalinity',
        'paramAlkalinity', 'statusAlkalinity',
        'paramCalcium', 'statusCalcium',
        'paramMagnesium', 'statusMagnesium',
        'paramPhosphate', 'paramStrontium', 'paramIodide',
        'paramDo', 'statusDo',
        // v6.0 special cards
        'dynamicCalculators',
        'wcPercent', 'wcResult',
        'subProduct', 'subLength', 'subWidth', 'subDepth', 'subResult',
        'smProduct', 'smVolume', 'smCurrentPpt', 'smDesiredPpt', 'smResult',
        // v6.0 profile tabs
        'profileTabs'
    ];
    ids.forEach(id => { allElements[id] = qs(id); });
}

/** Populates the unit selection dropdown and sets the last used unit. */
function setupUnitSelection() {
    const units = { L: "Litres (L)", US: "US Gallons", UK: "UK Gallons" };
    Object.entries(units).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        allElements.unit.appendChild(option);
    });
    allElements.unit.value = localStorage.getItem(LAST_UNIT_KEY) || 'US';
    // Persist unit choice; recalc is triggered by the body-level change listener
    allElements.unit.addEventListener('change', () => localStorage.setItem(LAST_UNIT_KEY, allElements.unit.value));
}

/** Sets up the theme toggle functionality. */
function setupThemeToggle() {
    const storedTheme = localStorage.getItem(THEME_KEY) || (prefersDarkMode() ? 'dark' : 'light');
    applyTheme(storedTheme);
    allElements.themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

/** Sets up the language toggle functionality. */
function setupLanguageToggle() {
    currentLang = localStorage.getItem(LANG_KEY) || 'en';
    translatePage();
    allElements.langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'kn' : 'en';
        translatePage();
        localStorage.setItem(LANG_KEY, currentLang);
    });
}

/**
 * Sets up GH/KH unit toggle functionality.
 */
function setupUnitToggles() {
    ghUnitMode = localStorage.getItem(GH_UNIT_KEY) || 'dh';
    khUnitMode = localStorage.getItem(KH_UNIT_KEY) || 'dh';
    applyUnitToggleState('gh', ghUnitMode);
    applyUnitToggleState('kh', khUnitMode);
    document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleUnitToggle);
    });
}

/**
 * Handles unit toggle button clicks.
 */
function handleUnitToggle(event) {
    const btn = event.target;
    const param = btn.dataset.param;
    const newUnit = btn.dataset.unit;
    const currentMode = param === 'gh' ? ghUnitMode : khUnitMode;
    const inputEl = allElements[param === 'gh' ? 'paramGh' : 'paramKh'];
    const currentValue = parseFloatSafe(inputEl.value);

    if (currentMode === newUnit) return;

    let newValue;
    if (newUnit === 'ppm') {
        newValue = Math.round(dhToPpm(currentValue));
    } else {
        newValue = Math.round(ppmToDh(currentValue));
    }
    inputEl.value = newValue;

    if (param === 'gh') {
        ghUnitMode = newUnit;
        localStorage.setItem(GH_UNIT_KEY, newUnit);
    } else {
        khUnitMode = newUnit;
        localStorage.setItem(KH_UNIT_KEY, newUnit);
    }
    applyUnitToggleState(param, newUnit);
    handleParameterStatusUpdate();
    doDosingCalculations();
}

/**
 * Applies visual state to toggle buttons and unit label.
 */
function applyUnitToggleState(param, activeUnit) {
    document.querySelectorAll(`.unit-toggle-btn[data-param="${param}"]`).forEach(btn => {
        const isActive = btn.dataset.unit === activeUnit;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    const unitEl = allElements[param === 'gh' ? 'ghUnit' : 'khUnit'];
    if (unitEl) {
        unitEl.textContent = activeUnit === 'ppm' ? 'ppm' : (param === 'gh' ? 'dGH' : 'dKH');
    }
}

/** Sets up the hamburger menu functionality. */
function setupHamburgerMenu() {
    const menuToggle = allElements.menuToggle;
    const menuOverlay = allElements.menuOverlay;
    const menuPanel = allElements.menuPanel;
    const closeMenu = allElements.closeMenu;

    function openMenu() {
        menuPanel.classList.add('active');
        menuOverlay.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuPanel.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeMenuFn() {
        menuPanel.classList.remove('active');
        menuOverlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuPanel.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (menuToggle) menuToggle.addEventListener('click', openMenu);
    if (closeMenu) closeMenu.addEventListener('click', closeMenuFn);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenuFn);

    syncMenuThemeButtons();
    syncMenuLangButtons();

    if (allElements.menuThemeLight) {
        allElements.menuThemeLight.addEventListener('click', () => {
            applyTheme('light');
            localStorage.setItem(THEME_KEY, 'light');
            syncMenuThemeButtons();
        });
    }
    if (allElements.menuThemeDark) {
        allElements.menuThemeDark.addEventListener('click', () => {
            applyTheme('dark');
            localStorage.setItem(THEME_KEY, 'dark');
            syncMenuThemeButtons();
        });
    }
    if (allElements.menuLangEn) {
        allElements.menuLangEn.addEventListener('click', () => {
            currentLang = 'en';
            translatePage();
            localStorage.setItem(LANG_KEY, currentLang);
            syncMenuLangButtons();
        });
    }
    if (allElements.menuLangKn) {
        allElements.menuLangKn.addEventListener('click', () => {
            currentLang = 'kn';
            translatePage();
            localStorage.setItem(LANG_KEY, currentLang);
            syncMenuLangButtons();
        });
    }
    if (allElements.menuDownloadCsv) {
        allElements.menuDownloadCsv.addEventListener('click', () => {
            handleCsvDownload();
            closeMenuFn();
        });
    }
    if (allElements.menuReset) {
        allElements.menuReset.addEventListener('click', () => {
            handleReset([handleParameterStatusUpdate, doDosingCalculations]);
            closeMenuFn();
        });
    }
    if (allElements.menuChangelog) {
        allElements.menuChangelog.addEventListener('click', () => {
            allElements.changelogModal.style.display = 'flex';
            closeMenuFn();
        });
    }

    // Buffer links - show hidden sections and scroll to card
    document.querySelectorAll('.menu-link[data-card]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cardId = link.dataset.card;
            const card = document.getElementById(cardId);
            if (card) {
                closeMenuFn();
                setTimeout(() => {
                    const advSection = document.getElementById('advancedBuffersSection');
                    if (advSection) advSection.classList.add('visible');
                    document.querySelectorAll('.advanced-buffer').forEach(buffer => {
                        buffer.classList.add('visible');
                    });
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const details = card.querySelector('details');
                    if (details) details.open = true;
                }, 300);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuPanel.classList.contains('active')) {
            closeMenuFn();
        }
    });
}

function syncMenuThemeButtons() {
    const isDark = document.body.classList.contains('dark');
    if (allElements.menuThemeLight) allElements.menuThemeLight.classList.toggle('active', !isDark);
    if (allElements.menuThemeDark) allElements.menuThemeDark.classList.toggle('active', isDark);
}

function syncMenuLangButtons() {
    if (allElements.menuLangEn) allElements.menuLangEn.classList.toggle('active', currentLang === 'en');
    if (allElements.menuLangKn) allElements.menuLangKn.classList.toggle('active', currentLang === 'kn');
}

/** Sets up volume mode toggle (Direct Entry vs L×B×H). */
function setupVolumeModeToggle() {
    volumeMode = localStorage.getItem(VOL_MODE_KEY) || 'direct';
    dimUnit = localStorage.getItem(DIM_UNIT_KEY) || 'cm';
    applyVolumeModeState();
    applyDimUnitState();

    document.querySelectorAll('.vol-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            if (mode !== volumeMode) {
                volumeMode = mode;
                localStorage.setItem(VOL_MODE_KEY, mode);
                applyVolumeModeState();
                if (mode === 'lbh') calculateVolumeFromDimensions();
                doDosingCalculations();
            }
        });
    });

    document.querySelectorAll('.dim-unit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const unit = e.target.dataset.unit;
            if (unit !== dimUnit) {
                dimUnit = unit;
                localStorage.setItem(DIM_UNIT_KEY, unit);
                applyDimUnitState();
                calculateVolumeFromDimensions();
                doDosingCalculations();
            }
        });
    });

    ['dimLength', 'dimBreadth', 'dimHeight'].forEach(id => {
        if (allElements[id]) {
            allElements[id].addEventListener('input', () => {
                calculateVolumeFromDimensions();
                doDosingCalculations();
            });
        }
    });
}

function applyVolumeModeState() {
    document.querySelectorAll('.vol-mode-btn').forEach(btn => {
        const isActive = btn.dataset.mode === volumeMode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    if (allElements.directVolumeSection) allElements.directVolumeSection.style.display = volumeMode === 'direct' ? 'block' : 'none';
    if (allElements.lbhVolumeSection) allElements.lbhVolumeSection.style.display = volumeMode === 'lbh' ? 'block' : 'none';
}

function applyDimUnitState() {
    document.querySelectorAll('.dim-unit-btn').forEach(btn => {
        const isActive = btn.dataset.unit === dimUnit;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
}

function calculateVolumeFromDimensions() {
    const length = parseFloatSafe(allElements.dimLength?.value);
    const breadth = parseFloatSafe(allElements.dimBreadth?.value);
    const height = parseFloatSafe(allElements.dimHeight?.value);
    const litres = dimensionsToLitres(length, breadth, height, dimUnit);
    if (allElements.calculatedVolume) allElements.calculatedVolume.textContent = fmt(litres, 2);
}

/**
 * Gets the effective volume in litres based on current mode.
 */
function getEffectiveVolumeLitres() {
    if (volumeMode === 'lbh') {
        const length = parseFloatSafe(allElements.dimLength?.value);
        const breadth = parseFloatSafe(allElements.dimBreadth?.value);
        const height = parseFloatSafe(allElements.dimHeight?.value);
        return dimensionsToLitres(length, breadth, height, dimUnit);
    } else {
        const volume = parseFloatSafe(allElements.volume?.value);
        const unit = allElements.unit?.value || 'L';
        return toLitres(volume, unit);
    }
}

// ---------------------------------------------------------------------------
// v6.0: Profile System
// ---------------------------------------------------------------------------

/** Sets up profile tab click handlers. */
function setupProfileTabs() {
    currentProfile = localStorage.getItem(PROFILE_KEY) || 'freshwater';
    // Apply initial tab state
    if (allElements.profileTabs) {
        allElements.profileTabs.querySelectorAll('.profile-tab').forEach(tab => {
            const isActive = tab.dataset.profile === currentProfile;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-pressed', isActive);
        });
        allElements.profileTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.profile-tab');
            if (!tab) return;
            const profile = tab.dataset.profile;
            if (profile === currentProfile) return;
            currentProfile = profile;
            localStorage.setItem(PROFILE_KEY, profile);
            // Update tab visuals
            allElements.profileTabs.querySelectorAll('.profile-tab').forEach(t => {
                const isActive = t.dataset.profile === currentProfile;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-pressed', isActive);
            });
            toggleProfileVisibility(currentProfile);
            applyProfileDefaults(currentProfile);
            handleParameterStatusUpdate();
            doDosingCalculations();
        });
    }
    // Apply initial visibility
    toggleProfileVisibility(currentProfile);
}

/**
 * Show/hide DOM elements by their data-profile attribute.
 * Elements without data-profile are always visible.
 * Elements with data-profile show only if the list includes the active profile.
 */
function toggleProfileVisibility(profile) {
    // Param items
    document.querySelectorAll('.param-item[data-profile]').forEach(el => {
        const profiles = el.dataset.profile.split(' ');
        el.style.display = profiles.includes(profile) ? '' : 'none';
    });
    // Dosing cards with data-profile (legacy + special)
    document.querySelectorAll('.dosing-card[data-profile]').forEach(el => {
        const profiles = el.dataset.profile.split(' ');
        el.style.display = profiles.includes(profile) ? '' : 'none';
    });
    // Dynamic calculator cards
    document.querySelectorAll('#dynamicCalculators .dosing-card[data-profile]').forEach(el => {
        const profiles = el.dataset.profile.split(' ');
        el.style.display = profiles.includes(profile) ? '' : 'none';
    });
}

/**
 * Apply profile defaults from SeachemEngine.PROFILE_DEFAULTS.
 */
function applyProfileDefaults(profile) {
    const defaults = window.SeachemEngine?.PROFILE_DEFAULTS?.[profile];
    if (!defaults) return;

    // Map of param id → default key
    const paramMap = {
        paramAmmonia: 'paramAmmonia', paramNitrite: 'paramNitrite', paramNitrate: 'paramNitrate',
        paramGh: 'paramGh', paramKh: 'paramKh', paramPh: 'paramPh', paramTemp: 'paramTemp',
        paramPotassium: 'paramPotassium', paramIron: 'paramIron',
        paramSalinity: 'paramSalinity', paramAlkalinity: 'paramAlkalinity',
        paramCalcium: 'paramCalcium', paramMagnesium: 'paramMagnesium',
        paramPhosphate: 'paramPhosphate', paramStrontium: 'paramStrontium',
        paramIodide: 'paramIodide', paramDo: 'paramDo'
    };

    for (const [elId, key] of Object.entries(paramMap)) {
        if (defaults[key] !== undefined && allElements[elId]) {
            allElements[elId].value = defaults[key];
        }
    }

    // Reset GH/KH unit mode to degrees on profile switch
    if (ghUnitMode !== 'dh') {
        ghUnitMode = 'dh';
        localStorage.setItem(GH_UNIT_KEY, 'dh');
        applyUnitToggleState('gh', 'dh');
    }
    if (khUnitMode !== 'dh') {
        khUnitMode = 'dh';
        localStorage.setItem(KH_UNIT_KEY, 'dh');
        applyUnitToggleState('kh', 'dh');
    }

    // Sync KH → legacy card inputs
    if (defaults.paramKh !== undefined) {
        if (allElements.khCurrent) allElements.khCurrent.value = fmt(defaults.paramKh, 2);
        if (allElements.nrKh) allElements.nrKh.value = fmt(defaults.paramKh, 2);
        if (allElements.acidCurrentKh) allElements.acidCurrentKh.value = fmt(defaults.paramKh, 2);
    }
    // Sync GH → legacy Equilibrium current
    if (defaults.paramGh !== undefined && allElements.ghCurrent) {
        allElements.ghCurrent.value = fmt(defaults.paramGh, 2);
    }

    // Reset dynamic card inputs for this profile
    resetDynamicCardInputs(profile);
}

/**
 * Reset dynamic card current inputs to profile defaults where applicable.
 */
function resetDynamicCardInputs(profile) {
    const defaults = window.SeachemEngine?.PROFILE_DEFAULTS?.[profile];
    if (!defaults) return;

    // Alkalinity → meq/L products (reef_buffer, reef_builder, reef_carbonate, reef_fusion2, alkaline_buffer, equilibrium_engine, potassium_bicarbonate)
    const alkValue = defaults.paramAlkalinity; // meq/L
    const khValue = defaults.paramKh; // dKH

    window.SeachemEngine?.PRODUCT_CONFIGS?.forEach(cfg => {
        const curEl = document.getElementById('dyn_' + cfg.id + '_current');
        if (!curEl) return;

        // Products that sync from saltwater alkalinity
        if (['reef_buffer', 'reef_builder', 'reef_carbonate', 'reef_fusion2'].includes(cfg.id) && alkValue !== undefined) {
            const scale = getScaleForProduct(cfg.id);
            curEl.value = fmt(window.SeachemEngine.convertInput(alkValue, 'meq/L', scale), 2);
        }
        // Products that sync from freshwater KH
        else if (['alkaline_buffer', 'equilibrium_engine', 'potassium_bicarbonate'].includes(cfg.id) && khValue !== undefined) {
            const scale = getScaleForProduct(cfg.id);
            // KH is in dKH
            curEl.value = fmt(window.SeachemEngine.convertInput(khValue, 'dKH', scale), 2);
        }
        // Calcium
        else if (cfg.id === 'reef_adv_calcium' && defaults.paramCalcium !== undefined) {
            curEl.value = defaults.paramCalcium;
        }
        // Magnesium
        else if (cfg.id === 'reef_adv_magnesium' && defaults.paramMagnesium !== undefined) {
            curEl.value = defaults.paramMagnesium;
        }
        // Strontium
        else if (cfg.id === 'reef_adv_strontium' && defaults.paramStrontium !== undefined) {
            curEl.value = defaults.paramStrontium;
        }
        else if (cfg.id === 'reef_strontium' && defaults.paramStrontium !== undefined) {
            curEl.value = defaults.paramStrontium;
        }
        // Iodide
        else if (cfg.id === 'reef_iodide' && defaults.paramIodide !== undefined) {
            curEl.value = defaults.paramIodide;
        }
        // Iron
        else if (cfg.id === 'flourish_iron' && defaults.paramIron !== undefined) {
            curEl.value = defaults.paramIron;
        }
        // Potassium
        else if (cfg.id === 'flourish_potassium' && defaults.paramPotassium !== undefined) {
            curEl.value = defaults.paramPotassium;
        }
    });
}

/** Get the active scale for a product (from localStorage or its config baseUnit). */
function getScaleForProduct(productId) {
    const saved = localStorage.getItem('scale_' + productId);
    if (saved) return saved;
    // Fall back to the product's native baseUnit from config
    if (window.SeachemEngine) {
        const cfg = window.SeachemEngine.PRODUCT_CONFIGS.find(c => c.id === productId);
        if (cfg) return cfg.baseUnit;
    }
    return 'meq/L';
}

// ---------------------------------------------------------------------------
// v6.0: Dynamic Card Generation
// ---------------------------------------------------------------------------

/**
 * Generate calculator cards from SeachemEngine.PRODUCT_CONFIGS and inject into #dynamicCalculators.
 */
function generateCalculatorCards() {
    const container = allElements.dynamicCalculators;
    if (!container || !window.SeachemEngine) return;
    container.innerHTML = '';

    window.SeachemEngine.PRODUCT_CONFIGS.forEach((cfg) => {
        const card = document.createElement('div');
        // Universal products show in all profiles
        const profileAttr = cfg.profile === 'universal' ? 'freshwater saltwater pond' : cfg.profile;
        card.className = 'dosing-card glass-card';
        card.id = 'dyn-card-' + cfg.id;
        card.setAttribute('data-profile', profileAttr);

        let inputsHtml = '';
        if (cfg.inputType === 'current_target') {
            // Unit label for display
            const unitLabel = cfg.unitScales ? cfg.unitScales[0] : cfg.baseUnit;
            const scaleSelect = cfg.unitScales
                ? `<select class="scale-select" id="dyn_${cfg.id}_scale" data-product="${cfg.id}">
                    ${cfg.unitScales.map(s => `<option value="${s}">${s}</option>`).join('')}
                  </select>`
                : `<span class="input-unit">${unitLabel}</span>`;

            inputsHtml = `
                <div class="input-row">
                    <div class="input-group">
                        <label for="dyn_${cfg.id}_current" data-lang-key="current_label">Current</label>
                        <div class="input-wrapper">
                            <input type="number" id="dyn_${cfg.id}_current" min="0" step="0.1" value="0" class="styled-input">
                            ${scaleSelect}
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dyn_${cfg.id}_target" data-lang-key="target_label">Target</label>
                        <input type="number" id="dyn_${cfg.id}_target" min="0" step="0.1" value="0" class="styled-input">
                    </div>
                </div>`;
        }
        // volume_only: no current/target inputs, add a hint instead
        if (cfg.inputType === 'volume_only') {
            inputsHtml = `<p class="product-info">Dose is based on water volume only.</p>`;
        }

        card.innerHTML = `
            <details>
                <summary class="dosing-summary">
                    <div class="summary-content">
                        <h3>${cfg.icon || ''} ${cfg.title}</h3>
                        <div class="summary-icon">💊</div>
                    </div>
                </summary>
                <div class="details-content">
                    ${inputsHtml}
                    <div class="result-container">
                        <div class="result-display">
                            <div class="result" id="dyn_${cfg.id}_result" aria-live="polite"></div>
                            <button type="button" class="copy-btn" id="dyn_${cfg.id}_copy" title="Copy result" aria-label="Copy ${cfg.title} result">
                                <span>📋</span>
                            </button>
                        </div>
                    </div>
                </div>
            </details>`;

        container.appendChild(card);
    });
}

/**
 * Set up event handlers on dynamically generated cards:
 * - scale-select change handlers (persist to localStorage, trigger recalc)
 * - copy button handlers
 * Also populate substrate and salt mix dropdowns.
 */
function setupDynamicCards() {
    // Restore saved scale selections and persist changes to localStorage
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            if (cfg.unitScales) {
                const selectEl = document.getElementById('dyn_' + cfg.id + '_scale');
                if (selectEl) {
                    const saved = localStorage.getItem('scale_' + cfg.id);
                    if (saved && cfg.unitScales.includes(saved)) {
                        selectEl.value = saved;
                    } else {
                        // Default to baseUnit if it's in the scale list
                        if (cfg.unitScales.includes(cfg.baseUnit)) selectEl.value = cfg.baseUnit;
                    }
                    // Persist selection; recalc is triggered by the body-level change listener
                    selectEl.addEventListener('change', () => {
                        localStorage.setItem('scale_' + cfg.id, selectEl.value);
                    });
                }
            }
        });
    }

    // Copy buttons for dynamic cards
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            const copyBtn = document.getElementById('dyn_' + cfg.id + '_copy');
            const resultEl = document.getElementById('dyn_' + cfg.id + '_result');
            if (copyBtn && resultEl) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const textToCopy = resultEl.dataset.dose || '0';
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const icon = copyBtn.querySelector('span');
                        if (icon) {
                            icon.textContent = '✔️';
                            setTimeout(() => { icon.textContent = '📋'; }, 1200);
                        }
                    });
                });
            }
        });
    }

    // Populate substrate product dropdown
    if (allElements.subProduct && window.SeachemEngine?.SUBSTRATE_PRODUCTS) {
        allElements.subProduct.innerHTML = '';
        window.SeachemEngine.SUBSTRATE_PRODUCTS.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            allElements.subProduct.appendChild(opt);
        });
    }

    // Substrate unit toggle
    document.querySelectorAll('.sub-unit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const unit = e.target.dataset.unit;
            if (unit !== substrateUnit) {
                substrateUnit = unit;
                document.querySelectorAll('.sub-unit-btn').forEach(b => {
                    const isActive = b.dataset.unit === substrateUnit;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-pressed', isActive);
                });
                doDosingCalculations();
            }
        });
    });

    // Populate salt mix product dropdown
    if (allElements.smProduct && window.SeachemEngine?.SALT_MIX_PRODUCTS) {
        allElements.smProduct.innerHTML = '';
        window.SeachemEngine.SALT_MIX_PRODUCTS.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            allElements.smProduct.appendChild(opt);
        });
    }
}

/** Translates the entire page using data-lang-key attributes. */
function translatePage() {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[currentLang][key];
        if (translation) {
            const isHtmlContent = key.startsWith('reco_') || key === 'changelog_list';
            if (isHtmlContent) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    handleParameterStatusUpdate();
    doDosingCalculations();
}

/** Collects all input values from the DOM. */
function getAllInputValues() {
    const inputs = {};
    const numericKeys = [
        'paramAmmonia', 'paramNitrate', 'paramNitrite', 'paramGh', 'paramKh', 'volume',
        'khCurrent', 'khTarget', 'khPurity', 'ghCurrent', 'ghTarget',
        'phCurrent', 'phTarget', 'nrKh', 'acidCurrentKh', 'acidTargetKh',
        'phGoldCurrent', 'phGoldTarget',
        // v6.0
        'paramPh', 'paramTemp', 'paramPotassium', 'paramIron',
        'paramSalinity', 'paramAlkalinity', 'paramCalcium', 'paramMagnesium',
        'paramPhosphate', 'paramStrontium', 'paramIodide', 'paramDo',
        'wcPercent', 'smVolume', 'smCurrentPpt', 'smDesiredPpt',
        'subLength', 'subWidth', 'subDepth'
    ];
    for (const key in allElements) {
        if (allElements[key] instanceof HTMLInputElement || allElements[key] instanceof HTMLSelectElement) {
            inputs[key] = numericKeys.includes(key) ? parseFloatSafe(allElements[key].value) : allElements[key].value;
        }
    }
    return inputs;
}

/** Displays validation errors or clears them. */
function displayErrors(errorMessages) {
    allElements.errors.innerHTML = errorMessages.length > 0 ? errorMessages.join(' &bull; ') : '';
    if (errorMessages.length > 0) allElements.errors.focus();
}

/** Updates UI based on parameter status checks — profile-aware v6.0. */
function handleParameterStatusUpdate() {
    const inputs = getAllInputValues();
    const litres = getEffectiveVolumeLitres();
    let recommendations = [];
    const t = (key, replacements = {}) => {
        let text = translations[currentLang][key] || key;
        for (const r in replacements) {
            text = text.replace(`{${r}}`, replacements[r]);
        }
        return text;
    };

    const updateStatus = (element, className, textKey) => {
        if (!element) return;
        element.className = 'status-badge ' + className;
        element.textContent = t(textKey);
    };

    // --- Universal checks (all profiles) ---

    // Ammonia
    if (inputs.paramAmmonia > 0) {
        updateStatus(allElements.statusAmmonia, 'warn', 'status_danger');
        recommendations.push(t('reco_ammonia_detected'));
        if (litres > 0) {
            const primeDose = calculatePrimeDose(litres);
            recommendations.push(t('reco_prime_dose', { primeDose: fmt(primeDose) }));
        } else {
            recommendations.push(t('reco_volume_needed'));
        }
    } else {
        updateStatus(allElements.statusAmmonia, 'good', 'status_good');
    }

    // Nitrite
    if (inputs.paramNitrite > 0) {
        updateStatus(allElements.statusNitrite, 'warn', 'status_danger');
        recommendations.push(t('reco_nitrite_detected'));
        if (litres > 0) {
            const stabilityDose = calculateStabilityDose(litres);
            recommendations.push(t('reco_stability_dose', { stabilityDose: fmt(stabilityDose) }));
        }
    } else {
        updateStatus(allElements.statusNitrite, 'good', 'status_good');
    }

    // Nitrate
    if (inputs.paramNitrate > 50) {
        updateStatus(allElements.statusNitrate, 'warn', 'status_high');
        recommendations.push(t('reco_nitrate_high'));
    } else {
        updateStatus(allElements.statusNitrate, 'good', 'status_good');
    }

    // --- pH display (all profiles — info only, no threshold) ---
    if (allElements.statusPh) {
        allElements.statusPh.className = 'status-badge';
        allElements.statusPh.textContent = `pH ${fmt(inputs.paramPh, 2)}`;
    }

    // --- Freshwater checks ---
    if (currentProfile === 'freshwater') {
        // GH
        let dGH = ghUnitMode === 'ppm' ? ppmToDh(inputs.paramGh) : inputs.paramGh;
        if (allElements.statusGh) {
            allElements.statusGh.className = 'status-badge';
            allElements.statusGh.textContent = `${fmt(dGH, 1)} dGH`;
        }
        if (allElements.ghCurrent) allElements.ghCurrent.value = fmt(dGH, 2);
        if (dGH < 3 && dGH > 0) recommendations.push(t('reco_gh_low'));

        // KH
        let dKH = khUnitMode === 'ppm' ? ppmToDh(inputs.paramKh) : inputs.paramKh;
        if (allElements.statusKh) {
            allElements.statusKh.className = 'status-badge';
            allElements.statusKh.textContent = `${fmt(dKH, 1)} dKH`;
        }
        [allElements.khCurrent, allElements.nrKh, allElements.acidCurrentKh].forEach(el => { if (el) el.value = fmt(dKH, 2); });
        if (dKH < 3 && dKH > 0) recommendations.push(t('reco_kh_low'));

        // Iron
        if (inputs.paramIron < 0.05 && inputs.paramIron >= 0) {
            recommendations.push(t('reco_iron_low'));
        }
        // Potassium
        if (inputs.paramPotassium < 5 && inputs.paramPotassium >= 0) {
            recommendations.push(t('reco_potassium_low'));
        }

        // Sync dynamic card: flourish_iron current ← paramIron
        syncDynInput('flourish_iron', inputs.paramIron);
        // Sync dynamic card: flourish_potassium current ← paramPotassium
        syncDynInput('flourish_potassium', inputs.paramPotassium);
        // Sync KH → alkaline_buffer, potassium_bicarbonate (in their current scale)
        syncDynAlkalineInputs(dKH);
    }

    // --- Saltwater checks ---
    if (currentProfile === 'saltwater') {
        // Salinity
        if (allElements.statusSalinity) {
            if (inputs.paramSalinity < 34 || inputs.paramSalinity > 36) {
                allElements.statusSalinity.className = 'status-badge warn';
                allElements.statusSalinity.textContent = t('status_check');
                recommendations.push(t('reco_salinity_check'));
            } else {
                allElements.statusSalinity.className = 'status-badge good';
                allElements.statusSalinity.textContent = t('status_good');
            }
        }

        // Alkalinity
        if (allElements.statusAlkalinity) {
            if (inputs.paramAlkalinity < 7) {
                allElements.statusAlkalinity.className = 'status-badge warn';
                allElements.statusAlkalinity.textContent = t('status_low');
                recommendations.push(t('reco_alkalinity_low'));
            } else {
                allElements.statusAlkalinity.className = 'status-badge good';
                allElements.statusAlkalinity.textContent = t('status_good');
            }
        }

        // Calcium
        if (allElements.statusCalcium) {
            if (inputs.paramCalcium < 380) {
                allElements.statusCalcium.className = 'status-badge warn';
                allElements.statusCalcium.textContent = t('status_low');
                recommendations.push(t('reco_calcium_low'));
            } else {
                allElements.statusCalcium.className = 'status-badge good';
                allElements.statusCalcium.textContent = t('status_good');
            }
        }

        // Magnesium
        if (allElements.statusMagnesium) {
            if (inputs.paramMagnesium < 1200) {
                allElements.statusMagnesium.className = 'status-badge warn';
                allElements.statusMagnesium.textContent = t('status_low');
                recommendations.push(t('reco_magnesium_low'));
            } else {
                allElements.statusMagnesium.className = 'status-badge good';
                allElements.statusMagnesium.textContent = t('status_good');
            }
        }

        // Sync saltwater params → dynamic card current inputs
        syncDynInput('reef_adv_calcium', inputs.paramCalcium);
        syncDynInput('reef_adv_magnesium', inputs.paramMagnesium);
        syncDynInput('reef_adv_strontium', inputs.paramStrontium);
        syncDynInput('reef_strontium', inputs.paramStrontium);
        syncDynInput('reef_iodide', inputs.paramIodide);
        syncDynInput('reef_calcium', inputs.paramCalcium);
        syncDynInput('reef_fusion1', inputs.paramCalcium);
        syncDynSaltwaterAlkalineInputs(inputs.paramAlkalinity);
    }

    // --- Pond checks ---
    if (currentProfile === 'pond') {
        // KH (pond also has KH)
        let dKH = khUnitMode === 'ppm' ? ppmToDh(inputs.paramKh) : inputs.paramKh;
        if (allElements.statusKh) {
            allElements.statusKh.className = 'status-badge';
            allElements.statusKh.textContent = `${fmt(dKH, 1)} dKH`;
        }
        if (dKH < 3 && dKH > 0) recommendations.push(t('reco_kh_low'));

        // DO
        if (allElements.statusDo) {
            if (inputs.paramDo < 5) {
                allElements.statusDo.className = 'status-badge warn';
                allElements.statusDo.textContent = t('status_low');
                recommendations.push(t('reco_do_low'));
            } else {
                allElements.statusDo.className = 'status-badge good';
                allElements.statusDo.textContent = t('status_good');
            }
        }
    }

    // Build recommendation list
    allElements.recommendations.innerHTML = '';
    if (recommendations.length > 0) {
        recommendations.forEach(rec => {
            const p = document.createElement('p');
            p.innerHTML = rec;
            allElements.recommendations.appendChild(p);
        });
    } else {
        const p = document.createElement('p');
        p.innerHTML = t('reco_ok');
        allElements.recommendations.appendChild(p);
    }
}

/** Sync a single dynamic card's current input from a param value. */
function syncDynInput(productId, value) {
    const el = document.getElementById('dyn_' + productId + '_current');
    if (el) el.value = value;
}

/** Sync freshwater KH (dKH) → alkaline_buffer, equilibrium_engine, potassium_bicarbonate current inputs. */
function syncDynAlkalineInputs(dKH) {
    ['alkaline_buffer', 'equilibrium_engine', 'potassium_bicarbonate'].forEach(id => {
        const el = document.getElementById('dyn_' + id + '_current');
        if (!el) return;
        const scale = getScaleForProduct(id);
        el.value = fmt(window.SeachemEngine.convertInput(dKH, 'dKH', scale), 2);
    });
}

/** Sync saltwater alkalinity (meq/L) → reef alkalinity products current inputs. */
function syncDynSaltwaterAlkalineInputs(meqL) {
    ['reef_buffer', 'reef_builder', 'reef_carbonate', 'reef_fusion2'].forEach(id => {
        const el = document.getElementById('dyn_' + id + '_current');
        if (!el) return;
        const scale = getScaleForProduct(id);
        el.value = fmt(window.SeachemEngine.convertInput(meqL, 'meq/L', scale), 2);
    });
}

/** Updates all result fields in the UI. */
function updateAllResults(results) {
    const t = (key) => translations[currentLang][key] || key;

    // --- Legacy cards ---
    allElements.khco3Result.textContent = `${fmtPrecise(results.khDose)} g KHCO₃`;
    allElements.khco3Result.dataset.dose = fmtPrecise(results.khDose);
    allElements.khSplit.textContent = splitText(results.khDose, currentLang);

    if (results.equilibriumDose > 0) {
        allElements.equilibriumResult.textContent = `${fmtPrecise(results.equilibriumDose)} g Equilibrium`;
        allElements.eqSplit.textContent = splitText(results.equilibriumDose, currentLang);
    } else if (results.ghCurrentHigher) {
        allElements.equilibriumResult.textContent = 'GH already at/above target';
        allElements.eqSplit.textContent = 'Equilibrium raises GH, not lowers it';
    } else {
        allElements.equilibriumResult.textContent = t('no_dose_needed');
        allElements.eqSplit.textContent = '';
    }
    allElements.equilibriumResult.dataset.dose = fmtPrecise(results.equilibriumDose);

    if (allElements.safeResult) {
        allElements.safeResult.textContent = `${fmtPrecise(results.safeDose)} g Safe`;
        allElements.safeResult.dataset.dose = fmtPrecise(results.safeDose);
    }
    if (allElements.aptResult) {
        allElements.aptResult.textContent = `${fmt(results.aptResult.ml, 2)} ml APT Complete`;
        allElements.aptResult.dataset.dose = fmt(results.aptResult.ml, 4);
    }
    if (allElements.nitrateEstimate) {
        allElements.nitrateEstimate.textContent = `Est. NO₃ increase: +${fmt(results.aptResult.estimatedNitrateIncrease, 2)} ppm`;
    }

    allElements.neutralResult.textContent = results.neutralRegulatorDose > 0 ? `${fmtPrecise(results.neutralRegulatorDose)} g Neutral Reg.` : t('no_dose_needed');
    allElements.neutralResult.dataset.dose = fmtPrecise(results.neutralRegulatorDose);
    allElements.nrSplit.textContent = splitText(results.neutralRegulatorDose, currentLang);

    allElements.acidResult.textContent = results.acidBufferDose > 0 ? `${fmtPrecise(results.acidBufferDose)} g Acid Buffer` : t('no_dose_needed');
    allElements.acidResult.dataset.dose = fmtPrecise(results.acidBufferDose);
    allElements.acidSplit.textContent = splitText(results.acidBufferDose, currentLang);

    const goldText = results.goldBufferResult.grams > 0 ? `${fmtPrecise(results.goldBufferResult.grams)} g Gold Buffer (${results.goldBufferResult.fullDose ? 'full' : 'half'} dose)` : t('no_dose_needed');
    allElements.goldResult.textContent = goldText;
    allElements.goldResult.dataset.dose = fmtPrecise(results.goldBufferResult.grams);
    allElements.goldSplit.textContent = splitText(results.goldBufferResult.grams, currentLang);

    // --- v6.0: Dynamic card results ---
    if (results.dynamicResults) {
        for (const [productId, res] of Object.entries(results.dynamicResults)) {
            const resultEl = document.getElementById('dyn_' + productId + '_result');
            if (!resultEl) continue;
            if (res.primary > 0) {
                resultEl.textContent = `${fmt(res.primary, 3)} ${res.primaryUnit} / ${fmt(res.secondary, 3)} ${res.secondaryUnit}`;
                resultEl.dataset.dose = fmt(res.primary, 4);
            } else {
                resultEl.textContent = '-';
                resultEl.dataset.dose = '0';
            }
        }
    }

    // --- v6.0: Water Change result ---
    if (results.waterChange !== undefined && allElements.wcResult) {
        const wc = results.waterChange;
        allElements.wcResult.textContent = `${fmt(wc.litres, 2)} L  /  ${fmt(wc.usGal, 2)} US Gal  /  ${fmt(wc.ukGal, 2)} UK Gal`;
    }

    // --- v6.0: Substrate result ---
    if (results.substrate !== undefined && allElements.subResult) {
        const sub = results.substrate;
        if (sub.bags > 0) {
            let txt = `${sub.bags} bag(s)`;
            if (sub.bagsSmall > 0) txt += ` or ${sub.bagsSmall} small bag(s)`;
            allElements.subResult.textContent = txt;
        } else {
            allElements.subResult.textContent = '-';
        }
    }

    // --- v6.0: Salt Mix result ---
    if (allElements.smResult) {
        if (results.saltMix && results.saltMix.grams > 0) {
            allElements.smResult.textContent = `${results.saltMix.formatted.kilograms} kg (${results.saltMix.formatted.grams} g)`;
        } else if (results.saltMixError) {
            allElements.smResult.textContent = results.saltMixError;
        } else {
            allElements.smResult.textContent = '-';
        }
    }

    updateTimestamp();
}

function updateTimestamp() {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    allElements.timestamp.textContent = `Last calc: ${ts}`;
}

/** Resets all inputs to defaults and recalculates. */
function handleReset(callbacks) {
    // Reset profile to freshwater
    currentProfile = 'freshwater';
    localStorage.setItem(PROFILE_KEY, 'freshwater');
    if (allElements.profileTabs) {
        allElements.profileTabs.querySelectorAll('.profile-tab').forEach(t => {
            const isActive = t.dataset.profile === 'freshwater';
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-pressed', isActive);
        });
    }
    toggleProfileVisibility('freshwater');

    // Reset all number inputs to defaultValue
    document.querySelectorAll('input[type=number]').forEach(input => { input.value = input.defaultValue || 0; });
    allElements.volume.value = 10;
    allElements.khPurity.value = 0.99;

    allElements.unit.value = 'US';
    localStorage.setItem(LAST_UNIT_KEY, 'US');

    // Reset GH/KH unit toggles to degrees
    ghUnitMode = 'dh';
    khUnitMode = 'dh';
    localStorage.setItem(GH_UNIT_KEY, 'dh');
    localStorage.setItem(KH_UNIT_KEY, 'dh');
    applyUnitToggleState('gh', 'dh');
    applyUnitToggleState('kh', 'dh');

    // Apply freshwater defaults
    applyProfileDefaults('freshwater');

    // Reset volume mode to direct
    volumeMode = 'direct';
    localStorage.setItem(VOL_MODE_KEY, 'direct');
    applyVolumeModeState();

    // Reset dimension unit to cm
    dimUnit = 'cm';
    localStorage.setItem(DIM_UNIT_KEY, 'cm');
    applyDimUnitState();

    if (allElements.dimLength) allElements.dimLength.value = 60;
    if (allElements.dimBreadth) allElements.dimBreadth.value = 30;
    if (allElements.dimHeight) allElements.dimHeight.value = 40;
    calculateVolumeFromDimensions();

    // Hide Advanced Buffers section
    const advSection = document.getElementById('advancedBuffersSection');
    if (advSection) advSection.classList.remove('visible');
    document.querySelectorAll('.advanced-buffer').forEach(buffer => {
        buffer.classList.remove('visible');
    });

    // Reset substrate unit
    substrateUnit = 'cm';
    document.querySelectorAll('.sub-unit-btn').forEach(b => {
        const isActive = b.dataset.unit === 'cm';
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive);
    });

    // Reset salt mix volume
    if (allElements.smVolume) allElements.smVolume.value = 10;
    if (allElements.smCurrentPpt) allElements.smCurrentPpt.value = 30;
    if (allElements.smDesiredPpt) allElements.smDesiredPpt.value = 35;

    // Clear scale localStorage for dynamic cards
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            if (cfg.unitScales) {
                localStorage.removeItem('scale_' + cfg.id);
                const selectEl = document.getElementById('dyn_' + cfg.id + '_scale');
                if (selectEl) selectEl.value = cfg.baseUnit;
            }
        });
    }

    callbacks.forEach(cb => cb());
}

/** Generates and downloads a CSV of all results. */
function handleCsvDownload() {
    const rows = [
        ['Parameter', 'Dose', 'Unit'],
        ['KHCO3', allElements.khco3Result.dataset.dose || '0', 'g'],
        ['Equilibrium', allElements.equilibriumResult.dataset.dose || '0', 'g'],
        ['Safe', allElements.safeResult?.dataset.dose || '0', 'g'],
        ['APT Complete', allElements.aptResult?.dataset.dose || '0', 'ml'],
        ['Neutral Regulator', allElements.neutralResult.dataset.dose || '0', 'g'],
        ['Acid Buffer', allElements.acidResult.dataset.dose || '0', 'g'],
        ['Gold Buffer', allElements.goldResult.dataset.dose || '0', 'g'],
    ];

    // v6.0: Add dynamic card results
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            const resultEl = document.getElementById('dyn_' + cfg.id + '_result');
            if (resultEl) {
                rows.push([cfg.title, resultEl.dataset.dose || '0', cfg.baseUnit === 'PPM' ? 'mL' : 'g']);
            }
        });
    }

    // v6.0: Add water change, substrate, salt mix
    const wcEl = allElements.wcResult;
    if (wcEl) rows.push(['Water Change', wcEl.textContent || '-', 'L']);
    const subEl = allElements.subResult;
    if (subEl) rows.push(['Substrate', subEl.textContent || '-', 'bags']);
    const smEl = allElements.smResult;
    if (smEl) rows.push(['Salt Mix', smEl.textContent || '-', 'kg']);

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `aquarium-dosing-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** Sets up clipboard copy functionality for legacy cards. */
function setupCopyButtons() {
    const copyMap = {
        copyKhco3: 'khco3Result',
        copyEquil: 'equilibriumResult',
        copySafe: 'safeResult',
        copyApt: 'aptResult',
        copyNR: 'neutralResult',
        copyAcid: 'acidResult',
        copyGold: 'goldResult'
    };
    for (const btnId in copyMap) {
        const button = allElements[btnId];
        const resultEl = allElements[copyMap[btnId]];
        if (button && resultEl) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const textToCopy = resultEl.dataset.dose || '0';
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const icon = button.querySelector('span');
                    if (icon) {
                        icon.textContent = '✔️';
                        setTimeout(() => { icon.textContent = '📋'; }, 1200);
                    }
                });
            });
        }
    }
}

/** Sets up modal functionality. */
function setupModal() {
    if (allElements.closeChangelog) {
        allElements.closeChangelog.addEventListener('click', () => allElements.changelogModal.style.display = 'none');
    }
    if (allElements.changelogModal) {
        allElements.changelogModal.addEventListener('click', (e) => {
            if (e.target === allElements.changelogModal) allElements.changelogModal.style.display = 'none';
        });
    }
}

/** Initializes all UI event listeners. */
function initEventListeners(callbacks) {
    let debounceTimeout;
    function scheduleCalc() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => { callbacks.forEach(cb => cb()); }, 250);
    }
    // 'input' fires on <input> elements as user types
    document.body.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement) scheduleCalc();
    });
    // 'change' fires on <select> elements when selection changes
    document.body.addEventListener('change', (event) => {
        if (event.target instanceof HTMLSelectElement) scheduleCalc();
    });

    setupCopyButtons();
    setupModal();
}

/** Main UI initialization function. */
function initUI(callbacks) {
    initDOMReferences();
    setupUnitSelection();
    setupThemeToggle();
    setupLanguageToggle();
    setupUnitToggles();
    setupHamburgerMenu();
    setupVolumeModeToggle();
    calculateVolumeFromDimensions();
    // v6.0: profile + dynamic cards
    generateCalculatorCards();
    setupDynamicCards();
    setupProfileTabs();
    initEventListeners(callbacks);
}
