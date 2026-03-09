document.addEventListener('DOMContentLoaded', () => {

    // Global Chart Defaults
    Chart.defaults.font.family = "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.color = '#666';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    Chart.defaults.plugins.tooltip.padding = 10;

    const green = '#4CAF50';
    const greenLight = 'rgba(76, 175, 80, 0.2)';
    const blue = '#2196F3';
    const blueLight = 'rgba(33, 150, 243, 0.2)';
    const orange = '#FF9800';
    const orangeLight = 'rgba(255, 152, 0, 0.2)';
    const red = '#F44336';
    const redLight = 'rgba(244, 67, 54, 0.2)';
    const grey = '#9E9E9E';

    // 1. Canopy vs Math (Scatter - Positive Correlation)
    const ctx1 = document.getElementById('chart1').getContext('2d');
    new Chart(ctx1, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Classroom Data Points',
                data: Array.from({ length: 40 }, () => ({
                    x: Math.random() * 80, // Canopy Cover % (0-80)
                    y: 65 + (Math.random() * 15) + (Math.random() * 20) // Base 65 + random + trend
                })).map(pt => {
                    // Force a positive trend
                    pt.y = 65 + (pt.x * 0.3) + (Math.random() * 10 - 5);
                    if (pt.y > 100) pt.y = 100;
                    return pt;
                }),
                backgroundColor: blue,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Window Canopy Cover %' }, min: 0, max: 100 },
                y: { title: { display: true, text: 'Math Test Retake Score (%)' }, min: 50, max: 100 }
            }
        }
    });

    // 2. Canopy vs Reading (Scatter - Plateau)
    const ctx2 = document.getElementById('chart2').getContext('2d');
    new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Classroom Data Points',
                data: Array.from({ length: 40 }, () => ({
                    x: Math.random() * 80,
                    y: 80 + (Math.random() * 10 - 5) // Base 80, flat.
                })),
                backgroundColor: grey,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Window Canopy Cover %' }, min: 0, max: 100 },
                y: { title: { display: true, text: 'Reading Comprehension (%)' }, min: 50, max: 100 }
            }
        }
    });

    // 3. Test Performance by Age Group (Bar)
    const ctx3 = document.getElementById('chart3').getContext('2d');
    new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade'],
            datasets: [
                {
                    label: 'Microforest Cohort (+ >50% View)',
                    backgroundColor: green,
                    data: [88, 90, 85, 82, 79, 75, 74]
                },
                {
                    label: 'Asphalt Cohort (<10% View)',
                    backgroundColor: grey,
                    data: [72, 75, 74, 73, 75, 72, 73]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Average Benchmark Score' }, min: 60, max: 100 }
            }
        }
    });

    // 4. Outdoor Hours vs Behavior (Line - Downward curve)
    const ctx4 = document.getElementById('chart4').getContext('2d');
    new Chart(ctx4, {
        type: 'line',
        data: {
            labels: ['0 Hrs', '1 Hr', '2 Hrs', '3 Hrs', '4 Hrs', '5+ Hrs'],
            datasets: [{
                label: 'Weekly Disciplinary Clinic Visits',
                data: [15, 12, 8, 4, 2, 1],
                borderColor: red,
                backgroundColor: redLight,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Incidents per Week' }, min: 0 }
            }
        }
    });

    // 5. Biodiversity vs Social (Scatter - Size mapping)
    const ctx5 = document.getElementById('chart5').getContext('2d');
    new Chart(ctx5, {
        type: 'bubble', // Using bubble to show cluster size
        data: {
            datasets: [{
                label: 'Campus Zones',
                data: [
                    { x: 2, y: 5, r: 10 },  // Parking (Low diversity, low social)
                    { x: 4, y: 12, r: 15 }, // Field
                    { x: 12, y: 25, r: 25 }, // Edge trees
                    { x: 28, y: 65, r: 40 }, // Microforest (High diversity, high social)
                    { x: 18, y: 40, r: 30 }  // Courtyard
                ],
                backgroundColor: orangeLight,
                borderColor: orange,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Distinct Species Count (Birds/Insects)' }, min: 0 },
                y: { title: { display: true, text: 'Active Social Interactions (per hour)' }, min: 0 }
            }
        }
    });

    // 6. Actual Temp vs Perceived Comfort (Line Multi-Axis)
    const ctx6 = document.getElementById('chart6').getContext('2d');
    new Chart(ctx6, {
        type: 'line',
        data: {
            labels: ['8AM', '10AM', '12PM', '2PM', '4PM'],
            datasets: [
                {
                    label: 'Actual Air Temp (°F)',
                    data: [78, 85, 92, 96, 94],
                    borderColor: red,
                    borderDash: [5, 5],
                    yAxisID: 'y'
                },
                {
                    label: 'Student "Comfortable" Log % (Microforest)',
                    data: [95, 90, 82, 75, 78],
                    borderColor: blue,
                    backgroundColor: blueLight,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temperature °F' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Comfortable Feedback %' }, grid: { drawOnChartArea: false } }
            }
        }
    });

    // 7. Proximity vs Asthma (Bar)
    const ctx7 = document.getElementById('chart7').getContext('2d');
    new Chart(ctx7, {
        type: 'bar',
        data: {
            labels: ['Windward (Filter)', 'Directly Adj.', '50m Downwind', '100m Downwind', 'No Canopy (Control)'],
            datasets: [{
                label: 'Monthly Inhaler / Nurse Visits',
                data: [4, 6, 8, 12, 18],
                backgroundColor: [green, green, greenLight, grey, red]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Nurse Visits (Respiratory)' }, min: 0 }
            }
        }
    });

    // 8. Hardscape Removal vs Flooding (Line)
    const ctx8 = document.getElementById('chart8').getContext('2d');
    new Chart(ctx8, {
        type: 'line',
        data: {
            labels: ['Year 0 (100% Concrete)', 'Year 1 (-5%)', 'Year 2 (-10%)', 'Year 3 (-15%)', 'Year 4 (-20%)'],
            datasets: [{
                label: 'Days of Parking Lot Flooding > 2"',
                data: [14, 11, 7, 3, 1],
                borderColor: blue,
                backgroundColor: blueLight,
                fill: true,
                borderWidth: 3,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Flooding Days per Year' }, min: 0 }
            }
        }
    });

    // 9. Economics vs Mortality (Line)
    const ctx9 = document.getElementById('chart9').getContext('2d');
    new Chart(ctx9, {
        type: 'line',
        data: {
            labels: ['$0', '$1k', '$2k', '$3k', '$4k', '$5k (Minimum)', '$6k+'],
            datasets: [{
                label: 'Canopy Mortality Rate (%)',
                data: [45, 30, 18, 12, 8, 2, 1], // Spikes high when underfunded
                borderColor: orange,
                backgroundColor: orangeLight,
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Mortality Rate %' }, min: 0 }
            }
        }
    });

    // 10. Diversity vs Pests (Bar)
    const ctx10 = document.getElementById('chart10').getContext('2d');
    new Chart(ctx10, {
        type: 'bar',
        data: {
            labels: ['Monoculture (1 Species)', 'Low Diversity (3)', 'Standard (5)', 'Tree Campus (<10% Rule)'],
            datasets: [{
                label: 'Max Biological Loss Risk ($)',
                data: [150000, 80000, 45000, 12000],
                backgroundColor: [red, orange, greenLight, green]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Value Risk ($)' }, min: 0 }
            }
        }
    });

});
