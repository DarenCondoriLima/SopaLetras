// renderer.js
export function createSheetHTML(previewArea, id, titulo, resultado, cols, authorName = "[Tu Nombre]") {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.id = `sheet-${id}`;

    const h2 = document.createElement('h2');
    h2.innerText = titulo;
    h2.id = `title-${id}`;

    const grid = document.createElement('div');
    grid.className = 'grid-container';
    grid.id = `grid-${id}`;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    resultado.grilla.forEach(fila => {
        fila.forEach(letra => {
            const celda = document.createElement('div');
            celda.className = 'grid-cell';
            celda.innerText = letra;
            grid.appendChild(celda);
        });
    });

    const bank = document.createElement('div');
    bank.className = 'word-bank';
    bank.innerHTML = `<h3>🔍 Palabras a buscar:</h3>`;
    const ul = document.createElement('ul');
    resultado.colocadas.forEach(p => {
        const li = document.createElement('li');
        li.innerText = p;
        ul.appendChild(li);
    });
    bank.appendChild(ul);

    const footer = document.createElement('div');
    footer.className = 'footer-sheet';
    footer.innerHTML = `
        <small>✨ Generado con Sopa de Letras App</small><br>
        <small>🖥️ Hecho por ${authorName}</small>
    `;

    sheet.appendChild(h2);
    sheet.appendChild(grid);
    sheet.appendChild(bank);
    sheet.appendChild(footer);
    previewArea.appendChild(sheet);
}

export function highlightAnswers(gridElement, juegoData, active) {
    const celdas = gridElement.children;
    const { cols } = juegoData;
    
    // Limpiar siempre primero
    for (let celda of celdas) celda.classList.remove('highlight');
    
    if (!active) return;

    Object.keys(juegoData.data.soluciones).forEach(palabra => {
        const { fila, col, dir } = juegoData.data.soluciones[palabra];
        for (let i = 0; i < palabra.length; i++) {
            const index = ((fila + (dir.y * i)) * cols) + (col + (dir.x * i));
            if (celdas[index]) celdas[index].classList.add('highlight');
        }
    });
}