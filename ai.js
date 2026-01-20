// ai.js
export const AI_CONFIG = {
    KEY_STORAGE_NAME: 'gemini_api_key'
};

export function getApiKey() {
    return localStorage.getItem(AI_CONFIG.KEY_STORAGE_NAME);
}

export function saveApiKey(key) {
    if (key.length < 10) throw new Error("API Key muy corta");
    localStorage.setItem(AI_CONFIG.KEY_STORAGE_NAME, key);
}

export function deleteApiKey() {
    localStorage.removeItem(AI_CONFIG.KEY_STORAGE_NAME);
}

// AHORA ACEPTA 'signal' PARA PODER CANCELAR
export async function generateListSingle(topic, apiKey, signal) {
    const prompt = `
        Genera una lista de 15 palabras relacionadas con: "${topic}".
        Reglas: Una palabra por línea, SIN numeración, MAYÚSCULAS, máx 12 letras, sin espacios.
    `;
    return await callGemini(prompt, apiKey, signal);
}

// AHORA ACEPTA 'signal' PARA PODER CANCELAR
export async function generateListMulti(topics, qty, apiKey, signal) {
    const prompt = `
        Genera listas para estos temas: "${topics}".
        Reglas:
        1. Formato Bloque: TÍTULO \\n PALABRAS...
        2. Separa bloques con DOS saltos de línea (\\n\\n).
        3. Exactamente ${qty} palabras por tema.
        4. MAYÚSCULAS, sin tildes, máx 13 letras.
        5. Sin numeración, sin espacios en las palabras.
        6. Solo una palabra por línea.
    `;
    return await callGemini(prompt, apiKey, signal);
}

// LÓGICA CENTRAL ACTUALIZADA CON ABORT CONTROLLER
async function callGemini(promptText, apiKey, signal) {
    // Usamos el modelo que te funcionó
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
            signal: signal // <--- ESTO PERMITE CANCELAR LA PETICIÓN
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        // Si el usuario canceló, lanzamos un error específico limpio
        if (error.name === 'AbortError') {
            throw new Error("Generación cancelada por el usuario.");
        }
        // Si es otro error (red, api key, etc), lo lanzamos normal
        throw error;
    }
}