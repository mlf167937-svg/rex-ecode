const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. PENGATURAN RUTE UTAMA: Paksa pengguna masuk ke login.html pertama kali
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Daftarkan folder public untuk aset statis lainnya (index.html, ai.html, dll)
app.use(express.static(path.join(__dirname, 'public')));

// Helper Call AI Provider dengan Headers Lengkap (Agar lolos filter Render.com)
async function callAIProvider(provider, apiKey, prompt, systemInstruction = "") {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'RexEditorCode/1.0.0'
    };

    if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { ...defaultHeaders, 'Authorization': `Bearer ${apiKey}` },
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
            headers: { ...defaultHeaders, 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
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

    if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'dangerously-allow-html-user-agent': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                system: systemInstruction,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.content[0].text;
    }

    if (provider === 'deepseek') {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { ...defaultHeaders, 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
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

    throw new Error("Provider AI tidak dikenali.");
}

// Endpoint Runner Code
app.post('/api/run', async (req, res) => {
    const { provider, apiKey, code, language } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key dibutuhkan" });

    const systemPrompt = "Kamu adalah mesin kompilasi/terminal kode. Jalankan kode ini dan berikan HANYA teks output konsol yang dihasilkan tanpa penjelasan basa-basi sama sekali.";
    const userPrompt = `Bahasa Pemrograman: ${language}\nKode:\n${code}`;

    try {
        const output = await callAIProvider(provider, apiKey, userPrompt, systemPrompt);
        res.json({ output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Chat AI
app.post('/api/chat', async (req, res) => {
    const { provider, apiKey, message, codeContext, action } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key dibutuhkan" });

    let systemPrompt = "Kamu adalah asisten AI pemrograman pintar di dalam RexEditorCode IDE. Jawab dengan ringkas.";
    let userPrompt = message;

    if (action === 'explain') {
        systemPrompt = "Jelaskan kode berikut ini dengan singkat dan mudah dimengerti.";
        userPrompt = `Kode:\n${codeContext}`;
    }

    try {
        const reply = await callAIProvider(provider, apiKey, userPrompt, systemPrompt);
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running secure on port ${PORT}`));
