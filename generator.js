export default class GeneradorSopa {
    constructor(filas = 20, columnas = 20) {
        this.filas = filas;
        this.columnas = columnas;
        this.grilla = [];
        this.soluciones = {};
        this.palabrasColocadas = [];
        this.palabrasOmitidas = [];
        this.direcciones = [];
        this.letrasDelJuego = ""; 
    }

    inicializarGrilla() {
        this.grilla = Array(this.filas).fill(null).map(() => Array(this.columnas).fill(''));
        this.soluciones = {};
        this.palabrasColocadas = [];
        this.palabrasOmitidas = [];
        // Por defecto, relleno normal (A-Z + Ñ). 
        // Nota: En modos Fácil/Medio, si una palabra tiene tilde, se destacará visualmente 
        // porque el relleno no tiene tildes. Esto ayuda a encontrarla.
        this.letrasDelJuego = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; 
    }

    configurarDificultad(nivel, listaPalabras) {
        // Direcciones normales
        const horizontal = { x: 1, y: 0 };
        const vertical = { x: 0, y: 1 };
        const diagonalAbajo = { x: 1, y: 1 };
        const diagonalArriba = { x: 1, y: -1 };
        
        // Direcciones invertidas (El caos)
        const horizontalInv = { x: -1, y: 0 };
        const verticalInv = { x: 0, y: -1 };
        const diagonalAbajoInv = { x: -1, y: 1 };
        const diagonalArribaInv = { x: -1, y: -1 };

        // Pool base de letras
        let letrasCamuflaje = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        
        // --- CORRECCIÓN 1: Permitir tildes en el camuflaje INSANO ---
        if (nivel === 'insano') {
            const letrasUnicas = new Set(listaPalabras.join('').toUpperCase().split(''));
            // Filtramos permitiendo vocales con tilde
            const filtradas = [...letrasUnicas].filter(char => /[A-ZÑÁÉÍÓÚÜ]/.test(char));
            if (filtradas.length > 0) {
                letrasCamuflaje = filtradas.join('');
            }
        }

        switch (nivel) {
            case 'facil':
                this.direcciones = [horizontal, vertical];
                this.letrasDelJuego = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
                break;

            case 'medio':
                this.direcciones = [horizontal, vertical, diagonalAbajo, diagonalArriba];
                this.letrasDelJuego = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
                break;

            case 'dificil':
                // Todas las direcciones, pero relleno estándar
                this.direcciones = [
                    horizontal, vertical, diagonalAbajo, diagonalArriba,
                    horizontalInv, verticalInv, diagonalAbajoInv, diagonalArribaInv
                ];
                this.letrasDelJuego = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
                break;

            case 'insano':
                // Todas las direcciones + Relleno restringido (incluyendo tildes si las palabras las tienen)
                this.direcciones = [
                    horizontal, vertical, diagonalAbajo, diagonalArriba,
                    horizontalInv, verticalInv, diagonalAbajoInv, diagonalArribaInv
                ];
                this.letrasDelJuego = letrasCamuflaje;
                break;

            default:
                this.direcciones = [horizontal, vertical];
                this.letrasDelJuego = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        }
    }

    generar(listaPalabras, dificultad = 'facil') {
        this.inicializarGrilla();
        this.configurarDificultad(dificultad, listaPalabras);
        
        // --- CORRECCIÓN 2: No borrar las tildes al limpiar las palabras ---
        const palabrasOrdenadas = listaPalabras
            .map(p => p.toUpperCase().replace(/[^A-ZÑÁÉÍÓÚÜ]/g, '')) // Se agregó ÁÉÍÓÚÜ al regex
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

        // 1. Verificar límites
        if (finFila < 0 || finFila >= this.filas || finCol < 0 || finCol >= this.columnas) {
            return false;
        }

        // --- MARGEN DE SEGURIDAD (Mantiene tu lógica anterior) ---
        // Evita letras pegadas antes o después de la palabra
        
        // Revisar casilla ANTERIOR
        const preFila = fila - dir.y;
        const preCol = col - dir.x;
        if (preFila >= 0 && preFila < this.filas && preCol >= 0 && preCol < this.columnas) {
            if (this.grilla[preFila][preCol] !== '') return false;
        }

        // Revisar casilla POSTERIOR
        const postFila = finFila + dir.y;
        const postCol = finCol + dir.x;
        if (postFila >= 0 && postFila < this.filas && postCol >= 0 && postCol < this.columnas) {
            if (this.grilla[postFila][postCol] !== '') return false;
        }

        // 2. Verificar colisiones letra por letra
        for (let i = 0; i < palabra.length; i++) {
            const f = fila + (dir.y * i);
            const c = col + (dir.x * i);
            const celdaActual = this.grilla[f][c];

            if (celdaActual !== '' && celdaActual !== palabra[i]) {
                return false;
            }
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
        for (let f = 0; f < this.filas; f++) {
            for (let c = 0; c < this.columnas; c++) {
                if (this.grilla[f][c] === '') {
                    this.grilla[f][c] = this.letrasDelJuego[Math.floor(Math.random() * this.letrasDelJuego.length)];
                }
            }
        }
    }
}