const fs = require('fs');
const path = require('path');

// Approximate bounding box for Rivas Elementary Campus (Donna, TX)
const minLon = -98.0745;
const maxLon = -98.0675;
const minLat = 26.1650;
const maxLat = 26.1695;

const speciesList = [
    "Bur Oak",
    "Live Oak",
    "Montezuma Bald Cypress",
    "Texas Pecan",
    "Mexican Sycamore"
];

const totalTrees = 158;
const features = [];

// Helper for random number
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

for (let i = 1; i <= totalTrees; i++) {
    const lon = getRandomArbitrary(minLon, maxLon);
    const lat = getRandomArbitrary(minLat, maxLat);
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];

    // Randomize planting year between 2024 and 2026 for a staggered microforest
    const plantYear = Math.floor(getRandomArbitrary(2024, 2027));

    // Base radius (ft) between 2.5 and 4.5
    const baseRadius = parseFloat(getRandomArbitrary(2.5, 4.5).toFixed(1));

    // Max radius limit for maturity
    const maxRadiusFeet = Math.floor(getRandomArbitrary(35, 55));

    features.push({
        type: "Feature",
        properties: {
            id: i,
            species: species,
            plantYear: plantYear,
            baseRadiusFeet: baseRadius,
            maxRadiusFeet: maxRadiusFeet
        },
        geometry: {
            type: "Point",
            coordinates: [parseFloat(lon.toFixed(5)), parseFloat(lat.toFixed(5))]
        }
    });
}

const geoJson = {
    type: "FeatureCollection",
    features: features
};

const outputPath = path.join(__dirname, '..', 'data', 'mock_trees.json');
fs.writeFileSync(outputPath, JSON.stringify(geoJson, null, 2));

console.log(`Successfully generated ${totalTrees} mock trees and overriding mock_trees.json`);
