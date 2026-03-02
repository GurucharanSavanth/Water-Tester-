// js/recommendationEngine.js v6.1
// Robust, methodical recommendation engine for all profiles.
// Pure functions — no DOM access. Returns structured recommendation objects.

(function () {
    "use strict";

    // --- Severity Levels ---
    var SEVERITY = {
        CRITICAL: 'critical',   // Immediate fish death risk
        WARNING:  'warning',    // Stress / long-term harm
        CAUTION:  'caution',    // Suboptimal but not dangerous
        INFO:     'info'        // Informational / optimization
    };

    // --- Freshwater Parameter Ranges ---
    var FW_RANGES = {
        ammonia:    { safe: [0, 0],      caution: [0.01, 0.25], warning: [0.26, 1.0],  critical: [1.01, Infinity], unit: 'ppm' },
        nitrite:    { safe: [0, 0],      caution: [0.01, 0.25], warning: [0.26, 1.0],  critical: [1.01, Infinity], unit: 'ppm' },
        nitrate:    { safe: [0, 20],     caution: [20.01, 40],  warning: [40.01, 80],   critical: [80.01, Infinity], unit: 'ppm' },
        ph:         { safe: [6.5, 7.5],  caution_low: [6.0, 6.49], caution_high: [7.51, 8.0], warning_low: [0, 5.99], warning_high: [8.01, 14], unit: 'pH' },
        gh:         { safe: [4, 12],     caution_low: [2, 3.99], caution_high: [12.01, 20], warning_low: [0, 1.99], warning_high: [20.01, Infinity], unit: 'dGH' },
        kh:         { safe: [3, 10],     caution_low: [1, 2.99], caution_high: [10.01, 15], warning_low: [0, 0.99], warning_high: [15.01, Infinity], unit: 'dKH' },
        temp:       { safe: [24, 28],    caution_low: [20, 23.99], caution_high: [28.01, 30], warning_low: [0, 19.99], warning_high: [30.01, Infinity], unit: '°C' },
        potassium:  { safe: [5, 30],     caution_low: [2, 4.99], warning_low: [0, 1.99], unit: 'ppm' },
        iron:       { safe: [0.05, 0.5], caution_low: [0.01, 0.049], warning_low: [0, 0.009], caution_high: [0.51, 1.0], warning_high: [1.01, Infinity], unit: 'ppm' }
    };

    // --- Saltwater Parameter Ranges ---
    var SW_RANGES = {
        ammonia:     { safe: [0, 0],        caution: [0.01, 0.1],  warning: [0.11, 0.5],    critical: [0.51, Infinity], unit: 'ppm' },
        nitrite:     { safe: [0, 0],        caution: [0.01, 0.1],  warning: [0.11, 0.5],    critical: [0.51, Infinity], unit: 'ppm' },
        nitrate:     { safe: [0, 10],       caution: [10.01, 20],  warning: [20.01, 50],    critical: [50.01, Infinity], unit: 'ppm' },
        ph:          { safe: [8.1, 8.4],    caution_low: [7.8, 8.09], caution_high: [8.41, 8.6], warning_low: [0, 7.79], warning_high: [8.61, 14], unit: 'pH' },
        temp:        { safe: [24, 27],      caution_low: [22, 23.99], caution_high: [27.01, 29], warning_low: [0, 21.99], warning_high: [29.01, Infinity], unit: '°C' },
        salinity:    { safe: [34, 36],      caution_low: [32, 33.99], caution_high: [36.01, 38], warning_low: [0, 31.99], warning_high: [38.01, Infinity], unit: 'PPT' },
        alkalinity:  { safe: [7, 12],       caution_low: [5, 6.99], caution_high: [12.01, 14], warning_low: [0, 4.99], warning_high: [14.01, Infinity], unit: 'meq/L' },
        calcium:     { safe: [380, 450],    caution_low: [350, 379], caution_high: [451, 500], warning_low: [0, 349], warning_high: [501, Infinity], unit: 'ppm' },
        magnesium:   { safe: [1250, 1400],  caution_low: [1100, 1249], caution_high: [1401, 1500], warning_low: [0, 1099], warning_high: [1501, Infinity], unit: 'ppm' },
        phosphate:   { safe: [0, 0.03],     caution: [0.031, 0.1], warning: [0.101, 0.5],   critical: [0.51, Infinity], unit: 'ppm' },
        strontium:   { safe: [6, 10],       caution_low: [4, 5.99], caution_high: [10.01, 15], unit: 'ppm' },
        iodide:      { safe: [0.04, 0.08],  caution_low: [0.01, 0.039], caution_high: [0.081, 0.15], unit: 'ppm' }
    };

    // --- Pond Parameter Ranges ---
    var POND_RANGES = {
        ammonia:    { safe: [0, 0],      caution: [0.01, 0.25], warning: [0.26, 1.0],  critical: [1.01, Infinity], unit: 'ppm' },
        nitrite:    { safe: [0, 0],      caution: [0.01, 0.25], warning: [0.26, 1.0],  critical: [1.01, Infinity], unit: 'ppm' },
        nitrate:    { safe: [0, 30],     caution: [30.01, 50],  warning: [50.01, 100],  critical: [100.01, Infinity], unit: 'ppm' },
        ph:         { safe: [7.0, 8.0],  caution_low: [6.5, 6.99], caution_high: [8.01, 8.5], warning_low: [0, 6.49], warning_high: [8.51, 14], unit: 'pH' },
        gh:         { safe: [4, 12],     caution_low: [2, 3.99], caution_high: [12.01, 20], warning_low: [0, 1.99], unit: 'dGH' },
        kh:         { safe: [4, 12],     caution_low: [2, 3.99], warning_low: [0, 1.99], unit: 'dKH' },
        temp:       { safe: [15, 25],    caution_low: [10, 14.99], caution_high: [25.01, 30], warning_low: [0, 9.99], warning_high: [30.01, Infinity], unit: '°C' },
        dissolvedO2:{ safe: [6, 20],     caution_low: [4, 5.99], warning_low: [2, 3.99], critical_low: [0, 1.99], unit: 'ppm' }
    };

    // --- Helper: check which range bracket a value falls into ---
    function classifyValue(value, rangeSpec) {
        if (value === null || value === undefined || !isFinite(value)) return null;

        function inRange(v, bounds) {
            return v >= bounds[0] && v <= bounds[1];
        }

        // Check critical first (highest priority)
        if (rangeSpec.critical && inRange(value, rangeSpec.critical)) return SEVERITY.CRITICAL;
        if (rangeSpec.critical_low && inRange(value, rangeSpec.critical_low)) return SEVERITY.CRITICAL;
        if (rangeSpec.critical_high && inRange(value, rangeSpec.critical_high)) return SEVERITY.CRITICAL;

        // Warning
        if (rangeSpec.warning && inRange(value, rangeSpec.warning)) return SEVERITY.WARNING;
        if (rangeSpec.warning_low && inRange(value, rangeSpec.warning_low)) return SEVERITY.WARNING;
        if (rangeSpec.warning_high && inRange(value, rangeSpec.warning_high)) return SEVERITY.WARNING;

        // Caution
        if (rangeSpec.caution && inRange(value, rangeSpec.caution)) return SEVERITY.CAUTION;
        if (rangeSpec.caution_low && inRange(value, rangeSpec.caution_low)) return SEVERITY.CAUTION;
        if (rangeSpec.caution_high && inRange(value, rangeSpec.caution_high)) return SEVERITY.CAUTION;

        // Safe
        if (rangeSpec.safe && inRange(value, rangeSpec.safe)) return null; // null = safe

        return SEVERITY.INFO;
    }

    // --- Determine direction (low/high/present) ---
    function getDirection(value, rangeSpec) {
        if (!rangeSpec.safe) return 'present';
        if (value < rangeSpec.safe[0]) return 'low';
        if (value > rangeSpec.safe[1]) return 'high';
        return 'ok';
    }

    // --- CO2 Estimation from pH and KH (pH/KH/CO2 relationship table) ---
    // CO2 (mg/L) = 3.0 * dKH * 10^(7.0 - pH)
    function estimateCO2(ph, dKH) {
        if (!ph || !dKH || ph <= 0 || dKH <= 0) return null;
        return 3.0 * dKH * Math.pow(10, 7.0 - ph);
    }

    // --- Cross-parameter analysis ---
    function analyzeCrossParams(params, profile) {
        var insights = [];

        // Freshwater: pH/KH stability analysis
        if (profile === 'freshwater' || profile === 'pond') {
            var kh = params.kh || 0;
            var ph = params.ph || 7;

            // Low KH + any pH = pH crash risk
            if (kh > 0 && kh < 2) {
                insights.push({
                    severity: SEVERITY.WARNING,
                    type: 'cross_param',
                    param: 'kh_ph_stability',
                    title_key: 'reco_ph_crash_risk_title',
                    message_key: 'reco_ph_crash_risk',
                    icon: '⚠️'
                });
            }

            // CO2 estimation for freshwater planted tanks
            if (profile === 'freshwater' && kh > 0 && ph > 0) {
                var co2 = estimateCO2(ph, kh);
                if (co2 !== null) {
                    if (co2 < 10) {
                        insights.push({
                            severity: SEVERITY.INFO,
                            type: 'cross_param',
                            param: 'co2_low',
                            title_key: 'reco_co2_low_title',
                            message_key: 'reco_co2_low',
                            data: { co2: co2.toFixed(1) },
                            icon: '🌿'
                        });
                    } else if (co2 > 35) {
                        insights.push({
                            severity: SEVERITY.WARNING,
                            type: 'cross_param',
                            param: 'co2_high',
                            title_key: 'reco_co2_high_title',
                            message_key: 'reco_co2_high',
                            data: { co2: co2.toFixed(1) },
                            icon: '💨'
                        });
                    } else {
                        insights.push({
                            severity: SEVERITY.INFO,
                            type: 'cross_param',
                            param: 'co2_ok',
                            title_key: 'reco_co2_ok_title',
                            message_key: 'reco_co2_ok',
                            data: { co2: co2.toFixed(1) },
                            icon: '✅'
                        });
                    }
                }
            }
        }

        // Freshwater: High ammonia + high temp = extra toxic
        if (profile === 'freshwater' || profile === 'pond') {
            var ammonia = params.ammonia || 0;
            var temp = params.temp || 26;
            var ph2 = params.ph || 7;
            if (ammonia > 0 && (temp > 28 || ph2 > 7.5)) {
                insights.push({
                    severity: SEVERITY.CRITICAL,
                    type: 'cross_param',
                    param: 'ammonia_toxicity',
                    title_key: 'reco_ammonia_toxicity_title',
                    message_key: 'reco_ammonia_toxicity',
                    icon: '☠️'
                });
            }
        }

        // Saltwater: Calcium/Alkalinity balance (should track inversely)
        if (profile === 'saltwater') {
            var calcium = params.calcium || 0;
            var alkalinity = params.alkalinity || 0;
            if (calcium > 480 && alkalinity > 12) {
                insights.push({
                    severity: SEVERITY.CAUTION,
                    type: 'cross_param',
                    param: 'ca_alk_precipitation',
                    title_key: 'reco_ca_alk_precip_title',
                    message_key: 'reco_ca_alk_precip',
                    icon: '🧊'
                });
            }

            // Calcium/Magnesium ratio (ideal Mg ≈ 3x Ca)
            var magnesium = params.magnesium || 0;
            if (calcium > 0 && magnesium > 0) {
                var ratio = magnesium / calcium;
                if (ratio < 2.5) {
                    insights.push({
                        severity: SEVERITY.CAUTION,
                        type: 'cross_param',
                        param: 'mg_ca_ratio_low',
                        title_key: 'reco_mg_ca_ratio_title',
                        message_key: 'reco_mg_ca_ratio_low',
                        data: { ratio: ratio.toFixed(2) },
                        icon: '⚖️'
                    });
                } else if (ratio > 3.5) {
                    insights.push({
                        severity: SEVERITY.CAUTION,
                        type: 'cross_param',
                        param: 'mg_ca_ratio_high',
                        title_key: 'reco_mg_ca_ratio_title',
                        message_key: 'reco_mg_ca_ratio_high',
                        data: { ratio: ratio.toFixed(2) },
                        icon: '⚖️'
                    });
                }
            }
        }

        // Pond: Low DO + high temp
        if (profile === 'pond') {
            var dO = params.dissolvedO2 || 0;
            var pTemp = params.temp || 22;
            if (dO > 0 && dO < 5 && pTemp > 25) {
                insights.push({
                    severity: SEVERITY.CRITICAL,
                    type: 'cross_param',
                    param: 'do_temp_crisis',
                    title_key: 'reco_do_temp_crisis_title',
                    message_key: 'reco_do_temp_crisis',
                    icon: '🫁'
                });
            }

            // Algae bloom risk: high nitrate + high temp + high pH (indicates photosynthesis-driven pH rise)
            var pNat = params.nitrate || 0;
            var pPh = params.ph || 7;
            if (pNat > 30 && pTemp > 22 && pPh > 8.0) {
                insights.push({
                    severity: SEVERITY.WARNING,
                    type: 'cross_param',
                    param: 'algae_bloom_risk',
                    title_key: 'reco_algae_bloom_title',
                    message_key: 'reco_algae_bloom',
                    icon: '🟢'
                });
            }

            // pH swing risk: low KH in pond = big diurnal pH swings
            var pKh = params.kh || 0;
            if (pKh > 0 && pKh < 4 && pPh > 7.5) {
                insights.push({
                    severity: SEVERITY.WARNING,
                    type: 'cross_param',
                    param: 'pond_ph_swing',
                    title_key: 'reco_pond_ph_swing_title',
                    message_key: 'reco_pond_ph_swing',
                    icon: '📈'
                });
            }
        }

        // Nitrogen cycle detection (all profiles)
        var amm = params.ammonia || 0;
        var nit = params.nitrite || 0;
        var nat = params.nitrate || 0;
        if (amm > 0.5 && nit > 0.5) {
            insights.push({
                severity: SEVERITY.CRITICAL,
                type: 'cross_param',
                param: 'cycle_crash',
                title_key: 'reco_cycle_crash_title',
                message_key: 'reco_cycle_crash',
                icon: '🔄'
            });
        } else if (amm > 0 && nit === 0 && nat < 5) {
            insights.push({
                severity: SEVERITY.WARNING,
                type: 'cross_param',
                param: 'cycle_not_started',
                title_key: 'reco_cycle_not_started_title',
                message_key: 'reco_cycle_not_started',
                icon: '🔄'
            });
        } else if (amm === 0 && nit > 0 && nat < 5) {
            insights.push({
                severity: SEVERITY.INFO,
                type: 'cross_param',
                param: 'cycle_mid',
                title_key: 'reco_cycle_mid_title',
                message_key: 'reco_cycle_mid',
                icon: '🔄'
            });
        }

        return insights;
    }

    // --- Main analysis function ---
    function analyze(params, profile, volumeLitres) {
        var ranges;
        switch (profile) {
            case 'saltwater': ranges = SW_RANGES; break;
            case 'pond':      ranges = POND_RANGES; break;
            default:          ranges = FW_RANGES; break;
        }

        var recommendations = [];

        // Map of param keys to their range config keys
        var paramMapping;
        if (profile === 'freshwater') {
            paramMapping = {
                ammonia: 'ammonia', nitrite: 'nitrite', nitrate: 'nitrate',
                ph: 'ph', gh: 'gh', kh: 'kh', temp: 'temp',
                potassium: 'potassium', iron: 'iron'
            };
        } else if (profile === 'saltwater') {
            paramMapping = {
                ammonia: 'ammonia', nitrite: 'nitrite', nitrate: 'nitrate',
                ph: 'ph', temp: 'temp', salinity: 'salinity',
                alkalinity: 'alkalinity', calcium: 'calcium', magnesium: 'magnesium',
                phosphate: 'phosphate', strontium: 'strontium', iodide: 'iodide'
            };
        } else {
            // Pond
            paramMapping = {
                ammonia: 'ammonia', nitrite: 'nitrite', nitrate: 'nitrate',
                ph: 'ph', gh: 'gh', kh: 'kh', temp: 'temp', dissolvedO2: 'dissolvedO2'
            };
        }

        // Evaluate each parameter
        for (var paramKey in paramMapping) {
            var rangeKey = paramMapping[paramKey];
            var rangeSpec = ranges[rangeKey];
            if (!rangeSpec) continue;

            var value = params[paramKey];
            if (value === null || value === undefined) continue;

            var severity = classifyValue(value, rangeSpec);
            if (severity === null) continue; // safe

            var direction = getDirection(value, rangeSpec);

            recommendations.push({
                severity: severity,
                type: 'param',
                param: paramKey,
                direction: direction,
                value: value,
                unit: rangeSpec.unit,
                safeRange: rangeSpec.safe,
                icon: getParamIcon(paramKey, direction)
            });
        }

        // Cross-parameter analysis
        var crossInsights = analyzeCrossParams(params, profile);
        recommendations = recommendations.concat(crossInsights);

        // Add emergency dosing info for ammonia/nitrite
        if (volumeLitres > 0) {
            recommendations.forEach(function (rec) {
                if (rec.param === 'ammonia' && rec.value > 0) {
                    rec.emergencyDose = {
                        product: 'Seachem Prime',
                        dose: volumeLitres * 0.025,
                        unit: 'mL'
                    };
                }
                if (rec.param === 'nitrite' && rec.value > 0) {
                    rec.emergencyDose = {
                        product: 'Seachem Stability',
                        dose: volumeLitres * 0.125,
                        unit: 'mL'
                    };
                }
            });
        }

        // Sort by severity: CRITICAL > WARNING > CAUTION > INFO
        var severityOrder = { critical: 0, warning: 1, caution: 2, info: 3 };
        recommendations.sort(function (a, b) {
            return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        });

        return {
            profile: profile,
            recommendations: recommendations,
            hasCritical: recommendations.some(function (r) { return r.severity === SEVERITY.CRITICAL; }),
            hasWarning: recommendations.some(function (r) { return r.severity === SEVERITY.WARNING; }),
            parameterCount: Object.keys(paramMapping).length,
            issueCount: recommendations.length,
            co2Estimate: ((profile === 'freshwater' || profile === 'pond') && params.kh > 0 && params.ph > 0)
                ? estimateCO2(params.ph, params.kh)
                : null
        };
    }

    function getParamIcon(param, direction) {
        var icons = {
            ammonia: '🟥', nitrite: '🟧', nitrate: '🟨',
            ph: '🔬', gh: '💎', kh: '🛡️', temp: '🌡️',
            potassium: '🟣', iron: '🔴',
            salinity: '🧂', alkalinity: '📊', calcium: '🦴',
            magnesium: '💠', phosphate: '🟡', strontium: '✨', iodide: '🧫',
            dissolvedO2: '🫁'
        };
        return icons[param] || '📋';
    }

    // --- Public API ---
    window.RecommendationEngine = {
        analyze: analyze,
        estimateCO2: estimateCO2,
        SEVERITY: SEVERITY,
        FW_RANGES: FW_RANGES,
        SW_RANGES: SW_RANGES,
        POND_RANGES: POND_RANGES
    };
})();
