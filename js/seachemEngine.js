// js/seachemEngine.js v6.0
// Pure-math module — no DOM access. All 23 Seachem product formulas ported from SeachemCalculations.kt.
// Unit-scale conversion, substrate calculator, product config array for data-driven card generation.

(function () {
    "use strict";

    // --- Unit Conversion Constants (mirrors SeachemCalculations.kt) ---
    const MEQ_L_TO_DKH = 2.8;
    const MEQ_L_TO_PPM = 50.0;
    const LIT_TO_US_GAL = 0.264172;

    // --- Unit Scale Conversion ---
    // Normalise any input scale to meq/L, then to the target base unit.
    function convertInput(value, fromScale, toScale) {
        if (fromScale === toScale) return value;
        // pH values pass through untouched
        if (fromScale === 'pH' || toScale === 'pH') return value;

        // Step 1: to meq/L
        let meqL;
        switch (fromScale) {
            case 'meq/L': meqL = value; break;
            case 'dKH':   meqL = value / MEQ_L_TO_DKH; break;
            case 'PPM':   meqL = value / MEQ_L_TO_PPM; break;
            default:      meqL = value;
        }

        // Step 2: from meq/L to target
        switch (toScale) {
            case 'meq/L': return meqL;
            case 'dKH':   return meqL * MEQ_L_TO_DKH;
            case 'PPM':   return meqL * MEQ_L_TO_PPM;
            default:      return meqL;
        }
    }

    // --- Helpers ---
    function litToUsGal(litres) { return litres * LIT_TO_US_GAL; }
    function clamp0(v) { return v < 0 || !isFinite(v) ? 0 : v; }
    function round3(v) { return Math.round(v * 1000) / 1000; }

    // --- Calculation Dispatch ---
    // Every calculate* function receives (current, target, litres, inputScale)
    // where current/target are already in the user-selected inputScale.
    // Volume is always litres. Products that need US gal convert internally.

    function calcAlkalineBuffer(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const grams = diff * 3.5 * volGal / 10;
        const tsp = grams / 7;
        return { primary: clamp0(grams), primaryUnit: 'g', secondary: clamp0(tsp), secondaryUnit: 'tsp' };
    }

    function calcEquilibriumEngine(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const grams = (volGal / 20) * (16 * diff);
        const tbsp = grams / 16;
        return { primary: clamp0(grams), primaryUnit: 'g', secondary: clamp0(tbsp), secondaryUnit: 'tbsp' };
    }

    function calcPotassiumBicarbonate(current, target, litres, scale) {
        const curDkh = convertInput(current, scale, 'dKH');
        const desDkh = convertInput(target, scale, 'dKH');
        const diff = desDkh - curDkh;
        const purity = 1.0; // SeachemCalculations.kt uses 1.0 for the engine version
        const grams = diff * 0.0357 * litres / purity;
        const tsp = grams / 5;
        return { primary: clamp0(grams), primaryUnit: 'g', secondary: clamp0(tsp), secondaryUnit: 'tsp' };
    }

    function calcReefBuffer(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const tsp = (diff / 0.5) * (volGal / 40);
        const grams = tsp * 5;
        return { primary: clamp0(tsp), primaryUnit: 'tsp', secondary: clamp0(grams), secondaryUnit: 'g' };
    }

    function calcReefBuilder(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const grams = 0.32 * volGal * diff;
        const tsp = grams / 6;
        return { primary: clamp0(grams), primaryUnit: 'g', secondary: clamp0(tsp), secondaryUnit: 'tsp' };
    }

    function calcReefCarbonate(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const ml = diff * volGal;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefFusion2(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curMeq = convertInput(current, scale, 'meq/L');
        const desMeq = convertInput(target, scale, 'meq/L');
        const diff = desMeq - curMeq;
        const ml = (volGal / 6.5) * (diff / 0.176);
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefAdvantageCalcium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const tsp = 0.0019 * volGal * diff;
        const grams = tsp * 5;
        return { primary: clamp0(tsp), primaryUnit: 'tsp', secondary: clamp0(grams), secondaryUnit: 'g' };
    }

    function calcReefAdvantageMagnesium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const tsp = 0.0095 * volGal * diff;
        const grams = tsp * 5;
        return { primary: clamp0(tsp), primaryUnit: 'tsp', secondary: clamp0(grams), secondaryUnit: 'g' };
    }

    function calcReefAdvantageStrontium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const grams = volGal * diff / 7.5;
        const tsp = grams / 6;
        return { primary: clamp0(grams), primaryUnit: 'g', secondary: clamp0(tsp), secondaryUnit: 'tsp' };
    }

    function calcReefCalcium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = (diff / 3) * (volGal / 20) * 5;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefComplete(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = 0.025 * volGal * diff;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefFusion1(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = (volGal / 6.5) * (diff / 4);
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefIodide(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = 0.5 * volGal * diff;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcReefStrontium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = 0.4 * volGal * diff;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourish(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const ml = (volGal / 60) * 5;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourishTrace(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const ml = (volGal / 20) * 5;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourishIron(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = (volGal / 50) * (diff * 20);
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourishNitrogen(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = diff * volGal * 0.25;
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourishPhosphorus(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = (volGal / 20) * (diff * 16.6);
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    function calcFlourishPotassium(current, target, litres, scale) {
        const volGal = litToUsGal(litres);
        const curPpm = convertInput(current, scale, 'PPM');
        const desPpm = convertInput(target, scale, 'PPM');
        const diff = desPpm - curPpm;
        const ml = (volGal / 30) * (diff * 2.5);
        const caps = ml / 5;
        return { primary: clamp0(ml), primaryUnit: 'mL', secondary: clamp0(caps), secondaryUnit: 'caps' };
    }

    // --- Calculation Router ---
    const CALC_FN_MAP = {
        alkaline_buffer:          calcAlkalineBuffer,
        equilibrium_engine:       calcEquilibriumEngine,
        potassium_bicarbonate:    calcPotassiumBicarbonate,
        reef_buffer:              calcReefBuffer,
        reef_builder:             calcReefBuilder,
        reef_carbonate:           calcReefCarbonate,
        reef_fusion2:             calcReefFusion2,
        reef_adv_calcium:         calcReefAdvantageCalcium,
        reef_adv_magnesium:       calcReefAdvantageMagnesium,
        reef_adv_strontium:       calcReefAdvantageStrontium,
        reef_calcium:             calcReefCalcium,
        reef_complete:            calcReefComplete,
        reef_fusion1:             calcReefFusion1,
        reef_iodide:              calcReefIodide,
        reef_strontium:           calcReefStrontium,
        flourish:                 calcFlourish,
        flourish_trace:           calcFlourishTrace,
        flourish_iron:            calcFlourishIron,
        flourish_nitrogen:        calcFlourishNitrogen,
        flourish_phosphorus:      calcFlourishPhosphorus,
        flourish_potassium:       calcFlourishPotassium
    };

    function calculate(productId, current, target, litres, scale) {
        const fn = CALC_FN_MAP[productId];
        if (!fn) return { primary: 0, primaryUnit: '?', secondary: 0, secondaryUnit: '?' };
        if (litres <= 0) return { primary: 0, primaryUnit: 'g', secondary: 0, secondaryUnit: 'g' };
        return fn(current, target, litres, scale || 'meq/L');
    }

    // --- Substrate Calculator ---
    // Matches SeachemCalculations.kt calculateGravel()
    // divisor = standard bag volume in cubic inches, smallDivisor = small bag (0 = N/A)
    const SUBSTRATE_PRODUCTS = [
        { id: 'flourite',          name: 'Flourite',              divisor: 8250, smallDivisor: 9000 },
        { id: 'flourite_black',    name: 'Flourite Black',        divisor: 7250, smallDivisor: 0 },
        { id: 'flourite_black_sand', name: 'Flourite Black Sand', divisor: 8000, smallDivisor: 0 },
        { id: 'flourite_dark',     name: 'Flourite Dark',         divisor: 8250, smallDivisor: 0 },
        { id: 'flourite_red',      name: 'Flourite Red',          divisor: 8250, smallDivisor: 0 },
        { id: 'flourite_sand',     name: 'Flourite Sand',         divisor: 8750, smallDivisor: 0 },
        { id: 'gray_coast',        name: 'Gray Coast',            divisor: 8500, smallDivisor: 0 },
        { id: 'meridian',          name: 'Meridian',              divisor: 10500, smallDivisor: 0 },
        { id: 'onyx',              name: 'Onyx',                  divisor: 8000, smallDivisor: 0 },
        { id: 'onyx_sand',         name: 'Onyx Sand',             divisor: 8250, smallDivisor: 0 },
        { id: 'pearl_beach',       name: 'Pearl Beach',           divisor: 9750, smallDivisor: 0 }
    ];

    function calculateSubstrate(productId, length, width, depth, unit) {
        const product = SUBSTRATE_PRODUCTS.find(p => p.id === productId);
        if (!product) return { bags: 0, bagsSmall: 0 };
        if (length <= 0 || width <= 0 || depth <= 0) return { bags: 0, bagsSmall: 0 };

        let l = length, w = width, d = depth;
        // Convert cm to inches if needed
        if (unit === 'cm') { l = l / 2.54; w = w / 2.54; d = d / 2.54; }

        const volume = l * w * d; // cubic inches
        if (volume <= 0 || !isFinite(volume)) return { bags: 0, bagsSmall: 0 };

        const bags = Math.ceil(volume / product.divisor);
        const bagsSmall = product.smallDivisor > 0 ? Math.ceil(volume / product.smallDivisor) : 0;
        return { bags, bagsSmall };
    }

    // --- Product Configs (data-driven card generation) ---
    // inputType: 'current_target' | 'volume_only'
    // profile: 'freshwater' | 'saltwater' | 'universal'
    // baseUnit: native formula unit; unitScales: available scale options (null = no dropdown)
    const PRODUCT_CONFIGS = [
        // --- Universal (shown in all profiles) ---
        {
            id: 'flourish', title: 'Flourish',
            inputType: 'volume_only', profile: 'universal',
            baseUnit: 'PPM', unitScales: null, icon: '🌱'
        },
        {
            id: 'flourish_trace', title: 'Flourish Trace',
            inputType: 'volume_only', profile: 'universal',
            baseUnit: 'PPM', unitScales: null, icon: '🧬'
        },

        // --- Freshwater ---
        {
            id: 'flourish_iron', title: 'Flourish Iron',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'PPM', unitScales: null, icon: '🔴'
        },
        {
            id: 'flourish_nitrogen', title: 'Flourish Nitrogen',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'PPM', unitScales: null, icon: '🟢'
        },
        {
            id: 'flourish_phosphorus', title: 'Flourish Phosphorus',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'PPM', unitScales: null, icon: '🟡'
        },
        {
            id: 'flourish_potassium', title: 'Flourish Potassium',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'PPM', unitScales: null, icon: '🟣'
        },
        {
            id: 'alkaline_buffer', title: 'Alkaline Buffer',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '⬆️'
        },
        {
            id: 'equilibrium_engine', title: 'Equilibrium (Engine)',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '⚖️'
        },
        {
            id: 'potassium_bicarbonate', title: 'Potassium Bicarbonate',
            inputType: 'current_target', profile: 'freshwater',
            baseUnit: 'dKH', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '🧪'
        },

        // --- Saltwater ---
        {
            id: 'reef_adv_calcium', title: 'Reef Advantage Calcium',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '🐚'
        },
        {
            id: 'reef_adv_magnesium', title: 'Reef Advantage Magnesium',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '💎'
        },
        {
            id: 'reef_adv_strontium', title: 'Reef Advantage Strontium',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '✨'
        },
        {
            id: 'reef_buffer', title: 'Reef Buffer',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '🛡️'
        },
        {
            id: 'reef_builder', title: 'Reef Builder',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '🏗️'
        },
        {
            id: 'reef_calcium', title: 'Reef Calcium',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '🪸'
        },
        {
            id: 'reef_carbonate', title: 'Reef Carbonate',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '⛰️'
        },
        {
            id: 'reef_complete', title: 'Reef Complete',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '🌊'
        },
        {
            id: 'reef_fusion1', title: 'Reef Fusion 1',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '1️⃣'
        },
        {
            id: 'reef_fusion2', title: 'Reef Fusion 2',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'meq/L', unitScales: ['meq/L', 'dKH', 'PPM'], icon: '2️⃣'
        },
        {
            id: 'reef_iodide', title: 'Reef Iodide',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '🧫'
        },
        {
            id: 'reef_strontium', title: 'Reef Strontium',
            inputType: 'current_target', profile: 'saltwater',
            baseUnit: 'PPM', unitScales: null, icon: '⭐'
        }
    ];

    // --- Salt Mix Products (mirrors SaltMixCalculations.kt exactly) ---
    const SALT_MIX_PRODUCTS = [
        'Aquaforest Hybrid Pro Salt Mix',
        'Aquaforest Reef Salt Mix',
        'Aquaforest Reef Salt Plus Mix',
        'Aquaforest Sea Salt Mix',
        'Brightwell NeoMarine',
        'HW-Marinemix Professional',
        'HW-Marinemix Reefer',
        'Instant Ocean Sea Salt Mix',
        'Instant Ocean Reef Crystals',
        'Nyos Pure Salt Mix',
        'Red Sea Coral Pro',
        'Red Sea Blue Bucket',
        'Reef Crystals',
        'Tropic Marin Bio-Actif',
        'Tropic Marin Classic',
        'Tropic Marin Pro Reef',
        'Tropic Marin SynBiotic'
    ];

    // --- Profile Defaults (from MainViewModel.kt applyProfileDefaults) ---
    const PROFILE_DEFAULTS = {
        freshwater: {
            paramAmmonia: 0, paramNitrite: 0, paramNitrate: 15,
            paramGh: 4, paramKh: 6, paramPh: 7.2, paramTemp: 26,
            paramPotassium: 15, paramIron: 0.1
        },
        saltwater: {
            paramAmmonia: 0, paramNitrite: 0, paramNitrate: 10,
            paramPh: 8.2, paramTemp: 26,
            paramSalinity: 35, paramAlkalinity: 8, paramCalcium: 420,
            paramMagnesium: 1300, paramPhosphate: 0.05,
            paramStrontium: 8, paramIodide: 0.06
        },
        pond: {
            paramAmmonia: 0, paramNitrite: 0, paramNitrate: 20,
            paramKh: 5, paramPh: 7.4, paramTemp: 22,
            paramDo: 7.5
        }
    };

    // --- Public API ---
    window.SeachemEngine = {
        PRODUCT_CONFIGS: PRODUCT_CONFIGS,
        SUBSTRATE_PRODUCTS: SUBSTRATE_PRODUCTS,
        SALT_MIX_PRODUCTS: SALT_MIX_PRODUCTS,
        PROFILE_DEFAULTS: PROFILE_DEFAULTS,
        calculate: calculate,
        calculateSubstrate: calculateSubstrate,
        convertInput: convertInput
    };
})();
