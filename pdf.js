import { highlightAnswers } from './renderer.js';

export async function generatePDF(juegosGenerados, includeSolutions, progress) {
    const { jsPDF } = window.jspdf;
    
    // Función de pausa para que la interfaz no se congele
    const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Configuración Optimizada: 
        // scale: 2 da buena calidad. Si sigue fallando con +50 hojas, baja a 1.5
        const opts = { scale: 2, windowWidth: 1200 };
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Calculamos el total de pasos para la barra
        const totalSteps = juegosGenerados.length * (includeSolutions ? 2 : 1);
        let currentStep = 0;

        // --- FASE 1: RENDERIZAR JUEGOS ---
        for (let i = 0; i < juegosGenerados.length; i++) {
            // 1. Verificar si el usuario dio click en "Cancelar"
            progress.checkCancellation(); 
            
            // 2. Pausa técnica (Yield) para liberar memoria y actualizar UI
            await wait(20); 

            if (i > 0) pdf.addPage();
            
            // Aseguramos que la hoja esté limpia visualmente
            const grid = document.getElementById(`grid-${juegosGenerados[i].id}`);
            highlightAnswers(grid, juegosGenerados[i], false);

            const sheet = document.getElementById(`sheet-${juegosGenerados[i].id}`);
            
            // Actualizar barra de progreso
            currentStep++;
            const percent = Math.round((currentStep / totalSteps) * 100);
            progress.update(percent, `Procesando Sopa ${i + 1} de ${juegosGenerados.length}`);

            // Captura Optimizada
            await captureAndAddPage(pdf, sheet, pdfWidth, opts);
        }

        // --- FASE 2: RENDERIZAR SOLUCIONES (Opcional) ---
        if (includeSolutions) {
            for (let i = 0; i < juegosGenerados.length; i++) {
                progress.checkCancellation();
                await wait(20);

                const j = juegosGenerados[i];
                const grid = document.getElementById(`grid-${j.id}`);
                const title = document.getElementById(`title-${j.id}`);
                
                // Pintamos la solución SOLO para la foto
                highlightAnswers(grid, j, true);
                title.innerText = j.titulo + " (SOLUCIÓN)";

                pdf.addPage();
                const sheet = document.getElementById(`sheet-${j.id}`);
                
                currentStep++;
                const percent = Math.round((currentStep / totalSteps) * 100);
                progress.update(percent, `Procesando Respuesta ${i + 1} de ${juegosGenerados.length}`);

                await captureAndAddPage(pdf, sheet, pdfWidth, opts);

                // IMPORTANTE: Despintar inmediatamente para liberar memoria del DOM
                title.innerText = j.titulo;
                highlightAnswers(grid, j, false);
            }
        }

        // --- GUARDADO FINAL ---
        progress.update(100, "Comprimiendo y Guardando archivo...");
        await wait(200); // Dar tiempo a leer el mensaje
        
        const fileName = juegosGenerados.length === 1 ? 
            (juegosGenerados[0].titulo || 'sopa') : `pack_${juegosGenerados.length}_sopas`;
        
        pdf.save(`${fileName}.pdf`);

    } catch (e) {
        // Si fue cancelación voluntaria, lo ignoramos (ya se manejó en UI)
        if (e.message && e.message.includes("cancelada")) {
            console.log("Generación PDF cancelada");
        } else {
            console.error(e);
            throw e; // Relanzamos para que app.js lo vea si es necesario
        }
    }
}

// --- FUNCIÓN DE CAPTURA DE ALTO RENDIMIENTO ---
async function captureAndAddPage(pdf, element, pdfWidth, opts) {
    try {
        const canvas = await html2canvas(element, opts);
        
        // TRUCO DE OPTIMIZACIÓN 1: Usar JPEG calidad 0.85 en vez de PNG
        // Reduce el peso de la imagen en memoria RAM en un 80%
        const img = canvas.toDataURL('image/jpeg', 0.85);
        
        const props = pdf.getImageProperties(img);
        const h = (props.height * pdfWidth) / props.width;
        
        // TRUCO DE OPTIMIZACIÓN 2: Compresión 'FAST'
        pdf.addImage(img, 'JPG', 0, 10, pdfWidth, h, undefined, 'FAST');
        
        // TRUCO DE OPTIMIZACIÓN 3: Limpieza forzada
        // Reducimos el canvas a 1x1 píxel para ayudar al "Garbage Collector" del navegador
        canvas.width = 1; 
        canvas.height = 1;
        
    } catch (err) {
        console.error("Error al capturar hoja", err);
        throw new Error("Fallo al capturar una de las hojas.");
    }
}