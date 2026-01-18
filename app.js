document.addEventListener('DOMContentLoaded', () => {
    
    // Referencias DOM
    const btnGenerar = document.getElementById('btn-generar');
    const btnDescargar = document.getElementById('btn-descargar');
    const btnSolucion = document.getElementById('btn-solucion'); // Nuevo botón
    const btnEliminar = document.getElementById('btn-eliminar-texto');
    const btnTema = document.getElementById('btn-tema');
    
    // Inputs y áreas
    const inputPalabras = document.getElementById('palabras');
    const inputTitulo = document.getElementById('titulo');
    const displayTitulo = document.getElementById('display-titulo');
    const gridContainer = document.getElementById('grid-container');
    const listaPalabrasUl = document.getElementById('lista-palabras');
    const hojaPapel = document.getElementById('hoja-papel');
    const inputFilas = document.getElementById('filas');
    const inputCols = document.getElementById('cols');
    const radiosDificultad = document.getElementsByName('dificultad');

    // ESTADO DE LA APLICACIÓN
    let datosSolucion = null; // Aquí guardaremos las coordenadas
    let mostrandoSolucion = false;

    // --- MODO OSCURO (Igual que antes) ---
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
        if(confirm("¿Borrar lista?")) inputPalabras.value = '';
    });

    // --- GENERAR ---
    btnGenerar.addEventListener('click', () => {
        const filas = parseInt(inputFilas.value);
        const cols = parseInt(inputCols.value);
        const textoRaw = inputPalabras.value;
        
        let dificultad = 'facil';
        for (const radio of radiosDificultad) {
            if (radio.checked) { dificultad = radio.value; break; }
        }
        
        const listaPalabras = textoRaw.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);

        if (listaPalabras.length === 0) { alert("Ingresa palabras"); return; }

        displayTitulo.innerText = inputTitulo.value || "Sopa de Letras";

        const generador = new GeneradorSopa(filas, cols);
        const resultado = generador.generar(listaPalabras, dificultad);

        // GUARDAMOS EL RESULTADO EN LA VARIABLE GLOBAL
        datosSolucion = resultado;
        mostrandoSolucion = false; // Resetear estado visual
        btnSolucion.innerText = "👁️ Solución";

        renderizarGrilla(resultado.grilla, filas, cols);
        renderizarLista(resultado.colocadas);
        
        // Habilitar botones
        btnDescargar.disabled = false;
        btnSolucion.disabled = false;

        if (resultado.omitidas.length > 0) alert(`No cupieron: ${resultado.omitidas.join(", ")}`);
    });

    // --- TOGGLE VER SOLUCIÓN ---
    btnSolucion.addEventListener('click', () => {
        if (!datosSolucion) return;

        mostrandoSolucion = !mostrandoSolucion;
        
        if (mostrandoSolucion) {
            btnSolucion.innerText = "Ocultar";
            resaltarRespuestas(true);
        } else {
            btnSolucion.innerText = "👁️ Solución";
            resaltarRespuestas(false);
        }
    });

    // Función auxiliar para pintar/despintar celdas
    function resaltarRespuestas(activar) {
        const celdas = gridContainer.children;
        const cols = parseInt(inputCols.value);
        
        // Limpiar todo primero
        if (!activar) {
            for (let celda of celdas) celda.classList.remove('highlight');
            return;
        }

        // Recorrer cada palabra solucionada y calcular sus celdas
        Object.keys(datosSolucion.soluciones).forEach(palabra => {
            const { fila, col, dir } = datosSolucion.soluciones[palabra];
            
            for (let i = 0; i < palabra.length; i++) {
                const fActual = fila + (dir.y * i);
                const cActual = col + (dir.x * i);
                
                // Calcular índice lineal en el grid (Fila * TotalColumnas + Columna)
                const index = (fActual * cols) + cActual;
                
                if (celdas[index]) {
                    celdas[index].classList.add('highlight');
                }
            }
        });
    }

    // --- RENDERIZADO ---
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

    // --- DESCARGAR PDF (CONDICIONAL) ---
    btnDescargar.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const chkIncluirSolucion = document.getElementById('chk-incluir-solucion'); // Referencia al checkbox
        
        const textoOriginal = btnDescargar.innerText;
        btnDescargar.innerText = "Generando PDF...";
        btnDescargar.disabled = true;

        try {
            // Guardar estado visual actual (¿usuario estaba viendo respuestas?)
            const estadoUsuarioSolucion = mostrandoSolucion;

            // ------------------------------------------------
            // PÁGINA 1: EL JUEGO (SIEMPRE SE GENERA)
            // ------------------------------------------------
            resaltarRespuestas(false); // Limpiamos visualmente para la foto
            const canvasJuego = await html2canvas(hojaPapel, { scale: 2 });
            const imgJuego = canvasJuego.toDataURL('image/png');

            // Crear el documento PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            // Agregar imagen del juego
            const propsJuego = pdf.getImageProperties(imgJuego);
            const heightJuego = (propsJuego.height * pdfWidth) / propsJuego.width;
            pdf.addImage(imgJuego, 'PNG', 0, 10, pdfWidth, heightJuego);

            // ------------------------------------------------
            // PÁGINA 2: LA SOLUCIÓN (OPCIONAL)
            // ------------------------------------------------
            if (chkIncluirSolucion.checked) {
                // Modificar interfaz temporalmente
                resaltarRespuestas(true); // Pintar respuestas
                const tituloOriginal = displayTitulo.innerText;
                displayTitulo.innerText += " (SOLUCIÓN)"; // Cambiar título
                
                // Tomar foto
                const canvasSolucion = await html2canvas(hojaPapel, { scale: 2 });
                const imgSolucion = canvasSolucion.toDataURL('image/png');

                // Restaurar título inmediatamente
                displayTitulo.innerText = tituloOriginal;

                // Agregar nueva página al PDF
                pdf.addPage();
                const propsSol = pdf.getImageProperties(imgSolucion);
                const heightSol = (propsSol.height * pdfWidth) / propsSol.width;
                pdf.addImage(imgSolucion, 'PNG', 0, 10, pdfWidth, heightSol);
            }

            // Restaurar estado visual original del usuario
            resaltarRespuestas(estadoUsuarioSolucion);

            // Descargar archivo
            pdf.save(`${inputTitulo.value || 'sopa_de_letras'}.pdf`);

        } catch (error) {
            console.error(error);
            alert("Error al generar PDF");
        } finally {
            btnDescargar.innerText = textoOriginal;
            btnDescargar.disabled = false;
        }
    });
});