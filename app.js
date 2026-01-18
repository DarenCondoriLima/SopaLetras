document.addEventListener('DOMContentLoaded', () => {
    const btnGenerar = document.getElementById('btn-generar');
    const btnDescargar = document.getElementById('btn-descargar');
    const btnSolucion = document.getElementById('btn-solucion');
    const btnEliminar = document.getElementById('btn-eliminar-texto');
    const btnTema = document.getElementById('btn-tema');
    
    const inputPalabras = document.getElementById('palabras');
    const inputTitulo = document.getElementById('titulo');
    const displayTitulo = document.getElementById('display-titulo');
    const gridContainer = document.getElementById('grid-container');
    const listaPalabrasUl = document.getElementById('lista-palabras');
    const hojaPapel = document.getElementById('hoja-papel');
    const inputFilas = document.getElementById('filas');
    const inputCols = document.getElementById('cols');
    const radiosDificultad = document.getElementsByName('dificultad');

    let datosSolucion = null;
    let mostrandoSolucion = false;

    // Tema
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        btnTema.innerText = '☀️';
    }
    
    btnTema.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            btnTema.innerText = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            btnTema.innerText = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    });

    btnEliminar.addEventListener('click', () => {
        if(confirm("¿Borrar toda la lista de palabras?")) inputPalabras.value = '';
    });

    // Generar
    btnGenerar.addEventListener('click', () => {
        const filas = parseInt(inputFilas.value);
        const cols = parseInt(inputCols.value);
        const textoRaw = inputPalabras.value;
        
        let dificultad = 'facil';
        for (const radio of radiosDificultad) {
            if (radio.checked) { dificultad = radio.value; break; }
        }
        
        const listaPalabras = textoRaw.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);

        if (listaPalabras.length === 0) { 
            alert("⚠️ Por favor ingresa al menos una palabra"); 
            return; 
        }

        displayTitulo.innerText = inputTitulo.value || "Mi Sopa de Letras";

        const generador = new GeneradorSopa(filas, cols);
        const resultado = generador.generar(listaPalabras, dificultad);

        datosSolucion = resultado;
        mostrandoSolucion = false;
        btnSolucion.innerText = "👁️ Ver";

        renderizarGrilla(resultado.grilla, filas, cols);
        renderizarLista(resultado.colocadas);
        
        btnDescargar.disabled = false;
        btnSolucion.disabled = false;

        if (resultado.omitidas.length > 0) {
            alert(`⚠️ No cupieron las siguientes palabras:\n${resultado.omitidas.join(", ")}`);
        }
    });

    // Toggle solución
    btnSolucion.addEventListener('click', () => {
        if (!datosSolucion) return;

        mostrandoSolucion = !mostrandoSolucion;
        
        if (mostrandoSolucion) {
            btnSolucion.innerText = "❌ Ocultar";
            resaltarRespuestas(true);
        } else {
            btnSolucion.innerText = "👁️ Ver";
            resaltarRespuestas(false);
        }
    });

    function resaltarRespuestas(activar) {
        const celdas = gridContainer.children;
        const cols = parseInt(inputCols.value);
        
        if (!activar) {
            for (let celda of celdas) celda.classList.remove('highlight');
            return;
        }

        Object.keys(datosSolucion.soluciones).forEach(palabra => {
            const { fila, col, dir } = datosSolucion.soluciones[palabra];
            
            for (let i = 0; i < palabra.length; i++) {
                const fActual = fila + (dir.y * i);
                const cActual = col + (dir.x * i);
                const index = (fActual * cols) + cActual;
                
                if (celdas[index]) {
                    celdas[index].classList.add('highlight');
                }
            }
        });
    }

    function renderizarGrilla(matriz, filas, cols) {
        gridContainer.innerHTML = ''; 
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        matriz.forEach(fila => {
            fila.forEach(letra => {
                const celda = document.createElement('div');
                celda.className = 'grid-cell';
                celda.innerText = letra;
                gridContainer.appendChild(celda);
            });
        });
    }

    function renderizarLista(palabras) {
        listaPalabrasUl.innerHTML = '';
        palabras.forEach(palabra => {
            const li = document.createElement('li');
            li.innerText = palabra;
            listaPalabrasUl.appendChild(li);
        });
    }

    // Descargar PDF
    btnDescargar.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const chkIncluirSolucion = document.getElementById('chk-incluir-solucion');
        
        const textoOriginal = btnDescargar.innerText;
        btnDescargar.innerText = "⏳ Generando...";
        btnDescargar.disabled = true;

        try {
            const estadoUsuarioSolucion = mostrandoSolucion;

            // Página 1: El juego
            resaltarRespuestas(false);
            const canvasJuego = await html2canvas(hojaPapel, { scale: 2 });
            const imgJuego = canvasJuego.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            const propsJuego = pdf.getImageProperties(imgJuego);
            const heightJuego = (propsJuego.height * pdfWidth) / propsJuego.width;
            pdf.addImage(imgJuego, 'PNG', 0, 10, pdfWidth, heightJuego);

            // Página 2: Solución (opcional)
            if (chkIncluirSolucion.checked) {
                resaltarRespuestas(true);
                const tituloOriginal = displayTitulo.innerText;
                displayTitulo.innerText += " (SOLUCIÓN)";
                
                const canvasSolucion = await html2canvas(hojaPapel, { scale: 2 });
                const imgSolucion = canvasSolucion.toDataURL('image/png');

                displayTitulo.innerText = tituloOriginal;

                pdf.addPage();
                const propsSol = pdf.getImageProperties(imgSolucion);
                const heightSol = (propsSol.height * pdfWidth) / propsSol.width;
                pdf.addImage(imgSolucion, 'PNG', 0, 10, pdfWidth, heightSol);
            }

            resaltarRespuestas(estadoUsuarioSolucion);

            pdf.save(`${inputTitulo.value || 'sopa_de_letras'}.pdf`);

        } catch (error) {
            console.error(error);
            alert("❌ Error al generar el PDF");
        } finally {
            btnDescargar.innerText = textoOriginal;
            btnDescargar.disabled = false;
        }
    });
});