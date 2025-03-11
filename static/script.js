document.addEventListener("DOMContentLoaded", () => {
  const heatmapGrid = document.getElementById('heatmapGrid');
  const investmentModal = document.getElementById('investmentModal');
  const listModal = document.getElementById('listModal');
  const closeModal = document.getElementById('closeModal');
  const closeListModal = document.getElementById('closeListModal');
  const addInvestmentBtn = document.getElementById('addInvestmentBtn');
  const viewInvestmentsBtn = document.getElementById('viewInvestmentsBtn');
  const investmentForm = document.getElementById('investmentForm');
  const investmentList = document.getElementById('investmentList');
  const modalTitle = document.getElementById('modalTitle');

  // Fetch investments from the backend API
  function loadInvestments() {
    fetch('/investments')
      .then(response => response.json())
      .then(data => {
        renderInvestments(data);
        renderInvestmentList(data);
      })
      .catch(error => console.error('Error fetching investments:', error));
  }

  // --- TREEMAP LAYOUT ALGORITHM (Slice-and-Dice) ---
  function layoutTreemap(items, rect, vertical) {
    if (items.length === 0) return [];
    if (items.length === 1) {
      return [{
        id: items[0].id,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }];
    }
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    let running = 0, splitIndex = 0;
    for (let i = 0; i < items.length; i++) {
      running += items[i].value;
      if (running >= totalValue / 2) {
        splitIndex = i + 1;
        break;
      }
    }
    if (splitIndex === 0) splitIndex = 1;
    const group1 = items.slice(0, splitIndex);
    const group2 = items.slice(splitIndex);
    const sumGroup1 = group1.reduce((s, item) => s + item.value, 0);
    const layouts = [];
    if (vertical) {
      const width1 = rect.width * (sumGroup1 / totalValue);
      const rect1 = { x: rect.x, y: rect.y, width: width1, height: rect.height };
      const rect2 = { x: rect.x + width1, y: rect.y, width: rect.width - width1, height: rect.height };
      layouts.push(...layoutTreemap(group1, rect1, !vertical));
      layouts.push(...layoutTreemap(group2, rect2, !vertical));
    } else {
      const height1 = rect.height * (sumGroup1 / totalValue);
      const rect1 = { x: rect.x, y: rect.y, width: rect.width, height: height1 };
      const rect2 = { x: rect.x, y: rect.y + height1, width: rect.width, height: rect.height - height1 };
      layouts.push(...layoutTreemap(group1, rect1, !vertical));
      layouts.push(...layoutTreemap(group2, rect2, !vertical));
    }
    return layouts;
  }

  function computeTreemapLayout(items, containerRect) {
    const sorted = items.slice().sort((a, b) => b.value - a.value);
    const initialOrientation = containerRect.width >= containerRect.height;
    return layoutTreemap(sorted, containerRect, initialOrientation);
  }
  // --- END TREEMAP LAYOUT ALGORITHM ---

  // Render the heatmap using fetched investment data
  function renderInvestments(investments) {
    heatmapGrid.innerHTML = '';
    if (investments.length === 0) {
      document.getElementById("portfolioValue").textContent = "Total Portfolio Value: $0.00";
      return;
    }
    
    let totalValue = 0;
    investments.forEach(inv => {
      // Calculate total investment value
      inv.value = inv.shares * inv.avg_price;
      totalValue += inv.value;
      // Generate a daily change if not available
      if (!inv.daily_change) {
        inv.daily_change = (Math.random() * 10 - 5).toFixed(2);
      }
    });
    document.getElementById("portfolioValue").textContent = "Total Portfolio Value: $" + totalValue.toFixed(2);
    
    const containerRect = {
      x: 0,
      y: 0,
      width: heatmapGrid.clientWidth,
      height: heatmapGrid.clientHeight
    };
    
    const layouts = computeTreemapLayout(investments, containerRect);
    
    layouts.forEach(layout => {
      const inv = investments.find(item => item.id === layout.id);
      if (!inv) return;
      const dailyChange = parseFloat(inv.daily_change);
      const magnitude = Math.min(Math.abs(dailyChange) / 5, 1);
      let color;
      if (dailyChange >= 0) {
        const lightness = 60 - (magnitude * 20);
        color = `hsl(120, 70%, ${lightness}%)`;
      } else {
        const lightness = 60 - (magnitude * 20);
        color = `hsl(0, 70%, ${lightness}%)`;
      }
      
      const tile = document.createElement('div');
      tile.classList.add('investment-tile');
      const tileMargin = 4;
      tile.style.left = (layout.x + tileMargin/2) + 'px';
      tile.style.top = (layout.y + tileMargin/2) + 'px';
      tile.style.width = (layout.width - tileMargin) + 'px';
      tile.style.height = (layout.height - tileMargin) + 'px';
      tile.style.backgroundColor = color;
      
      tile.innerHTML = `
        <div class="tile-default">
          <h3>${inv.stock_symbol.toUpperCase()}</h3>
          <p>${dailyChange >= 0 ? '+' : ''}${inv.daily_change}%</p>
        </div>
        <div class="tile-hover">
          <p>Shares: ${inv.shares}</p>
          <p>Avg Price: $${inv.avg_price}</p>
          <p>Total: $${(inv.shares * inv.avg_price).toFixed(2)}</p>
          <div class="tile-actions">
            <button class="list-btn" data-action="edit" data-id="${inv.id}">Edit</button>
            <button class="list-btn" data-action="delete" data-id="${inv.id}">Delete</button>
          </div>
        </div>
      `;
      
      heatmapGrid.appendChild(tile);
    });
  }

  // Render the investment list in the modal
  function renderInvestmentList(investments) {
    investmentList.innerHTML = '';
    investments.forEach(investment => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${investment.stock_symbol.toUpperCase()} - ${investment.shares} shares @ $${investment.avg_price}</span>
        <div>
          <button class="list-btn" data-action="edit" data-id="${investment.id}">Edit</button>
          <button class="list-btn" data-action="delete" data-id="${investment.id}">Delete</button>
        </div>
      `;
      investmentList.appendChild(li);
    });
  }

  // Open modal helper
  function openModal(modal) {
    modal.style.display = 'block';
  }

  // Close modal helper
  function closeModalFunc(modal) {
    modal.style.display = 'none';
  }

  // Event listener: open "Add Investment" modal
  addInvestmentBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add Investment';
    investmentForm.reset();
    document.getElementById('investmentId').value = '';
    openModal(investmentModal);
  });

  // Event listener: open "Investment List" modal and load data
  viewInvestmentsBtn.addEventListener('click', () => {
    loadInvestments();
    openModal(listModal);
  });

  // Close modals when clicking on close button
  closeModal.addEventListener('click', () => closeModalFunc(investmentModal));
  closeListModal.addEventListener('click', () => closeModalFunc(listModal));

  // Close modal when clicking outside modal content
  window.addEventListener('click', (event) => {
    if (event.target === investmentModal) {
      closeModalFunc(investmentModal);
    } else if (event.target === listModal) {
      closeModalFunc(listModal);
    }
  });

  // Handle form submission for adding or editing an investment
  investmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const investmentId = document.getElementById('investmentId').value;
    const stockSymbol = document.getElementById('stockSymbol').value;
    const shares = parseFloat(document.getElementById('shares').value);
    const avgPrice = parseFloat(document.getElementById('avgPrice').value);

    const data = {
      stock_symbol: stockSymbol,
      shares: shares,
      avg_price: avgPrice
    };

    if (investmentId) {
      // Update existing investment via PUT request
      fetch(`/investment/${investmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        console.log('Updated:', result);
        loadInvestments();
      })
      .catch(error => console.error('Error updating investment:', error));
    } else {
      // Add new investment via POST request
      fetch('/investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        console.log('Added:', result);
        loadInvestments();
      })
      .catch(error => console.error('Error adding investment:', error));
    }
    closeModalFunc(investmentModal);
  });

  // Delegate click events for edit and delete actions on both tiles and list
  document.addEventListener('click', (e) => {
    if (e.target.matches('.list-btn')) {
      const action = e.target.getAttribute('data-action');
      const id = e.target.getAttribute('data-id');
      if (action === 'edit') {
        // Retrieve investment details and populate the form for editing
        fetch('/investments')
          .then(response => response.json())
          .then(data => {
            const inv = data.find(item => item.id == id);
            if (inv) {
              document.getElementById('investmentId').value = inv.id;
              document.getElementById('stockSymbol').value = inv.stock_symbol;
              document.getElementById('shares').value = inv.shares;
              document.getElementById('avgPrice').value = inv.avg_price;
              modalTitle.textContent = 'Edit Investment';
              closeModalFunc(listModal);
              openModal(investmentModal);
            }
          })
          .catch(error => console.error('Error fetching investment for edit:', error));
      } else if (action === 'delete') {
        // Delete the investment via DELETE request
        fetch(`/investment/${id}`, {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
          console.log('Deleted:', result);
          loadInvestments();
        })
        .catch(error => console.error('Error deleting investment:', error));
      }
    }
  });

  // Re-render treemap on window resize to adjust layout
  window.addEventListener('resize', loadInvestments);

  // Initial load of investments
  loadInvestments();
});
