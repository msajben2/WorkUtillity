document.addEventListener('DOMContentLoaded', function() {
    const checkboxContainer = document.getElementById('checkbox-container');

    // 1. Vytvorenie 10 zaškrtávacích políčok
    for (let i = 1; i <= 10; i++) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('checkbox-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${i}`;
        checkbox.dataset.id = i;

        const label = document.createElement('label');
        label.htmlFor = `item-${i}`;
        label.textContent = `Položka ${i}`;

        const counter = document.createElement('input');
        counter.type = 'number';
        counter.id = `counter-${i}`;
        counter.min = 1;
        counter.value = 1;
        counter.classList.add('hidden'); // Skryté v predvolenom stave

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        itemDiv.appendChild(counter);
        checkboxContainer.appendChild(itemDiv);

        // Zobrazenie/skrytie počítadla pri zaškrtnutí
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                counter.classList.remove('hidden');
            } else {
                counter.classList.add('hidden');
            }
        });
    }

    // 2. Spracovanie súhrnu
    const summarizeBtn = document.getElementById('summarize-btn');
    summarizeBtn.addEventListener('click', function() {
        const summaryContainer = document.getElementById('summary-container');
        const summaryContent = document.getElementById('summary-content');
        let summaryHTML = '<h3>Zvolené položky:</h3><ul>';

        // Získanie dát z checkboxov a počítadiel
        for (let i = 1; i <= 10; i++) {
            const checkbox = document.getElementById(`item-${i}`);
            if (checkbox.checked) {
                const counter = document.getElementById(`counter-${i}`);
                summaryHTML += `<li>Položka ${i}: <strong>${counter.value} ks</strong></li>`;
            }
        }
        summaryHTML += '</ul>';

        // Získanie dát z rozbaľovacích menu
        summaryHTML += '<h3>Voliteľné možnosti:</h3><ul>';
        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`select-${i}`);
            summaryHTML += `<li>Možnosť ${i}: <strong>${select.value}</strong></li>`;
        }
        summaryHTML += '</ul>';

        summaryContent.innerHTML = summaryHTML;
        summaryContainer.classList.remove('hidden');
    });

    // 3. Spustenie tlače
    const printBtn = document.getElementById('print-btn');
    printBtn.addEventListener('click', function() {
        window.print();
    });
});
