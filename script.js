document.addEventListener('DOMContentLoaded', function() {
    
    // --- DEFINÍCIE A PREMENNÉ ---
    const itemDefinitions = {
        1: "Quick start guide", 2: "Quick start guide-BPS", 3: "Ethernet cable 5m",
        4: "Ferrite core", 5: "POE injector", 6: "EU power cable",
        7: "HDMI adaptor", 8: "Clamp for calibration ball", 9: "Adaptor calibration ball holder",
        10: "Calibration ball", 11: "Marker board 300x300, Dibond", 12: "US power cable",
        13: "UK power cable", 14: "JPY power cable"
    };
    const extraItemDefinitions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let allOrders = {};
    let dynamicItemCounter = Object.keys(itemDefinitions).length + 20;

    // Elementy stránky
    const orderNumberInput = document.getElementById('order-number');
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const checkboxContainer = document.getElementById('checkbox-container');
    const snInput = document.getElementById('serial-number');
    const nonStandardSnCheckbox = document.getElementById('non-standard-sn');
    const saveBoxBtn = document.getElementById('save-box-btn');
    const savedOrdersContent = document.getElementById('saved-orders-content');
    const printBtn = document.getElementById('print-btn');
    const totalItemsContent = document.getElementById('total-items-content');
    const totalSummaryDiv = document.getElementById('total-summary');
    const extraItemSelect = document.getElementById('extra-item-select');
    const radioVc = document.getElementById('type-vc');
    const radioSmc = document.getElementById('type-smc');
    const radioOther = document.getElementById('type-other');
    const sizeSelectionGroup = document.getElementById('size-selection-group');
    const sizeSelect = document.getElementById('size-select');

    // --- PREPÍNANIE POHĽADOV ---
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const packingView = document.getElementById('packing-view');
    const clocksView = document.getElementById('clocks-view');
    toggleViewBtn.addEventListener('click', function() {
        const isPackingVisible = !packingView.classList.contains('hidden');
        packingView.classList.toggle('hidden', isPackingVisible);
        clocksView.classList.toggle('hidden', !isPackingVisible);
        toggleViewBtn.textContent = isPackingVisible ? 'Zobraziť Tvorbu Krabíc' : 'Zobraziť Svetový Čas';
    });
    
    // --- LOGIKA PRE SVETOVÝ ČAS ---
    const timeZones = { 'USA (Východ)': 'America/New_York', 'USA (Západ)': 'America/Los_Angeles', 'Kanada (Východ)': 'America/Toronto', 'Kanada (Západ)': 'America/Vancouver', 'Čína': 'Asia/Shanghai', 'Japonsko': 'Asia/Tokyo', 'Thajsko': 'Asia/Bangkok', 'Slovensko': 'Europe/Bratislava' };
    function startWorldClocks() {
        const clocksContainer = document.getElementById('world-clocks-container');
        clocksContainer.innerHTML = '';
        Object.keys(timeZones).forEach(name => {
            const clockDiv = document.createElement('div');
            clockDiv.classList.add('clock');
            clockDiv.innerHTML = `<div class="time" id="time-${name.replace(/[^a-zA-Z]/g, '')}"></div><div class="date" id="date-${name.replace(/[^a-zA-Z]/g, '')}"></div><div class="zone">${name}</div>`;
            clocksContainer.appendChild(clockDiv);
        });
        updateClocks();
        setInterval(updateClocks, 1000);
    }
    function updateClocks() {
        Object.entries(timeZones).forEach(([name, zone]) => {
            try {
                const now = new Date();
                const timeEl = document.getElementById(`time-${name.replace(/[^a-zA-Z]/g, '')}`);
                const dateEl = document.getElementById(`date-${name.replace(/[^a-zA-Z]/g, '')}`);
                if (timeEl) timeEl.textContent = now.toLocaleTimeString('sk-SK', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                if (dateEl) dateEl.textContent = now.toLocaleDateString('sk-SK', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
            } catch (e) { console.error(`Chyba pri aktualizácii času pre zónu ${zone}:`, e); }
        });
    }

    // --- LOGIKA APLIKÁCIE PRE TVORBU KRABÍC ---
    
    function validateFormForSave() {
        const orderNumberFilled = orderNumberInput.value.trim() !== '';
        const isVc = radioVc.checked;
        const isSmc = radioSmc.checked;
        const isOther = radioOther.checked;
        const snValue = snInput.value.trim();
        const sizeSelected = sizeSelect.value !== '';
        const atLeastOneItemSelected = Object.keys(getCurrentFormItems()).length > 0;
        
        let snIsValid = false;
        if (nonStandardSnCheckbox.checked) {
            snIsValid = snValue !== '';
        } else {
            const vcPattern = /^[A-Za-z]\d{7}$/;
            const smcPattern = /^[A-Za-z]{3}-\d{3}$/;
            if (isVc) snIsValid = vcPattern.test(snValue);
            if (isSmc) snIsValid = smcPattern.test(snValue);
        }

        let isFormValid = false;
        if (orderNumberFilled && atLeastOneItemSelected) {
            if (isOther) isFormValid = true;
            else if (isVc && snIsValid) isFormValid = true;
            else if (isSmc && snIsValid && sizeSelected) isFormValid = true;
        }
        
        saveBoxBtn.disabled = !isFormValid;
    }

    function handleOrderNumberChange() {
        const orderNumber = orderNumberInput.value.trim();
        if (allOrders[orderNumber]) {
            customerNameInput.value = allOrders[orderNumber].customerName;
            customerAddressInput.value = allOrders[orderNumber].customerAddress;
        } 
        else if (customerNameInput.value !== '' || customerAddressInput.value !== '') {
            customerNameInput.value = '';
            customerAddressInput.value = '';
        }
        validateFormForSave();
    }
    orderNumberInput.addEventListener('blur', handleOrderNumberChange);
    orderNumberInput.addEventListener('input', handleOrderNumberChange);

    function clearCurrentSelection() {
        document.querySelectorAll('#checkbox-container input[type="checkbox"]:checked').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function createCheckboxItem(id, name) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('checkbox-item');
        itemDiv.dataset.id = id;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${id}`;
        const label = document.createElement('label');
        label.htmlFor = `item-${id}`;
        label.textContent = name;
        const counter = document.createElement('input');
        counter.type = 'number';
        counter.id = `counter-${id}`;
        counter.min = 1;
        counter.value = 1;
        counter.classList.add('hidden');
        itemDiv.append(checkbox, label, counter);
        const updateHandler = () => {
            counter.classList.toggle('hidden', !checkbox.checked);
            itemDiv.classList.toggle('checked', checkbox.checked);
            validateFormForSave();
        };
        checkbox.addEventListener('change', updateHandler);
        counter.addEventListener('input', updateHandler);
        return itemDiv;
    }
    
    function generateCheckboxes(items) {
        checkboxContainer.innerHTML = '';
        Object.entries(items).forEach(([id, name]) => {
            checkboxContainer.appendChild(createCheckboxItem(id, name));
        });
    }
    
    function getCurrentFormItems() {
        const currentItems = {};
        document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(checkbox => {
            const itemDiv = checkbox.closest('.checkbox-item');
            const name = itemDiv.querySelector('label').textContent;
            const count = parseInt(itemDiv.querySelector('input[type="number"]').value) || 1;
            currentItems[name] = (currentItems[name] || 0) + count;
        });
        return currentItems;
    }

    function updateTotalSummary() {
        const totalCounts = {};
        const hasSavedItems = Object.keys(allOrders).length > 0;
        if (!hasSavedItems) {
            totalSummaryDiv.classList.add('hidden');
            return;
        }
        totalSummaryDiv.classList.remove('hidden');
        Object.values(allOrders).forEach(orderData => {
            orderData.boxes.forEach(box => {
                box.items.forEach(item => {
                    totalCounts[item.name] = (totalCounts[item.name] || 0) + item.count;
                });
            });
        });
        let totalHTML = '<ul>';
        let grandTotal = 0;
        Object.keys(totalCounts).sort().forEach(name => {
             totalHTML += `<li>${name}: <strong>${totalCounts[name]} ks</strong></li>`;
             grandTotal += totalCounts[name];
        });
        totalHTML += `</ul><hr><p><strong>Celkový počet všetkých kusov: ${grandTotal}</strong></p>`;
        totalItemsContent.innerHTML = totalHTML;
    }

    extraItemDefinitions.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = `Extra položka ${item}`;
        extraItemSelect.appendChild(option);
    });

    extraItemSelect.addEventListener('change', function() {
        if (this.value) {
            const itemName = `Extra položka ${this.value}`;
            if (!document.querySelector(`.checkbox-item input[data-dynamic-name="${itemName}"]`)) {
                 const newItemDiv = createCheckboxItem(dynamicItemCounter, itemName);
                 newItemDiv.querySelector('input[type="checkbox"]').dataset.dynamicName = itemName;
                 checkboxContainer.appendChild(newItemDiv);
                 dynamicItemCounter++;
            }
            this.value = '';
        }
    });
    
    function handleTypeChange() {
        clearCurrentSelection();
        const isVc = radioVc.checked;
        const isSmc = radioSmc.checked;
        const isOther = radioOther.checked;
        document.getElementById('sn-group').classList.toggle('hidden', isOther);
        document.getElementById('preset-buttons-vc').classList.toggle('hidden', !isVc);
        document.getElementById('preset-buttons-smc').classList.toggle('hidden', !isSmc);
        sizeSelectionGroup.classList.toggle('hidden', !isSmc);
        nonStandardSnCheckbox.checked = false;
        validateFormForSave();
    }
    
    [radioVc, radioSmc, radioOther, snInput, sizeSelect, orderNumberInput, customerNameInput, customerAddressInput, nonStandardSnCheckbox].forEach(el => {
        el.addEventListener('change', validateFormForSave);
        el.addEventListener('input', validateFormForSave);
    });
    [radioVc, radioSmc, radioOther].forEach(el => el.addEventListener('change', handleTypeChange));

    [document.getElementById('preset-buttons-vc'), document.getElementById('preset-buttons-smc')].forEach(container => {
        container.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') setPreset(e.target.dataset.preset);
        });
    });

    function setPreset(preset) {
        clearCurrentSelection();
        let itemsToSelect = [], baseVC = [2, 7, 8, 9, 10, 11];
        switch (preset) {
            case 'eu': itemsToSelect = [...baseVC, 6]; break;
            case 'us': itemsToSelect = [...baseVC, 12]; break;
            case 'uk': itemsToSelect = [...baseVC, 13]; break;
            case 'jpy': itemsToSelect = [...baseVC, 14]; break;
            case 'smc': itemsToSelect = [1, 3, 4, 5, 6]; break;
        }
        itemsToSelect.forEach(id => {
            const cb = document.getElementById(`item-${id}`);
            if (cb && !cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        validateFormForSave();
    }

    saveBoxBtn.addEventListener('click', function() {
        const orderNumber = orderNumberInput.value.trim();
        const customerName = customerNameInput.value.trim();
        const customerAddress = customerAddressInput.value.trim();
        let finalItemsObject = getCurrentFormItems();
        const boxType = document.querySelector('input[name="box-type"]:checked').value;
        if (boxType === 'VC') {
            finalItemsObject['VC paper box inner'] = (finalItemsObject['VC paper box inner'] || 0) + 1;
            finalItemsObject['VC paper box outer'] = (finalItemsObject['VC paper box outer'] || 0) + 1;
        } else if (boxType === 'S/MC') {
            const size = sizeSelect.value;
            finalItemsObject[`${size} paper box inner`] = (finalItemsObject[`${size} paper box inner`] || 0) + 1;
            finalItemsObject[`${size} paper box outer`] = (finalItemsObject[`${size} paper box outer`] || 0) + 1;
        }
        if (!allOrders[orderNumber]) {
            allOrders[orderNumber] = {
                orderNumber: orderNumber,
                customerName: customerName,
                customerAddress: customerAddress,
                boxes: []
            };
        }
        allOrders[orderNumber].customerName = customerName;
        allOrders[orderNumber].customerAddress = customerAddress;
        
        let snValue = radioOther.checked ? 'Ostatné' : snInput.value.trim();
        if (nonStandardSnCheckbox.checked) {
            snValue += " (Netradičné)";
        }
        
        allOrders[orderNumber].boxes.push({ 
            sn: snValue,
            type: boxType, 
            items: Object.entries(finalItemsObject).map(([name, count]) => ({name, count})) 
        });
        renderSavedOrders();
        resetForm();
    });
    
    function renderSavedOrders() {
        savedOrdersContent.innerHTML = '';
        Object.values(allOrders).forEach(orderData => {
            const orderGroupDiv = document.createElement('div');
            orderGroupDiv.classList.add('order-group');
            let groupHTML = `<h3>Objednávka: ${orderData.orderNumber}</h3>
                             <p><strong>Zákazník:</strong> ${orderData.customerName || 'N/A'}<br>
                                <strong>Adresa:</strong> ${orderData.customerAddress || 'N/A'}</p>`;
            orderData.boxes.forEach(box => {
                groupHTML += '<div class="summary-box">';
                groupHTML += `<h4>SN: ${box.sn}</h4>`;
                groupHTML += '<ul>';
                box.items.forEach(item => { groupHTML += `<li>${item.name}: <strong>${item.count} ks</strong></li>`; });
                groupHTML += '</ul></div>';
            });
            orderGroupDiv.innerHTML = groupHTML;
            savedOrdersContent.appendChild(orderGroupDiv);
        });
        printBtn.classList.toggle('hidden', Object.keys(allOrders).length === 0);
    }

    function resetForm() {
        snInput.value = '';
        nonStandardSnCheckbox.checked = false;
        sizeSelect.value = '';
        generateCheckboxes(itemDefinitions);
        extraItemSelect.value = '';
        radioVc.checked = true;
        radioVc.dispatchEvent(new Event('change'));
        snInput.focus();
        validateFormForSave();
    }

    printBtn.addEventListener('click', () => window.print());

    // --- INICIALIZÁCIA APLIKÁCIE ---
    startWorldClocks();
    generateCheckboxes(itemDefinitions);
    handleTypeChange();
    updateTotalSummary();
    validateFormForSave();
});
