document.addEventListener('DOMContentLoaded', function() {
    
    // Názvy položiek
    const itemNames = {
        1: "POE injector",
        2: "ethernet 5m",
        3: "EU power cable",
        4: "Quick start guide",
        5: "ferrite core",
        6: "Položka 6",
        7: "Položka 7",
        8: "Položka 8",
        9: "Položka 9",
        10: "Položka 10"
    };

    // Pole, kde sa budú ukladať všetky krabice
    let allBoxes = [];

    const checkboxContainer = document.getElementById('checkbox-container');
    const snInput = document.getElementById('serial-number');
    const addBoxBtn = document.getElementById('add-box-btn');
    const summaryList = document.getElementById('summary-list');
    const printBtn = document.getElementById('print-btn');
    const totalSummaryDiv = document.getElementById('total-summary');
    const totalItemsContent = document.getElementById('total-items-content');

    // 1. Generovanie zaškrtávacích políčok s novými názvami
    function generateCheckboxes() {
        checkboxContainer.innerHTML = ''; // Vyčistí staré políčka
        for (let i = 1; i <= 10; i++) {
            const itemName = itemNames[i];
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('checkbox-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `item-${i}`;
            checkbox.dataset.id = i;

            const label = document.createElement('label');
            label.htmlFor = `item-${i}`;
            label.textContent = itemName;

            const counter = document.createElement('input');
            counter.type = 'number';
            counter.id = `counter-${i}`;
            counter.min = 1;
            counter.value = 1;
            counter.classList.add('hidden');

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            itemDiv.appendChild(counter);
            checkboxContainer.appendChild(itemDiv);

            checkbox.addEventListener('change', function() {
                counter.classList.toggle('hidden', !this.checked);
            });
        }
    }
    
    generateCheckboxes();

    // 2. Logika pre tlačidlo "Pridať krabicu do súhrnu"
    addBoxBtn.addEventListener('click', function() {
        const sn = snInput.value.trim();
        if (!sn) {
            alert('Prosím, zadajte sériové číslo (SN).');
            return;
        }

        const selectedItems = [];
        for (let i = 1; i <= 10; i++) {
            const checkbox = document.getElementById(`item-${i}`);
            if (checkbox.checked) {
                const counter = document.getElementById(`counter-${i}`);
                selectedItems.push({
                    name: itemNames[i],
                    count: parseInt(counter.value)
                });
            }
        }

        if (selectedItems.length === 0) {
            alert('Nevybrali ste žiadne položky pre túto krabicu.');
            return;
        }

        // Uloženie dát o krabici
        allBoxes.push({ sn, items: selectedItems });

        // Aktualizácia zobrazenia
        renderSummary();
        resetForm();
    });

    // 3. Vykreslenie súhrnu všetkých krabíc a celkového súčtu
    function renderSummary() {
        summaryList.innerHTML = '';
        const totalCounts = {};

        allBoxes.forEach(box => {
            // Vytvorenie vizuálneho bloku pre krabicu
            const boxDiv = document.createElement('div');
            boxDiv.classList.add('summary-box');
            
            let boxHTML = `<h4>SN: ${box.sn}</h4><ul>`;
            box.items.forEach(item => {
                boxHTML += `<li>${item.name}: <strong>${item.count} ks</strong></li>`;
                
                // Priebežné sčítavanie do celkového súčtu
                totalCounts[item.name] = (totalCounts[item.name] || 0) + item.count;
            });
            boxHTML += '</ul>';
            boxDiv.innerHTML = boxHTML;
            summaryList.appendChild(boxDiv);
        });
        
        // Vykreslenie celkového súčtu
        let totalHTML = '<ul>';
        let grandTotal = 0;
        for (const name in totalCounts) {
            totalHTML += `<li>${name}: <strong>${totalCounts[name]} ks</strong></li>`;
            grandTotal += totalCounts[name];
        }
        totalHTML += `</ul><hr><p><strong>Celkový počet všetkých kusov: ${grandTotal}</strong></p>`;
        
        totalItemsContent.innerHTML = totalHTML;

        // Zobrazenie tlačidla tlače a súhrnu, ak existuje aspoň jedna krabica
        if(allBoxes.length > 0) {
            printBtn.classList.remove('hidden');
            totalSummaryDiv.classList.remove('hidden');
        } else {
            printBtn.classList.add('hidden');
            totalSummaryDiv.classList.add('hidden');
        }
    }

    // 4. Resetovanie formulára pre zadanie ďalšej krabice
    function resetForm() {
        snInput.value = '';
        generateCheckboxes(); // Najjednoduchší spôsob, ako resetovať checkboxy a počítadlá
        snInput.focus();
    }

    // 5. Logika pre finálnu tlač
    printBtn.addEventListener('click', function() {
        window.print();
    });
});
