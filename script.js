const stockData = JSON.parse(localStorage.getItem("stockData")) || [];
const heatmapContainer = document.getElementById("heatmap-container");
const stockForm = document.getElementById("stock-form");
const editStockForm = document.getElementById("edit-stock-form");
const holdingsList = document.getElementById("holdingsList");

// Buttons
const addStockBtn = document.getElementById("addStockBtn");
const viewHoldingsBtn = document.getElementById("viewHoldingsBtn");
const closeAddStock = document.getElementById("closeAddStock");
const closeEditStock = document.getElementById("closeEditStock");
const closeHoldings = document.getElementById("closeHoldings");

// Modals
const addStockModal = document.getElementById("addStockModal");
const editStockModal = document.getElementById("editStockModal");
const holdingsModal = document.getElementById("holdingsModal");

// Function to save data to local storage
const saveToLocalStorage = () => {
    localStorage.setItem("stockData", JSON.stringify(stockData));
};

// Function to calculate the color based on stock performance
const getColor = (change) => {
    return change > 0 ? "#00C853" : "#D32F2F"; // Strong green & red colors
};

// Function to update the heatmap with a rectangular Finviz-like layout
const updateHeatmap = () => {
    heatmapContainer.innerHTML = "";
    saveToLocalStorage();

    if (stockData.length === 0) {
        heatmapContainer.innerHTML = "<p>No stocks added yet.</p>";
        return;
    }

    // Calculate total portfolio value
    const totalValue = stockData.reduce((sum, stock) => sum + (stock.sharesOwned * stock.avgPrice), 0);

    // Sort stocks by market value (biggest first)
    stockData.sort((a, b) => (b.sharesOwned * b.avgPrice) - (a.sharesOwned * a.avgPrice));

    stockData.forEach((stock, index) => {
        const marketValue = stock.sharesOwned * stock.avgPrice;
        const weight = (marketValue / totalValue) * 100;
        const minSize = 60; // Ensure small stocks remain visible

        const stockBox = document.createElement("div");
        stockBox.classList.add("stock-box");
        stockBox.style.backgroundColor = getColor(stock.change);
        stockBox.style.width = `${Math.max(weight * 5, minSize)}px`;
        stockBox.style.height = `${Math.max(weight * 5, minSize)}px`;

        stockBox.innerHTML = `<strong>${stock.symbol}</strong><br>${stock.change}%`;

        // Add popup details
        const popup = document.createElement("div");
        popup.classList.add("stock-popup");
        popup.innerHTML = `
            <strong>${stock.symbol}</strong><br>
            Shares: ${stock.sharesOwned}<br>
            Avg Price: $${stock.avgPrice.toFixed(2)}<br>
            Market Value: $${marketValue.toFixed(2)}<br>
            Change: ${stock.change}%
            <br>
            <button class="edit-button" onclick="openEditForm(${index})">Edit</button>
            <button class="remove-button" onclick="removeStock(${index})">Remove</button>
        `;
        stockBox.appendChild(popup);

        // Add fade-in animation for new stocks
        stockBox.style.animation = "fadeIn 0.5s ease-out";

        heatmapContainer.appendChild(stockBox);
    });
};

// Function to open edit stock form
const openEditForm = (index) => {
    const stock = stockData[index];
    document.getElementById("editIndex").value = index;
    document.getElementById("editSymbol").value = stock.symbol;
    document.getElementById("editSharesOwned").value = stock.sharesOwned;
    document.getElementById("editAvgPrice").value = stock.avgPrice;
    editStockModal.style.display = "block";
};

// Function to save edited stock details
editStockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const index = document.getElementById("editIndex").value;
    const newShares = parseInt(document.getElementById("editSharesOwned").value);
    const newPrice = parseFloat(document.getElementById("editAvgPrice").value);

    stockData[index].sharesOwned = newShares;
    stockData[index].avgPrice = newPrice;
    editStockModal.style.display = "none";
    updateHeatmap();
});

// Function to remove a stock with animation
const removeStock = (index) => {
    const stockBox = heatmapContainer.children[index];
    if (stockBox) {
        stockBox.style.animation = "fadeOut 0.5s ease-in";
        setTimeout(() => {
            stockData.splice(index, 1);
            updateHeatmap();
        }, 500); // Match animation duration
    } else {
        stockData.splice(index, 1);
        updateHeatmap();
    }
};

// Handle adding a new stock
stockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const symbol = document.getElementById("symbol").value.toUpperCase();
    const sharesOwned = parseInt(document.getElementById("sharesOwned").value);
    const avgPrice = parseFloat(document.getElementById("avgPrice").value);

    if (!symbol || isNaN(sharesOwned) || isNaN(avgPrice)) {
        alert("Please enter valid stock details.");
        return;
    }

    stockData.push({ symbol, sharesOwned, avgPrice, change: 0 });
    addStockModal.style.display = "none";
    stockForm.reset();
    updateHeatmap();
});

// Function to display the list of stock holdings
const updateHoldingsList = () => {
    holdingsList.innerHTML = "";
    if (stockData.length === 0) {
        holdingsList.innerHTML = "<p>No stocks owned yet.</p>";
        return;
    }

    stockData.forEach((stock, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${stock.symbol}</strong> - ${stock.sharesOwned} shares @ $${stock.avgPrice.toFixed(2)}
            <button class="edit-button" onclick="openEditForm(${index})">Edit</button>
            <button class="remove-button" onclick="removeStock(${index})">Remove</button>
        `;
        holdingsList.appendChild(listItem);
    });
};

// Event Listeners for Modal Buttons
addStockBtn.addEventListener("click", () => (addStockModal.style.display = "block"));
viewHoldingsBtn.addEventListener("click", () => {
    updateHoldingsList();
    holdingsModal.style.display = "block";
});
closeAddStock.addEventListener("click", () => (addStockModal.style.display = "none"));
closeEditStock.addEventListener("click", () => (editStockModal.style.display = "none"));
closeHoldings.addEventListener("click", () => (holdingsModal.style.display = "none"));

// Initialize Heatmap
document.addEventListener("DOMContentLoaded", updateHeatmap);
