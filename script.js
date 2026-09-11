document.addEventListener('DOMContentLoaded', function() {
    
    // --- DEFINÍCIE ZÁKLADNÝCH POLOŽIEK ---
    const allAvailableItems = {
        1: "Quick start guide",
        2: "Quick start guide-BPS",
        3: "Ethernet cable 5m",
        4: "Ferrite core",
        5: "POE injector",
        6: "EU power cable",
        7: "HDMI adaptor",
        8: "Clamp for calibration ball",
        9: "Adaptor calibration ball holder",
        10: "Calibration ball",
        11: "Marker board 300x300, Dibond",
        12: "US power cable",
        13: "UK power cable",
        14: "JPY power cable",
        15: "L mount+4 screws+Label"
    };

    const extraItemDefinitions = [
        "L mount+4 screws+Label",
        ... 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    ];

    let allOrders = {};
    let dynamicCounter = 100;

    // DOM elementy
    const orderNumberInput = document.getElementById('order-number');
    const orderTypeSelect = document.getElementById('order-type-select');
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const orderDescriptionInput = document.getElementById('order-description');

    const radioSmc = document.getElementById('type-smc');
    const radioVc = document.getElementById('type-vc');
    const radioOther = document.getElementById('type-other');

    const snInput = document.getElementById('serial-numbers');
    const snCountBadge = document.getElementById('sn-count-badge');
    const snHint = document.getElementById('sn-hint');
    const nonStandardSnCheckbox = document.getElementById('non-standard-sn');

    const presetsSmcGroup = document.getElementById('presets-smc-group');
    const presetsVcGroup = document.getElementById('presets-vc-group');
    const checkboxContainer = document.getElementById('checkbox-container');
    const extraItemSelect = document.getElementById('extra-item-select');

    const livePreviewContent = document.getElementById('live-preview-content');
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

    // --- SVETOVÝ ČAS ---
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

    // --- GENEROVANIE CHECKBOXOV S PREPÍNAČOM NÁSOBENIA ---
    function renderCheckboxes() {
        checkboxContainer.innerHTML = '';
        const currentType = getCurrentProductType();
        
        // Zoznam položiek podľa typu
        let itemKeys = [];
        if (currentType === 'S/MC') itemKeys = [1, 3, 4, 5, 6, 12, 13, 14, 15];
        else if (currentType === 'VC') itemKeys = [2, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        else itemKeys = Object.keys(allAvailableItems);

        itemKeys.forEach(id => {
            const name = allAvailableItems[id];
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('checkbox-item');
            itemDiv.dataset.name = name;
            itemDiv.dataset.id = id;

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = `item-cb-${id}`;

            const label = document.createElement('label');
            label.htmlFor = `item-cb-${id}`;
            label.textContent = name;

            const countInput = document.createElement('input');
            countInput.type = 'number';
            countInput.min = 1;
            countInput.value = 1;
            countInput.classList.add('hidden');

            // Prepínač [x SN] vs [Fixne]
            const modeBadge = document.createElement('span');
            modeBadge.classList.add('item-mode-badge', 'hidden');
            modeBadge.dataset.mode = 'per_box'; // per_box alebo fixed
            modeBadge.textContent = '× SN';
            modeBadge.title = 'Kliknite pre prepnutie medzi "na zariadenie (x SN)" a "fixne 1x na balík"';

            modeBadge.addEventListener('click', () => {
                if (modeBadge.dataset.mode === 'per_box') {
                    modeBadge.dataset.mode = 'fixed';
                    modeBadge.textContent = 'Fixne';
                    modeBadge.classList.add('fixed');
                } else {
                    modeBadge.dataset.mode = 'per_box';
                    modeBadge.textContent = '× SN';
                    modeBadge.classList.remove('fixed');
                }
                updateLivePreviewAndValidate();
            });

            const changeHandler = () => {
                countInput.classList.toggle('hidden', !cb.checked);
                modeBadge.classList.toggle('hidden', !cb.checked);
                itemDiv.classList.toggle('checked', cb.checked);
                updateLivePreviewAndValidate();
            };

            cb.addEventListener('change', changeHandler);
            countInput.addEventListener('input', updateLivePreviewAndValidate);

            itemDiv.append(cb, label, countInput, modeBadge);
            checkboxContainer.appendChild(itemDiv);
        });
    }

    function getCurrentProductType() {
        if (radioSmc.checked) return 'S/MC';
        if (radioVc.checked) return 'VC';
        return 'Ostatné';
    }

    // --- INTELIGENTNÝ PARSER SÉRIOVÝCH ČÍSIEL ---
    function parseEnteredSerialNumbers() {
        const type = getCurrentProductType();
        if (type === 'Ostatné') return { list: [{ sn: 'Príslušenstvo', size: null }], errors: [] };

        const raw = snInput.value.trim();
        if (!raw) return { list: [], errors: [] };

        const isNonStandard = nonStandardSnCheckbox.checked;
        const lines = raw.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
        const result = [];
        const errors = [];

        const vcRegex = /^[A-Za-z]\d{7}$/;

        lines.forEach(line => {
            if (type === 'VC') {
                // Pre VC rozdelíme aj medzerami
                const tokens = line.split(/\s+/).filter(t => t.length > 0);
                tokens.forEach(tok => {
                    if (!isNonStandard && !vcRegex.test(tok)) {
                        errors.push(`Neplatný VC formát: "${tok}" (má byť X0000000)`);
                    }
                    result.push({ sn: tok, size: null });
                });
            } else if (type === 'S/MC') {
                // Podpora formátov: "SEG-001 - XL", "SEG-002 M", "SEG-003-L"
                // Odstránime redundantné pomlčky na rozhraní SN a veľkosti
                const cleanLine = line.replace(/\s*-\s*([sSmMlLxX]+)$/, ' $1');
                const parts = cleanLine.split(/\s+/).filter(p => p.length > 0);

                const sn = parts[0];
                let size = null;

                if (parts.length >= 2) {
                    const potentialSize = parts[parts.length - 1].toUpperCase();
                    if (['S', 'M', 'L', 'XL'].includes(potentialSize)) {
                        size = potentialSize;
                    }
                }

                if (!size) {
                    errors.push(`Pri SN "${sn}" chýba veľkosť (doplňte S, M, L alebo XL, napr. ${sn} - L)`);
                }

                result.push({ sn, size: size || 'M' });
            }
        });

        return { list: result, errors };
    }

    // --- ZÍSKANIE ZAŠKRTNUTÝCH POLOŽIEK ---
    function getSelectedFormItems() {
        const selected = [];
        checkboxContainer.querySelectorAll('.checkbox-item').forEach(itemDiv => {
            const cb = itemDiv.querySelector('input[type="checkbox"]');
            if (cb && cb.checked) {
                const name = itemDiv.dataset.name;
                const count = parseInt(itemDiv.querySelector('input[type="number"]').value) || 1;
                const mode = itemDiv.querySelector('.item-mode-badge').dataset.mode;
                selected.push({ name, count, mode });
            }
        });
        return selected;
    }

    // --- AUTOMATICKÉ PRAVIDLO PRE LEASE OBJEDNÁVKY ---
    function applyLeaseAutoRule() {
        const isLease = orderTypeSelect.value === 'Lease';
        const type = getCurrentProductType();

        if (isLease && type === 'S/MC') {
            const lmountItem = checkboxContainer.querySelector('[data-id="15"]');
            if (lmountItem) {
                const cb = lmountItem.querySelector('input[type="checkbox"]');
                if (cb && !cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change'));
                }
            }
        }
    }

    // --- ŽIVÝ NÁHĽAD (LIVE PREVIEW) A VALIDÁCIA ---
    function updateLivePreviewAndValidate() {
        const type = getCurrentProductType();
        const parsed = parseEnteredSerialNumbers();
        const items = getSelectedFormItems();
        const orderNum = orderNumberInput.value.trim();
        const orderType = orderTypeSelect.value;

        const count = parsed.list.length;
        snCountBadge.textContent = `${count} ks`;

        // 1. Zostavenie Živého Náhľadu
        if (count === 0 && items.length === 0) {
            livePreviewContent.innerHTML = '<em>Zadajte sériové čísla a vyberte položky pre zobrazenie náhľadu.</em>';
        } else {
            let previewHTML = `<strong>Typ:</strong> ${type} (${count} ks zariadení)<br>`;

            // Zoznam krabíc
            if (type === 'VC' && count > 0) {
                previewHTML += `• <strong>Krabice:</strong> ${count}× VC inner box, ${count}× VC outer box<br>`;
            } else if (type === 'S/MC' && count > 0) {
                const sizeMap = {};
                parsed.list.forEach(i => { sizeMap[i.size] = (sizeMap[i.size] || 0) + 1; });
                const boxList = Object.entries(sizeMap).map(([s, q]) => `${q}× ${s} paper box (inner+outer)`).join(', ');
                previewHTML += `• <strong>Krabice:</strong> ${boxList}<br>`;
            }

            // Zoznam položiek
            if (items.length > 0) {
                previewHTML += `• <strong>Príslušenstvo:</strong><ul>`;
                items.forEach(it => {
                    const totalQty = it.mode === 'per_box' ? (it.count * (count || 1)) : it.count;
                    const modeText = it.mode === 'per_box' ? `(${it.count} ks / krabica)` : `(fixne na balík)`;
                    previewHTML += `<li>${it.name}: <strong>${totalQty} ks</strong> ${modeText}</li>`;
                });
                previewHTML += `</ul>`;
            } else {
                previewHTML += `• <em>Žiadne káble ani príslušenstvo (iba telo a krabice).</em>`;
            }

            livePreviewContent.innerHTML = previewHTML;
        }

        // 2. Kontrola platnosti formulára
        const missing = [];
        if (!orderNum) missing.push('Číslo objednávky');
        if (!orderType) missing.push('Typ objednávky');
        if (type !== 'Ostatné' && count === 0) missing.push('Zadajte aspoň 1 sériové číslo');
        if (parsed.errors.length > 0) missing.push(...parsed.errors);

        const isValid = missing.length === 0;
        saveBoxBtn.disabled = !isValid;

        if (!isValid) {
            validationFeedback.style.color = '#e11d48';
            validationFeedback.textContent = '❌ ' + missing.join(' | ');
        } else {
            validationFeedback.style.color = '#16a34a';
            validationFeedback.textContent = `✓ Balík je pripravený (${count} ks). Stlačte Ctrl+Enter na pridanie.`;
        }
    }

    // --- PREDVOĽBY ---
    function setPreset(presetName) {
        checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change'));
        });

        let toSelect = [];
        if (presetName === 'smc') toSelect = [1, 3, 4, 5, 6];
        else if (presetName === 'eu') toSelect = [2, 6, 7, 8, 9, 10, 11];
        else if (presetName === 'us') toSelect = [2, 12, 7, 8, 9, 10, 11];
        else if (presetName === 'uk') toSelect = [2, 13, 7, 8, 9, 10, 11];
        else if (presetName === 'jpy') toSelect = [2, 14, 7, 8, 9, 10, 11];

        toSelect.forEach(id => {
            const el = checkboxContainer.querySelector(`[data-id="${id}"] input[type="checkbox"]`);
            if (el) {
                el.checked = true;
                el.dispatchEvent(new Event('change'));
            }
        });

        applyLeaseAutoRule();
        updateLivePreviewAndValidate();
    }

    document.getElementById('preset-buttons-container').addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') return;
        if (e.target.dataset.clear) {
            checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            });
            updateLivePreviewAndValidate();
            return;
        }
        if (e.target.dataset.preset) {
            setPreset(e.target.dataset.preset);
        }
    });

    // Prepínanie typov produktov
    function handleTypeChange() {
        const type = getCurrentProductType();
        presetsSmcGroup.classList.toggle('hidden', type !== 'S/MC');
        presetsVcGroup.classList.toggle('hidden', type !== 'VC');
        document.getElementById('sn-input-section').classList.toggle('hidden', type === 'Ostatné');

        if (type === 'S/MC') {
            snHint.innerHTML = 'Uvádzajte veľkosť za SN, napr. <code>SEG-001 - XL</code>, <code>SEG-002 M</code> alebo <code>SEG-003 - L</code>.';
            snInput.placeholder = 'Napr.:\nSEG-001 - M\nSEG-002 - L\nSEG-003 - XL';
        } else if (type === 'VC') {
            snHint.innerHTML = 'Formát pre VC: <code>A1234567</code> (1 písmeno + 7 čísiel).';
            snInput.placeholder = 'Napr.:\nA1234567\nA1234568';
        }

        renderCheckboxes();
        applyLeaseAutoRule();
        updateLivePreviewAndValidate();
    }

    [radioSmc, radioVc, radioOther].forEach(r => r.addEventListener('change', handleTypeChange));

    // Predvypĺňanie existujúcej objednávky
    function handleOrderNumberChange() {
        const num = orderNumberInput.value.trim();
        if (allOrders[num]) {
            orderTypeSelect.value = allOrders[num].orderType;
            customerNameInput.value = allOrders[num].customerName;
            customerAddressInput.value = allOrders[num].customerAddress;
            orderDescriptionInput.value = allOrders[num].description || '';
        }
        applyLeaseAutoRule();
        updateLivePreviewAndValidate();
    }
    orderNumberInput.addEventListener('input', handleOrderNumberChange);
    orderNumberInput.addEventListener('blur', handleOrderNumberChange);

    orderTypeSelect.addEventListener('change', () => {
        applyLeaseAutoRule();
        updateLivePreviewAndValidate();
    });

    [customerNameInput, customerAddressInput, orderDescriptionInput, snInput, nonStandardSnCheckbox].forEach(el => {
        el.addEventListener('input', updateLivePreviewAndValidate);
        el.addEventListener('change', updateLivePreviewAndValidate);
    });

    // Extra položky dropdown
    extraItemDefinitions.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        extraItemSelect.appendChild(opt);
    });

    extraItemSelect.addEventListener('change', function() {
        if (this.value) {
            const name = this.value;
            let exists = false;
            checkboxContainer.querySelectorAll('.checkbox-item').forEach(el => {
                if (el.dataset.name === name) exists = true;
            });
            if (!exists) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('checkbox-item', 'checked');
                itemDiv.dataset.name = name;
                itemDiv.dataset.id = dynamicCounter++;

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = true;
                cb.id = `item-cb-extra-${itemDiv.dataset.id}`;

                const label = document.createElement('label');
                label.htmlFor = cb.id;
                label.textContent = name;

                const countInput = document.createElement('input');
                countInput.type = 'number';
                countInput.min = 1;
                countInput.value = 1;

                const modeBadge = document.createElement('span');
                modeBadge.classList.add('item-mode-badge');
                modeBadge.dataset.mode = 'per_box';
                modeBadge.textContent = '× SN';

                modeBadge.addEventListener('click', () => {
                    if (modeBadge.dataset.mode === 'per_box') {
                        modeBadge.dataset.mode = 'fixed';
                        modeBadge.textContent = 'Fixne';
                        modeBadge.classList.add('fixed');
                    } else {
                        modeBadge.dataset.mode = 'per_box';
                        modeBadge.textContent = '× SN';
                        modeBadge.classList.remove('fixed');
                    }
                    updateLivePreviewAndValidate();
                });

                cb.addEventListener('change', () => {
                    countInput.classList.toggle('hidden', !cb.checked);
                    modeBadge.classList.toggle('hidden', !cb.checked);
                    itemDiv.classList.toggle('checked', cb.checked);
                    updateLivePreviewAndValidate();
                });
                countInput.addEventListener('input', updateLivePreviewAndValidate);

                itemDiv.append(cb, label, countInput, modeBadge);
                checkboxContainer.appendChild(itemDiv);
            }
            this.value = '';
            updateLivePreviewAndValidate();
        }
    });

    // Skratka Ctrl + Enter
    snInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!saveBoxBtn.disabled) saveBoxBtn.click();
        }
    });

    // --- ULOŽENIE BALÍKA DO OBJEDNÁVKY ---
    saveBoxBtn.addEventListener('click', function() {
        const orderNumber = orderNumberInput.value.trim();
        const orderType = orderTypeSelect.value;
        const customerName = customerNameInput.value.trim();
        const customerAddress = customerAddressInput.value.trim();
        const description = orderDescriptionInput.value.trim();

        const type = getCurrentProductType();
        const parsed = parseEnteredSerialNumbers();
        const items = getSelectedFormItems();

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

        // Výpočet veľkostí
        const sizeCounts = {};
        if (type === 'S/MC') {
            parsed.list.forEach(item => {
                sizeCounts[item.size] = (sizeCounts[item.size] || 0) + 1;
            });
        }

        // Pridanie balíka
        allOrders[orderNumber].packages.push({
            type: type,
            sns: parsed.list,
            sizeCounts: sizeCounts,
            items: items
        });

        renderSavedOrders();
        resetPackageFormOnly();
    });

    // --- VYKRESLENIE SÚHRNU ---
    function renderSavedOrders() {
        savedOrdersContent.innerHTML = '';
        const orderKeys = Object.keys(allOrders);

        if (orderKeys.length === 0) {
            savedOrdersContent.innerHTML = '<p class="empty-hint">Zatiaľ nie sú uložené žiadne objednávky.</p>';
            totalSummaryDiv.classList.add('hidden');
            printBtn.classList.add('hidden');
            return;
        }

        orderKeys.forEach(orderNumber => {
            const orderData = allOrders[orderNumber];
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order-group');

            const descHTML = orderData.description ? `<div style="background:#e2e8f0; padding:4px 8px; margin-bottom:6px; border-radius:4px; font-size:0.88em;"><strong>Poznámka:</strong> ${orderData.description}</div>` : '';

            let html = `<h3>Objednávka: ${orderData.orderNumber} (${orderData.orderType})</h3>
                        <p style="margin:0 0 6px 0; font-size:0.88em;"><strong>Zákazník:</strong> ${orderData.customerName || 'N/A'} | <strong>Adresa:</strong> ${orderData.customerAddress || 'N/A'}</p>
                        ${descHTML}`;

            orderData.packages.forEach((pkg, index) => {
                const count = pkg.sns.length;
                html += `<div class="summary-box">`;
                html += `<h4>Balík #${index + 1}: ${pkg.type} — <strong>${count} ks</strong></h4>`;

                if (pkg.type !== 'Ostatné' && count > 0) {
                    html += `<div class="sn-list-container"><strong>Sériové čísla:</strong><div class="sn-tags">`;
                    pkg.sns.forEach(i => {
                        const sizeBadge = i.size ? `<span class="tag-size">${i.size}</span>` : '';
                        html += `<span class="sn-tag">${i.sn}${sizeBadge}</span>`;
                    });
                    html += `</div></div>`;
                }

                // Krabice
                if (pkg.type === 'VC') {
                    html += `<p style="margin:4px 0; font-size:0.85em;">• <strong>Krabice:</strong> ${count}× VC inner box, ${count}× VC outer box</p>`;
                } else if (pkg.type === 'S/MC') {
                    const boxSummary = Object.entries(pkg.sizeCounts).map(([s, q]) => `${q}× ${s} paper box`).join(', ');
                    html += `<p style="margin:4px 0; font-size:0.85em;">• <strong>Krabice:</strong> ${boxSummary}</p>`;
                }

                // Položky
                if (pkg.items.length > 0) {
                    html += `<strong style="font-size:0.85em;">Príslušenstvo v balíku:</strong><ul style="margin:2px 0 0 0; padding-left:18px; font-size:0.85em;">`;
                    pkg.items.forEach(item => {
                        const totalQty = item.mode === 'per_box' ? (item.count * count) : item.count;
                        const perText = item.mode === 'per_box' && count > 1 ? `<span class="item-per-box-note">(${item.count} ks / zariadenie)</span>` : '';
                        html += `<li>${item.name}: <strong>${totalQty} ks</strong> ${perText}</li>`;
                    });
                    html += `</ul>`;
                }
                html += `</div>`;
            });

            orderDiv.innerHTML = html;
            savedOrdersContent.appendChild(orderDiv);
        });

        updateTotalSummary();
        printBtn.classList.remove('hidden');
    }

    // --- CELKOVÝ SUMÁR KUSOV ---
    function updateTotalSummary() {
        const totals = {};
        let grandTotal = 0;

        Object.values(allOrders).forEach(order => {
            order.packages.forEach(pkg => {
                const count = pkg.sns.length;

                // Krabice VC
                if (pkg.type === 'VC') {
                    totals['VC paper box inner'] = (totals['VC paper box inner'] || 0) + count;
                    totals['VC paper box outer'] = (totals['VC paper box outer'] || 0) + count;
                } else if (pkg.type === 'S/MC') {
                    Object.entries(pkg.sizeCounts).forEach(([size, qty]) => {
                        totals[`${size} paper box inner`] = (totals[`${size} paper box inner`] || 0) + qty;
                        totals[`${size} paper box outer`] = (totals[`${size} paper box outer`] || 0) + qty;
                    });
                }

                // Položky
                pkg.items.forEach(item => {
                    const qty = item.mode === 'per_box' ? (item.count * count) : item.count;
                    totals[item.name] = (totals[item.name] || 0) + qty;
                });
            });
        });

        const keys = Object.keys(totals);
        if (keys.length === 0) {
            totalSummaryDiv.classList.add('hidden');
            return;
        }

        totalSummaryDiv.classList.remove('hidden');
        let html = '<ul style="margin:4px 0; padding-left:18px; font-size:0.9em;">';
        keys.sort().forEach(name => {
            html += `<li>${name}: <strong>${totals[name]} ks</strong></li>`;
            grandTotal += totals[name];
        });
        html += `</ul><hr><p style="margin:4px 0; font-size:0.95em;"><strong>Celkový počet všetkých položiek: ${grandTotal} ks</strong></p>`;
        totalItemsContent.innerHTML = html;
    }

    // Resetuje len spodnú časť balíka (údaje objednávky zostávajú predvyplnené pre ďalší balík)
    function resetPackageFormOnly() {
        snInput.value = '';
        renderCheckboxes();
        updateLivePreviewAndValidate();
        snInput.focus();
    }

    printBtn.addEventListener('click', () => window.print());

    // --- INICIALIZÁCIA ---
    startWorldClocks();
    handleTypeChange();
});
