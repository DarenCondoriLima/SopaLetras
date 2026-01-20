// app.js
import GeneradorSopa from './generator.js';
import * as AI from './ai.js';
import * as Renderer from './renderer.js';
import { generatePDF } from './pdf.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM ---
    const tabSingle = document.getElementById('tab-single');
    const tabMulti = document.getElementById('tab-multi');
    const containerSingle = document.getElementById('container-single');
    const containerMulti = document.getElementById('container-multi');
    const modeDesc = document.getElementById('mode-desc');

    const inputTitulo = document.getElementById('titulo');
    const inputPalabras = document.getElementById('palabras');
    const inputPalabrasMulti = document.getElementById('palabras-multi');

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
    const chkIncluirSolucion = document.getElementById('chk-incluir-solucion');

    // Referencias IA
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnDeleteKey = document.getElementById('btn-delete-key');
    const btnActivateIA = document.getElementById('btn-activate-ia');
    const divAiSection = document.getElementById('ai-section');
    const inputApiKey = document.getElementById('input-api-key');
    
    const btnAIGenerate = document.getElementById('btn-ai-generate');
    const inputAITopic = document.getElementById('ai-topic');

    // Referencias IA Multi
    const btnActivateIAMulti = document.getElementById('btn-activate-ia-multi');
    const divAiSectionMulti = document.getElementById('ai-section-multi');
    const btnAIGenerateMulti = document.getElementById('btn-ai-generate-multi');
    const inputTopicMulti = document.getElementById('ai-topic-multi');
    const inputQtyMulti = document.getElementById('ai-qty-multi');


    // ESTADO
    let currentMode = 'single';
    let juegosGenerados = []; 
    let mostrandoSolucion = false;

    // --- INICIALIZACIÓN IA UI ---
    updateAIInterface();

    function updateAIInterface() {
        const key = AI.getApiKey();
        const divSetup = document.getElementById('ai-setup-box');
        const divReady = document.getElementById('ai-ready-box');
        const divHelp = document.getElementById('ai-help-text');

        if (key) {
            divSetup.classList.add('hidden');
            divHelp.classList.add('hidden');
            divReady.classList.remove('hidden');
            divReady.style.display = 'flex';
        } else {
            divSetup.classList.remove('hidden');
            divHelp.classList.remove('hidden');
            divReady.classList.add('hidden');
        }
    }

    // --- EVENTOS DE INTERFAZ ---

    // 1. Modos
    const setMode = (mode) => {
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
    };
    tabSingle.addEventListener('click', () => setMode('single'));
    tabMulti.addEventListener('click', () => setMode('multi'));

    // 2. Tema
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

    // 3. IA Key Management
    btnSaveKey.addEventListener('click', () => {
        try {
            AI.saveApiKey(inputApiKey.value.trim());
            inputApiKey.value = '';
            updateAIInterface();
        } catch(e) { alert(e.message); }
    });

    btnDeleteKey.addEventListener('click', () => {
        if(confirm("¿Borrar Key?")) {
            AI.deleteApiKey();
            updateAIInterface();
        }
    });

    // 4. Toggle IA Panels
    btnActivateIA.addEventListener('click', () => {
        divAiSection.classList.toggle('hidden');
        const isHidden = divAiSection.classList.contains('hidden');
        btnActivateIA.innerText = isHidden ? "🤖 Usar IA" : "❌ Ocultar IA";
        if (!isHidden && AI.getApiKey()) setTimeout(() => inputAITopic.focus(), 100);
    });

    btnActivateIAMulti.addEventListener('click', () => {
        divAiSectionMulti.classList.toggle('hidden');
        const isHidden = divAiSectionMulti.classList.contains('hidden');
        btnActivateIAMulti.innerText = isHidden ? "🤖 Generar Pack con IA" : "❌ Cerrar IA";
    });

    // --- GENERACIÓN CON IA ---
    
    // Single
    btnAIGenerate.addEventListener('click', async () => {
        const apiKey = AI.getApiKey();
        if (!apiKey) return alert("Configura tu API Key primero.");
        const tema = inputAITopic.value.trim();
        if (!tema) return alert("Escribe un tema.");

        const originalText = btnAIGenerate.innerText;
        btnAIGenerate.innerText = "✨ Pensando...";
        btnAIGenerate.disabled = true;

        try {
            const palabras = await AI.generateListSingle(tema, apiKey);
            inputPalabras.value = palabras;
            inputTitulo.value = tema.charAt(0).toUpperCase() + tema.slice(1);
            inputPalabras.style.borderColor = "#10b981";
            setTimeout(() => inputPalabras.style.borderColor = "", 500);
        } catch (e) {
            alert(e.message);
        } finally {
            btnAIGenerate.innerText = originalText;
            btnAIGenerate.disabled = false;
        }
    });

    // Multi
    btnAIGenerateMulti.addEventListener('click', async () => {
        const apiKey = AI.getApiKey();
        if (!apiKey) return alert("Configura tu API Key primero.");
        const temas = inputTopicMulti.value.trim();
        if (!temas) return alert("Escribe temas.");
        
        const originalText = btnAIGenerateMulti.innerText;
        btnAIGenerateMulti.innerText = "📚 Generando...";
        btnAIGenerateMulti.disabled = true;

        try {
            const cantidad = inputQtyMulti.value || 15;
            const resultado = await AI.generateListMulti(temas, cantidad, apiKey);
            inputPalabrasMulti.value = resultado;
            inputPalabrasMulti.style.borderColor = "#db2777";
            setTimeout(() => inputPalabrasMulti.style.borderColor = "", 500);
        } catch (e) {
            alert(e.message);
        } finally {
            btnAIGenerateMulti.innerText = originalText;
            btnAIGenerateMulti.disabled = false;
        }
    });


    // --- GENERACIÓN DEL JUEGO (CORE) ---

    btnGenerar.addEventListener('click', () => {
        const filas = parseInt(inputFilas.value);
        const cols = parseInt(inputCols.value);
        let dificultad = 'facil';
        for (const radio of radiosDificultad) { if (radio.checked) { dificultad = radio.value; break; } }

        // Parsear datos
        let juegosAProcesar = [];
        if (currentMode === 'single') {
            const raw = inputPalabras.value;
            const lista = raw.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);
            if(lista.length === 0) return alert("Ingresa palabras");
            juegosAProcesar.push({ titulo: inputTitulo.value || "Sopa de Letras", palabras: lista });
        } else {
            juegosAProcesar = parseMultiInput(inputPalabrasMulti.value);
            if(juegosAProcesar.length === 0) return alert("Formato incorrecto");
        }

        // Generar
        juegosGenerados = [];
        previewArea.innerHTML = ''; 

        juegosAProcesar.forEach((juegoData, index) => {
            const generador = new GeneradorSopa(filas, cols);
            const resultado = generador.generar(juegoData.palabras, dificultad);
            
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

            Renderer.createSheetHTML(previewArea, idUnico, juegoData.titulo, resultado, cols);
        });

        // Reset UI Buttons
        mostrandoSolucion = false;
        btnSolucion.innerText = "👁️ Ver";
        btnDescargar.disabled = false;
        btnSolucion.disabled = false;
        btnVerMovil.disabled = false;
    });

    function parseMultiInput(text) {
        const norm = text.replace(/\r\n/g, "\n");
        const bloques = norm.split(/\n\s*\n/);
        const lista = [];
        bloques.forEach(bloque => {
            const lineas = bloque.trim().split('\n').map(l => l.trim()).filter(l => l !== '');
            if (lineas.length >= 2) {
                lista.push({ titulo: lineas[0], palabras: lineas.slice(1) });
            }
        });
        return lista;
    }

    // --- ACCIONES RESULTADO ---

    btnSolucion.addEventListener('click', () => {
        if (juegosGenerados.length === 0) return;
        mostrandoSolucion = !mostrandoSolucion;
        btnSolucion.innerText = mostrandoSolucion ? "❌ Ocultar" : "👁️ Ver";

        juegosGenerados.forEach(j => {
            const grid = document.getElementById(`grid-${j.id}`);
            Renderer.highlightAnswers(grid, j, mostrandoSolucion);
        });
    });

    btnDescargar.addEventListener('click', () => {
        generatePDF(juegosGenerados, chkIncluirSolucion.checked, btnDescargar);
    });
    
    // Auxiliares
    btnEliminar.addEventListener('click', () => {
        if(confirm("¿Borrar?")) {
            if(currentMode === 'single') { inputPalabras.value = ''; inputTitulo.value = ''; }
            else { inputPalabrasMulti.value = ''; }
        }
    });

    btnEjemplo.addEventListener('click', () => {
        if (currentMode === 'single') {
            inputTitulo.value = "Ejemplo Arequipa";
            inputPalabras.value = "MISTI\nCHACHANI\nCOLCA";
        } else {
            inputPalabrasMulti.value = "CIUDADES DEL PERÚ\nAREQUIPA\nLIMA\nTRUJILLO\n\nCOLORES\nAMARILLO\nROJO\nVERDE";
        }
    });

    btnVerMovil.addEventListener('click', () => previewArea.scrollIntoView({ behavior: 'smooth' }));
});