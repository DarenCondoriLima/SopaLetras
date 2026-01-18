
// --- GENERADOR DE SOPA ---
class GeneradorSopa {
    constructor(filas = 20, columnas = 20) {
        this.filas = filas;
        this.columnas = columnas;
        this.grilla = [];
        this.soluciones = {};
        this.palabrasColocadas = [];
        this.palabrasOmitidas = [];
        this.direcciones = [];
    }

    inicializarGrilla() {
        this.grilla = Array(this.filas).fill(null).map(() => Array(this.columnas).fill(''));
        this.soluciones = {};
        this.palabrasColocadas = [];
        this.palabrasOmitidas = [];
    }

    configurarDificultad(nivel) {
        const horizontal = { x: 1, y: 0 };
        const vertical = { x: 0, y: 1 };
        const diagonalAbajo = { x: 1, y: 1 };
        const diagonalArriba = { x: 1, y: -1 };
        const horizontalInv = { x: -1, y: 0 };
        const verticalInv = { x: 0, y: -1 };
        const diagonalAbajoInv = { x: -1, y: 1 };
        const diagonalArribaInv = { x: -1, y: -1 };

        switch (nivel) {
            case 'facil':
                this.direcciones = [horizontal, vertical];
                break;
            case 'medio':
                this.direcciones = [horizontal, vertical, diagonalAbajo, diagonalArriba];
                break;
            case 'dificil':
                this.direcciones = [
                    horizontal, vertical, diagonalAbajo, diagonalArriba,
                    horizontalInv, verticalInv, diagonalAbajoInv, diagonalArribaInv
                ];
                break;
            default:
                this.direcciones = [horizontal, vertical];
        }
    }

    generar(listaPalabras, dificultad = 'facil') {
        this.inicializarGrilla();
        this.configurarDificultad(dificultad);
        
        const palabrasOrdenadas = listaPalabras
            .map(p => p.toUpperCase().replace(/[^A-ZÑ]/g, ''))
            .sort((a, b) => b.length - a.length);

        palabrasOrdenadas.forEach(palabra => {
            if(!this.intentarColocarPalabra(palabra)) {
                this.palabrasOmitidas.push(palabra);
            } else {
                this.palabrasColocadas.push(palabra);
            }
        });

        this.rellenarHuecos();
        return {
            grilla: this.grilla,
            colocadas: this.palabrasColocadas,
            omitidas: this.palabrasOmitidas,
            soluciones: this.soluciones
        };
    }

    intentarColocarPalabra(palabra) {
        let intentos = 0;
        const maxIntentos = 150;

        while (intentos < maxIntentos) {
            const dir = this.direcciones[Math.floor(Math.random() * this.direcciones.length)];
            const startFila = Math.floor(Math.random() * this.filas);
            const startCol = Math.floor(Math.random() * this.columnas);

            if (this.esPosicionValida(palabra, startFila, startCol, dir)) {
                this.colocar(palabra, startFila, startCol, dir);
                return true;
            }
            intentos++;
        }
        return false;
    }

    esPosicionValida(palabra, fila, col, dir) {
        const finFila = fila + (dir.y * (palabra.length - 1));
        const finCol = col + (dir.x * (palabra.length - 1));

        if (finFila < 0 || finFila >= this.filas || finCol < 0 || finCol >= this.columnas) return false;

        for (let i = 0; i < palabra.length; i++) {
            const f = fila + (dir.y * i);
            const c = col + (dir.x * i);
            const celdaActual = this.grilla[f][c];
            if (celdaActual !== '' && celdaActual !== palabra[i]) return false;
        }
        return true;
    }

    colocar(palabra, fila, col, dir) {
        for (let i = 0; i < palabra.length; i++) {
            this.grilla[fila + (dir.y * i)][col + (dir.x * i)] = palabra[i];
        }
        this.soluciones[palabra] = { fila, col, dir };
    }

    rellenarHuecos() {
        const letras = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        for (let f = 0; f < this.filas; f++) {
            for (let c = 0; c < this.columnas; c++) {
                if (this.grilla[f][c] === '') {
                    this.grilla[f][c] = letras[Math.floor(Math.random() * letras.length)];
                }
            }
        }
    }
}
