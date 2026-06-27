require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Groq } = require('groq-sdk'); // Sudah diperbaiki di sini!

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// API 1: Mode Chat / Assistant
app.post('/api/chat', async (req, res) => {
    try {
        const { message, codeContext } = req.body;
        
        let prompt = "Anda adalah AI Assistant untuk programmer. Jawab dengan singkat dan jelas.";
        if (codeContext) {
            prompt += `\n\nKonteks Kode Pengguna:\n${codeContext}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: message }
            ],
            model: "llama3-70b-8192",
            temperature: 0.7,
        });

        res.json({ reply: chatCompletion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 2: Mode Compiler / Interpreter (Simulasi)
app.post('/api/run', async (req, res) => {
    try {
        const { code, language } = req.body;
        
        const systemPrompt = `You are a strict ${language} interpreter/compiler. 
        Execute the following code and return ONLY the console standard output. 
        If there is an error, return ONLY the error message. 
        DO NOT include markdown blocks (\`\`\`). DO NOT explain anything. DO NOT output anything else except the exact output. 
        Begin your response with "OUTPUT:\n".`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: code }
            ],
            model: "llama3-8b-8192",
            temperature: 0.1,
        });

        res.json({ output: chatCompletion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengeksekusi kode via AI." });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
