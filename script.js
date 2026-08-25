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
    const addBoxBtn = document.getElementById('add-box-btn');
    const savedBoxesContent = document.getElementById('saved-boxes-content');
    const printBtn = document.getElementById('print-btn');
    const totalItemsContent = document.getElementById('total-items-content');
    const extraItemSelect = document.getElementById('extra-item-select');
    const radioVc = document.getElementById('type-vc');
    const radioSmc = document.getElementById('type-smc');
    const radioOther = document.getElementById('type-other');

    // --- PREPÍNANIE POHĽADOV (KRABICE / HODINY) ---
    // (táto časť ostáva bez zmeny)
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const packingView = document.getElementById('packing-view');
    const clocksView = document.getElementById('clocks-view');

    toggleViewBtn.addEventListener('click', function() {
        const isPackingVisible = !packingView.classList.contains('hidden');
        if (isPackingVisible) {
            packingView.classList.add('hidden');
            clocksView.classList.remove('hidden');
            toggleViewBtn.textContent = 'Zobraziť Tvorbu Krabíc';
        } else {
            clocksView.classList.add('hidden');
            packingView.classList.remove('hidden');
            toggleViewBtn.textContent = 'Zobraziť Svetový Čas';
        }
    });
    
    // --- LOGIKA PRE SVETOVÝ ČAS ---
    // (táto časť ostáva bez zmeny)
    const timeZones = {
        'USA (Východ)': 'America/New_York', 'USA (Západ)': 'America/Los_Angeles',
        'Kanada (Východ)': 'America/Toronto', 'Kanada (Západ)': 'America/Vancouver',
        'Čína': 'Asia/Shanghai', 'Japonsko': 'Asia/Tokyo', 'Thajsko': 'Asia/Bangkok',
        'Slovensko': 'Europe/Bratislava'
    };

    function startWorldClocks() {
        const clocksContainer = document.getElementById('world-clocks-container');
        clocksContainer.innerHTML = '';
        Object.keys(timeZones).forEach(name => {
            const clockDiv = document.createElement('div');
            clockDiv.classList.add('clock');
            clockDiv.innerHTML = `
                <div class="time" id="time-${name.replace(/[^a-zA-Z]/g, '')}"></div>
                <div class="date" id="date-${name.replace(/[^a-zA-Z]/g, '')}"></div>
                <div class="zone">${name}</div>
            `;
            clocksContainer.appendChild(clockDiv);
        });
        updateClocks();
        setInterval(updateClocks, 1000);
    }

    function updateClocks() {
        Object.entries(timeZones).forEach(([name, zone]) => {
            try {
                const now = new Date();
                const timeString = now.toLocaleTimeString('sk-SK', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = now.toLocaleDateString('sk-SK', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
                const timeEl = document.getElementById(`time-${name.replace(/[^a-zA-Z]/g, '')}`);
                const dateEl = document.getElementById(`date-${name.replace(/[^a-zA-Z]/g, '')}`);
                if (timeEl) timeEl.textContent = timeString;
                if (dateEl) dateEl.textContent = dateString;
            } catch (e) {
                console.error(`Chyba pri aktualizácii času pre zónu ${zone}:`, e);
            }
        });
    }

    // --- LOGIKA APLIKÁCIE PRE TVORBU KRABÍC ---
    
    // Generuje checkboxy pri štarte a po pridaní krabice
    function generateCheckboxes(items) {
        checkboxContainer.innerHTML = '';
        Object.entries(items).forEach(([id, name]) => {
            checkboxContainer.appendChild(createCheckboxItem(id, name));
        });
    }

    // Vytvára jeden checkbox s logikou
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

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        itemDiv.appendChild(counter);

        // Pridanie event listenerov, ktoré spustia prepočet celkového súčtu
        checkbox.addEventListener('change', () => {
            counter.classList.toggle('hidden', !checkbox.checked);
            itemDiv.classList.toggle('checked', checkbox.checked);
            updateTotalSummary(); // <-- Kľúčová zmena
        });
        counter.addEventListener('input', updateTotalSummary); // <-- Kľúčová zmena
        
        return itemDiv;
    }
    
    // Získava položky z *aktuálneho* formulára (to, čo ešte nie je uložené)
    function getCurrentFormItems() {
        const currentItems = {};
        document.querySelectorAll('.checkbox-item').forEach(itemDiv => {
             const checkbox = itemDiv.querySelector('input[type="checkbox"]');
             if(checkbox.checked){
                 const name = itemDiv.querySelector('label').textContent;
                 const count = parseInt(itemDiv.querySelector('input[type="number"]').value) || 1;
                 currentItems[name] = (currentItems[name] || 0) + count;
             }
        });
        return currentItems;
    }

    // **NOVÁ FUNKCIA:** Aktualizuje celkový súčet (uložené + aktuálne)
    function updateTotalSummary() {
        const currentFormItems = getCurrentFormItems();
        const totalCounts = {};
        
        // 1. Sčíta položky z už uložených krabíc
        allBoxes.forEach(box => {
            box.items.forEach(item => {
                totalCounts[item.name] = (totalCounts[item.name] || 0) + item.count;
            });
        });

        // 2. Pripočíta položky z aktuálneho formulára
        Object.entries(currentFormItems).forEach(([name, count]) => {
            totalCounts[name] = (totalCounts[name] || 0) + count;
        });

        // 3. Zobrazí výsledok
        let totalHTML = '<ul>';
        let grandTotal = 0;
        Object.keys(totalCounts).sort().forEach(name => {
             totalHTML += `<li>${name}: <strong>${totalCounts[name]} ks</strong></li>`;
             grandTotal += totalCounts[name];
        });
        totalHTML += `</ul><hr><p><strong>Celkový počet všetkých kusov: ${grandTotal}</strong></p>`;
        totalItemsContent.innerHTML = totalHTML;
    }


    // Zvyšok funkcií s drobnými úpravami...
    
    extraItemDefinitions.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = `Extra položka ${item}`;
        extraItemSelect.appendChild(option);
    });

    extraItemSelect.addEventListener('change', function() {
        if (this.value) {
            const itemName = `Extra položka ${this.value}`;
            if(!document.querySelector(`.checkbox-item input[data-dynamic-name="${itemName}"]`)){
                 const newItemDiv = createCheckboxItem(dynamicItemCounter, itemName);
                 newItemDiv.querySelector('input[type="checkbox"]').dataset.dynamicName = itemName;
                 checkboxContainer.appendChild(newItemDiv);
                 dynamicItemCounter++;
            }
            this.value = '';
        }
    });

    [radioVc, radioSmc, radioOther].forEach(radio => {
        radio.addEventListener('change', function() {
            const isOther = radioOther.checked;
            snGroup.classList.toggle('hidden', isOther);
            document.getElementById('preset-buttons-vc').classList.toggle('hidden', !radioVc.checked);
            document.getElementById('preset-buttons-smc').classList.toggle('hidden', !radioSmc.checked);
        });
    });

    document.querySelectorAll('.preset-buttons').forEach(container => {
        container.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') setPreset(e.target.dataset.preset);
        });
    });

    function setPreset(preset) {
        document.querySelectorAll('#checkbox-container input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        let itemsToSelect = [];
        const baseVC = [2, 7, 8, 9, 10, 11];
        
        switch (preset) {
            case 'eu': itemsToSelect = [...baseVC, 6]; break;
            case 'us': itemsToSelect = [...baseVC, 12]; break;
            case 'uk': itemsToSelect = [...baseVC, 13]; break;
            case 'jpy': itemsToSelect = [...baseVC, 14]; break;
            case 'smc': itemsToSelect = [1, 3, 4, 5, 6]; break;
        }

        itemsToSelect.forEach(id => {
            const cb = document.getElementById(`item-${id}`);
            if (cb) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        updateTotalSummary(); // Prepočítaj po nastavení predvoľby
    }

    addBoxBtn.addEventListener('click', function() {
        const isOther = radioOther.checked;
        const sn = snInput.value.trim();
        const customerName = customerNameInput.value.trim();

        if (!isOther && !sn) {
            alert('Pre typ VC a S/MC je povinné zadať sériové číslo (SN).');
            return;
        }

        const currentFormItemsObject = getCurrentFormItems();
        if (Object.keys(currentFormItemsObject).length === 0) {
            alert('Nevybrali ste žiadne položky pre túto krabicu.');
            return;
        }
        const selectedItems = Object.entries(currentFormItemsObject).map(([name, count]) => ({name, count}));

        const boxType = document.querySelector('input[name="box-type"]:checked').value;
        const boxSN = isOther ? 'Ostatné' : sn;
        allBoxes.push({ sn: boxSN, customer: customerName, type: boxType, items: selectedItems });

        renderSavedBoxes();
        resetForm();
    });
    
    // Zobrazuje iba už uložené krabice
    function renderSavedBoxes() {
        savedBoxesContent.innerHTML = '';
        allBoxes.forEach(box => {
            const boxDiv = document.createElement('div');
            boxDiv.classList.add('summary-box');
            let boxHTML = `<h4>SN: ${box.sn} (Zákazník: ${box.customer || 'N/A'})</h4><ul>`;
            box.items.forEach(item => {
                boxHTML += `<li>${item.name}: <strong>${item.count} ks</strong></li>`;
            });
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
        updateTotalSummary(); // Prepočítaj súčet po resete (mal by byť rovnaký ako súčet uložených)
    }

    printBtn.addEventListener('click', () => window.print());

    // --- INICIALIZÁCIA APLIKÁCIE ---
    startWorldClocks();
    generateCheckboxes(itemDefinitions);
    radioVc.dispatchEvent(new Event('change'));
    updateTotalSummary(); // Prvý prepočet pri načítaní stránky
});
