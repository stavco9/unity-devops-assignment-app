const API_BASE_URL = 'https://unity-store-dev-web-server.k8s.stav-devops.eu-central-1.pre-prod.stavco9.com';
//const API_BASE_URL = 'http://localhost:3000';

function getOutputElement() {
    return document.getElementById('output');
}

function displayMessage(message, type = 'info', isHtml = false) {
    const output = getOutputElement();
    if (isHtml) {
        output.innerHTML = message;
    } else {
        output.textContent = message;
    }
    output.className = `output ${type}`;
}

function handlePurchase() {
    const username = document.getElementById('username').value.trim();
    const maxPrice = document.getElementById('maxPrice').value;

    if (!username) {
        displayMessage('Please enter a username', 'error');
        return;
    }

    if (!maxPrice || parseFloat(maxPrice) < 0) {
        displayMessage('Please enter a valid max price', 'error');
        return;
    }

    const requestBody = {
        username: username,
        maxItemPrice: parseFloat(maxPrice)
    };

    displayMessage('Sending purchase request...', 'info');

    fetch(`${API_BASE_URL}/purchase`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (response.status === 200) {
            displayMessage('Purchase request was sent successfully!', 'success');
        } else {
            displayMessage(`Error occurred. Status: ${response.status}`, 'error');
        }
    })
    .catch(error => {
        displayMessage(`Error occurred: ${error.message}`, 'error');
    });
}

function handleGetPurchases() {
    const username = document.getElementById('username').value.trim();

    if (!username) {
        displayMessage('Please enter a username', 'error');
        return;
    }

    displayMessage('Fetching user purchases...', 'info');

    fetch(`${API_BASE_URL}/getAllUserBuys?username=${username}`)
    .then(response => {
        if (response.status == 200) {
            return response.json().then(data => {
                const formattedOutput = formatUserPurchases(data);
                displayMessage(formattedOutput, 'data', true);
            }).catch(error => {
                displayMessage(`Error parsing response: ${error.message}`, 'error');
            });
        } else if (response.status == 404) {
            displayMessage('User was not found', 'error');
            return Promise.resolve();
        } else if (response.status >= 500 && response.status < 600) {
            displayMessage('Error has been occurred', 'error');
            return Promise.resolve();
        } else {
            displayMessage(`Error occurred. Status: ${response.status}`, 'error');
            return Promise.resolve();
        }
    })
    .catch(error => {
        displayMessage(`Error occurred: ${error.message}`, 'error');
    });
}

function formatUserPurchases(data) {
    let html = '<div class="user-info">';
    html += `<div class="info-row"><strong>Username:</strong> ${escapeHtml(data.username)}</div>`;
    html += `<div class="info-row"><strong>Email:</strong> ${escapeHtml(data.email)}</div>`;
    html += `<div class="info-row"><strong>Balance:</strong> $${data.balance.toFixed(2)}</div>`;
    html += '</div>';
    
    if (data.purchaseditems && data.purchaseditems.length > 0) {
        html += '<div class="purchases-section">';
        html += `<h3>Purchased Items (${data.purchaseditems.length})</h3>`;
        html += '<table class="purchases-table">';
        html += '<thead><tr><th>Name</th><th>Price</th><th>Purchased At</th></tr></thead>';
        html += '<tbody>';
        
        data.purchaseditems.forEach(item => {
            const purchaseDate = new Date(item.purchasedAt);
            const formattedDate = purchaseDate.toLocaleString();
            html += '<tr>';
            html += `<td>${escapeHtml(item.name)}</td>`;
            html += `<td>$${item.price.toFixed(2)}</td>`;
            html += `<td>${formattedDate}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
    } else {
        html += '<div class="no-items">No purchased items found.</div>';
    }
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
