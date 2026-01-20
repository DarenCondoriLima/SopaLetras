// ui.js
export class ProgressManager {
    constructor() {
        this.overlay = document.getElementById('loading-overlay');
        this.title = document.getElementById('loading-title');
        this.barFill = document.getElementById('progress-bar-fill');
        this.text = document.getElementById('loading-text');
        this.btnCancel = document.getElementById('btn-cancel-process');
        
        this.isCancelled = false;
        this.abortController = null; // Para cancelar peticiones Fetch (IA)
        
        // Bind del evento click
        this.btnCancel.addEventListener('click', () => this.cancel());
    }

    start(title = "Procesando...") {
        this.isCancelled = false;
        this.abortController = new AbortController(); // Nuevo controlador de aborto
        
        this.overlay.classList.remove('hidden');
        this.title.innerText = title;
        this.update(0, "Iniciando...");
        return this.abortController.signal; // Devolvemos la señal para fetch
    }

    update(percent, message) {
        this.barFill.style.width = `${percent}%`;
        this.text.innerText = message;
    }

    finish() {
        setTimeout(() => {
            this.overlay.classList.add('hidden');
        }, 500); // Pequeña pausa para ver el 100%
    }

    cancel() {
        this.isCancelled = true;
        this.text.innerText = "Cancelando operación...";
        if (this.abortController) {
            this.abortController.abort(); // Mata la petición de IA si existe
        }
    }

    // Método auxiliar para verificar si debemos parar loops
    checkCancellation() {
        if (this.isCancelled) throw new Error("Operación cancelada por el usuario.");
    }
}