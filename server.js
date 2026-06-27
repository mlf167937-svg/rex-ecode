const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper untuk melakukan request ke API AI luar menggunakan fetch bawaan Node.js
async function callAIProvider(provider, apiKey, prompt, systemInstruction = "") {
    if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    } 
    
    if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    }

    if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction}\n\nUser Question:\n${prompt}` }] }]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error("Provider AI tidak dikenali.");
}

// Endpoint untuk menjalankan simulasi kode menggunakan AI
app.post('/api/run', async (req, res) => {
    const { provider, apiKey, code, language } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key dibutuhkan" });

    const systemPrompt = "Kamu adalah terminal compiler/interpreter handal. Jalankan kode berikut dan kembalikan HANYA output konsol aslinya saja, tanpa penjelasan apa pun.";
    const userPrompt = `Bahasa: ${language}\nKode:\n${code}`;

    try {
        const output = await callAIProvider(provider, apiKey, userPrompt, systemPrompt);
        res.json({ output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint untuk fitur Chat AI global / klik kanan edit
app.post('/api/chat', async (req, res) => {
    const { provider, apiKey, message, codeContext, action } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key dibutuhkan" });

    let systemPrompt = "Kamu adalah asisten AI pemrogaman pintar yang terintegrasi di dalam RexEditorCode (IDE mirip VS Code). Berikan jawaban yang ringkas dan solutif.";
    let userPrompt = message;

    if (action === 'explain') {
        systemPrompt = "Jelaskan baris kode berikut dengan singkat dan mudah dipahami.";
        userPrompt = `Kode:\n${codeContext}`;
    } else if (action === 'fix') {
        systemPrompt = "Cari bug atau error pada kode berikut, lalu berikan hasil perbaikan kodenya saja secara rapi.";
        userPrompt = `Kode:\n${codeContext}`;
    }

    try {
        const reply = await callAIProvider(provider, apiKey, userPrompt, systemPrompt);
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server berjalan lancar di http://localhost:${PORT}`));
