class GeneradorSopa {
    constructor(filas = 15, columnas = 15) {
        this.filas = filas;
        this.columnas = columnas;
        this.grilla = [];
        this.soluciones = {}; // Para guardar dónde quedó cada palabra (útil para el solucionario)
        this.palabrasColocadas = [];
        this.palabrasOmitidas = []; // Las que no cupieron
        
        // Definimos las direcciones posibles (x: columna, y: fila)
        this.direcciones = [
            { x: 1, y: 0 },   // Horizontal derecha
            { x: 0, y: 1 },   // Vertical abajo
            { x: 1, y: 1 },   // Diagonal abajo-derecha
            { x: 1, y: -1 },  // Diagonal arriba-derecha
            // Puedes agregar más (invertidas) si quieres mayor dificultad
        ];
    }

    // 1. Inicializar la matriz vacía
    inicializarGrilla() {
        this.grilla = Array(this.filas).fill(null).map(() => Array(this.columnas).fill(''));
        this.soluciones = {};
        this.palabrasColocadas = [];
        this.palabrasOmitidas = [];
    }

    // 2. Método principal para generar la sopa
    generar(listaPalabras) {
        this.inicializarGrilla();
        
        // Ordenamos de mayor a menor longitud (truco: las largas son más difíciles de ubicar, así que van primero)
        const palabrasOrdenadas = listaPalabras
            .map(p => p.toUpperCase().replace(/\s/g, '')) // Limpiar espacios y mayúsculas
            .sort((a, b) => b.length - a.length);

        palabrasOrdenadas.forEach(palabra => {
            const colocada = this.intentarColocarPalabra(palabra);
            if (colocada) {
                this.palabrasColocadas.push(palabra);
            } else {
                this.palabrasOmitidas.push(palabra);
                console.warn(`No se pudo colocar: ${palabra}`);
            }
        });

        this.rellenarHuecos();
        return {
            grilla: this.grilla,
            colocadas: this.palabrasColocadas,
            omitidas: this.palabrasOmitidas
        };
    }

    // 3. Lógica de "Fuerza Bruta" para encontrar sitio
    intentarColocarPalabra(palabra) {
        let intentos = 0;
        const maxIntentos = 100; // Evitamos bucles infinitos

        while (intentos < maxIntentos) {
            // Elegir posición y dirección al azar
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

    // 4. Verificar si la palabra cabe y no choca
    esPosicionValida(palabra, fila, col, dir) {
        // Verificar límites finales
        const finFila = fila + (dir.y * (palabra.length - 1));
        const finCol = col + (dir.x * (palabra.length - 1));

        if (finFila < 0 || finFila >= this.filas || finCol < 0 || finCol >= this.columnas) {
            return false;
        }

        // Verificar colisiones letra por letra
        for (let i = 0; i < palabra.length; i++) {
            const f = fila + (dir.y * i);
            const c = col + (dir.x * i);
            const celdaActual = this.grilla[f][c];

            // La celda debe estar vacía O tener la MISMA letra (cruce de palabras)
            if (celdaActual !== '' && celdaActual !== palabra[i]) {
                return false;
            }
        }
        return true;
    }

    // 5. Escribir la palabra en la grilla
    colocar(palabra, fila, col, dir) {
        for (let i = 0; i < palabra.length; i++) {
            this.grilla[fila + (dir.y * i)][col + (dir.x * i)] = palabra[i];
        }
        // Guardamos la solución por si queremos resaltarla luego
        this.soluciones[palabra] = { fila, col, dir };
    }

    // 6. Llenar los espacios vacíos con letras random
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