document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DE MODO ---
    const tabSingle = document.getElementById('tab-single');
    const tabMulti = document.getElementById('tab-multi');
    const containerSingle = document.getElementById('container-single');
    const containerMulti = document.getElementById('container-multi');
    const modeDesc = document.getElementById('mode-desc');

    // Inputs Single
    const inputTitulo = document.getElementById('titulo');
    const inputPalabras = document.getElementById('palabras');

    // Botones Comunes
    const btnGenerar = document.getElementById('btn-generar');
    const btnDescargar = document.getElementById('btn-descargar');
    const btnSolucion = document.getElementById('btn-solucion');
    const btnEliminar = document.getElementById('btn-eliminar-texto');
    const btnEjemplo = document.getElementById('btn-ejemplo');
    const btnVerMovil = document.getElementById('btn-ver-movil');
    const btnTema = document.getElementById('btn-tema');
    
    const previewArea = document.getElementById('preview-area');
    const inputFilas = document.getElementById('filas');
    const inputCols = document.getElementById('cols');
    const radiosDificultad = document.getElementsByName('dificultad');

    // ESTADO
    let currentMode = 'single'; // 'single' o 'multi'
    let juegosGenerados = []; 
    let mostrandoSolucion = false;

    // --- CAMBIO DE MODO ---
    tabSingle.addEventListener('click', () => setMode('single'));
    tabMulti.addEventListener('click', () => setMode('multi'));

    // --- ELEMENTOS DE IA ---
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnDeleteKey = document.getElementById('btn-delete-key');
    const btnActivateIA = document.getElementById('btn-activate-ia');
    const divAiSection = document.getElementById('ai-section');
    const inputApiKey = document.getElementById('input-api-key');
    const divSetupBox = document.getElementById('ai-setup-box');
    const divReadyBox = document.getElementById('ai-ready-box');
    const divHelpText = document.getElementById('ai-help-text');
    
    const btnAIGenerate = document.getElementById('btn-ai-generate');
    const inputAITopic = document.getElementById('ai-topic');

    // 1. COMPROBAR SI YA HAY KEY GUARDADA
    checkSavedKey();

    function checkSavedKey() {
        const key = localStorage.getItem('gemini_api_key');
        if (key) {
            // Si hay key, ocultar setup y mostrar ready
            divSetupBox.classList.add('hidden');
            divHelpText.classList.add('hidden');
            divReadyBox.classList.remove('hidden');
            divReadyBox.style.display = 'flex'; // Restaurar flex si hidden lo quitó
        } else {
            // Si no hay, mostrar setup
            divSetupBox.classList.remove('hidden');
            divHelpText.classList.remove('hidden');
            divReadyBox.classList.add('hidden');
        }
    }

    // 2. GUARDAR KEY
    btnSaveKey.addEventListener('click', () => {
        const key = inputApiKey.value.trim();
        if (key.length < 10) {
            alert("La API Key parece demasiado corta.");
            return;
        }
        localStorage.setItem('gemini_api_key', key);
        inputApiKey.value = ''; // Limpiar input por seguridad
        checkSavedKey(); // Actualizar interfaz
    });

    // 3. BORRAR KEY
    btnDeleteKey.addEventListener('click', () => {
        if(confirm("¿Quieres borrar la API Key de este navegador?")) {
            localStorage.removeItem('gemini_api_key');
            checkSavedKey();
        }
    });

    btnActivateIA.addEventListener('click', () => {
        // 1. Alternar la clase 'hidden'
        divAiSection.classList.toggle('hidden');
        
        // 2. Verificar si ahora es visible para cambiar el texto
        const isHidden = divAiSection.classList.contains('hidden');
        
        if (isHidden) {
            btnActivateIA.innerText = "🤖 Usar IA";
            btnActivateIA.classList.remove('active'); // Opcional: para estilos
        } else {
            btnActivateIA.innerText = "❌ Ocultar IA";
            btnActivateIA.classList.add('active'); // Opcional
            
            // Foco automático al input cuando se abre
            const inputTopic = document.getElementById('ai-topic');
            const inputKey = document.getElementById('input-api-key');
            
            // Si ya hay key, foco al tema, si no, a la key
            if(localStorage.getItem('gemini_api_key')) {
                setTimeout(() => inputTopic.focus(), 100);
            } else {
                setTimeout(() => inputKey.focus(), 100);
            }
        }
    });

    // 4. GENERAR CON IA
    btnAIGenerate.addEventListener('click', async () => {
        const tema = inputAITopic.value.trim();
        const apiKey = localStorage.getItem('gemini_api_key');

        if (!apiKey) {
            alert("⚠️ Primero debes guardar tu API Key de Google Gemini arriba.");
            return;
        }
        
        if (!tema) {
            alert("Escribe una temática (ej: Países de Europa).");
            return;
        }

        const textoOriginal = btnAIGenerate.innerText;
        btnAIGenerate.innerText = "✨ Pensando...";
        btnAIGenerate.disabled = true;

        try {
            // Prompt optimizado para que la IA no hable, solo dé datos
            const prompt = `
            Genera una lista de 15 palabras relacionadas con: "${tema}".
            Reglas:
            1. Solo devuelve las palabras (una por línea).
            2. Sin numeración (ni 1., ni -).
            3. Todo en MAYÚSCULAS.
            4. Máximo 12 letras por palabra.
            5. No escribas nada más que las palabras.
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error("Error API:", data.error);
                throw new Error("Error en la API: " + data.error.message);
            }

            const textoGenerado = data.candidates[0].content.parts[0].text;
            
            // Limpiar respuesta (quitar posibles asteriscos o espacios extra)
            const palabrasLimpias = textoGenerado.trim();

            inputPalabras.value = palabrasLimpias;
            inputTitulo.value = tema.charAt(0).toUpperCase() + tema.slice(1);
            
            // Efecto visual de éxito
            inputPalabras.style.borderColor = "#10b981";
            setTimeout(() => inputPalabras.style.borderColor = "", 500);

        } catch (error) {
            console.error(error);
            alert("Hubo un problema: " + error.message);
            // Si el error es de autenticación, sugerir borrar la key
            if(error.message.includes('API_KEY_INVALID') || error.message.includes('403')) {
                if(confirm("La API Key parece inválida. ¿Quieres borrarla?")) {
                    localStorage.removeItem('gemini_api_key');
                    checkSavedKey();
                }
            }
        } finally {
            btnAIGenerate.innerText = textoOriginal;
            btnAIGenerate.disabled = false;
        }
    });

    // --- REFERENCIAS IA MULTI ---
    const btnActivateIAMulti = document.getElementById('btn-activate-ia-multi');
    const divAiSectionMulti = document.getElementById('ai-section-multi');
    const btnAIGenerateMulti = document.getElementById('btn-ai-generate-multi');
    const inputTopicMulti = document.getElementById('ai-topic-multi');
    const inputQtyMulti = document.getElementById('ai-qty-multi');
    const inputPalabrasMulti = document.getElementById('palabras-multi');

    // --- TOGGLE VISIBILIDAD IA MULTI ---
    btnActivateIAMulti.addEventListener('click', () => {
        divAiSectionMulti.classList.toggle('hidden');
        if (divAiSectionMulti.classList.contains('hidden')) {
            btnActivateIAMulti.innerText = "🤖 Generar Pack con IA";
        } else {
            btnActivateIAMulti.innerText = "❌ Cerrar IA";
            setTimeout(() => inputTopicMulti.focus(), 100);
        }
    });

    // --- GENERAR MULTI ---
    btnAIGenerateMulti.addEventListener('click', async () => {
        const temas = inputTopicMulti.value.trim();
        const cantidad = inputQtyMulti.value || 15;
        const apiKey = localStorage.getItem('gemini_api_key');

        if (!apiKey) {
            alert("⚠️ Primero configura tu API Key en la pestaña 'Un Juego'.");
            // Opcional: Cambiar a la pestaña single automáticamente
            tabSingle.click();
            return;
        }

        if (!temas) {
            alert("Ingresa al menos un tema (ej: Deportes).");
            return;
        }

        const textoOriginal = btnAIGenerateMulti.innerText;
        btnAIGenerateMulti.innerText = "📚 Generando múltiples listas...";
        btnAIGenerateMulti.disabled = true;

        try {
            // Prompt diseñado para devolver el formato exacto que usa tu parseador
            const prompt = `
            Actúa como un generador de contenido para juegos de sopa de letras.
            El usuario te dará una lista de temas: "${temas}".
            
            Tu tarea es generar UNA lista de palabras para CADA tema.
            
            REGLAS DE FORMATO ESTRICTAS:
            1. Formato de Bloque:
               TÍTULO DEL TEMA
               PALABRA1
               PALABRA2
               ...
            
            2. Separa cada bloque de tema con DOS saltos de línea (\n\n).
            3. Genera exactamente ${cantidad} palabras por cada tema.
            4. Palabras en MAYÚSCULAS, sin tildes (usa N por Ñ), sin espacios, máximo 13 letras.
            5. Solo devuelve el contenido, nada de "Aquí tienes".
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            const textoGenerado = data.candidates[0].content.parts[0].text;
            
            // Inyectar en el textarea masivo
            inputPalabrasMulti.value = textoGenerado.trim();
            
            // Feedback visual
            inputPalabrasMulti.style.borderColor = "#db2777";
            setTimeout(() => inputPalabrasMulti.style.borderColor = "", 500);
            
            // Opcional: Cerrar panel IA para ver resultado
            // divAiSectionMulti.classList.add('hidden');
            // btnActivateIAMulti.innerText = "🤖 Generar Pack con IA";

        } catch (error) {
            console.error(error);
            alert("Error IA: " + error.message);
        } finally {
            btnAIGenerateMulti.innerText = textoOriginal;
            btnAIGenerateMulti.disabled = false;
        }
    });

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'single') {
            tabSingle.classList.add('active');
            tabMulti.classList.remove('active');
            containerSingle.classList.remove('hidden');
            containerMulti.classList.add('hidden');
            modeDesc.innerText = "Configura un juego único.";
        } else {
            tabSingle.classList.remove('active');
            tabMulti.classList.add('active');
            containerSingle.classList.add('hidden');
            containerMulti.classList.remove('hidden');
            modeDesc.innerText = "Pega una lista masiva separada por espacios.";
        }
    }

    // --- TEMAS ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        btnTema.innerText = '☀️';
    }
    btnTema.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            btnTema.innerText = '🌙';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            btnTema.innerText = '☀️';
        }
    });


    // --- BOTONES AUXILIARES ---
    btnEliminar.addEventListener('click', () => {
        if(confirm("¿Borrar contenido actual?")) {
            if (currentMode === 'single') {
                inputPalabras.value = '';
                inputTitulo.value = '';
            } else {
                inputPalabrasMulti.value = '';
            }
        }
    });

    btnEjemplo.addEventListener('click', () => {
        if (currentMode === 'single') {
            inputTitulo.value = "Lugares de Arequipa";
            inputPalabras.value = "MISTI\nCHACHANI\nYANAHUARA\nCOLCA\nSABANDIA\nMONASTERIO";
        } else {
            inputPalabrasMulti.value = 
`Lugares de Arequipa
MISTI
CHACHANI
YANAHUARA

Animales del Peru
CONDOR
VICUÑA
LLAMA

Frutas
LUCUMA
CHIRIMOYA
AGUAYMANTO`;
        }
    });

    btnVerMovil.addEventListener('click', () => {
        previewArea.scrollIntoView({ behavior: 'smooth' });
    });

    // --- LÓGICA PRINCIPAL DE GENERACIÓN ---
    btnGenerar.addEventListener('click', () => {
        const filas = parseInt(inputFilas.value);
        const cols = parseInt(inputCols.value);
        
        let dificultad = 'facil';
        for (const radio of radiosDificultad) { if (radio.checked) { dificultad = radio.value; break; } }

        // 1. Preparar datos según modo
        let juegosAProcesar = [];

        if (currentMode === 'single') {
            const rawTxt = inputPalabras.value;
            const lista = rawTxt.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);
            if (lista.length === 0) { alert("Ingresa palabras."); return; }
            
            juegosAProcesar.push({
                titulo: inputTitulo.value || "Sopa de Letras",
                palabras: lista
            });
        } else {
            // Modo Multi
            juegosAProcesar = parsearInputMulti(inputPalabrasMulti.value);
            if (juegosAProcesar.length === 0) { alert("Formato incorrecto en lista masiva."); return; }
        }

        // 2. Generar
        juegosGenerados = [];
        previewArea.innerHTML = ''; // Limpiar

        juegosAProcesar.forEach((juegoData, index) => {
            const generador = new GeneradorSopa(filas, cols);
            const resultado = generador.generar(juegoData.palabras, dificultad);
            
            // Si hay omitidas en modo single, avisar. En multi, solo console.log para no spamear alertas
            if (currentMode === 'single' && resultado.omitidas.length > 0) {
                alert(`No cupieron: ${resultado.omitidas.join(", ")}`);
            }

            const idUnico = `juego-${index}`;
            juegosGenerados.push({
                id: idUnico,
                titulo: juegoData.titulo,
                data: resultado,
                filas, cols
            });

            crearHojaHTML(idUnico, juegoData.titulo, resultado, filas, cols);
        });

        // 3. Resetear UI
        mostrandoSolucion = false;
        btnSolucion.innerText = "👁️ Ver";
        btnDescargar.disabled = false;
        btnSolucion.disabled = false;
        btnVerMovil.disabled = false;
    });

    function parsearInputMulti(texto) {
        const normalizado = texto.replace(/\r\n/g, "\n");
        const bloques = normalizado.split(/\n\s*\n/);
        const lista = [];
        bloques.forEach(bloque => {
            const lineas = bloque.trim().split('\n').map(l => l.trim()).filter(l => l !== '');
            if (lineas.length < 2) return;
            lista.push({ titulo: lineas[0], palabras: lineas.slice(1) });
        });
        return lista;
    }

    // --- CREACIÓN DE DOM ---
    function crearHojaHTML(id, titulo, resultado, filas, cols) {
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
        // AQUÍ AGREGAMOS TU NOMBRE
        footer.innerHTML = `
            <small>✨ Generado con Sopa de Letras App</small><br>
            <small>🖥️ Hecho por [Daren Paulo Jose Condori Lima]</small>
        `;

        sheet.appendChild(h2);
        sheet.appendChild(grid);
        sheet.appendChild(bank);
        sheet.appendChild(footer);
        previewArea.appendChild(sheet);
    }

    // --- SOLUCIONES ---
    btnSolucion.addEventListener('click', () => {
        if (juegosGenerados.length === 0) return;
        mostrandoSolucion = !mostrandoSolucion;
        btnSolucion.innerText = mostrandoSolucion ? "❌ Ocultar" : "👁️ Ver";

        juegosGenerados.forEach(juego => {
            const grid = document.getElementById(`grid-${juego.id}`);
            resaltar(grid, juego, mostrandoSolucion);
        });
    });

    function resaltar(gridElement, juegoData, activar) {
        const celdas = gridElement.children;
        const { cols } = juegoData;
        for (let celda of celdas) celda.classList.remove('highlight');
        if (!activar) return;

        Object.keys(juegoData.data.soluciones).forEach(palabra => {
            const { fila, col, dir } = juegoData.data.soluciones[palabra];
            for (let i = 0; i < palabra.length; i++) {
                const index = ((fila + (dir.y * i)) * cols) + (col + (dir.x * i));
                if (celdas[index]) celdas[index].classList.add('highlight');
            }
        });
    }

    // --- PDF ---
    btnDescargar.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const chkIncluirSolucion = document.getElementById('chk-incluir-solucion');
        
        btnDescargar.innerText = "⏳ Procesando...";
        btnDescargar.disabled = true;

        const opts = { scale: 2, windowWidth: 1200 };

        try {
            const estadoPrevio = mostrandoSolucion;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // 1. Juegos Limpios
            juegosGenerados.forEach(j => resaltar(document.getElementById(`grid-${j.id}`), j, false));

            for (let i = 0; i < juegosGenerados.length; i++) {
                if (i > 0) pdf.addPage();
                const sheet = document.getElementById(`sheet-${juegosGenerados[i].id}`);
                const canvas = await html2canvas(sheet, opts);
                const img = canvas.toDataURL('image/png');
                const props = pdf.getImageProperties(img);
                const h = (props.height * pdfWidth) / props.width;
                pdf.addImage(img, 'PNG', 0, 10, pdfWidth, h);
            }

            // 2. Soluciones
            if (chkIncluirSolucion.checked) {
                juegosGenerados.forEach(j => {
                    resaltar(document.getElementById(`grid-${j.id}`), j, true);
                    document.getElementById(`title-${j.id}`).innerText = j.titulo + " (SOLUCIÓN)";
                });

                for (let i = 0; i < juegosGenerados.length; i++) {
                    pdf.addPage();
                    const sheet = document.getElementById(`sheet-${juegosGenerados[i].id}`);
                    const canvas = await html2canvas(sheet, opts);
                    const img = canvas.toDataURL('image/png');
                    const props = pdf.getImageProperties(img);
                    const h = (props.height * pdfWidth) / props.width;
                    pdf.addImage(img, 'PNG', 0, 10, pdfWidth, h);
                    // Restaurar título
                    document.getElementById(`title-${juegosGenerados[i].id}`).innerText = juegosGenerados[i].titulo;
                }
            }

            // Restaurar estado
            juegosGenerados.forEach(j => resaltar(document.getElementById(`grid-${j.id}`), j, estadoPrevio));
            
            const nombreArchivo = currentMode === 'single' ? 
                (juegosGenerados[0].titulo || 'sopa') : 'pack_sopas';
            pdf.save(`${nombreArchivo}.pdf`);

        } catch (e) {
            console.error(e);
            alert("Error al generar PDF");
        } finally {
            btnDescargar.innerText = "📄 Descargar PDF";
            btnDescargar.disabled = false;
        }
    });
});