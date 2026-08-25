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
    let allBoxes = []; 
    let dynamicItemCounter = Object.keys(itemDefinitions).length + 1;

    // Elementy stránky
    const checkboxContainer = document.getElementById('checkbox-container');
    const snInput = document.getElementById('serial-number');
    const customerNameInput = document.getElementById('customer-name');
    const snGroup = document.getElementById('sn-group');
    const saveBoxBtn = document.getElementById('save-box-btn'); // Nové ID
    const savedBoxesContent = document.getElementById('saved-boxes-content');
    const printBtn = document.getElementById('print-btn');
    const totalItemsContent = document.getElementById('total-items-content');
    const extraItemSelect = document.getElementById('extra-item-select');
    const radioVc = document.getElementById('type-vc');
    const radioSmc = document.getElementById('type-smc');
    const radioOther = document.getElementById('type-other');

    // --- PREPÍNANIE POHĽADOV --- (bez zmeny)
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const packingView = document.getElementById('packing-view');
    const clocksView = document.getElementById('clocks-view');
    toggleViewBtn.addEventListener('click', function() {
        const isPackingVisible = !packingView.classList.contains('hidden');
        packingView.classList.toggle('hidden', isPackingVisible);
        clocksView.classList.toggle('hidden', !isPackingVisible);
        toggleViewBtn.textContent = isPackingVisible ? 'Zobraziť Tvorbu Krabíc' : 'Zobraziť Svetový Čas';
    });
    
    // --- LOGIKA PRE SVETOVÝ ČAS --- (bez zmeny)
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
    
    // **NOVÁ FUNKCIA:** Validuje formulár a (de)aktivuje tlačidlo Uložiť
    function validateFormForSave() {
        const isOther = radioOther.checked;
        const snFilled = snInput.value.trim() !== '';
        const atLeastOneItemSelected = Object.keys(getCurrentFormItems()).length > 0;
        
        const isFormValid = atLeastOneItemSelected && (isOther || snFilled);
        saveBoxBtn.disabled = !isFormValid;
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

        // Každá zmena vo formulári teraz volá validáciu a prepočet
        const updateHandler = () => {
            counter.classList.toggle('hidden', !checkbox.checked);
            itemDiv.classList.toggle('checked', checkbox.checked);
            updateTotalSummary();
            validateFormForSave(); // <-- Kľúčová zmena
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
        const currentFormItems = getCurrentFormItems();
        const totalCounts = {};
        allBoxes.forEach(box => {
            box.items.forEach(item => { totalCounts[item.name] = (totalCounts[item.name] || 0) + item.count; });
        });
        Object.entries(currentFormItems).forEach(([name, count]) => {
            totalCounts[name] = (totalCounts[name] || 0) + count;
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

    [radioVc, radioSmc, radioOther, snInput].forEach(el => {
        el.addEventListener('change', validateFormForSave);
        el.addEventListener('input', validateFormForSave);
    });

    document.querySelectorAll('.preset-buttons').forEach(container => {
        container.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') setPreset(e.target.dataset.preset);
        });
    });

    function setPreset(preset) {
        document.querySelectorAll('#checkbox-container input[type="checkbox"]').forEach(cb => {
            if(cb.checked) {
                cb.checked = false;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
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
        updateTotalSummary();
        validateFormForSave();
    }

    saveBoxBtn.addEventListener('click', function() {
        const currentFormItemsObject = getCurrentFormItems();
        const boxType = document.querySelector('input[name="box-type"]:checked').value;
        const boxSN = radioOther.checked ? 'Ostatné' : snInput.value.trim();
        allBoxes.push({ 
            sn: boxSN, 
            customer: customerNameInput.value.trim(), 
            type: boxType, 
            items: Object.entries(currentFormItemsObject).map(([name, count]) => ({name, count})) 
        });
        renderSavedBoxes();
        resetForm();
    });
    
    function renderSavedBoxes() {
        savedBoxesContent.innerHTML = '';
        allBoxes.forEach(box => {
            const boxDiv = document.createElement('div');
            boxDiv.classList.add('summary-box');
            let boxHTML = `<h4>SN: ${box.sn} (Zákazník: ${box.customer || 'N/A'})</h4><ul>`;
            box.items.forEach(item => { boxHTML += `<li>${item.name}: <strong>${item.count} ks</strong></li>`; });
            boxHTML += '</ul>';
            boxDiv.innerHTML = boxHTML;
            savedBoxesContent.appendChild(boxDiv);
        });
        printBtn.classList.toggle('hidden', allBoxes.length === 0);
    }

    function resetForm() {
        snInput.value = '';
        customerNameInput.value = '';
        generateCheckboxes(itemDefinitions);
        extraItemSelect.value = '';
        radioVc.checked = true;
        radioVc.dispatchEvent(new Event('change'));
        snInput.focus();
        updateTotalSummary();
        validateFormForSave(); // Deaktivuje tlačidlo po uložení
    }

    printBtn.addEventListener('click', () => window.print());

    // --- INICIALIZÁCIA APLIKÁCIE ---
    startWorldClocks();
    generateCheckboxes(itemDefinitions);
    radioVc.dispatchEvent(new Event('change'));
    updateTotalSummary();
    validateFormForSave();
});
