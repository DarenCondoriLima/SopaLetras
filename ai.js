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

export async function generateListSingle(topic, apiKey) {
    const prompt = `
        Genera una lista de 15 palabras relacionadas con: "${topic}".
        Reglas: Una palabra por línea, SIN numeración, MAYÚSCULAS, máx 12 letras, sin espacios.
    `;
    return await callGemini(prompt, apiKey);
}

export async function generateListMulti(topics, qty, apiKey) {
    const prompt = `
        Genera listas para estos temas: "${topics}".
        Reglas:
        1. Formato Bloque: TÍTULO \\n PALABRAS...
        2. Separa bloques con DOS saltos de línea (\\n\\n).
        3. Exactamente ${qty} palabras por tema.
        4. MAYÚSCULAS, sin tildes, máx 13 letras.
    `;
    return await callGemini(prompt, apiKey);
}

async function callGemini(promptText, apiKey) {
    // Usamos el modelo que te funcionó
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text.trim();
}