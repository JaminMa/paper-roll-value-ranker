document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const titleInput = document.getElementById('titleInput');
    const priceInput = document.getElementById('priceInput');
    const linkInput = document.getElementById('linkInput');
    const bountyResultsList = document.getElementById('bountyResultsList');
    const charminResultsList = document.getElementById('charminResultsList');
    const clearListBtn = document.getElementById('clearListBtn');
    const errorBanner = document.getElementById('errorBanner');
    const errorMessage = document.getElementById('errorMessage');

    let bountyProducts = [];
    let charminProducts = [];

    const defaultRollValues = {
        'Bounty': {
            'Regular': 1,
            'Big': 1.33,
            'Giant': 1.5,
            'Single Plus': 1.5,
            'Super': 1.83,
            'Double': 2,
            'Double Plus': 2.5,
            'Family': 2.5,
            'Triple': 3,
            'Family Triple': 3.375
        },
        'Charmin Ultra Soft': {
            'Mega': 208,
            'Jumbo': 213,
            'Family Mega': 267,
            'Mega XL': 312,
            'Family Mega XL': 364,
            'Super Mega': 366,
            'Mega XXL': 416
        },
        'Charmin Ultra Strong': {
            'Mega': 220,
            'Family Mega': 275,
            'Mega XL': 330,
            'Super Mega': 363,
            'Family Mega XL': 385,
            'Mega XXL': 440
        }
    };

    let brandRollValues = JSON.parse(JSON.stringify(defaultRollValues));

    function loadRollValues() {
        const saved = localStorage.getItem('brandRollValues');
        if (saved) {
            try {
                brandRollValues = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved RollValues", e);
            }
        }
    }

    function saveRollValues() {
        localStorage.setItem('brandRollValues', JSON.stringify(brandRollValues));
    }

    loadRollValues();

    function loadProducts() {
        const savedBounty = localStorage.getItem('bountyProducts');
        if (savedBounty) {
            try {
                bountyProducts = JSON.parse(savedBounty);
            } catch (e) {
                console.error("Failed to parse saved bounty products", e);
            }
        }
        const savedCharmin = localStorage.getItem('charminProducts');
        if (savedCharmin) {
            try {
                charminProducts = JSON.parse(savedCharmin);
            } catch (e) {
                console.error("Failed to parse saved charmin products", e);
            }
        }
    }

    function saveProducts() {
        localStorage.setItem('bountyProducts', JSON.stringify(bountyProducts));
        localStorage.setItem('charminProducts', JSON.stringify(charminProducts));
    }

    loadProducts();
    renderResults();

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        const title = titleInput.value.trim();
        const price = parseFloat(priceInput.value);
        const link = linkInput.value.trim();

        if (!title || isNaN(price)) {
            showError("Please enter a valid title and price.");
            return;
        }

        const parsed = parseProductTitle(title);
        if (!parsed.success) {
            showError(parsed.error);
            return;
        }

        const totalUnits = parsed.packSize * parsed.rollValue;
        const costPerUnit = parsed.brand === 'Bounty' ? price / totalUnits : price / (totalUnits / 100);

        const newProduct = {
            id: Date.now(),
            addedAt: Date.now(),
            originalTitle: title,
            price: price,
            link: link,
            brand: parsed.brand,
            packSize: parsed.packSize,
            rollType: parsed.rollType,
            totalUnits: totalUnits,
            costPerUnit: costPerUnit,
            isNew: true
        };

        // Reset isNew flag on existing products
        bountyProducts.forEach(p => p.isNew = false);
        charminProducts.forEach(p => p.isNew = false);

        if (parsed.brand === 'Bounty') {
            bountyProducts.push(newProduct);
            bountyProducts.sort((a, b) => a.costPerUnit - b.costPerUnit);
        } else if (parsed.brand.startsWith('Charmin')) {
            charminProducts.push(newProduct);
            charminProducts.sort((a, b) => a.costPerUnit - b.costPerUnit);
        }

        saveProducts();
        renderResults();

        // Reset inputs
        titleInput.value = '';
        priceInput.value = '';
        linkInput.value = '';
        titleInput.focus();
    });

    if (clearListBtn) {
        clearListBtn.addEventListener('click', () => {
            bountyProducts = [];
            charminProducts = [];
            saveProducts();
            renderResults();
        });
    }

    function parseProductTitle(title) {
        const lowerTitle = title.toLowerCase();

        // 1. Extract Brand
        let brand = 'Unknown';
        if (lowerTitle.includes('bounty')) {
            brand = 'Bounty';
        } else if (lowerTitle.includes('charmin')) {
            if (lowerTitle.includes('strong')) {
                brand = 'Charmin Ultra Strong';
            } else {
                // Default to soft if not explicitly strong
                brand = 'Charmin Ultra Soft';
            }
        }

        if (brand === 'Unknown') {
            return { success: false, error: "Could not identify brand (must be Bounty or Charmin)." };
        }

        // 2. Extract Pack Size
        let packSize = null;
        // Matches "8-pk", "8 pk", "12 rolls", "6ct", etc.
        const packMatch = lowerTitle.match(/(\d+)\s*(?:-?pk|-?pack|rolls?|ct\b)/);
        if (packMatch) {
            packSize = parseInt(packMatch[1], 10);
        } else {
            // Fallback: look for the first standalone number
            const numMatch = lowerTitle.match(/\b(\d+)\b/);
            if (numMatch) {
                packSize = parseInt(numMatch[1], 10);
            }
        }

        if (!packSize) {
            return { success: false, error: "Could not identify pack size (e.g., 8-Pk)." };
        }

        // 3. Extract Roll rollValue Type
        let matchedTypes = [];
        const activeRollValues = brandRollValues[brand];

        for (const [key, val] of Object.entries(activeRollValues)) {
            if (lowerTitle.includes(key.toLowerCase())) {
                matchedTypes.push({ key, val });
            }
        }

        let rollType = null;
        let rollValue = null;

        if (matchedTypes.length > 0) {
            // Sort by highest rollValue first. If equal, prefer the longer string (e.g., 'super mega' over 'mega')
            matchedTypes.sort((a, b) => {
                if (b.val !== a.val) {
                    return b.val - a.val;
                }
                return b.key.length - a.key.length;
            });

            rollType = matchedTypes[0].key;
            rollValue = matchedTypes[0].val;
        } else {
            // Default to Regular if no keyword found
            rollType = 'Regular';
            rollValue = 1;
        }

        return {
            success: true,
            brand,
            packSize,
            rollType,
            rollValue
        };
    }

    function renderResults() {
        renderList(bountyProducts, bountyResultsList);
        renderList(charminProducts, charminResultsList);
    }

    function renderList(productsList, container) {
        container.innerHTML = '';

        if (productsList.length === 0) {
            container.innerHTML = '<div style="padding: 16px; color: var(--mdc-theme-text-secondary); text-align: center;">No products added yet.</div>';
            return;
        }

        productsList.forEach((product, index) => {
            const isBestValue = index === 0 && productsList.length > 1;

            const item = document.createElement(product.link ? 'a' : 'div');
            if (product.link) {
                item.href = product.link;
                item.target = '_blank';
                item.rel = 'noopener noreferrer';
                item.style.textDecoration = 'none';
                item.style.color = 'inherit';
            }
            item.className = `result-item ${isBestValue ? 'best-value' : ''} ${product.isNew ? 'new-item' : ''}`;

            const isBounty = product.brand === 'Bounty';
            const unitLabel = isBounty ? 'Regular Rolls' : 'Total Sheets';
            const costDenominator = isBounty ? '/ Reg Roll' : '/ 100 Sheets';
            const timestamp = product.addedAt ? new Date(product.addedAt).toLocaleString() : '';

            item.innerHTML = `
                <div class="rank-badge">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name" title="${product.originalTitle}">
                        ${product.brand} - ${product.packSize} ${product.rollType} Rolls${product.isNew ? '<span class="new-badge">NEW</span>' : ''}
                    </div>
                    <div class="product-meta">
                        $${product.price.toFixed(2)} &bull; ${product.totalUnits} ${unitLabel}
                        ${timestamp ? `<br><span class="timestamp-label" style="font-size: 0.75rem; color: var(--mdc-theme-text-secondary); opacity: 0.8;">Added: ${timestamp}</span>` : ''}
                    </div>
                </div>
                <div class="cost-info">
                    <div class="cost-value">$${product.costPerUnit.toFixed(2)}</div>
                    <div class="cost-label">${costDenominator}</div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    // --- Settings Modal Logic ---
    let workingRollValues = null;

    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsContainer = document.getElementById('settingsContainer');

    openSettingsBtn.addEventListener('click', () => {
        // Create a working copy for the modal
        workingRollValues = JSON.parse(JSON.stringify(brandRollValues));
        renderSettings();
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        // Discard working copy by simply closing
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        // Apply working copy to actual state
        brandRollValues = JSON.parse(JSON.stringify(workingRollValues));
        saveRollValues();
        if (bountyProducts.length > 0 || charminProducts.length > 0) {
            recalculateProducts();
        }
        settingsModal.classList.add('hidden');
    });

    resetSettingsBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to restore the default RollValues? This will erase any custom entries. (Click Save & Close to apply)")) {
            workingRollValues = JSON.parse(JSON.stringify(defaultRollValues));
            renderSettings();
        }
    });

    function renderSettings() {
        settingsContainer.innerHTML = '';
        const brands = Object.keys(workingRollValues);
        brands.forEach(brand => {
            const brandId = brand.replace(/\s+/g, '');
            const section = document.createElement('div');
            section.className = 'brand-section';

            section.innerHTML = `
                <h3>${brand}</h3>
                <div id="${brandId}ConfigList" class="config-list"></div>
                <form id="add${brandId}Form" class="add-config-form">
                    <input type="text" id="new${brandId}Name" placeholder="Roll Name" required>
                    <input type="number" id="new${brandId}Value" step="0.01" min="0.01" placeholder="Value" required>
                    <button type="submit" class="mdc-button mdc-button--raised">+</button>
                </form>
            `;
            settingsContainer.appendChild(section);

            const listContainer = document.getElementById(`${brandId}ConfigList`);
            renderConfigList(brand, listContainer);

            const form = document.getElementById(`add${brandId}Form`);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById(`new${brandId}Name`);
                const valInput = document.getElementById(`new${brandId}Value`);
                const key = nameInput.value.trim();
                const val = parseFloat(valInput.value);

                if (key && !isNaN(val) && val > 0) {
                    workingRollValues[brand][key] = val;
                    nameInput.value = '';
                    valInput.value = '';
                    renderConfigList(brand, listContainer);
                }
            });
        });
    }

    function renderConfigList(brand, container) {
        container.innerHTML = '';

        const sortedKeys = Object.keys(workingRollValues[brand]).sort((a, b) => {
            return workingRollValues[brand][a] - workingRollValues[brand][b];
        });

        sortedKeys.forEach(key => {
            const val = workingRollValues[brand][key];
            const div = document.createElement('div');
            div.className = 'config-item';

            div.innerHTML = `
                <span class="config-name">${key}</span>
                <input type="number" class="config-val-input" step="0.01" min="0.01" value="${val}" data-brand="${brand}" data-key="${key}">
                <button class="icon-button delete-btn" data-brand="${brand}" data-key="${key}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            container.appendChild(div);
        });

        const inputs = container.querySelectorAll('.config-val-input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const b = e.target.dataset.brand;
                const k = e.target.dataset.key;
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) {
                    workingRollValues[b][k] = v;
                }
            });
        });

        const deletes = container.querySelectorAll('.delete-btn');
        deletes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const b = e.currentTarget.dataset.brand;
                const k = e.currentTarget.dataset.key;
                delete workingRollValues[b][k];
                renderConfigList(b, container);
            });
        });
    }

    function recalculateProducts() {
        const recalculateList = (list) => {
            list.forEach(product => {
                const parsed = parseProductTitle(product.originalTitle);
                if (parsed.success) {
                    product.brand = parsed.brand;
                    product.packSize = parsed.packSize;
                    product.rollType = parsed.rollType;

                    product.totalUnits = parsed.packSize * parsed.rollValue;
                    product.costPerUnit = parsed.brand === 'Bounty' ? product.price / product.totalUnits : product.price / (product.totalUnits / 100);
                }
            });
            list.sort((a, b) => a.costPerUnit - b.costPerUnit);
        };

        recalculateList(bountyProducts);
        recalculateList(charminProducts);

        saveProducts();
        renderResults();
    }

});
