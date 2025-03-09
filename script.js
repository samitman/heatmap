const stockData = JSON.parse(localStorage.getItem("stockData")) || [];
const heatmapContainer = document.getElementById("heatmap-container");
const totalPortfolioValueText = document.getElementById("total-portfolio-value");
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

// Function to calculate total portfolio value
const calculateTotalPortfolioValue = () => {
    const totalValue = stockData.reduce((sum, stock) => sum + (stock.sharesOwned * stock.avgPrice), 0);
    totalPortfolioValueText.innerText = `Total Portfolio Value: $${totalValue.toFixed(2)}`;
};

// Function to determine tile size based on investment weight
const getTileSize = (investment, maxInvestment) => {
    return Math.max(60, Math.floor((investment / maxInvestment) * 300)); // Scale dynamically
};

// Function to determine color based on stock change
const getColor = (change) => {
    if (change >= 5) return "#00FF00"; 
    if (change > 0) return "#00C853"; 
    if (change === 0) return "#666666"; 
    if (change > -5) return "#D32F2F"; 
    return "#8B0000"; 
};

// Function to update heatmap layout **NO GAPS**
const updateHeatmap = () => {
    heatmapContainer.innerHTML = "";
    saveToLocalStorage();
    calculateTotalPortfolioValue();

    if (stockData.length === 0) {
        heatmapContainer.innerHTML = "<p>No stocks added yet.</p>";
        return;
    }

    stockData.sort((a, b) => (b.sharesOwned * b.avgPrice) - (a.sharesOwned * a.avgPrice));
    const maxInvestment = Math.max(...stockData.map(stock => stock.sharesOwned * stock.avgPrice));

    // Grid setup for **rectangular, gap-free layout**
    heatmapContainer.style.display = "grid";
    heatmapContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
    heatmapContainer.style.gap = "0px"; // Ensures tiles touch each other

    stockData.forEach((stock, index) => {
        const investment = stock.sharesOwned * stock.avgPrice;
        const tileSize = getTileSize(investment, maxInvestment);

        const stockBox = document.createElement("div");
        stockBox.classList.add("stock-box");
        stockBox.style.backgroundColor = getColor(stock.change);
        stockBox.style.width = `${tileSize}px`;
        stockBox.style.height = `${tileSize}px`;
        stockBox.innerHTML = `
            <strong>${stock.symbol}</strong>
            <br>
            <span>${stock.change}%</span>
        `;

        // Popup details (Now remains visible for interaction)
        const popup = document.createElement("div");
        popup.classList.add("stock-popup");
        popup.innerHTML = `
            <strong>${stock.symbol}</strong><br>
            Shares: ${stock.sharesOwned}<br>
            Avg Price: $${stock.avgPrice.toFixed(2)}<br>
            Market Value: $${investment.toFixed(2)}<br>
            Change: ${stock.change}%
            <br>
            <button class="edit-button" onclick="openEditForm(${index})">Edit</button>
            <button class="remove-button" onclick="removeStock(${index})">Remove</button>
        `;
        
        stockBox.appendChild(popup);
        
        // Keep popup visible when hovering
        stockBox.addEventListener("mouseenter", () => popup.style.display = "block");
        stockBox.addEventListener("mouseleave", () => {
            setTimeout(() => {
                if (!popup.matches(":hover")) popup.style.display = "none";
            }, 300);
        });

        popup.addEventListener("mouseenter", () => popup.style.display = "block");
        popup.addEventListener("mouseleave", () => popup.style.display = "none");

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

// Function to remove a stock
const removeStock = (index) => {
    stockData.splice(index, 1);
    updateHeatmap();
};

// Handle adding a new stock
stockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const symbol = document.getElementById("symbol").value.toUpperCase();
    const sharesOwned = parseInt(document.getElementById("sharesOwned").value);
    const avgPrice = parseFloat(document.getElementById("avgPrice").value);
    const change = (Math.random() * 20 - 10).toFixed(2);

    stockData.push({ symbol, sharesOwned, avgPrice, change });
    addStockModal.style.display = "none";
    stockForm.reset();
    updateHeatmap();
});

// Function to update holdings list
const updateHoldingsList = () => {
    holdingsList.innerHTML = "";
    if (stockData.length === 0) {
        holdingsList.innerHTML = "<p>No stocks owned yet.</p>";
        return;
    }

    stockData.forEach((stock, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <div class="holding-info">
                <strong>${stock.symbol}</strong> - ${stock.sharesOwned} shares @ $${stock.avgPrice.toFixed(2)}
            </div>
            <div class="holding-buttons">
                <button class="edit-button" onclick="openEditForm(${index})">Edit</button>
                <button class="remove-button" onclick="removeStock(${index})">Remove</button>
            </div>
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
