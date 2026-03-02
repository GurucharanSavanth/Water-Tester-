// js/uiHandlers.js v6.1 (Bug-fixed, refactored, robust recommendations)

let allElements = {};
let currentLang = 'en';
let ghUnitMode = 'dh';
let khUnitMode = 'dh';
let volumeMode = 'direct';
let dimUnit = 'cm';
let currentProfile = 'freshwater';
let substrateUnit = 'cm';

// Track whether user has manually edited legacy card inputs (to prevent overwrite)
let legacyInputsDirty = {};

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
        'menuToggle', 'menuOverlay', 'menuPanel', 'closeMenu',
        'menuThemeLight', 'menuThemeDark', 'menuLangEn', 'menuLangKn',
        'menuDownloadCsv', 'menuReset', 'menuChangelog',
        'directVolumeSection', 'lbhVolumeSection',
        'dimLength', 'dimBreadth', 'dimHeight', 'calculatedVolume',
        'safeResult', 'copySafe', 'aptResult', 'copyApt', 'nitrateEstimate',
        'paramPh', 'statusPh', 'paramTemp',
        'paramPotassium', 'paramIron',
        'paramSalinity', 'statusSalinity',
        'paramAlkalinity', 'statusAlkalinity',
        'paramCalcium', 'statusCalcium',
        'paramMagnesium', 'statusMagnesium',
        'paramPhosphate', 'paramStrontium', 'paramIodide',
        'paramDo', 'statusDo',
        'dynamicCalculators',
        'wcPercent', 'wcResult',
        'subProduct', 'subLength', 'subWidth', 'subDepth', 'subResult',
        'smProduct', 'smVolume', 'smCurrentPpt', 'smDesiredPpt', 'smResult',
        'profileTabs',
        'co2Estimate', 'paramHistoryBtn', 'saveParamsBtn'
    ];
    ids.forEach(id => { allElements[id] = qs(id); });
}

/** Populates the unit selection dropdown. */
function setupUnitSelection() {
    const units = { L: "Litres (L)", US: "US Gallons", UK: "UK Gallons" };
    Object.entries(units).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        allElements.unit.appendChild(option);
    });
    allElements.unit.value = localStorage.getItem(LAST_UNIT_KEY) || 'US';
    allElements.unit.addEventListener('change', () => localStorage.setItem(LAST_UNIT_KEY, allElements.unit.value));
}

/** Sets up the theme toggle. */
function setupThemeToggle() {
    const storedTheme = localStorage.getItem(THEME_KEY) || (prefersDarkMode() ? 'dark' : 'light');
    applyTheme(storedTheme);
    allElements.themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

/** Sets up language toggle — does NOT trigger calculations during init. */
function setupLanguageToggle(skipCalc) {
    currentLang = localStorage.getItem(LANG_KEY) || 'en';
    translatePage(skipCalc);
    allElements.langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'kn' : 'en';
        translatePage(false);
        localStorage.setItem(LANG_KEY, currentLang);
    });
}

function setupUnitToggles() {
    ghUnitMode = localStorage.getItem(GH_UNIT_KEY) || 'dh';
    khUnitMode = localStorage.getItem(KH_UNIT_KEY) || 'dh';
    applyUnitToggleState('gh', ghUnitMode);
    applyUnitToggleState('kh', khUnitMode);
    document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleUnitToggle);
    });
}

function handleUnitToggle(event) {
    const btn = event.target;
    const param = btn.dataset.param;
    const newUnit = btn.dataset.unit;
    const currentMode = param === 'gh' ? ghUnitMode : khUnitMode;
    const inputEl = allElements[param === 'gh' ? 'paramGh' : 'paramKh'];
    const currentValue = parseFloatSafe(inputEl.value);

    if (currentMode === newUnit) return;

    // Use 1 decimal for dH, integer for ppm to minimize round-trip loss
    let newValue;
    if (newUnit === 'ppm') {
        newValue = Math.round(dhToPpm(currentValue));
    } else {
        newValue = parseFloat(ppmToDh(currentValue).toFixed(1));
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

/** Sets up the hamburger menu. */
function setupHamburgerMenu() {
    const menuToggle = allElements.menuToggle;
    const menuOverlay = allElements.menuOverlay;
    const menuPanel = allElements.menuPanel;
    const closeMenu = allElements.closeMenu;

    function openMenu() {
        menuPanel.classList.add('active');
        menuOverlay.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuPanel.removeAttribute('aria-hidden');
        document.body.style.overflow = 'hidden';
        // Focus first interactive element in menu
        const firstBtn = menuPanel.querySelector('button, a, input, select');
        if (firstBtn) firstBtn.focus();
    }

    function closeMenuFn() {
        menuPanel.classList.remove('active');
        menuOverlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuPanel.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        menuToggle.focus();
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
            translatePage(false);
            localStorage.setItem(LANG_KEY, currentLang);
            syncMenuLangButtons();
        });
    }
    if (allElements.menuLangKn) {
        allElements.menuLangKn.addEventListener('click', () => {
            currentLang = 'kn';
            translatePage(false);
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
            if (allElements.changelogModal) allElements.changelogModal.style.display = 'flex';
            closeMenuFn();
        });
    }

    // Buffer links
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

/** Sets up volume mode toggle. */
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
// Profile System
// ---------------------------------------------------------------------------

function setupProfileTabs() {
    currentProfile = localStorage.getItem(PROFILE_KEY) || 'freshwater';
    if (allElements.profileTabs) {
        allElements.profileTabs.querySelectorAll('.profile-tab').forEach(tab => {
            const isActive = tab.dataset.profile === currentProfile;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
        allElements.profileTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.profile-tab');
            if (!tab) return;
            const profile = tab.dataset.profile;
            if (profile === currentProfile) return;
            currentProfile = profile;
            localStorage.setItem(PROFILE_KEY, profile);
            allElements.profileTabs.querySelectorAll('.profile-tab').forEach(t => {
                const isActive = t.dataset.profile === currentProfile;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', isActive);
            });
            toggleProfileVisibility(currentProfile);
            applyProfileDefaults(currentProfile);
            legacyInputsDirty = {};
            handleParameterStatusUpdate();
            doDosingCalculations();
        });
    }
    toggleProfileVisibility(currentProfile);
    // FIX: Apply profile defaults on initial load (not just on tab switch)
    applyProfileDefaults(currentProfile);
}

function toggleProfileVisibility(profile) {
    document.querySelectorAll('[data-profile]').forEach(el => {
        // Never hide the profile tab buttons themselves
        if (el.classList.contains('profile-tab')) return;
        const profiles = el.dataset.profile.split(' ');
        el.style.display = profiles.includes(profile) ? '' : 'none';
    });
}

function applyProfileDefaults(profile) {
    const defaults = window.SeachemEngine?.PROFILE_DEFAULTS?.[profile];
    if (!defaults) return;

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

    // Sync to legacy cards
    if (defaults.paramKh !== undefined) {
        if (allElements.khCurrent) allElements.khCurrent.value = fmt(defaults.paramKh, 2);
        if (allElements.nrKh) allElements.nrKh.value = fmt(defaults.paramKh, 2);
        if (allElements.acidCurrentKh) allElements.acidCurrentKh.value = fmt(defaults.paramKh, 2);
    }
    if (defaults.paramGh !== undefined && allElements.ghCurrent) {
        allElements.ghCurrent.value = fmt(defaults.paramGh, 2);
    }

    // FIX: Clear scale localStorage BEFORE resetting dynamic cards
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            if (cfg.unitScales) {
                localStorage.removeItem('scale_' + cfg.id);
                const selectEl = document.getElementById('dyn_' + cfg.id + '_scale');
                if (selectEl) selectEl.value = cfg.baseUnit;
            }
        });
    }

    resetDynamicCardInputs(profile);
}

function resetDynamicCardInputs(profile) {
    const defaults = window.SeachemEngine?.PROFILE_DEFAULTS?.[profile];
    if (!defaults) return;

    window.SeachemEngine?.PRODUCT_CONFIGS?.forEach(cfg => {
        const curEl = document.getElementById('dyn_' + cfg.id + '_current');
        if (!curEl) return;

        if (['reef_buffer', 'reef_builder', 'reef_carbonate', 'reef_fusion2'].includes(cfg.id) && defaults.paramAlkalinity !== undefined) {
            const scale = getScaleForProduct(cfg.id);
            curEl.value = fmt(window.SeachemEngine.convertInput(defaults.paramAlkalinity, 'meq/L', scale), 2);
        } else if (['alkaline_buffer', 'equilibrium_engine', 'potassium_bicarbonate'].includes(cfg.id) && defaults.paramKh !== undefined) {
            const scale = getScaleForProduct(cfg.id);
            curEl.value = fmt(window.SeachemEngine.convertInput(defaults.paramKh, 'dKH', scale), 2);
        } else if (cfg.id === 'reef_adv_calcium' && defaults.paramCalcium !== undefined) {
            curEl.value = defaults.paramCalcium;
        } else if (cfg.id === 'reef_adv_magnesium' && defaults.paramMagnesium !== undefined) {
            curEl.value = defaults.paramMagnesium;
        } else if ((cfg.id === 'reef_adv_strontium' || cfg.id === 'reef_strontium') && defaults.paramStrontium !== undefined) {
            curEl.value = defaults.paramStrontium;
        } else if (cfg.id === 'reef_iodide' && defaults.paramIodide !== undefined) {
            curEl.value = defaults.paramIodide;
        } else if (cfg.id === 'flourish_iron' && defaults.paramIron !== undefined) {
            curEl.value = defaults.paramIron;
        } else if (cfg.id === 'flourish_potassium' && defaults.paramPotassium !== undefined) {
            curEl.value = defaults.paramPotassium;
        }
    });
}

function getScaleForProduct(productId) {
    const saved = localStorage.getItem('scale_' + productId);
    if (saved) return saved;
    if (window.SeachemEngine) {
        const cfg = window.SeachemEngine.PRODUCT_CONFIGS.find(c => c.id === productId);
        if (cfg) return cfg.baseUnit;
    }
    return 'meq/L';
}

// ---------------------------------------------------------------------------
// Dynamic Card Generation
// ---------------------------------------------------------------------------

function generateCalculatorCards() {
    const container = allElements.dynamicCalculators;
    if (!container || !window.SeachemEngine) return;
    container.innerHTML = '';

    const t = (key) => translations[currentLang]?.[key] || key;

    window.SeachemEngine.PRODUCT_CONFIGS.forEach((cfg) => {
        const card = document.createElement('div');
        const profileAttr = cfg.profile === 'universal' ? 'freshwater saltwater pond' : cfg.profile;
        card.className = 'dosing-card glass-card';
        card.id = 'dyn-card-' + cfg.id;
        card.setAttribute('data-profile', profileAttr);

        let inputsHtml = '';
        if (cfg.inputType === 'current_target') {
            const unitLabel = cfg.unitScales ? cfg.unitScales[0] : cfg.baseUnit;
            const scaleSelect = cfg.unitScales
                ? `<select class="scale-select" id="dyn_${cfg.id}_scale" data-product="${cfg.id}">
                    ${cfg.unitScales.map(s => `<option value="${s}">${s}</option>`).join('')}
                  </select>`
                : `<span class="input-unit">${unitLabel}</span>`;

            inputsHtml = `
                <div class="input-row">
                    <div class="input-group">
                        <label for="dyn_${cfg.id}_current" data-lang-key="current_label">${t('current_label')}</label>
                        <div class="input-wrapper">
                            <input type="number" id="dyn_${cfg.id}_current" min="0" step="0.1" value="0" class="styled-input">
                            ${scaleSelect}
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="dyn_${cfg.id}_target" data-lang-key="target_label">${t('target_label')}</label>
                        <input type="number" id="dyn_${cfg.id}_target" min="0" step="0.1" value="0" class="styled-input">
                    </div>
                </div>`;
        }
        if (cfg.inputType === 'volume_only') {
            inputsHtml = `<p class="product-info" data-lang-key="volume_only_hint">${t('volume_only_hint')}</p>`;
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

function setupDynamicCards() {
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            if (cfg.unitScales) {
                const selectEl = document.getElementById('dyn_' + cfg.id + '_scale');
                if (selectEl) {
                    const saved = localStorage.getItem('scale_' + cfg.id);
                    if (saved && cfg.unitScales.includes(saved)) {
                        selectEl.value = saved;
                    } else if (cfg.unitScales.includes(cfg.baseUnit)) {
                        selectEl.value = cfg.baseUnit;
                    }
                    selectEl.addEventListener('change', () => {
                        localStorage.setItem('scale_' + cfg.id, selectEl.value);
                    });
                }
            }
        });
    }

    // Copy buttons for dynamic cards — use safe clipboard
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            const copyBtn = document.getElementById('dyn_' + cfg.id + '_copy');
            const resultEl = document.getElementById('dyn_' + cfg.id + '_result');
            if (copyBtn && resultEl) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const textToCopy = resultEl.dataset.dose || '0';
                    handleCopyClick(copyBtn, textToCopy);
                });
            }
        });
    }

    // Substrate dropdown
    if (allElements.subProduct && window.SeachemEngine?.SUBSTRATE_PRODUCTS) {
        allElements.subProduct.innerHTML = '';
        window.SeachemEngine.SUBSTRATE_PRODUCTS.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            allElements.subProduct.appendChild(opt);
        });
    }

    // Substrate unit toggle — now persists to localStorage
    substrateUnit = localStorage.getItem(SUB_UNIT_KEY) || 'cm';
    document.querySelectorAll('.sub-unit-btn').forEach(btn => {
        const isActive = btn.dataset.unit === substrateUnit;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
        btn.addEventListener('click', (e) => {
            const unit = e.target.dataset.unit;
            if (unit !== substrateUnit) {
                substrateUnit = unit;
                localStorage.setItem(SUB_UNIT_KEY, unit);
                document.querySelectorAll('.sub-unit-btn').forEach(b => {
                    const active = b.dataset.unit === substrateUnit;
                    b.classList.toggle('active', active);
                    b.setAttribute('aria-pressed', active);
                });
                doDosingCalculations();
            }
        });
    });

    // Salt mix dropdown
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

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

/** Translates the page. skipCalc=true during init to avoid premature calculation. */
function translatePage(skipCalc) {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[currentLang]?.[key];
        if (translation) {
            const isHtmlContent = key.startsWith('reco_') || key === 'changelog_list';
            if (isHtmlContent) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    if (!skipCalc) {
        handleParameterStatusUpdate();
        doDosingCalculations();
    }
}

// ---------------------------------------------------------------------------
// Input Collection
// ---------------------------------------------------------------------------

function getAllInputValues() {
    const inputs = {};
    const numericKeys = [
        'paramAmmonia', 'paramNitrate', 'paramNitrite', 'paramGh', 'paramKh', 'volume',
        'khCurrent', 'khTarget', 'khPurity', 'ghCurrent', 'ghTarget',
        'phCurrent', 'phTarget', 'nrKh', 'acidCurrentKh', 'acidTargetKh',
        'phGoldCurrent', 'phGoldTarget',
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

function displayErrors(errorMessages) {
    if (!allElements.errors) return;
    allElements.errors.innerHTML = errorMessages.length > 0 ? errorMessages.join(' &bull; ') : '';
    if (errorMessages.length > 0) allElements.errors.focus();
}

// ---------------------------------------------------------------------------
// Robust Recommendation Rendering (uses RecommendationEngine)
// ---------------------------------------------------------------------------

function handleParameterStatusUpdate() {
    const inputs = getAllInputValues();
    const litres = getEffectiveVolumeLitres();
    const t = (key, replacements = {}) => {
        let text = translations[currentLang]?.[key] || key;
        for (const r in replacements) {
            text = text.replace(`{${r}}`, replacements[r]);
        }
        return text;
    };

    // Resolve GH/KH to dGH/dKH for analysis
    const dGH = ghUnitMode === 'ppm' ? ppmToDh(inputs.paramGh) : inputs.paramGh;
    const dKH = khUnitMode === 'ppm' ? ppmToDh(inputs.paramKh) : inputs.paramKh;

    // Build params object for the recommendation engine
    const engineParams = {
        ammonia: inputs.paramAmmonia,
        nitrite: inputs.paramNitrite,
        nitrate: inputs.paramNitrate,
        ph: inputs.paramPh,
        temp: inputs.paramTemp
    };

    if (currentProfile === 'freshwater') {
        engineParams.gh = dGH;
        engineParams.kh = dKH;
        engineParams.potassium = inputs.paramPotassium;
        engineParams.iron = inputs.paramIron;
    } else if (currentProfile === 'saltwater') {
        engineParams.salinity = inputs.paramSalinity;
        engineParams.alkalinity = inputs.paramAlkalinity;
        engineParams.calcium = inputs.paramCalcium;
        engineParams.magnesium = inputs.paramMagnesium;
        engineParams.phosphate = inputs.paramPhosphate;
        engineParams.strontium = inputs.paramStrontium;
        engineParams.iodide = inputs.paramIodide;
    } else if (currentProfile === 'pond') {
        engineParams.gh = dGH;
        engineParams.kh = dKH;
        engineParams.dissolvedO2 = inputs.paramDo;
    }

    // Run recommendation engine
    let analysis = null;
    if (window.RecommendationEngine) {
        analysis = window.RecommendationEngine.analyze(engineParams, currentProfile, litres);
    }

    // --- Update status badges ---
    updateStatusBadge(allElements.statusAmmonia, inputs.paramAmmonia, 0, 0, 'ammonia');
    updateStatusBadge(allElements.statusNitrite, inputs.paramNitrite, 0, 0, 'nitrite');
    updateStatusBadge(allElements.statusNitrate, inputs.paramNitrate, 0, 20, 'nitrate');

    if (allElements.statusPh) {
        allElements.statusPh.className = 'status-badge';
        allElements.statusPh.textContent = `pH ${fmt(inputs.paramPh, 2)}`;
    }

    if (currentProfile === 'freshwater') {
        if (allElements.statusGh) {
            allElements.statusGh.className = 'status-badge';
            allElements.statusGh.textContent = `${fmt(dGH, 1)} dGH`;
        }
        if (allElements.statusKh) {
            allElements.statusKh.className = 'status-badge';
            allElements.statusKh.textContent = `${fmt(dKH, 1)} dKH`;
        }

        // FIX: Only sync to legacy cards if user hasn't manually edited them
        syncLegacyInput('ghCurrent', dGH);
        syncLegacyInput('khCurrent', dKH);
        syncLegacyInput('nrKh', dKH);
        syncLegacyInput('acidCurrentKh', dKH);

        // Sync dynamic cards
        syncDynInput('flourish_iron', inputs.paramIron);
        syncDynInput('flourish_potassium', inputs.paramPotassium);
        syncDynAlkalineInputs(dKH);
    }

    if (currentProfile === 'saltwater') {
        updateSaltwaterBadge(allElements.statusSalinity, inputs.paramSalinity, 34, 36);
        updateSaltwaterBadge(allElements.statusAlkalinity, inputs.paramAlkalinity, 7, 12);
        updateSaltwaterBadge(allElements.statusCalcium, inputs.paramCalcium, 380, 450);
        updateSaltwaterBadge(allElements.statusMagnesium, inputs.paramMagnesium, 1250, 1400);

        syncDynInput('reef_adv_calcium', inputs.paramCalcium);
        syncDynInput('reef_adv_magnesium', inputs.paramMagnesium);
        syncDynInput('reef_adv_strontium', inputs.paramStrontium);
        syncDynInput('reef_strontium', inputs.paramStrontium);
        syncDynInput('reef_iodide', inputs.paramIodide);
        syncDynInput('reef_calcium', inputs.paramCalcium);
        syncDynInput('reef_fusion1', inputs.paramCalcium);
        syncDynInput('reef_complete', inputs.paramCalcium);
        syncDynSaltwaterAlkalineInputs(inputs.paramAlkalinity);
    }

    if (currentProfile === 'pond') {
        if (allElements.statusGh) {
            allElements.statusGh.className = 'status-badge';
            allElements.statusGh.textContent = `${fmt(dGH, 1)} dGH`;
        }
        if (allElements.statusKh) {
            allElements.statusKh.className = 'status-badge';
            allElements.statusKh.textContent = `${fmt(dKH, 1)} dKH`;
        }
        if (allElements.statusDo) {
            const doVal = inputs.paramDo;
            if (doVal < 4) {
                allElements.statusDo.className = 'status-badge warn';
                allElements.statusDo.textContent = t('status_danger');
            } else if (doVal < 6) {
                allElements.statusDo.className = 'status-badge warn';
                allElements.statusDo.textContent = t('status_low');
            } else {
                allElements.statusDo.className = 'status-badge good';
                allElements.statusDo.textContent = t('status_good');
            }
        }

        // Sync pond legacy card inputs
        syncLegacyInput('ghCurrent', dGH);
        syncLegacyInput('khCurrent', dKH);
        syncLegacyInput('nrKh', dKH);
        syncLegacyInput('acidCurrentKh', dKH);

        // Sync pond dynamic alkaline card inputs
        syncDynAlkalineInputs(dKH);
    }

    // --- CO2 estimate display ---
    if (allElements.co2Estimate && analysis && analysis.co2Estimate !== null) {
        allElements.co2Estimate.textContent = `CO₂ ≈ ${analysis.co2Estimate.toFixed(1)} mg/L`;
        allElements.co2Estimate.style.display = '';
    } else if (allElements.co2Estimate) {
        allElements.co2Estimate.style.display = 'none';
    }

    // --- Render recommendations ---
    renderRecommendations(analysis, litres, t);
}

function updateStatusBadge(el, value, safeLow, safeHigh, type) {
    if (!el) return;
    if (type === 'ammonia' || type === 'nitrite') {
        if (value > 0) {
            el.className = 'status-badge warn';
            el.textContent = value > 1 ? translations[currentLang]?.status_danger || 'DANGER' : translations[currentLang]?.status_high || 'High';
        } else {
            el.className = 'status-badge good';
            el.textContent = translations[currentLang]?.status_good || 'Good';
        }
    } else if (type === 'nitrate') {
        if (value > 50) {
            el.className = 'status-badge warn';
            el.textContent = translations[currentLang]?.status_high || 'High';
        } else {
            el.className = 'status-badge good';
            el.textContent = translations[currentLang]?.status_good || 'Good';
        }
    }
}

function updateSaltwaterBadge(el, value, low, high) {
    if (!el) return;
    const t = translations[currentLang] || translations.en;
    if (value < low) {
        el.className = 'status-badge warn';
        el.textContent = t.status_low || 'Low';
    } else if (value > high) {
        el.className = 'status-badge warn';
        el.textContent = t.status_high || 'High';
    } else {
        el.className = 'status-badge good';
        el.textContent = t.status_good || 'Good';
    }
}

/** Sync legacy card input only if user hasn't manually focused/edited it */
function syncLegacyInput(elId, value) {
    if (legacyInputsDirty[elId]) return;
    const el = allElements[elId];
    if (el) el.value = fmt(value, 2);
}

function syncDynInput(productId, value) {
    const el = document.getElementById('dyn_' + productId + '_current');
    if (el) el.value = value;
}

function syncDynAlkalineInputs(dKH) {
    ['alkaline_buffer', 'equilibrium_engine', 'potassium_bicarbonate', 'pond_alkaline_buffer'].forEach(id => {
        const el = document.getElementById('dyn_' + id + '_current');
        if (!el || !window.SeachemEngine) return;
        const scale = getScaleForProduct(id);
        el.value = fmt(window.SeachemEngine.convertInput(dKH, 'dKH', scale), 2);
    });
}

function syncDynSaltwaterAlkalineInputs(meqL) {
    ['reef_buffer', 'reef_builder', 'reef_carbonate', 'reef_fusion2'].forEach(id => {
        const el = document.getElementById('dyn_' + id + '_current');
        if (!el || !window.SeachemEngine) return;
        const scale = getScaleForProduct(id);
        el.value = fmt(window.SeachemEngine.convertInput(meqL, 'meq/L', scale), 2);
    });
}

// ---------------------------------------------------------------------------
// Recommendation Rendering
// ---------------------------------------------------------------------------

function renderRecommendations(analysis, litres, t) {
    if (!allElements.recommendations) return;

    const beacons = document.querySelectorAll('.realtime-beacon');
    const loader = document.getElementById('emergencyLoader');
    const container = allElements.recommendations.closest('.recommendations-container');
    const hasCritical = analysis && analysis.hasCritical;

    // Update beacon state
    beacons.forEach((beacon) => {
        const label = beacon.querySelector('.beacon-label');
        const status = beacon.querySelector('.beacon-status');
        if (hasCritical) {
            beacon.classList.add('has-critical');
            if (label) label.textContent = t('beacon_alert') || 'ALERT';
            if (status) status.textContent = t('beacon_check') || 'Check parameters';
        } else {
            beacon.classList.remove('has-critical');
            if (label) label.textContent = t('beacon_live') || 'LIVE';
            if (status) status.textContent = t('beacon_ok') || 'No errors';
        }
    });

    // Emergency loading buffer for critical issues
    if (hasCritical && loader) {
        loader.style.display = '';
        allElements.recommendations.style.display = 'none';

        // Flash the container border
        if (container) {
            container.classList.remove('critical-flash');
            void container.offsetWidth; // force reflow for re-trigger
            container.classList.add('critical-flash');
        }

        // Show recommendations after the scan animation completes
        clearTimeout(renderRecommendations._loaderTimer);
        renderRecommendations._loaderTimer = setTimeout(() => {
            loader.style.display = 'none';
            allElements.recommendations.style.display = '';
            populateRecommendations(analysis, litres, t);
        }, 1200);
        return;
    }

    // Non-critical: render immediately
    if (loader) loader.style.display = 'none';
    allElements.recommendations.style.display = '';
    populateRecommendations(analysis, litres, t);
}

function populateRecommendations(analysis, litres, t) {
    allElements.recommendations.innerHTML = '';

    if (!analysis || analysis.recommendations.length === 0) {
        const p = document.createElement('p');
        p.className = 'reco-item reco-ok';
        p.innerHTML = `<span class="reco-icon">✅</span> ${t('reco_ok')}`;
        allElements.recommendations.appendChild(p);
        return;
    }

    const severityLabels = {
        critical: { class: 'reco-critical', label: 'CRITICAL' },
        warning:  { class: 'reco-warning',  label: 'WARNING' },
        caution:  { class: 'reco-caution',  label: 'CAUTION' },
        info:     { class: 'reco-info',     label: 'INFO' }
    };

    analysis.recommendations.forEach(rec => {
        const div = document.createElement('div');
        const sevInfo = severityLabels[rec.severity] || severityLabels.info;
        div.className = `reco-item ${sevInfo.class}`;

        let html = '';

        if (rec.type === 'cross_param') {
            // Cross-parameter insight
            let msg = t(rec.message_key) || rec.message_key;
            if (rec.data) {
                for (const k in rec.data) {
                    msg = msg.replace(`{${k}}`, rec.data[k]);
                }
            }
            html = `<span class="reco-icon">${rec.icon || '📋'}</span>
                    <span class="reco-badge ${sevInfo.class}">${sevInfo.label}</span>
                    <span class="reco-text">${msg}</span>`;
        } else {
            // Single parameter recommendation
            const paramLabel = getParamDisplayName(rec.param, t);
            const dirText = rec.direction === 'high' ? '↑' : rec.direction === 'low' ? '↓' : '⚠';
            const rangeText = rec.safeRange ? `(safe: ${rec.safeRange[0]}–${rec.safeRange[1]} ${rec.unit})` : '';
            const action = getActionText(rec, currentProfile, t);

            html = `<span class="reco-icon">${rec.icon || '📋'}</span>
                    <span class="reco-badge ${sevInfo.class}">${sevInfo.label}</span>
                    <strong>${paramLabel}</strong> ${dirText} ${fmt(rec.value, 2)} ${rec.unit}
                    <span class="reco-range">${rangeText}</span>`;

            if (action) {
                html += `<br><span class="reco-action">${action}</span>`;
            }

            if (rec.emergencyDose) {
                html += `<br><span class="reco-emergency">→ Dose <strong>${fmt(rec.emergencyDose.dose, 1)} ${rec.emergencyDose.unit}</strong> of ${rec.emergencyDose.product} immediately</span>`;
            }
        }

        div.innerHTML = html;
        allElements.recommendations.appendChild(div);
    });
}

function getParamDisplayName(param, t) {
    const names = {
        ammonia: t('param_ammonia_label'), nitrite: t('param_nitrite_label'), nitrate: t('param_nitrate_label'),
        ph: t('param_ph_label'), gh: t('param_gh_label'), kh: t('param_kh_label'), temp: t('param_temp_label'),
        potassium: t('param_potassium_label'), iron: t('param_iron_label'),
        salinity: t('param_salinity_label'), alkalinity: t('param_alkalinity_label'),
        calcium: t('param_calcium_label'), magnesium: t('param_magnesium_label'),
        phosphate: t('param_phosphate_label'), strontium: t('param_strontium_label'),
        iodide: t('param_iodide_label'), dissolvedO2: t('param_do_label')
    };
    return names[param] || param;
}

function getActionText(rec, profile, t) {
    const p = rec.param;
    const dir = rec.direction;

    // Freshwater actions
    if (p === 'ammonia' && dir !== 'ok') return t('reco_ammonia_detected');
    if (p === 'nitrite' && dir !== 'ok') return t('reco_nitrite_detected');
    if (p === 'nitrate' && dir === 'high') return t('reco_nitrate_high');
    if (p === 'gh' && dir === 'low') return t('reco_gh_low');
    if (p === 'kh' && dir === 'low') return t('reco_kh_low');
    if (p === 'iron' && dir === 'low') return t('reco_iron_low');
    if (p === 'potassium' && dir === 'low') return t('reco_potassium_low');

    // Saltwater actions
    if (p === 'salinity' && (dir === 'low' || dir === 'high')) return t('reco_salinity_check');
    if (p === 'alkalinity' && dir === 'low') return t('reco_alkalinity_low');
    if (p === 'calcium' && dir === 'low') return t('reco_calcium_low');
    if (p === 'magnesium' && dir === 'low') return t('reco_magnesium_low');

    // Pond actions
    if (p === 'dissolvedO2' && dir === 'low') return t('reco_do_low');

    return '';
}

// ---------------------------------------------------------------------------
// Parameter History (localStorage)
// ---------------------------------------------------------------------------

function saveParameterSnapshot() {
    const inputs = getAllInputValues();
    const dGH = ghUnitMode === 'ppm' ? ppmToDh(inputs.paramGh) : inputs.paramGh;
    const dKH = khUnitMode === 'ppm' ? ppmToDh(inputs.paramKh) : inputs.paramKh;

    const snapshot = {
        timestamp: new Date().toISOString(),
        profile: currentProfile,
        ammonia: inputs.paramAmmonia,
        nitrite: inputs.paramNitrite,
        nitrate: inputs.paramNitrate,
        ph: inputs.paramPh,
        temp: inputs.paramTemp
    };

    if (currentProfile === 'freshwater') {
        snapshot.gh = dGH;
        snapshot.kh = dKH;
        snapshot.potassium = inputs.paramPotassium;
        snapshot.iron = inputs.paramIron;
    } else if (currentProfile === 'saltwater') {
        snapshot.salinity = inputs.paramSalinity;
        snapshot.alkalinity = inputs.paramAlkalinity;
        snapshot.calcium = inputs.paramCalcium;
        snapshot.magnesium = inputs.paramMagnesium;
    } else if (currentProfile === 'pond') {
        snapshot.kh = dKH;
        snapshot.dissolvedO2 = inputs.paramDo;
    }

    try {
        const history = JSON.parse(localStorage.getItem(PARAM_HISTORY_KEY) || '[]');
        history.push(snapshot);
        // Keep last 50 entries
        while (history.length > 50) history.shift();
        localStorage.setItem(PARAM_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        // localStorage full or unavailable
    }
}

function getParameterHistory() {
    try {
        return JSON.parse(localStorage.getItem(PARAM_HISTORY_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function setupParameterHistory() {
    if (allElements.saveParamsBtn) {
        allElements.saveParamsBtn.addEventListener('click', () => {
            saveParameterSnapshot();
            const btn = allElements.saveParamsBtn;
            const origText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => { btn.textContent = origText; }, 1500);
        });
    }
    if (allElements.paramHistoryBtn) {
        allElements.paramHistoryBtn.addEventListener('click', showParameterHistory);
    }
}

function showParameterHistory() {
    const history = getParameterHistory();
    const modal = document.getElementById('historyModal');
    const body = document.getElementById('historyBody');
    if (!modal || !body) return;

    if (history.length === 0) {
        body.innerHTML = '<p>No saved readings yet. Use "Save Reading" to track your parameters over time.</p>';
    } else {
        const profileHistory = history.filter(h => h.profile === currentProfile);
        if (profileHistory.length === 0) {
            body.innerHTML = `<p>No saved readings for ${currentProfile} profile.</p>`;
        } else {
            let html = '<table class="history-table"><thead><tr><th>Date</th>';
            // Dynamic columns based on profile
            const cols = getHistoryColumns(currentProfile);
            cols.forEach(c => { html += `<th>${c.label}</th>`; });
            html += '</tr></thead><tbody>';

            profileHistory.slice(-10).reverse().forEach(entry => {
                const date = new Date(entry.timestamp);
                html += `<tr><td>${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>`;
                cols.forEach(c => {
                    const val = entry[c.key];
                    html += `<td>${val !== undefined ? fmt(val, c.decimals || 1) : '-'}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            if (profileHistory.length > 10) {
                html += `<p class="history-note">Showing last 10 of ${profileHistory.length} readings.</p>`;
            }
            body.innerHTML = html;
        }
    }
    modal.style.display = 'flex';
}

function getHistoryColumns(profile) {
    if (profile === 'freshwater') {
        return [
            { key: 'ammonia', label: 'NH₃', decimals: 2 },
            { key: 'nitrite', label: 'NO₂', decimals: 2 },
            { key: 'nitrate', label: 'NO₃', decimals: 0 },
            { key: 'ph', label: 'pH', decimals: 2 },
            { key: 'gh', label: 'GH', decimals: 1 },
            { key: 'kh', label: 'KH', decimals: 1 }
        ];
    } else if (profile === 'saltwater') {
        return [
            { key: 'ammonia', label: 'NH₃', decimals: 2 },
            { key: 'nitrate', label: 'NO₃', decimals: 0 },
            { key: 'ph', label: 'pH', decimals: 2 },
            { key: 'salinity', label: 'Sal', decimals: 1 },
            { key: 'alkalinity', label: 'Alk', decimals: 1 },
            { key: 'calcium', label: 'Ca', decimals: 0 },
            { key: 'magnesium', label: 'Mg', decimals: 0 }
        ];
    } else {
        return [
            { key: 'ammonia', label: 'NH₃', decimals: 2 },
            { key: 'nitrite', label: 'NO₂', decimals: 2 },
            { key: 'nitrate', label: 'NO₃', decimals: 0 },
            { key: 'ph', label: 'pH', decimals: 2 },
            { key: 'kh', label: 'KH', decimals: 1 },
            { key: 'dissolvedO2', label: 'DO', decimals: 1 }
        ];
    }
}

// ---------------------------------------------------------------------------
// Results Display
// ---------------------------------------------------------------------------

function updateAllResults(results) {
    const t = (key) => translations[currentLang]?.[key] || key;

    // Legacy cards
    if (allElements.khco3Result) {
        allElements.khco3Result.textContent = `${fmtPrecise(results.khDose)} g KHCO₃`;
        allElements.khco3Result.dataset.dose = fmtPrecise(results.khDose);
    }
    if (allElements.khSplit) {
        allElements.khSplit.textContent = splitText(results.khDose, currentLang);
    }

    if (allElements.equilibriumResult) {
        if (results.equilibriumDose > 0) {
            allElements.equilibriumResult.textContent = `${fmtPrecise(results.equilibriumDose)} g Equilibrium`;
            if (allElements.eqSplit) allElements.eqSplit.textContent = splitText(results.equilibriumDose, currentLang);
        } else if (results.ghCurrentHigher) {
            allElements.equilibriumResult.textContent = t('gh_already_at_target') || 'GH already at/above target';
            if (allElements.eqSplit) allElements.eqSplit.textContent = '';
        } else {
            allElements.equilibriumResult.textContent = t('no_dose_needed');
            if (allElements.eqSplit) allElements.eqSplit.textContent = '';
        }
        allElements.equilibriumResult.dataset.dose = fmtPrecise(results.equilibriumDose);
    }

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

    if (allElements.neutralResult) {
        allElements.neutralResult.textContent = results.neutralRegulatorDose > 0 ? `${fmtPrecise(results.neutralRegulatorDose)} g Neutral Reg.` : t('no_dose_needed');
        allElements.neutralResult.dataset.dose = fmtPrecise(results.neutralRegulatorDose);
    }
    if (allElements.nrSplit) {
        allElements.nrSplit.textContent = splitText(results.neutralRegulatorDose, currentLang);
    }

    if (allElements.acidResult) {
        allElements.acidResult.textContent = results.acidBufferDose > 0 ? `${fmtPrecise(results.acidBufferDose)} g Acid Buffer` : t('no_dose_needed');
        allElements.acidResult.dataset.dose = fmtPrecise(results.acidBufferDose);
    }
    if (allElements.acidSplit) {
        allElements.acidSplit.textContent = splitText(results.acidBufferDose, currentLang);
    }

    if (allElements.goldResult) {
        const goldText = results.goldBufferResult.grams > 0 ? `${fmtPrecise(results.goldBufferResult.grams)} g Gold Buffer (${results.goldBufferResult.fullDose ? 'full' : 'half'} dose)` : t('no_dose_needed');
        allElements.goldResult.textContent = goldText;
        allElements.goldResult.dataset.dose = fmtPrecise(results.goldBufferResult.grams);
    }
    if (allElements.goldSplit) {
        allElements.goldSplit.textContent = splitText(results.goldBufferResult?.grams || 0, currentLang);
    }

    // Dynamic card results
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

    // Water Change
    if (results.waterChange !== undefined && allElements.wcResult) {
        const wc = results.waterChange;
        allElements.wcResult.textContent = `${fmt(wc.litres, 2)} L  /  ${fmt(wc.usGal, 2)} US Gal  /  ${fmt(wc.ukGal, 2)} UK Gal`;
    }

    // Substrate
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

    // Salt Mix
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
    if (!allElements.timestamp) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const label = currentLang === 'kn' ? 'ಕೊನೆಯ ಲೆಕ್ಕಾಚಾರ' : 'Last calc';
    allElements.timestamp.textContent = `${label}: ${ts}`;
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

function handleReset(callbacks) {
    currentProfile = 'freshwater';
    localStorage.setItem(PROFILE_KEY, 'freshwater');
    if (allElements.profileTabs) {
        allElements.profileTabs.querySelectorAll('.profile-tab').forEach(t => {
            const isActive = t.dataset.profile === 'freshwater';
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive);
        });
    }
    toggleProfileVisibility('freshwater');

    document.querySelectorAll('input[type=number]').forEach(input => { input.value = input.defaultValue || 0; });
    if (allElements.volume) allElements.volume.value = 10;
    if (allElements.khPurity) allElements.khPurity.value = 0.99;
    if (allElements.unit) {
        allElements.unit.value = 'US';
        localStorage.setItem(LAST_UNIT_KEY, 'US');
    }

    ghUnitMode = 'dh';
    khUnitMode = 'dh';
    localStorage.setItem(GH_UNIT_KEY, 'dh');
    localStorage.setItem(KH_UNIT_KEY, 'dh');
    applyUnitToggleState('gh', 'dh');
    applyUnitToggleState('kh', 'dh');

    legacyInputsDirty = {};

    applyProfileDefaults('freshwater');

    volumeMode = 'direct';
    localStorage.setItem(VOL_MODE_KEY, 'direct');
    applyVolumeModeState();

    dimUnit = 'cm';
    localStorage.setItem(DIM_UNIT_KEY, 'cm');
    applyDimUnitState();

    if (allElements.dimLength) allElements.dimLength.value = 60;
    if (allElements.dimBreadth) allElements.dimBreadth.value = 30;
    if (allElements.dimHeight) allElements.dimHeight.value = 40;
    calculateVolumeFromDimensions();

    const advSection = document.getElementById('advancedBuffersSection');
    if (advSection) advSection.classList.remove('visible');
    document.querySelectorAll('.advanced-buffer').forEach(buffer => {
        buffer.classList.remove('visible');
    });

    substrateUnit = 'cm';
    localStorage.setItem(SUB_UNIT_KEY, 'cm');
    document.querySelectorAll('.sub-unit-btn').forEach(b => {
        const isActive = b.dataset.unit === 'cm';
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive);
    });

    if (allElements.smVolume) allElements.smVolume.value = 10;
    if (allElements.smCurrentPpt) allElements.smCurrentPpt.value = 30;
    if (allElements.smDesiredPpt) allElements.smDesiredPpt.value = 35;

    callbacks.forEach(cb => cb());
}

// ---------------------------------------------------------------------------
// CSV Export (with proper escaping)
// ---------------------------------------------------------------------------

function handleCsvDownload() {
    const rows = [
        ['Parameter', 'Dose', 'Unit'].map(csvEscape)
    ];
    const addRow = (name, dose, unit) => {
        rows.push([csvEscape(name), csvEscape(dose), csvEscape(unit)]);
    };

    addRow('KHCO3', allElements.khco3Result?.dataset.dose || '0', 'g');
    addRow('Equilibrium', allElements.equilibriumResult?.dataset.dose || '0', 'g');
    addRow('Safe', allElements.safeResult?.dataset.dose || '0', 'g');
    addRow('APT Complete', allElements.aptResult?.dataset.dose || '0', 'ml');
    addRow('Neutral Regulator', allElements.neutralResult?.dataset.dose || '0', 'g');
    addRow('Acid Buffer', allElements.acidResult?.dataset.dose || '0', 'g');
    addRow('Gold Buffer', allElements.goldResult?.dataset.dose || '0', 'g');

    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            const resultEl = document.getElementById('dyn_' + cfg.id + '_result');
            if (resultEl) {
                addRow(cfg.title, resultEl.dataset.dose || '0', cfg.baseUnit === 'PPM' ? 'mL' : 'g');
            }
        });
    }

    if (allElements.wcResult) addRow('Water Change', allElements.wcResult.textContent || '-', 'L');
    if (allElements.subResult) addRow('Substrate', allElements.subResult.textContent || '-', 'bags');
    if (allElements.smResult) addRow('Salt Mix', allElements.smResult.textContent || '-', 'kg');

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `aquarium-dosing-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    try {
        link.click();
    } finally {
        document.body.removeChild(link);
    }
}

// ---------------------------------------------------------------------------
// Copy Buttons (safe clipboard)
// ---------------------------------------------------------------------------

function handleCopyClick(button, text) {
    safeClipboardWrite(text).then(ok => {
        const icon = button.querySelector('span');
        if (icon) {
            icon.textContent = ok ? '✔️' : '❌';
            setTimeout(() => { icon.textContent = '📋'; }, 1200);
        }
    });
}

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
                handleCopyClick(button, resultEl.dataset.dose || '0');
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function setupModal() {
    if (allElements.closeChangelog) {
        allElements.closeChangelog.addEventListener('click', () => {
            if (allElements.changelogModal) allElements.changelogModal.style.display = 'none';
        });
    }
    if (allElements.changelogModal) {
        allElements.changelogModal.addEventListener('click', (e) => {
            if (e.target === allElements.changelogModal) allElements.changelogModal.style.display = 'none';
        });
    }

    // History modal close
    const historyModal = document.getElementById('historyModal');
    const closeHistory = document.getElementById('closeHistory');
    if (closeHistory && historyModal) {
        closeHistory.addEventListener('click', () => { historyModal.style.display = 'none'; });
    }
    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) historyModal.style.display = 'none';
        });
    }
}

// ---------------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------------

function initEventListeners(callbacks) {
    let debounceTimeout;
    function scheduleCalc() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => { callbacks.forEach(cb => cb()); }, 250);
    }
    document.body.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement) {
            // Track manual edits to legacy card inputs
            const id = event.target.id;
            if (['khCurrent', 'ghCurrent', 'nrKh', 'acidCurrentKh'].includes(id)) {
                legacyInputsDirty[id] = true;
            }
            scheduleCalc();
        }
    });
    document.body.addEventListener('change', (event) => {
        if (event.target instanceof HTMLSelectElement) scheduleCalc();
    });

    setupCopyButtons();
    setupModal();
}

// ---------------------------------------------------------------------------
// Main Init
// ---------------------------------------------------------------------------

function initUI(callbacks) {
    initDOMReferences();
    setupUnitSelection();
    setupThemeToggle();
    // FIX: Pass skipCalc=true during init to prevent premature calculation
    setupLanguageToggle(true);
    setupUnitToggles();
    setupHamburgerMenu();
    setupVolumeModeToggle();
    calculateVolumeFromDimensions();
    generateCalculatorCards();
    setupDynamicCards();
    // FIX: setupProfileTabs now applies defaults on init
    setupProfileTabs();
    setupParameterHistory();
    initEventListeners(callbacks);
}
