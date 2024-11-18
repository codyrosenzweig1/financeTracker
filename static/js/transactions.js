document.getElementById('transactionForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    //Get input values
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;

    //send a POST request to add a new transaction
    const response = await fetch('/add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({amount, category, description})
    });

    if (response.ok) {
        alert('Transaction added!');
        fetchTransactions();
        fetchSummary();

        // Clear the form
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        document.getElementById('description').value = '';
    } else {
        alert('Error adding transaction.');
    }
});

async function fetchTransactions(categoryFilter = '', sortOption = 'date') {
    let url = `/get_transactions?sort=${sortOption}`;
    if (categoryFilter) {
        url += `&category=${categoryFilter}`;
    }
    if (startDate) {
        url += `&start_date=${startDate.value}`;
    }
    if (endDate) {
        url += `&end_date=${endDate.value}`;
    }

    const response = await fetch(url);
    const transactions = await response.json();

    // Get the div to display transactions and clear them
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';

    transactions.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.classList.add('transaction-item');

        transactionDiv.innerHTML = `
        <div class="transaction-info">
            <span class="transaction-date">${transaction.date}</span>
            <span class="transaction-amount">$${transaction.amount}</span> 
            <span class="transaction-category">${transaction.category}</span> 
            <span class="transaction-description">${transaction.description}</span>
        </div>

        <div class="transaction-actions">
            <button class="edit-button" data-id="${transaction.id}">Edit</button>
            <button class="delete-button" data-id="${transaction.id}">Delete</button>
        </div>
        `;

        // Add the transaction container to the transaction list
        transactionList.appendChild(transactionDiv);
        console.log(transactionList);
    });

    //Attach event listeners to each edit and delete button
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
}

document.getElementById('applyFilters').addEventListener('click', () => {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortOption = document.getElementById('sortOptions').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    fetchTransactions(categoryFilter, sortOption, startDate, endDate);
});

//function to handle editing a transaction
async function editTransaction(id) {
    const newAmount = prompt('Enter new amount:');
    const newCategory = prompt('Enter new category:');
    const newDescription = prompt('Enter new description:');

    const response = await fetch(`/edit_transaction/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            amount: newAmount,
            category: newCategory,
            description: newDescription
        })
    });

    if (response.ok) {
        alert('Transaction updated!');
        fetchTransactions();
        fetchSummary();
    } else {
        alert('Error updating transaction.');
    }
}

async function deleteTransaction(id) {
    const response = await fetch(`/delete_transaction/${id}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        alert('Transaction deleted!');
        fetchTransactions();
        fetchSummary();
    } else {
        alert('Error deleting transaction.');
    }
}

async function fetchSummary() {
    const response = await fetch('/get_summary');
    const summaryData = await response.json();

    document.getElementById('totalSpending').textContent = `Total Spending: $${summaryData.total_spending.toFixed(2)}`;

    const categorySummary = document.getElementById('categorySummary');
    categorySummary.innerHTML = '';
    for (const [category, total] of Object.entries(summaryData.category_totals)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.textContent = `${category}: $${total.toFixed(2)}`;
        categorySummary.appendChild(categoryDiv);
    }

    const ts_response = await fetch('/get_spending_over_time');
    const timeSeriesData = await ts_response.json();

    renderSpendingOverTimeChart(timeSeriesData);
    renderSpendingByCategoryChart(summaryData.category_totals);
}

let spendingByCategoryChart;

function renderSpendingByCategoryChart(categoryTotals) {

    if (spendingByCategoryChart) {
        spendingByCategoryChart.destroy();
    }

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const ctx = document.getElementById('spendingByCategoryChart').getContext('2d');

    spendingByCategoryChart = new Chart(ctx, {
        type: 'pie',  // Chart type: 'pie' creates a pie chart
        data: {
            labels: labels, // Labels for each slice (e.g., ["Food", "Clothes", "Transport"])
            datasets: [{
                label: 'Spending by Category', // Title shown in tooltips
                data: data, // Data values corresponding to labels (e.g., [200, 150, 50])
    
                // Background colors for each slice (you can adjust colors)
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)', // Light pink
                    'rgba(54, 162, 235, 0.2)', // Light blue
                    'rgba(255, 206, 86, 0.2)', // Light yellow
                    'rgba(75, 192, 192, 0.2)', // Light green
                    'rgba(153, 102, 255, 0.2)', // Light purple
                    'rgba(255, 159, 64, 0.2)'   // Light orange
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)', // Darker pink
                    'rgba(54, 162, 235, 1)', // Darker blue
                    'rgba(255, 206, 86, 1)', // Darker yellow
                    'rgba(75, 192, 192, 1)', // Darker green
                    'rgba(153, 102, 255, 1)', // Darker purple
                    'rgba(255, 159, 64, 1)'   // Darker orange
                ],
                borderWidth: 1 // Border width of each slice
            }]
        },
        options: {
            responsive: true, // Chart resizes based on screen size
            plugins: {
                legend: {
                    position: 'top' // Position of the chart legend
                },
                title: {
                    display: true,
                    text: 'Spending by Category' // Title of the chart
                }
            }
        }
    });
}

let spendingOverTimeChart;

function renderSpendingOverTimeChart(timeSeriesData) {
    if (spendingOverTimeChart) {
        spendingOverTimeChart.destroy();
    }

    const labels = timeSeriesData.map(entry => entry.date);
    const data = timeSeriesData.map(entry => entry.totalSpending);

    const ctx = document.getElementById('spendingOverTimeChart').getContext('2d');

    spendingOverTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Spending Over Time',
                data: data,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Spending Over Time'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'  // Change this to 'month', 'week', etc., based on your data
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

fetchTransactions();
fetchSummary();