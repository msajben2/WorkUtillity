document.addEventListener('DOMContentLoaded', function() {
    
    // --- DEFINÍCIE POLOŽIEK ---
    const vcBaseItems = {
        2: "Quick start guide-BPS", 6: "EU power cable", 7: "HDMI adaptor",
        8: "Clamp for calibration ball", 9: "Adaptor calibration ball holder",
        10: "Calibration ball", 11: "Marker board 300x300, Dibond",
        12: "US power cable", 13: "UK power cable", 14: "JPY power cable"
    };

    const smcBaseItems = {
        1: "Quick start guide", 3: "Ethernet cable 5m", 4: "Ferrite core",
        5: "POE injector", 6: "EU power cable", 12: "US power cable",
        13: "UK power cable", 14: "JPY power cable", 15: "L mount+4 screws+Label"
    };

    const extraItemDefinitions = [
        "L mount+4 screws+Label",
        ... 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    ];

    let allOrders = {};
    let dynamicItemCounter = 100;

    // Prvky DOM
    const orderNumberInput = document.getElementById('order-number');
    const orderTypeSelect = document.getElementById('order-type-select');
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const orderDescriptionInput = document.getElementById('order-description');

    const vcSnInput = document.getElementById('vc-serial-numbers');
    const vcCountBadge = document.getElementById('vc-count-badge');
    const vcCheckboxContainer = document.getElementById('vc-checkbox-container');

    const smcSnInput = document.getElementById('smc-serial-numbers');
    const smcDefaultSizeSelect = document.getElementById('smc-default-size');
    const smcCountBadge = document.getElementById('smc-count-badge');
    const smcCheckboxContainer = document.getElementById('smc-checkbox-container');

    const extraItemSelect = document.getElementById('extra-item-select');
    const extraCheckboxContainer = document.getElementById('extra-checkbox-container');

    const saveBoxBtn = document.getElementById('save-box-btn');
    const validationFeedback = document.getElementById('validation-feedback');
    const savedOrdersContent = document.getElementById('saved-orders-content');
    const printBtn = document.getElementById('print-btn');
    const totalSummaryDiv = document.getElementById('total-summary');
    const totalItemsContent = document.getElementById('total-items-content');

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
    const timeZones = { 
        'USA (Východ)': 'America/New_York', 'USA (Západ)': 'America/Los_Angeles', 
        'Kanada': 'America/Toronto', 'Čína': 'Asia/Shanghai', 
        'Japonsko': 'Asia/Tokyo', 'Slovensko': 'Europe/Bratislava' 
    };
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
            } catch (e) {}
        });
    }

    // --- GENEROVANIE CHECKBOXOV ---
    function createCheckboxItem(id, name, prefix = '') {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('checkbox-item');
        itemDiv.dataset.name = name;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${prefix}-${id}`;
        
        const label = document.createElement('label');
        label.htmlFor = `item-${prefix}-${id}`;
        label.textContent = name;
        
        const counter = document.createElement('input');
        counter.type = 'number';
        counter.min = 1;
        counter.value = 1;
        counter.classList.add('hidden');
        
        itemDiv.append(checkbox, label, counter);
        
        const updateHandler = () => {
            counter.classList.toggle('hidden', !checkbox.checked);
            itemDiv.classList.toggle('checked', checkbox.checked);
            validateForm();
        };
        checkbox.addEventListener('change', updateHandler);
        counter.addEventListener('input', updateHandler);
        
        return itemDiv;
    }

    function populateCheckboxes(container, items, prefix) {
        container.innerHTML = '';
        Object.entries(items).forEach(([id, name]) => {
            container.appendChild(createCheckboxItem(id, name, prefix));
        });
    }

    // --- PARSOVANIE SÉRIOVÝCH ČÍSIEL ---
    function parseVCSNS() {
        const raw = vcSnInput.value.trim();
        if (!raw) return [];
        return raw.split(/[\n,;\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    }

    function parseSMCSNS() {
        const raw = smcSnInput.value.trim();
        if (!raw) return [];
        const defaultSize = smcDefaultSizeSelect.value || 'M';
        const lines = raw.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        const result = [];
        lines.forEach(line => {
            const parts = line.split(/\s+/).filter(p => p.length > 0);
            if (parts.length === 0) return;
            
            const sn = parts[0];
            let size = defaultSize;
            if (parts.length >= 2) {
                const possibleSize = parts[1].toUpperCase();
                if (['S', 'M', 'L', 'XL'].includes(possibleSize)) {
                    size = possibleSize;
                }
            }
            result.push({ sn, size });
        });
        return result;
    }

    function getSelectedItems(container) {
        const items = {};
        container.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
            const itemDiv = cb.closest('.checkbox-item');
            const name = itemDiv.dataset.name;
            const count = parseInt(itemDiv.querySelector('input[type="number"]').value) || 1;
            items[name] = count;
        });
        return items;
    }

    // --- AUTOMATICKÉ ZAŠKRTNUTIE LEASE L-MOUNT ---
    function checkLeaseRules() {
        const isLease = orderTypeSelect.value === 'Lease';
        const smcSns = parseSMCSNS();
        
        if (isLease && smcSns.length > 0) {
            const lmountCb = smcCheckboxContainer.querySelector('input[id*="-15"]');
            if (lmountCb && !lmountCb.checked) {
                lmountCb.checked = true;
                lmountCb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    // --- PREDVYPĹŇANIE EXISTUJÚCEJ OBJEDNÁVKY ---
    function handleOrderNumberChange() {
        const orderNumber = orderNumberInput.value.trim();
        if (allOrders[orderNumber]) {
            orderTypeSelect.value = allOrders[orderNumber].orderType;
            customerNameInput.value = allOrders[orderNumber].customerName;
            customerAddressInput.value = allOrders[orderNumber].customerAddress;
            orderDescriptionInput.value = allOrders[orderNumber].description || '';
        }
        checkLeaseRules();
        validateForm();
    }
    orderNumberInput.addEventListener('blur', handleOrderNumberChange);
    orderNumberInput.addEventListener('input', handleOrderNumberChange);

    // --- VALIDÁCIA FORMULÁRA ---
    function validateForm() {
        const orderNumber = orderNumberInput.value.trim();
        const orderType = orderTypeSelect.value;
        const vcSns = parseVCSNS();
        const smcSns = parseSMCSNS();

        if (vcCountBadge) vcCountBadge.textContent = `${vcSns.length} ks`;
        if (smcCountBadge) smcCountBadge.textContent = `${smcSns.length} ks`;

        const missing = [];
        if (!orderNumber) missing.push('Číslo objednávky');
        if (!orderType) missing.push('Typ objednávky');

        const totalDevices = vcSns.length + smcSns.length;
        if (totalDevices === 0) {
            missing.push('Zadajte aspoň 1 VC alebo S/MC sériové číslo');
        }

        const vcItems = getSelectedItems(vcCheckboxContainer);
        const smcItems = getSelectedItems(smcCheckboxContainer);

        if (vcSns.length > 0 && Object.keys(vcItems).length === 0) {
            missing.push('Vyberte predvoľbu / položky pre VC');
        }
        if (smcSns.length > 0 && Object.keys(smcItems).length === 0) {
            missing.push('Vyberte predvoľbu / položky pre S/MC');
        }

        const isValid = missing.length === 0;
        saveBoxBtn.disabled = !isValid;

        if (validationFeedback) {
            if (!isValid) {
                validationFeedback.style.color = '#e74c3c';
                validationFeedback.textContent = '❌ Chýba: ' + missing.join(' | ');
            } else {
                validationFeedback.style.color = '#27ae60';
                validationFeedback.textContent = `✓ Pripravené na uloženie (${vcSns.length}x VC, ${smcSns.length}x S/MC). Skratka: Ctrl+Enter`;
            }
        }
    }

    // Predvoľby VC
    document.getElementById('preset-buttons-vc').addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') return;
        const preset = e.target.dataset.preset;
        const clear = e.target.dataset.clear;
        
        vcCheckboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });

        if (clear) return;

        let toSelect = [2, 7, 8, 9, 10, 11];
        if (preset === 'eu') toSelect.push(6);
        if (preset === 'us') toSelect.push(12);
        if (preset === 'uk') toSelect.push(13);
        if (preset === 'jpy') toSelect.push(14);

        toSelect.forEach(id => {
            const cb = document.getElementById(`item-vc-${id}`);
            if (cb) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        validateForm();
    });

    // Predvoľby S/MC
    document.getElementById('preset-buttons-smc').addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') return;
        const preset = e.target.dataset.preset;
        const clear = e.target.dataset.clear;

        smcCheckboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });

        if (clear) return;

        if (preset === 'smc') {
            [1, 3, 4, 5, 6].forEach(id => {
                const cb = document.getElementById(`item-smc-${id}`);
                if (cb) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }
        checkLeaseRules();
        validateForm();
    });

    // Pridanie extra položky
    extraItemDefinitions.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        extraItemSelect.appendChild(opt);
    });

    extraItemSelect.addEventListener('change', function() {
        if (this.value) {
            const itemName = this.value;
            let exists = false;
            extraCheckboxContainer.querySelectorAll('.checkbox-item').forEach(el => {
                if (el.dataset.name === itemName) exists = true;
            });
            if (!exists) {
                const newItem = createCheckboxItem(dynamicItemCounter++, itemName, 'extra');
                extraCheckboxContainer.appendChild(newItem);
                const cb = newItem.querySelector('input[type="checkbox"]');
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
            this.value = '';
        }
    });

    // Listenery pre sledovanie zmien
    [orderNumberInput, orderTypeSelect, customerNameInput, customerAddressInput, orderDescriptionInput, vcSnInput, smcSnInput, smcDefaultSizeSelect].forEach(el => {
        el.addEventListener('input', () => { checkLeaseRules(); validateForm(); });
        el.addEventListener('change', () => { checkLeaseRules(); validateForm(); });
    });

    // Skratka Ctrl + Enter
    [vcSnInput, smcSnInput].forEach(input => {
        input.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!saveBoxBtn.disabled) {
                    saveBoxBtn.click();
                }
            }
        });
    });

    // --- ULOŽENIE ZMIEŠANEJ OBJEDNÁVKY ---
    saveBoxBtn.addEventListener('click', function() {
        const orderNumber = orderNumberInput.value.trim();
        const orderType = orderTypeSelect.value;
        const customerName = customerNameInput.value.trim();
        const customerAddress = customerAddressInput.value.trim();
        const description = orderDescriptionInput.value.trim();

        const vcSns = parseVCSNS();
        const smcSns = parseSMCSNS();
        const vcItems = getSelectedItems(vcCheckboxContainer);
        const smcItems = getSelectedItems(smcCheckboxContainer);
        const extraItems = getSelectedItems(extraCheckboxContainer);

        if (!allOrders[orderNumber]) {
            allOrders[orderNumber] = {
                orderNumber, orderType, customerName, customerAddress, description, packages: []
            };
        } else {
            allOrders[orderNumber].orderType = orderType;
            allOrders[orderNumber].customerName = customerName;
            allOrders[orderNumber].customerAddress = customerAddress;
            allOrders[orderNumber].description = description;
        }

        // 1. Spracovanie VC
        if (vcSns.length > 0) {
            const finalVcItems = { ...vcItems, ...extraItems };
            finalVcItems['VC paper box inner'] = 1;
            finalVcItems['VC paper box outer'] = 1;

            allOrders[orderNumber].packages.push({
                type: 'VC',
                sns: vcSns,
                items: Object.entries(finalVcItems).map(([name, count]) => ({ name, count }))
            });
        }

        // 2. Spracovanie S/MC
        if (smcSns.length > 0) {
            const finalSmcItems = { ...smcItems, ...extraItems };
            const sizeCounts = {};
            smcSns.forEach(item => {
                sizeCounts[item.size] = (sizeCounts[item.size] || 0) + 1;
            });

            allOrders[orderNumber].packages.push({
                type: 'S/MC',
                snsWithSizes: smcSns,
                sizeCounts: sizeCounts,
                items: Object.entries(finalSmcItems).map(([name, count]) => ({ name, count }))
            });
        }

        renderSavedOrders();
        resetForm();
    });

    // --- VYKRESLENIE SÚHRNU ---
    function renderSavedOrders() {
        savedOrdersContent.innerHTML = '';

        Object.values(allOrders).forEach(orderData => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order-group');

            const descHTML = orderData.description ? `<div style="background:#eee; padding:6px; margin-bottom:8px; border-radius:4px;"><strong>Popis:</strong> ${orderData.description}</div>` : '';

            let html = `<h3>Objednávka: ${orderData.orderNumber} (${orderData.orderType})</h3>
                        <p><strong>Zákazník:</strong> ${orderData.customerName || 'N/A'} | <strong>Adresa:</strong> ${orderData.customerAddress || 'N/A'}</p>
                        ${descHTML}`;

            orderData.packages.forEach(pkg => {
                html += '<div class="summary-box">';
                if (pkg.type === 'VC') {
                    const count = pkg.sns.length;
                    html += `<h4>Balík: VC Zariadenia — <strong>${count} ks</strong></h4>`;
                    html += `<div class="sn-list-container"><strong>Sériové čísla (${count} ks):</strong><div class="sn-tags">`;
                    pkg.sns.forEach(sn => { html += `<span class="sn-tag">${sn}</span>`; });
                    html += `</div></div>`;

                    html += '<strong>Položky na balenie:</strong><ul>';
                    pkg.items.forEach(item => {
                        html += `<li>${item.name}: <strong>${item.count * count} ks</strong> <span class="item-per-box-note">(${item.count} ks / balík)</span></li>`;
                    });
                    html += '</ul>';
                } else if (pkg.type === 'S/MC') {
                    const count = pkg.snsWithSizes.length;
                    html += `<h4>Balík: S/MC Zariadenia — <strong>${count} ks</strong></h4>`;
                    
                    html += `<div class="sn-list-container"><strong>Sériové čísla (${count} ks):</strong><div class="sn-tags">`;
                    pkg.snsWithSizes.forEach(item => {
                        html += `<span class="sn-tag">${item.sn} <span class="tag-size">${item.size}</span></span>`;
                    });
                    html += `</div></div>`;

                    html += '<strong>Krabice pre zariadenia:</strong><ul>';
                    Object.entries(pkg.sizeCounts).forEach(([size, qty]) => {
                        html += `<li>${size} paper box (inner + outer): <strong>${qty} ks</strong></li>`;
                    });
                    html += '</ul>';

                    html += '<strong>Príslušenstvo:</strong><ul>';
                    pkg.items.forEach(item => {
                        html += `<li>${item.name}: <strong>${item.count * count} ks</strong> <span class="item-per-box-note">(${item.count} ks / zariadenie)</span></li>`;
                    });
                    html += '</ul>';
                }
                html += '</div>';
            });

            orderDiv.innerHTML = html;
            savedOrdersContent.appendChild(orderDiv);
        });

        updateTotalSummary();
        printBtn.classList.toggle('hidden', Object.keys(allOrders).length === 0);
    }

    // --- CELKOVÝ SÚHRN POLOŽIEK ---
    function updateTotalSummary() {
        const totals = {};
        const hasOrders = Object.keys(allOrders).length > 0;
        if (!hasOrders) {
            totalSummaryDiv.classList.add('hidden');
            return;
        }
        totalSummaryDiv.classList.remove('hidden');

        Object.values(allOrders).forEach(order => {
            order.packages.forEach(pkg => {
                if (pkg.type === 'VC') {
                    const count = pkg.sns.length;
                    pkg.items.forEach(item => {
                        totals[item.name] = (totals[item.name] || 0) + (item.count * count);
                    });
                } else if (pkg.type === 'S/MC') {
                    const count = pkg.snsWithSizes.length;
                    Object.entries(pkg.sizeCounts).forEach(([size, qty]) => {
                        totals[`${size} paper box inner`] = (totals[`${size} paper box inner`] || 0) + qty;
                        totals[`${size} paper box outer`] = (totals[`${size} paper box outer`] || 0) + qty;
                    });
                    pkg.items.forEach(item => {
                        totals[item.name] = (totals[item.name] || 0) + (item.count * count);
                    });
                }
            });
        });

        let html = '<ul>';
        let grandTotal = 0;
        Object.keys(totals).sort().forEach(name => {
            html += `<li>${name}: <strong>${totals[name]} ks</strong></li>`;
            grandTotal += totals[name];
        });
        html += `</ul><hr><p><strong>Celkový počet všetkých kusov: ${grandTotal}</strong></p>`;
        totalItemsContent.innerHTML = html;
    }

    function resetForm() {
        vcSnInput.value = '';
        smcSnInput.value = '';
        populateCheckboxes(vcCheckboxContainer, vcBaseItems, 'vc');
        populateCheckboxes(smcCheckboxContainer, smcBaseItems, 'smc');
        extraCheckboxContainer.innerHTML = '';
        validateForm();
    }

    printBtn.addEventListener('click', () => window.print());

    // --- ŠTART APLIKÁCIE ---
    startWorldClocks();
    populateCheckboxes(vcCheckboxContainer, vcBaseItems, 'vc');
    populateCheckboxes(smcCheckboxContainer, smcBaseItems, 'smc');
    validateForm();
});
