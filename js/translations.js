// js/translations.js v6.0

const translations = {
    en: {
        main_title: "Aquarium Calculator",
        subtitle: "Dosing & Water Parameter Analysis",
        param_status_title: "Water Parameter Status",
        core_params_title: "Core Parameters",
        param_ammonia_label: "Ammonia (NH₃/NH₄⁺)",
        param_nitrate_label: "Nitrate (NO₃)",
        param_nitrite_label: "Nitrite (NO₂)",
        param_gh_label: "General Hardness (GH)",
        param_kh_label: "Carbonate Hardness (KH)",
        emergency_title: "Emergency Recommendations",
        reco_ok: "No issues detected. All parameters look good!",
        reco_ammonia_detected: "Ammonia detected!",
        reco_prime_dose: "Dose <strong>{primeDose} mL of Seachem Prime</strong> immediately to detoxify.",
        reco_nitrite_detected: "Nitrite detected!",
        reco_stability_dose: "Add <strong>{stabilityDose} mL of Seachem Stability</strong> to boost beneficial bacteria.",
        reco_gh_low: "GH is very low. Consider adding <strong>Seachem Equilibrium</strong> to raise it.",
        reco_kh_low: "KH is very low, which can cause pH swings. Add a <strong>KH booster</strong>.",
        reco_nitrate_high: "High Nitrates (>50ppm). Consider a <strong>30-50% water change</strong>.",
        reco_volume_needed: "Enter water volume to calculate emergency doses.",
        status_good: "Good",
        status_high: "High",
        status_danger: "DANGER",
        status_low: "Low",
        status_check: "Check",
        dosing_calculators_title: "Dosing Calculators",
        water_volume_title: "Water Volume",
        net_volume_label: "Net Water Volume",
        unit_label: "Unit",
        kh_booster_title: "KH Booster (Potassium Bicarbonate)",
        gh_booster_title: "GH Booster (Seachem Equilibrium)",
        safe_title: "Water Conditioner (Seachem Safe)",
        apt_title: "Plant Fertilizer (APT Complete)",
        ph_neutralizer_title: "pH Neutralizer (Seachem Neutral Regulator)",
        kh_reducer_title: "KH & pH Reducer (Seachem Acid Buffer)",
        goldfish_buffer_title: "Goldfish Buffer (Seachem Gold Buffer)",
        current_kh_label: "Current KH (°dKH)",
        target_kh_label: "Target KH (°dKH)",
        purity_label: "Purity (0.5-1.0)",
        current_gh_label: "Current GH (°dGH)",
        target_gh_label: "Target GH (°dGH)",
        current_ph_label: "Current pH",
        target_ph_label: "Target pH",
        no_dose_needed: "No dose needed",
        changelog_btn: "v6.0 Changelog",
        calculate_btn: "Calculate Doses",
        download_csv_btn: "Download CSV",
        reset_btn: "Reset All",
        changelog_title: "Version 6.0 Changelog",
        changelog_list: `
            <li><strong>v6.0 New:</strong> 3-profile system — Freshwater, Saltwater, Pond</li>
            <li><strong>v6.0 New:</strong> 21 Seachem product calculators (full Android port)</li>
            <li><strong>v6.0 New:</strong> Salt Mix Calculator (17 brand products)</li>
            <li><strong>v6.0 New:</strong> Substrate / Gravel bag calculator (11 products)</li>
            <li><strong>v6.0 New:</strong> Water Change volume calculator</li>
            <li><strong>v6.0 New:</strong> Profile-aware recommendations (saltwater & pond)</li>
            <li><strong>v6.0 New:</strong> Unit-scale dropdowns (meq/L ↔ dKH ↔ PPM)</li>
            <li><strong>v6.0 Improved:</strong> Dashboard param → calculator auto-sync</li>
            <li><strong>v5.0:</strong> Stoichiometric KHCO3, LxBxH volume, Safe, APT Complete</li>
            <li><strong>v5.0:</strong> Hamburger menu, auto-calculation, precision to 0.0001</li>
        `,

        // v6.0 — Profile
        profile_freshwater: "🐠 Freshwater",
        profile_saltwater: "🐟 Saltwater",
        profile_pond: "🐸 Pond",

        // v6.0 — New param labels
        param_ph_label: "pH",
        param_temp_label: "Temperature",
        param_potassium_label: "Potassium (K⁺)",
        param_iron_label: "Iron (Fe²⁺)",
        param_salinity_label: "Salinity",
        param_alkalinity_label: "Alkalinity",
        param_calcium_label: "Calcium (Ca²⁺)",
        param_magnesium_label: "Magnesium (Mg²⁺)",
        param_phosphate_label: "Phosphate (PO₄³⁻)",
        param_strontium_label: "Strontium (Sr²⁺)",
        param_iodide_label: "Iodide (I⁻)",
        param_do_label: "Dissolved O₂",

        // v6.0 — Dynamic card input labels
        current_label: "Current",
        target_label: "Target",
        input_current: "Current",
        input_target: "Target",
        input_scale: "Unit",
        volume_only_hint: "Dose is based on water volume only.",

        // v6.0 — Substrate dimension labels
        dim_length_label: "Length",
        dim_width_label: "Width",
        dim_depth_label: "Depth",
        wc_percent_label: "Change %",

        // v6.0 — Special card titles
        salt_mix_title: "Salt Mix Calculator",
        salt_mix_product_label: "Salt Product",
        salt_mix_volume_label: "Volume (US Gal)",
        salt_mix_current_label: "Current PPT",
        salt_mix_desired_label: "Desired PPT",
        substrate_title: "Substrate Calculator",
        substrate_product_label: "Substrate Product",
        water_change_title: "Water Change Calculator",
        water_change_percent_label: "Change %",

        // v6.0 — Profile-aware recommendations
        reco_alkalinity_low: "Alkalinity is low (<7 meq/L). Consider <strong>Reef Buffer</strong> or <strong>Reef Builder</strong>.",
        reco_calcium_low: "Calcium is low (<380 ppm). Consider <strong>Reef Advantage Calcium</strong>.",
        reco_magnesium_low: "Magnesium is low (<1200 ppm). Consider <strong>Reef Advantage Magnesium</strong>.",
        reco_salinity_out: "Salinity is outside 34–36 PPT. Consider <strong>Salt Mix</strong> or a water change.",
        reco_salinity_check: "Salinity is outside 34–36 PPT. Consider <strong>Salt Mix</strong> or a water change.",
        reco_iron_low: "Iron is low (<0.05 ppm). Consider <strong>Flourish Iron</strong>.",
        reco_potassium_low: "Potassium is low (<5 ppm). Consider <strong>Flourish Potassium</strong>.",
        reco_do_low: "Dissolved O₂ is low (<5 ppm). Improve <strong>water circulation / aeration</strong>."
    },
    kn: {
        main_title: "ಅಕ್ವೇರಿಯಂ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
        subtitle: "ಡೋಸಿಂಗ್ ಮತ್ತು ನೀರಿನ ಪ್ಯಾರಾಮೀಟರ್ ವಿಶ್ಲೇಷಣೆ",
        param_status_title: "ನೀರಿನ ಪ್ಯಾರಾಮೀಟರ್ ಸ್ಥಿತಿ",
        core_params_title: "ಪ್ರಮುಖ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು",
        param_ammonia_label: "ಅಮೋನಿಯಾ (NH₃/NH₄⁺)",
        param_nitrate_label: "ನೈಟ್ರೇಟ್ (NO₃)",
        param_nitrite_label: "ನೈಟ್ರೈಟ್ (NO₂)",
        param_gh_label: "ಸಾಮಾನ್ಯ ಕಠಿಣತೆ (GH)",
        param_kh_label: "ಕಾರ್ಬೋನೇಟ್ ಕಠಿಣತೆ (KH)",
        emergency_title: "ತುರ್ತು ಶಿಫಾರಸುಗಳು",
        reco_ok: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಎಲ್ಲಾ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಉತ್ತಮವಾಗಿವೆ!",
        reco_ammonia_detected: "ಅಮೋನಿಯಾ ಪತ್ತೆಯಾಗಿದೆ!",
        reco_prime_dose: "ವಿಷಮುಕ್ತಗೊಳಿಸಲು ತಕ್ಷಣವೇ <strong>ಸೀಕೆಮ್ ಪ್ರೈಮ್ {primeDose} ಮಿ.ಲೀ.</strong> ಡೋಸ್ ಮಾಡಿ.",
        reco_nitrite_detected: "ನೈಟ್ರೈಟ್ ಪತ್ತೆಯಾಗಿದೆ!",
        reco_stability_dose: "ಉತ್ತಮ ಬ್ಯಾಕ್ಟೀರಿಯಾವನ್ನು ಹೆಚ್ಚಿಸಲು <strong>ಸೀಕೆಮ್ ಸ್ಟೆಬಿಲಿಟಿ {stabilityDose} ಮಿ.ಲೀ.</strong> ಸೇರಿಸಿ.",
        reco_gh_low: "GH ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ. ಅದನ್ನು ಹೆಚ್ಚಿಸಲು <strong>ಸೀಕೆಮ್ ಇಕ್ವಿಲಿಬ್ರಿಯಂ</strong> ಸೇರಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ.",
        reco_kh_low: "KH ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ, ಇದು pH ಬದಲಾವಣೆಗೆ ಕಾರಣವಾಗಬಹುದು. <strong>KH ಬೂಸ್ಟರ್</strong> ಸೇರಿಸಿ.",
        reco_nitrate_high: "ಹೆಚ್ಚಿನ ನೈಟ್ರೇಟ್‌ಗಳು (>50ppm). <strong>30-50% ನೀರು ಬದಲಾವಣೆ</strong>ಯನ್ನು ಪರಿಗಣಿಸಿ.",
        reco_volume_needed: "ತುರ್ತು ಡೋಸ್‌ಗಳನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ನೀರಿನ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ.",
        status_good: "ಉತ್ತಮ",
        status_high: "ಹೆಚ್ಚು",
        status_danger: "ಅಪಾಯ",
        status_low: "ಕಡಿಮೆ",
        status_check: "ಪರಿಶೆಮ್",
        dosing_calculators_title: "ಡೋಸಿಂಗ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು",
        water_volume_title: "ನೀರಿನ ಪ್ರಮಾಣ",
        net_volume_label: "ನಿವ್ವಳ ನೀರಿನ ಪ್ರಮಾಣ",
        unit_label: "ಘಟಕ",
        kh_booster_title: "KH ಬೂಸ್ಟರ್ (ಪೊಟ್ಯಾಸಿಯಮ್ ಬೈಕಾರ್ಬನೇಟ್)",
        gh_booster_title: "GH ಬೂಸ್ಟರ್ (ಸೀಕೆಮ್ ಇಕ್ವಿಲಿಬ್ರಿಯಂ)",
        safe_title: "ನೀರಿನ ಕಂಡೀಷನರ್ (ಸೀಕೆಮ್ ಸೇಫ್)",
        apt_title: "ಸಸ್ಯ ರಸಗೊಬ್ಬರ (APT ಕಂಪ್ಲೀಟ್)",
        ph_neutralizer_title: "pH ನ್ಯೂಟ್ರಾಲೈಜರ್ (ಸೀಕೆಮ್ ನ್ಯೂಟ್ರಲ್ ರೆಗ್ಯುಲೇಟರ್)",
        kh_reducer_title: "KH ಮತ್ತು pH ರಿಡ್ಯೂಸರ್ (ಸೀಕೆಮ್ ಆಸಿಡ್ ಬಫರ್)",
        goldfish_buffer_title: "ಗೋಲ್ಡ್ ಫಿಶ್ ಬಫರ್ (ಸೀಕೆಮ್ ಗೋಲ್ಡ್ ಬಫರ್)",
        current_kh_label: "ಪ್ರಸ್ತುತ KH (°dKH)",
        target_kh_label: "ಗುರಿ KH (°dKH)",
        purity_label: "ಶುದ್ಧತೆ (೦.೫-೧.೦)",
        current_gh_label: "ಪ್ರಸ್ತುತ GH (°dGH)",
        target_gh_label: "ಗುರಿ GH (°dGH)",
        current_ph_label: "ಪ್ರಸ್ತುತ pH",
        target_ph_label: "ಗುರಿ pH",
        no_dose_needed: "ಡೋಸ್ ಅಗತ್ಯವಿಲ್ಲ",
        changelog_btn: "v6.0 ಬದಲಾವಣೆ ಲಾಗ್",
        calculate_btn: "ಡೋಸ್‌ಗಳನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ",
        download_csv_btn: "CSV ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        reset_btn: "ಎಲ್ಲವನ್ನೂ ಮರುಹೊಂದಿಸಿ",
        changelog_title: "ಆವೃತ್ತಿ 6.0 ಬದಲಾವಣೆ ಲಾಗ್",
        changelog_list: `
            <li><strong>v6.0 ಹೊಸ:</strong> 3-ಪ್ರೋಫಿಲ್ ವ್ಯವಸ್ಥೆ — ಸಿಹಿ, ಲವಣ, ಪೊಂದೀ ನೀರು</li>
            <li><strong>v6.0 ಹೊಸ:</strong> 21 ಸೀಕೆಮ್ ಪ್ರಡಕ್ಟ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು</li>
            <li><strong>v6.0 ಹೊಸ:</strong> ಸಾಲ್ಟ್ ಮಿಕ್ಸ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್ (17 ಬ್ರಾಂಡ್‌ಗಳು)</li>
            <li><strong>v6.0 ಹೊಸ:</strong> ಸಾಂಷ್ಟ್ರೇಟ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್ (11 ಪ್ರಡಕ್ಟ್‌ಗಳು)</li>
            <li><strong>v6.0 ಹೊಸ:</strong> ನೀರು ಬದಲಾವಣೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್</li>
            <li><strong>v6.0 ಹೊಸ:</strong> ಪ್ರೋಫಿಲ್-ಆಧಾರಿತ ಶಿಫಾರಸು (ಲವಣ ಮತ್ತು ಪೊಂದೀ)</li>
            <li><strong>v5.0:</strong> KHCO3 ಲೆಕ್ಕಾಚಾರ, LxBxH, Safe, APT Complete</li>
        `,

        // v6.0 — Profile
        profile_freshwater: "🐠 ಸಿಹಿ ನೀರು",
        profile_saltwater: "🐟 ಲವಣ ನೀರು",
        profile_pond: "🐸 ಪೊಂದೀ",

        // v6.0 — New param labels
        param_ph_label: "pH",
        param_temp_label: "ತಾಪಮಾನ",
        param_potassium_label: "ಪೊಟ್ಯಾಸಿಯಮ್ (K⁺)",
        param_iron_label: "ಇರನ್ (Fe²⁺)",
        param_salinity_label: "ಲವಣಾಂಶ",
        param_alkalinity_label: "ಆಲ್ಕಲೈನಿಟಿ",
        param_calcium_label: "ಕ್ಯಾಲ್ಸಿಯಂ (Ca²⁺)",
        param_magnesium_label: "ಮ್ಯಾಗ್ನೆಶಿಯಂ (Mg²⁺)",
        param_phosphate_label: "ಫಾಸ್ಫೇಟ್ (PO₄³⁻)",
        param_strontium_label: "ಸ್ಟ್ರೋಂಟಿಯಂ (Sr²⁺)",
        param_iodide_label: "ಇಡೈಡ್ (I⁻)",
        param_do_label: "ಕರ೟ ಆಮ್ಯಾಕ್ಸಿಜನ್",

        // v6.0 — Dynamic card input labels
        current_label: "ಪ್ರಸ್ತುತ",
        target_label: "ಗುರಿ",
        input_current: "ಪ್ರಸ್ತುತ",
        input_target: "ಗುರಿ",
        input_scale: "ಘಟಕ",
        volume_only_hint: "ಡೋಸ್ ನೀರಿನ ಪ್ರಮಾಣದ ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ.",

        // v6.0 — Substrate dimension labels
        dim_length_label: "ಉದ್ದ",
        dim_width_label: "ಅಗಲ",
        dim_depth_label: "ಆಳ",
        wc_percent_label: "ಬದಲಾವಣೆ %",

        // v6.0 — Special card titles
        salt_mix_title: "ಸಾಲ್ಟ್ ಮಿಕ್ಸ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
        salt_mix_product_label: "ಸಾಲ್ಟ್ ಪ್ರಡಕ್ಟ್",
        salt_mix_volume_label: "ಪ್ರಮಾಣ (US Gal)",
        salt_mix_current_label: "ಪ್ರಸ್ತುತ PPT",
        salt_mix_desired_label: "ಗುರಿ PPT",
        substrate_title: "ಸಾಂಷ್ಟ್ರೇಟ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
        substrate_product_label: "ಸಾಂಷ್ಟ್ರೇಟ್ ಪ್ರಡಕ್ಟ್",
        water_change_title: "ನೀರು ಬದಲಾವಣೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
        water_change_percent_label: "ಬದಲಾವಣೆ %",

        // v6.0 — Profile-aware recommendations
        reco_alkalinity_low: "ಆಲ್ಕಲೈನಿಟಿ ಕಡಿಮೆಯಾಗಿದೆ (<7 meq/L). <strong>Reef Buffer</strong> ಅಥವಾ <strong>Reef Builder</strong> ಪರಿಗಣಿಸಿ.",
        reco_calcium_low: "ಕ್ಯಾಲ್ಸಿಯಂ ಕಡಿಮೆಯಾಗಿದೆ (<380 ppm). <strong>Reef Advantage Calcium</strong> ಪರಿಗಣಿಸಿ.",
        reco_magnesium_low: "ಮ್ಯಾಗ್ನೆಶಿಯಂ ಕಡಿಮೆಯಾಗಿದೆ (<1200 ppm). <strong>Reef Advantage Magnesium</strong> ಪರಿಗಣಿಸಿ.",
        reco_salinity_out: "ಲವಣಾಂಶ 34–36 PPT ವ್ಯಾಪ್ತಿಗಿಂತ ಹೊಡೆಗೆ. <strong>Salt Mix</strong> ಅಥವಾ ನೀರು ಬದಲಾವಣೆ ಪರಿಗಣಿಸಿ.",
        reco_salinity_check: "ಲವಣಾಂಶ 34–36 PPT ವ್ಯಾಪ್ತಿಗಿಂತ ಹೊಡೆಗೆ. <strong>Salt Mix</strong> ಅಥವಾ ನೀರು ಬದಲಾವಣೆ ಪರಿಗಣಿಸಿ.",
        reco_iron_low: "ಇರನ್ ಕಡಿಮೆಯಾಗಿದೆ (<0.05 ppm). <strong>Flourish Iron</strong> ಪರಿಗಣಿಸಿ.",
        reco_potassium_low: "ಪೊಟ್ಯಾಸಿಯಮ್ ಕಡಿಮೆಯಾಗಿದೆ (<5 ppm). <strong>Flourish Potassium</strong> ಪರಿಗಣಿಸಿ.",
        reco_do_low: "ಕರ೟ ಆಮ್ಯಾಕ್ಸಿಜನ್ ಕಡಿಮೆಯಾಗಿದೆ (<5 ppm). <strong>ನೀರಿನ ಪ್ರವಾಹ / ಗಾಯೀಕರಣ</strong> ಸುಧಾರಿಸಿ."
    }
};
