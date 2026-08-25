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
    let allBoxes = []; // Pamäť pre všetky krabice
    let dynamicItemCounter = Object.keys(itemDefinitions).length + 1; // Začíname číslovanie pre extra položky

    // Elementy stránky
    const checkboxContainer = document.getElementById('checkbox-container');
    const snInput = document.getElementById('serial-number');
    const snGroup = document.getElementById('sn-group');
    const addBoxBtn = document.getElementById('add-box-btn');
    const summaryList = document.getElementById('summary-list');
    const printBtn = document.getElementById('print-btn');
    const totalSummaryDiv = document.getElementById('total-summary');
    const totalItemsContent = document.getElementById('total-items-content');
    const extraItemSelect = document.getElementById('extra-item-select');
    const radioVc = document.getElementById('type-vc');
    const radioSmc = document.getElementById('type-smc');
    const radioOther = document.getElementById('type-other');
    const presetButtonsVc = document.getElementById('preset-buttons-vc');
    const presetButtonsSmc = document.getElementById('preset-buttons-smc');

    // --- PREPÍNANIE POHĽADOV (KRABICE / HODINY) ---
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
        setInterval(updateClocks, 1000); // Aktualizácia každú sekundu
    }

    function updateClocks() {
        Object.entries(timeZones).forEach(([name, zone]) => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('sk-SK', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateString = now.toLocaleDateString('sk-SK', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
            const timeEl = document.getElementById(`time-${name.replace(/[^a-zA-Z]/g, '')}`);
            const dateEl = document.getElementById(`date-${name.replace(/[^a-zA-Z]/g, '')}`);
            if (timeEl) timeEl.textContent = timeString;
            if (dateEl) dateEl.textContent = dateString;
        });
    }

    // --- LOGIKA APLIKÁCIE PRE TVORBU KRABÍC ---
    
    // Generovanie checkboxov
    function generateCheckboxes(items) {
        checkboxContainer.innerHTML = '';
        Object.entries(items).forEach(([id, name]) => {
            checkboxContainer.appendChild(createCheckboxItem(id, name));
        });
    }

    // Vytvorenie jedného checkboxu
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

        checkbox.addEventListener('change', function() {
            counter.classList.toggle('hidden', !this.checked);
            itemDiv.classList.toggle('checked', this.checked);
        });
        return itemDiv;
    }

    // Naplnenie selectu pre extra položky
    extraItemDefinitions.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = `Extra položka ${item}`;
        extraItemSelect.appendChild(option);
    });

    extraItemSelect.addEventListener('change', function() {
        if (this.value) {
            const itemName = `Extra položka ${this.value}`;
            // Skontrolujeme, či už taká položka nebola pridaná
            const existingItem = document.querySelector(`.checkbox-item label[for="item-${dynamicItemCounter}"]`);
            if(!document.querySelector(`.checkbox-item input[data-dynamic-name="${itemName}"]`)){
                 const newItemDiv = createCheckboxItem(dynamicItemCounter, itemName);
                 newItemDiv.querySelector('input[type="checkbox"]').dataset.dynamicName = itemName;
                 checkboxContainer.appendChild(newItemDiv);
                 dynamicItemCounter++;
            }
            this.value = ''; // Reset selectu
        }
    });

    // Logika pre zmenu typu krabice (VC, S/MC, Ostatné)
    [radioVc, radioSmc, radioOther].forEach(radio => {
        radio.addEventListener('change', function() {
            const isOther = radioOther.checked;
            snGroup.classList.toggle('hidden', isOther);
            presetButtonsVc.classList.toggle('hidden', !radioVc.checked);
            presetButtonsSmc.classList.toggle('hidden', !radioSmc.checked);
        });
    });

    // Logika pre predvoľby (Default tlačidlá)
    document.querySelector('.preset-buttons').addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const preset = e.target.dataset.preset;
            setPreset(preset);
        }
    });
     document.getElementById('preset-buttons-smc').addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const preset = e.target.dataset.preset;
            setPreset(preset);
        }
    });

    function setPreset(preset) {
        // Najprv všetko odznačíme
        document.querySelectorAll('#checkbox-container input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change')); // Aby sa skryli počítadlá
        });
        
        let itemsToSelect = [];
        const baseVC = [2, 7, 8, 9, 10, 11]; // ID položiek pre VC
        
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
                cb.dispatchEvent(new Event('change')); // Aby sa ukázali počítadlá
            }
        });
    }

    // Pridanie krabice do súhrnu
    addBoxBtn.addEventListener('click', function() {
        const isOther = radioOther.checked;
        const sn = snInput.value.trim();
        if (!isOther && !sn) {
            alert('Pre typ VC a S/MC je povinné zadať sériové číslo (SN).');
            return;
        }

        const selectedItems = [];
        document.querySelectorAll('.checkbox-item').forEach(itemDiv => {
             const checkbox = itemDiv.querySelector('input[type="checkbox"]');
             if(checkbox.checked){
                 const id = itemDiv.dataset.id;
                 const name = itemDiv.querySelector('label').textContent;
                 const count = parseInt(itemDiv.querySelector('input[type="number"]').value);
                 selectedItems.push({ name, count });
             }
        });

        if (selectedItems.length === 0) {
            alert('Nevybrali ste žiadne položky pre túto krabicu.');
            return;
        }

        const boxType = document.querySelector('input[name="box-type"]:checked').value;
        const boxSN = isOther ? 'Ostatné' : sn;
        allBoxes.push({ sn: boxSN, type: boxType, items: selectedItems });

        renderSummary();
        resetForm();
    });
    
    // Vykreslenie súhrnu
    function renderSummary() {
        summaryList.innerHTML = '';
        const totalCounts = {};
        let grandTotal = 0;

       
