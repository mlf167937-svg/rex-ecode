const express = require('express');
const path = require('path');
const cors = require('cors');
const { Groq } = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 1: Chat Assistant
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = req.headers['x-groq-key'];
        if (!apiKey) return res.status(401).json({ error: "API Key Groq belum dimasukkan. Refresh halaman untuk mengatur API Key." });

        const groq = new Groq({ apiKey: apiKey });
        const { message, codeContext } = req.body;
        
        let prompt = "Anda adalah AI Assistant programmer ahli. Jawab menggunakan bahasa Indonesia dengan ramah, singkat, dan tepat sasaran.";
        if (codeContext) prompt += `\n\nKonteks Kode:\n${codeContext}`;

        const chat = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }, { role: "user", content: message }],
            model: "llama3-70b-8192",
            temperature: 0.7,
        });
        res.json({ reply: chat.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "API Key salah atau server sibuk." });
    }
});

// API 2: Mode Compiler (Run Code)
app.post('/api/run', async (req, res) => {
    try {
        const apiKey = req.headers['x-groq-key'];
        if (!apiKey) return res.status(401).json({ error: "API Key dibutuhkan untuk simulasi compiler Python/JS." });

        const groq = new Groq({ apiKey: apiKey });
        const { code, language } = req.body;
        
        const prompt = `You are a strict ${language} compiler. Execute the code and return ONLY the standard output or error message. Do not use markdown. Start directly with the output.`;

        const chat = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }, { role: "user", content: code }],
            model: "llama3-8b-8192",
            temperature: 0.1,
        });
        res.json({ output: chat.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Gagal eksekusi kode. Pastikan API Key valid." });
    }
});

// API 3: Mode Edit Kode (Klik Kanan)
app.post('/api/edit', async (req, res) => {
    try {
        const apiKey = req.headers['x-groq-key'];
        if (!apiKey) return res.status(401).json({ error: "Fitur AI dinonaktifkan." });

        const groq = new Groq({ apiKey: apiKey });
        const { code, action } = req.body;
        let prompt = "";
        
        if (action === "explain") prompt = "Jelaskan cara kerja kode berikut secara singkat dan mudah dipahami.";
        if (action === "fix") prompt = "Temukan bug di kode berikut dan berikan versi yang sudah diperbaiki beserta penjelasannya.";
        if (action === "comment") prompt = "Tambahkan komentar yang jelas pada kode berikut agar mudah dibaca. Hanya kembalikan kodenya saja.";

        const chat = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }, { role: "user", content: code }],
            model: "llama3-70b-8192",
            temperature: 0.3,
        });
        res.json({ reply: chat.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Gagal menganalisa kode." });
    }
});

app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));
