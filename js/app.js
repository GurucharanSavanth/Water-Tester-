// js/app.js v6.0

/**
 * Main calculation logic for dosing. Orchestrates input gathering,
 * validation, calculation, and result display.
 */
function doDosingCalculations() {
    const userInputs = getAllInputValues();
    const errorMessages = [];
    const t = (key) => translations[currentLang][key] || key;

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

    // --- Legacy Calculations (dosingCalculations.js — untouched) ---
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

    // --- v6.0: SeachemEngine dynamic product calculations ---
    results.dynamicResults = {};
    if (window.SeachemEngine) {
        window.SeachemEngine.PRODUCT_CONFIGS.forEach(cfg => {
            let current = 0, target = 0, scale = cfg.baseUnit;

            if (cfg.inputType === 'current_target') {
                const curEl = document.getElementById('dyn_' + cfg.id + '_current');
                const tgtEl = document.getElementById('dyn_' + cfg.id + '_target');
                current = curEl ? parseFloatSafe(curEl.value) : 0;
                target = tgtEl ? parseFloatSafe(tgtEl.value) : 0;

                // Read scale from dropdown if available
                if (cfg.unitScales) {
                    const scaleEl = document.getElementById('dyn_' + cfg.id + '_scale');
                    if (scaleEl) scale = scaleEl.value;
                }
            }
            // volume_only products don't need current/target

            results.dynamicResults[cfg.id] = window.SeachemEngine.calculate(cfg.id, current, target, litres, scale);
        });
    }

    // --- v6.0: Water Change Calculator ---
    const wcPercent = userInputs.wcPercent || 0;
    const wcLitres = litres * (wcPercent / 100);
    results.waterChange = {
        litres: wcLitres,
        usGal: wcLitres / US_GAL_TO_L,
        ukGal: wcLitres / UK_GAL_TO_L
    };

    // --- v6.0: Substrate Calculator ---
    if (window.SeachemEngine && allElements.subProduct) {
        const productId = allElements.subProduct.value;
        const subL = userInputs.subLength || 0;
        const subW = userInputs.subWidth || 0;
        const subD = userInputs.subDepth || 0;
        results.substrate = window.SeachemEngine.calculateSubstrate(productId, subL, subW, subD, substrateUnit);
    } else {
        results.substrate = { bags: 0, bagsSmall: 0 };
    }

    // --- v6.0: Salt Mix Calculator (UMD module) ---
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
            }
        } catch (e) {
            results.saltMixError = e.message || 'Salt mix calculation error';
        }
    }

    // --- Display Results ---
    updateAllResults(results);
}


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const calculationSequence = [handleParameterStatusUpdate, doDosingCalculations];
    initUI(calculationSequence);
    calculationSequence.forEach(cb => cb());
});
