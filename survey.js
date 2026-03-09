// Logic for the Student Wellbeing & Thermal Comfort Kiosk
document.addEventListener('DOMContentLoaded', () => {
    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
    document.getElementById("campusTitle").textContent = campusName;

    const zoneSelector = document.getElementById("zoneSelector");
    const faceControls = document.getElementById("faceControls");

    // UI elements for stats
    const statPleasant = document.getElementById("statPleasant");
    const statNeutral = document.getElementById("statNeutral");
    const statUncomfortable = document.getElementById("statUncomfortable");

    // Load custom zones into the dropdown if available
    const savedZones = localStorage.getItem(`zones_${campusName}`);
    if (savedZones) {
        try {
            const zones = JSON.parse(savedZones);
            if (zones.length > 0) {
                // Clear the mock options except the first placeholder
                zoneSelector.innerHTML = '<option value="" disabled selected>Select Area...</option>';
                const addedZones = new Set();

                zones.forEach(z => {
                    // Try to use a name if they added one, otherwise use category
                    let name = z.category;
                    if (z.name) name = z.name;

                    if (name && name !== "Campus Boundary" && name !== "Rooftop" && !addedZones.has(name)) {
                        const opt = document.createElement("option");
                        opt.value = name;
                        opt.textContent = name;
                        zoneSelector.appendChild(opt);
                        addedZones.add(name);
                    }
                });

                // Fallback if no valid zones were added
                if (addedZones.size === 0) {
                    addDefaultZones();
                }
            }
        } catch (e) {
            console.error("Failed to parse local zones", e);
            addDefaultZones();
        }
    } else {
        // Just use the hardcoded ones already in HTML, but we need to reset the listener anyway.
    }

    function addDefaultZones() {
        zoneSelector.innerHTML = '<option value="" disabled selected>Select Area...</option>';
        ['Microforest', 'Courtyard', 'Front Drop-off', 'Recess Field'].forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            zoneSelector.appendChild(opt);
        });
    }

    // Enable buttons only when a zone is selected
    zoneSelector.addEventListener("change", () => {
        if (zoneSelector.value) {
            faceControls.style.opacity = "1";
            faceControls.style.pointerEvents = "auto";
            updateStatsForZone(zoneSelector.value);
        }
    });

    // Mock initial data if empty
    function getSurveyData() {
        const raw = localStorage.getItem("survey_data");
        if (raw) return JSON.parse(raw);

        // Seed with some mock data for the presentation
        let mock = {
            "Microforest": { pleasant: 42, neutral: 12, uncomfortable: 3 },
            "Courtyard": { pleasant: 15, neutral: 25, uncomfortable: 8 },
            "Front Drop-off": { pleasant: 4, neutral: 18, uncomfortable: 29 },
            "Recess Field": { pleasant: 10, neutral: 20, uncomfortable: 40 }
        };
        localStorage.setItem("survey_data", JSON.stringify(mock));
        return mock;
    }

    function updateStatsForZone(zone) {
        const data = getSurveyData();
        const zoneData = data[zone] || { pleasant: 0, neutral: 0, uncomfortable: 0 };

        // Simple counter animation
        animateValue(statPleasant, zoneData.pleasant);
        animateValue(statNeutral, zoneData.neutral);
        animateValue(statUncomfortable, zoneData.uncomfortable);
    }

    window.logFeedback = function (sentiment) {
        const zone = zoneSelector.value;
        if (!zone) return;

        // Save to DB (localStorage)
        const data = getSurveyData();
        if (!data[zone]) {
            data[zone] = { pleasant: 0, neutral: 0, uncomfortable: 0 };
        }
        data[zone][sentiment]++;
        localStorage.setItem("survey_data", JSON.stringify(data));

        // Show thank you message
        const tkMsg = document.getElementById("thankYouMessage");
        tkMsg.style.display = "block";

        // Update stats
        updateStatsForZone(zone);

        setTimeout(() => {
            tkMsg.style.display = "none";
        }, 1500);
    };

    function animateValue(obj, end) {
        let current = parseInt(obj.textContent) || 0;
        if (current === end) {
            obj.textContent = end;
            return;
        }

        // Quick visual tick up
        let step = Math.ceil(Math.abs(end - current) / 10);
        let timer = setInterval(function () {
            if (current < end) current += step;
            else current -= step;

            if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
                clearInterval(timer);
                current = end;
            }
            obj.textContent = current;
        }, 30);
    }
});
