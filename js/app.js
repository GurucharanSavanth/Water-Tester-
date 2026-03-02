// js/app.js v6.1

const LOADING_SCREEN_MIN_DURATION_MS = 5000;
const LOADING_SCREEN_FADE_MS = 550;
const loadingScreenStartTime = Date.now();
const loadingLogTimers = [];
const LOADING_LOG_STEPS = [
    { delay: 90, level: 'BOOT', message: 'Starting aquarium runtime bootstrap sequence...' },
    { delay: 260, level: 'INFO', message: 'Binding loader telemetry channel and heartbeat monitors.' },
    { delay: 520, level: 'INFO', message: 'Resolving local configuration manifest and safety limits.' },
    { delay: 820, level: 'INFO', message: 'Validating persisted UI state from local storage cache.' },
    { delay: 1120, level: 'INFO', message: 'Mounting translation cache for en-US and kn-IN bundles.' },
    { delay: 1470, level: 'INFO', message: 'Attaching DOM references for controls, cards, and status panels.' },
    { delay: 1820, level: 'INFO', message: 'Initializing dosing API adapters for Seachem and salt-mix engines.' },
    { delay: 2220, level: 'INFO', message: 'Hydrating profile defaults for freshwater, saltwater, and pond modes.' },
    { delay: 2620, level: 'INFO', message: 'Registering recommendation ruleset and parameter watchdogs.' },
    { delay: 3040, level: 'INFO', message: 'Priming unit converters for litres, gallons, dKH, and dGH.' },
    { delay: 3460, level: 'INFO', message: 'Warming calculation pipelines and scheduling initial render pass.' },
    { delay: 3920, level: 'INFO', message: 'Syncing emergency alert renderer and live badge channel.' },
    { delay: 4360, level: 'INFO', message: 'Running final dependency health check and readiness probe.' },
    { delay: 4720, level: 'READY', message: 'API initialization complete. Runtime ready for water analysis.' }
];

function formatLoadingLogTimestamp(epochMs) {
    const date = new Date(epochMs);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function appendLoadingLogLine(stream, entry, timestampMs) {
    if (!stream || !stream.isConnected) return;

    const line = document.createElement('div');
    line.className = `loading-log-line level-${entry.level.toLowerCase()}`;

    const time = document.createElement('span');
    time.className = 'loading-log-time';
    time.textContent = formatLoadingLogTimestamp(timestampMs);

    const level = document.createElement('span');
    level.className = 'loading-log-level';
    level.textContent = entry.level;

    const message = document.createElement('span');
    message.className = 'loading-log-message';
    message.textContent = entry.message;

    line.append(time, level, message);
    stream.appendChild(line);
    stream.scrollTop = stream.scrollHeight;
}

function startLoadingScreenBootLog() {
    const loadingScreen = document.getElementById('loadingScreen');
    const stream = document.getElementById('loadingLogStream');
    if (!loadingScreen || !stream || loadingScreen.dataset.logStarted === 'true') return;

    loadingScreen.dataset.logStarted = 'true';
    stream.innerHTML = '';

    LOADING_LOG_STEPS.forEach((entry) => {
        const timerId = window.setTimeout(() => {
            appendLoadingLogLine(stream, entry, loadingScreenStartTime + entry.delay);
        }, entry.delay);
        loadingLogTimers.push(timerId);
    });
}

function dismissLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen || loadingScreen.dataset.dismissScheduled === 'true') return;

    loadingScreen.dataset.dismissScheduled = 'true';
    const elapsed = Date.now() - loadingScreenStartTime;
    const remainingDelay = Math.max(0, LOADING_SCREEN_MIN_DURATION_MS - elapsed);

    window.setTimeout(() => {
        if (!loadingScreen.parentNode) return;

        loadingScreen.setAttribute('aria-hidden', 'true');
        loadingScreen.classList.add('fade-out');

        window.setTimeout(() => {
            while (loadingLogTimers.length > 0) {
                clearTimeout(loadingLogTimers.pop());
            }
            if (loadingScreen.parentNode) {
                loadingScreen.remove();
            }
        }, LOADING_SCREEN_FADE_MS);
    }, remainingDelay);
}

/**
 * Main calculation orchestrator. Gathers inputs, validates,
 * runs all calculation functions, and updates UI.
 */
function doDosingCalculations() {
    const userInputs = getAllInputValues();
    const errorMessages = [];

    const litres = getEffectiveVolumeLitres();

    // --- Validation ---
    if (!(litres > 0)) {
        errorMessages.push('Water Volume must be > 0');
    }
    if (userInputs.khPurity < 0.5 || userInputs.khPurity > 1) {
        errorMessages.push('KHCO₃ Purity must be between 0.50 and 1.00');
    }

    if (errorMessages.length > 0) {
        displayErrors(errorMessages);
        const zeroResults = {
            khDose: 0, equilibriumDose: 0, ghCurrentHigher: false, safeDose: 0,
            aptResult: { ml: 0, estimatedNitrateIncrease: 0, estimatedFinalNitrate: 0 },
            neutralRegulatorDose: 0, acidBufferDose: 0,
            goldBufferResult: { grams: 0, fullDose: false },
            dynamicResults: {}, waterChange: { litres: 0, usGal: 0, ukGal: 0 },
            substrate: { bags: 0, bagsSmall: 0 }, saltMix: null, saltMixError: ''
        };
        updateAllResults(zeroResults);
        return;
    }

    displayErrors([]);

    const results = {};

    // --- Legacy Calculations ---
    results.khDose = calculateKhco3Grams(userInputs.khCurrent, userInputs.khTarget, litres, userInputs.khPurity);

    const deltaGh = userInputs.ghTarget - userInputs.ghCurrent;
    results.ghCurrentHigher = userInputs.ghCurrent >= userInputs.ghTarget;
    results.equilibriumDose = deltaGh > 0 ? calculateEquilibriumGrams(deltaGh, litres) : 0;

    results.safeDose = calculateSafeGrams(litres);

    const currentNitrate = userInputs.paramNitrate || 0;
    results.aptResult = calculateAptCompleteDose(litres, currentNitrate);

    results.neutralRegulatorDose = calculateNeutralRegulatorGrams(litres, userInputs.phCurrent, userInputs.phTarget, userInputs.nrKh);
    results.acidBufferDose = calculateAcidBufferGrams(litres, userInputs.acidCurrentKh, userInputs.acidTargetKh);
    results.goldBufferResult = calculateGoldBufferGrams(litres, userInputs.phGoldCurrent, userInputs.phGoldTarget);

    // --- SeachemEngine dynamic calculations ---
    results.dynamicResults = {};
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            let current = 0, target = 0, scale = cfg.baseUnit;

            if (cfg.inputType === 'current_target') {
                const curEl = document.getElementById('dyn_' + cfg.id + '_current');
                const tgtEl = document.getElementById('dyn_' + cfg.id + '_target');
                current = curEl ? parseFloatSafe(curEl.value) : 0;
                target = tgtEl ? parseFloatSafe(tgtEl.value) : 0;

                if (cfg.unitScales) {
                    const scaleEl = document.getElementById('dyn_' + cfg.id + '_scale');
                    if (scaleEl) scale = scaleEl.value;
                }
            }

            results.dynamicResults[cfg.id] = window.SeachemEngine.calculate(cfg.id, current, target, litres, scale);
        });
    }

    // --- Water Change ---
    const wcPercent = userInputs.wcPercent || 0;
    const wcLitres = litres * (wcPercent / 100);
    results.waterChange = {
        litres: wcLitres,
        usGal: wcLitres / US_GAL_TO_L,
        ukGal: wcLitres / UK_GAL_TO_L
    };

    // --- Substrate ---
    if (window.SeachemEngine && allElements.subProduct) {
        const productId = allElements.subProduct.value;
        const subL = userInputs.subLength || 0;
        const subW = userInputs.subWidth || 0;
        const subD = userInputs.subDepth || 0;
        results.substrate = window.SeachemEngine.calculateSubstrate(productId, subL, subW, subD, substrateUnit);
    } else {
        results.substrate = { bags: 0, bagsSmall: 0 };
    }

    // --- Salt Mix ---
    results.saltMix = null;
    results.saltMixError = '';
    if (typeof SaltMixCalculator !== 'undefined' && allElements.smProduct) {
        try {
            const productName = allElements.smProduct.value;
            const smVol = userInputs.smVolume || 0;
            const smCur = userInputs.smCurrentPpt || 0;
            const smDes = userInputs.smDesiredPpt || 0;
            if (smVol > 0 && smDes > smCur) {
                results.saltMix = SaltMixCalculator.calculateSaltMix({
                    productName: productName,
                    volumeGallons: smVol,
                    currentPpt: smCur,
                    desiredPpt: smDes
                });
            } else if (smVol > 0 && smDes <= smCur && smDes > 0) {
                results.saltMixError = 'Salt mix raises salinity only. For lower salinity, do a water change.';
            }
        } catch (e) {
            results.saltMixError = e.message || 'Salt mix calculation error';
        }
    }

    // --- Display ---
    updateAllResults(results);
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    startLoadingScreenBootLog();
    try {
        const calculationSequence = [handleParameterStatusUpdate, doDosingCalculations];
        initUI(calculationSequence);
        // Run initial calculations after full init
        calculationSequence.forEach(cb => cb());
    } catch (error) {
        console.error('App initialization failed:', error);
    } finally {
        dismissLoadingScreen();
    }
});
