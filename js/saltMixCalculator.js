// js/saltMixCalculator.js v6.1
// Salt Mix Calculator — ported from SaltMixCalculations.kt
// UMD module exposing window.SaltMixCalculator

(function () {
    "use strict";

    // Salt mix rate: grams per US gallon per PPT increase
    // Industry standard: ~0.5 cups (136g) per gallon for 35 PPT from 0
    // → ~3.886 g/gal/PPT. Individual brand rates override where available.
    const DEFAULT_RATE = 3.886; // g per US gallon per PPT

    // Brand-specific mix rates (g per US gallon per PPT)
    // Sources: manufacturer packaging instructions
    const BRAND_RATES = {
        'Aquaforest Hybrid Pro Salt Mix':   3.90,
        'Aquaforest Reef Salt Mix':         3.85,
        'Aquaforest Reef Salt Plus Mix':    3.88,
        'Aquaforest Sea Salt Mix':          3.80,
        'Brightwell NeoMarine':             3.95,
        'HW-Marinemix Professional':        3.90,
        'HW-Marinemix Reefer':              3.92,
        'Instant Ocean Sea Salt Mix':       3.80,
        'Instant Ocean Reef Crystals':      3.85,
        'Nyos Pure Salt Mix':               3.90,
        'Red Sea Coral Pro':                4.00,
        'Red Sea Blue Bucket':              3.95,
        'Reef Crystals':                    3.85,
        'Tropic Marin Bio-Actif':           3.95,
        'Tropic Marin Classic':             3.88,
        'Tropic Marin Pro Reef':            3.98,
        'Tropic Marin SynBiotic':           3.92
    };

    function calculateSaltMix(options) {
        var productName = options.productName;
        var volumeGallons = options.volumeGallons;
        var currentPpt = options.currentPpt;
        var desiredPpt = options.desiredPpt;

        if (volumeGallons <= 0) {
            throw new Error('Volume must be > 0');
        }
        if (desiredPpt <= currentPpt) {
            throw new Error('Desired PPT must be greater than current PPT');
        }
        if (desiredPpt > 45) {
            throw new Error('Desired PPT exceeds safe maximum (45)');
        }

        var rate = BRAND_RATES[productName] || DEFAULT_RATE;
        var deltaPpt = desiredPpt - currentPpt;
        var grams = rate * volumeGallons * deltaPpt;
        var kilograms = grams / 1000;

        return {
            grams: grams,
            kilograms: kilograms,
            rate: rate,
            product: productName,
            formatted: {
                grams: grams.toFixed(1),
                kilograms: kilograms.toFixed(3)
            }
        };
    }

    function getAvailableProducts() {
        return Object.keys(BRAND_RATES);
    }

    window.SaltMixCalculator = {
        calculateSaltMix: calculateSaltMix,
        getAvailableProducts: getAvailableProducts,
        BRAND_RATES: BRAND_RATES
    };
})();
