document.addEventListener("DOMContentLoaded", () => {
    let investments = [];
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
  
    // Load investments from localStorage if available
    if (localStorage.getItem('investments')) {
      investments = JSON.parse(localStorage.getItem('investments'));
      renderInvestments();
    }
  
    // Save investments to localStorage
    function saveInvestments() {
      localStorage.setItem('investments', JSON.stringify(investments));
    }
  
    // --- TREEMAP LAYOUT ALGORITHM (Slice-and-Dice) ---
    // Recursively splits the container rectangle among items.
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
      // Ensure each item has a "value" property
      const sorted = items.slice().sort((a, b) => b.value - a.value);
      const initialOrientation = containerRect.width >= containerRect.height;
      return layoutTreemap(sorted, containerRect, initialOrientation);
    }
    // --- END TREEMAP LAYOUT ALGORITHM ---
  
    // Render the heatmap using a fixed container and computed treemap layout.
    function renderInvestments() {
      heatmapGrid.innerHTML = '';
      if (investments.length === 0) {
        document.getElementById("portfolioValue").textContent = "Total Portfolio Value: $0.00";
        return;
      }
      
      // Compute total portfolio value and assign each investment a value.
      let totalValue = 0;
      investments.forEach(inv => {
        inv.value = inv.shares * inv.avgPrice;
        totalValue += inv.value;
        if (!inv.hasOwnProperty('dailyChange')) {
          inv.dailyChange = (Math.random() * 10 - 5).toFixed(2);
        }
      });
      document.getElementById("portfolioValue").textContent = "Total Portfolio Value: $" + totalValue.toFixed(2);
      
      // Get container dimensions
      const containerRect = {
        x: 0,
        y: 0,
        width: heatmapGrid.clientWidth,
        height: heatmapGrid.clientHeight
      };
      
      // Compute layout
      const layouts = computeTreemapLayout(investments, containerRect);
      
      // Create tiles according to layout
      layouts.forEach(layout => {
        const inv = investments.find(item => item.id === layout.id);
        if (!inv) return;
        const dailyChange = parseFloat(inv.dailyChange);
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
        // Apply a 4px margin between tiles by adjusting positions and sizes.
        const tileMargin = 4;
        tile.style.left = (layout.x + tileMargin/2) + 'px';
        tile.style.top = (layout.y + tileMargin/2) + 'px';
        tile.style.width = (layout.width - tileMargin) + 'px';
        tile.style.height = (layout.height - tileMargin) + 'px';
        tile.style.backgroundColor = color;
        
        tile.innerHTML = `
          <div class="tile-default">
            <h3>${inv.stockSymbol.toUpperCase()}</h3>
            <p>${dailyChange >= 0 ? '+' : ''}${inv.dailyChange}%</p>
          </div>
          <div class="tile-hover">
            <p>Shares: ${inv.shares}</p>
            <p>Avg Price: $${inv.avgPrice}</p>
            <p>Total: $${(inv.shares * inv.avgPrice).toFixed(2)}</p>
            <div class="tile-actions">
              <button class="list-btn" data-action="edit" data-id="${inv.id}">Edit</button>
              <button class="list-btn" data-action="delete" data-id="${inv.id}">Delete</button>
            </div>
          </div>
        `;
        
        heatmapGrid.appendChild(tile);
      });
    }
  
    // Render the investment list modal
    function renderInvestmentList() {
      investmentList.innerHTML = '';
      investments.forEach(investment => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${investment.stockSymbol.toUpperCase()} - ${investment.shares} shares @ $${investment.avgPrice}</span>
          <div>
            <button class="list-btn" data-action="edit" data-id="${investment.id}">Edit</button>
            <button class="list-btn" data-action="delete" data-id="${investment.id}">Delete</button>
          </div>
        `;
        investmentList.appendChild(li);
      });
    }
  
    // Open "Add Investment" modal
    addInvestmentBtn.addEventListener('click', () => {
      modalTitle.textContent = 'Add Investment';
      investmentForm.reset();
      document.getElementById('investmentId').value = '';
      openModal(investmentModal);
    });
  
    // Open "Investment List" modal
    viewInvestmentsBtn.addEventListener('click', () => {
      renderInvestmentList();
      openModal(listModal);
    });
  
    // Open modal helper
    function openModal(modal) {
      modal.style.display = 'block';
    }
    // Close modal helper
    function closeModalFunc(modal) {
      modal.style.display = 'none';
    }
  
    // Close modals when clicking on the close button
    closeModal.addEventListener('click', () => closeModalFunc(investmentModal));
    closeListModal.addEventListener('click', () => closeModalFunc(listModal));
  
    // Close modal when clicking outside the modal content
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
  
      if (investmentId) {
        // Edit existing investment
        investments = investments.map(inv => {
          if (inv.id === investmentId) {
            return { ...inv, stockSymbol, shares, avgPrice };
          }
          return inv;
        });
      } else {
        // Add new investment with a unique ID
        const newInvestment = {
          id: Date.now().toString(),
          stockSymbol,
          shares,
          avgPrice
        };
        investments.push(newInvestment);
      }
      saveInvestments();
      renderInvestments();
      renderInvestmentList();
      closeModalFunc(investmentModal);
    });
  
    // Delegate edit and delete actions (from both the heatmap tiles and investment list)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.list-btn')) {
        const action = e.target.getAttribute('data-action');
        const id = e.target.getAttribute('data-id');
        if (action === 'edit') {
          const inv = investments.find(item => item.id === id);
          if (inv) {
            document.getElementById('investmentId').value = inv.id;
            document.getElementById('stockSymbol').value = inv.stockSymbol;
            document.getElementById('shares').value = inv.shares;
            document.getElementById('avgPrice').value = inv.avgPrice;
            modalTitle.textContent = 'Edit Investment';
            closeModalFunc(listModal);
            openModal(investmentModal);
          }
        } else if (action === 'delete') {
          investments = investments.filter(item => item.id !== id);
          saveInvestments();
          renderInvestments();
          renderInvestmentList();
        }
      }
    });
  
    // Re-render treemap on window resize to adjust layout
    window.addEventListener('resize', () => {
      renderInvestments();
    });
  });
  