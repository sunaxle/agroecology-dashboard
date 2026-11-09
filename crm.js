document.addEventListener('DOMContentLoaded', () => {
    // Wait for data sources
    if (typeof treeData !== 'undefined') {
        populateNetworkTable(treeData);
    }
    
    if (typeof donorsData !== 'undefined') {
        populateDonorsTable(donorsData);
    }

    // Setup Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
});

// Flatten hierarchical data from treeData
function flattenNetwork(node, parentGroup = null) {
    let result = [];
    
    // We optionally skip the "root" itself if it doesn't represent an active student,
    // but the prompt is for the active network, so we'll just include everyone.
    if (node.name !== "Master's Students" && node.name !== "Undergraduates & Interns" && node.name !== "Leadership & Postdocs") {
        result.push({
            name: node.name,
            group: node.group,
            description: node.description || "N/A"
        });
    }

    if (node.children) {
        node.children.forEach(child => {
            result = result.concat(flattenNetwork(child, node.name));
        });
    }
    
    return result;
}

function populateNetworkTable(data) {
    const tableBody = document.getElementById('networkTableBody');
    if (!tableBody) return;
    
    const flattened = flattenNetwork(data);
    
    // Remove duplicates or root entries if they aren't useful in a CRM
    const filtered = flattened.filter(item => item.name !== "Dr. Alex Racelis" || item.group !== "root");
    
    let html = '';
    filtered.forEach(person => {
        let badgeClass = 'badge';
        if (person.group === 'leadership') badgeClass += ' leadership';
        if (person.group === 'masters') badgeClass += ' masters';
        if (person.group === 'undergrad') badgeClass += ' undergrad';
        
        let roleName = person.group;
        if (roleName === 'leadership') roleName = 'Leadership';
        if (roleName === 'masters') roleName = "Master's";
        if (roleName === 'undergrad') roleName = 'Undergrad';
        
        html += `
            <tr>
                <td><strong>${person.name}</strong></td>
                <td><span class="${badgeClass}">${roleName}</span></td>
                <td>${person.description}</td>
                <td><button class="btn-action" style="background: transparent; color: var(--green); border: 1px solid var(--green);">View Profile</button></td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function populateDonorsTable(data) {
    const tableBody = document.getElementById('donorsTableBody');
    if (!tableBody) return;

    let html = '';
    data.forEach(donor => {
        const badgeClass = donor.status === 'Active' ? 'badge active-donor' : 'badge lapsed-donor';
        
        html += `
            <tr>
                <td>
                    <strong>${donor.name}</strong><br>
                    <span style="font-size: 12px; color: #666;">${donor.address}</span>
                </td>
                <td>
                    ${donor.email}<br>
                    ${donor.number}
                </td>
                <td>${donor.occupation}</td>
                <td><strong>$${donor.totalDonations.toFixed(2)}</strong></td>
                <td><span class="${badgeClass}">${donor.status}</span></td>
                <td><button class="btn-action" style="background: transparent; color: var(--green); border: 1px solid var(--green);">Edit</button></td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Donation Modal Logic
function openDonationModal() {
    document.getElementById('donationModal').classList.add('active');
}

function closeDonationModal() {
    document.getElementById('donationModal').classList.remove('active');
}

function selectAmount(btn, amount) {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function submitDonation() {
    window.open('https://donate.utrgv.edu/campaigns/78643/donations/new?a=12801302', '_blank');
    closeDonationModal();
}
