// pdf.js
import { highlightAnswers } from './renderer.js';

export async function generatePDF(juegosGenerados, includeSolutions, btnElement) {
    const { jsPDF } = window.jspdf;
    const originalText = btnElement.innerText;
    
    try {
        btnElement.innerText = "⏳ Procesando PDF...";
        btnElement.disabled = true;

        const opts = { scale: 2, windowWidth: 1200 };
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // 1. Capturar Juegos Limpios
        // Aseguramos que estén limpios visualmente
        juegosGenerados.forEach(j => {
            const grid = document.getElementById(`grid-${j.id}`);
            highlightAnswers(grid, j, false);
        });

        for (let i = 0; i < juegosGenerados.length; i++) {
            if (i > 0) pdf.addPage();
            const sheet = document.getElementById(`sheet-${juegosGenerados[i].id}`);
            await captureAndAddPage(pdf, sheet, pdfWidth, opts);
        }

        // 2. Capturar Soluciones (si aplica)
        if (includeSolutions) {
            juegosGenerados.forEach(j => {
                const grid = document.getElementById(`grid-${j.id}`);
                const title = document.getElementById(`title-${j.id}`);
                highlightAnswers(grid, j, true);
                title.innerText = j.titulo + " (SOLUCIÓN)";
            });

            for (let i = 0; i < juegosGenerados.length; i++) {
                pdf.addPage();
                const sheet = document.getElementById(`sheet-${juegosGenerados[i].id}`);
                await captureAndAddPage(pdf, sheet, pdfWidth, opts);
                // Restaurar título
                document.getElementById(`title-${juegosGenerados[i].id}`).innerText = juegosGenerados[i].titulo;
            }
        }

        const fileName = juegosGenerados.length === 1 ? 
            (juegosGenerados[0].titulo || 'sopa') : 'pack_sopas';
        
        pdf.save(`${fileName}.pdf`);

    } catch (e) {
        console.error(e);
        alert("Error al generar PDF");
    } finally {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
        
        // Restaurar estado visual (limpio)
        juegosGenerados.forEach(j => {
            const grid = document.getElementById(`grid-${j.id}`);
            highlightAnswers(grid, j, false);
        });
    }
}

async function captureAndAddPage(pdf, element, pdfWidth, opts) {
    const canvas = await html2canvas(element, opts);
    const img = canvas.toDataURL('image/png');
    const props = pdf.getImageProperties(img);
    const h = (props.height * pdfWidth) / props.width;
    pdf.addImage(img, 'PNG', 0, 10, pdfWidth, h);
}