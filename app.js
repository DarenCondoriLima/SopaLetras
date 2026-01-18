// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    
    // Referencias a elementos del DOM
    const btnGenerar = document.getElementById('btn-generar');
    const btnDescargar = document.getElementById('btn-descargar');
    const inputPalabras = document.getElementById('palabras');
    const inputTitulo = document.getElementById('titulo');
    const displayTitulo = document.getElementById('display-titulo');
    const gridContainer = document.getElementById('grid-container');
    const listaPalabrasUl = document.getElementById('lista-palabras');
    const hojaPapel = document.getElementById('hoja-papel');

    // Instancia del generador (usando la clase que creamos en el paso anterior)
    let generador;

    // --- FUNCIÓN GENERAR ---
    btnGenerar.addEventListener('click', () => {
        const filas = parseInt(document.getElementById('filas').value);
        const cols = parseInt(document.getElementById('cols').value);
        const textoRaw = inputPalabras.value;
        
        // Procesar palabras: separar por comas o saltos de línea, quitar espacios vacíos
        const listaPalabras = textoRaw.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);

        if (listaPalabras.length === 0) {
            alert("Por favor ingresa al menos una palabra.");
            return;
        }

        // 1. Configurar título
        displayTitulo.innerText = inputTitulo.value || "Sopa de Letras";

        // 2. Ejecutar lógica
        generador = new GeneradorSopa(filas, cols);
        const resultado = generador.generar(listaPalabras);

        // 3. Renderizar Grilla
        renderizarGrilla(resultado.grilla, filas, cols);

        // 4. Renderizar Lista de palabras (solo las que sí cupieron)
        renderizarLista(resultado.colocadas);

        // 5. Habilitar botón de descarga
        btnDescargar.disabled = false;

        // Si hubo omitidas, avisar
        if (resultado.omitidas.length > 0) {
            alert(`Atención: No cupieron estas palabras: ${resultado.omitidas.join(", ")}. Intenta aumentar el tamaño de la cuadrícula.`);
        }
    });

    function renderizarGrilla(matriz, filas, cols) {
        gridContainer.innerHTML = ''; // Limpiar anterior
        
        // Configuramos CSS Grid dinámicamente según el tamaño elegido
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${filas}, 1fr)`;

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

    // --- FUNCIÓN DESCARGAR PDF ---
    btnDescargar.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        
        // Efecto visual de "cargando"
        const textoOriginal = btnDescargar.innerText;
        btnDescargar.innerText = "Generando PDF...";
        btnDescargar.disabled = true;

        try {
            // 1. Capturar el div "hoja-papel" como imagen (Canvas)
            const canvas = await html2canvas(hojaPapel, {
                scale: 2, // Mayor calidad
                useCORS: true // Por si usas imágenes externas (no es el caso aquí, pero buena práctica)
            });

            const imgData = canvas.toDataURL('image/png');
            
            // 2. Crear PDF A4
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calcular proporciones para que la imagen encaje bien
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // 3. Añadir imagen
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, imgHeight); // Margen superior de 10mm
            
            // 4. Descargar
            pdf.save(`${inputTitulo.value || 'sopa_de_letras'}.pdf`);

        } catch (error) {
            console.error("Error al generar PDF", error);
            alert("Hubo un error al generar el PDF.");
        } finally {
            btnDescargar.innerText = textoOriginal;
            btnDescargar.disabled = false;
        }
    });
});