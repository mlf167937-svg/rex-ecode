const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mengatur folder 'public' sebagai tempat menyimpan file statis (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint untuk menjalankan "Virtual Compiler" menggunakan Groq API
app.post('/api/run-code', async (req, res) => {
    const { code, language, apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: "API Key Groq belum dimasukkan di pengaturan!" });
    }

    // System Prompt Keras agar AI bertindak sebagai Mesin/Terminal
    const systemPrompt = `Kamu adalah output terminal/compiler profesional untuk bahasa pemrograman ${language}. 
TUGASMU:
1. Analisis kode yang diberikan user.
2. Jawab HANYA dengan output yang seharusnya tampil di layar terminal/console.
3. JANGAN berikan penjelasan, basa-basi, salam, atau teks markdown (seperti \`\`\`).
4. Jika terdapat sintaks error atau kesalahan logika dalam kode, berikan pesan error standar yang realistis sesuai bahasa tersebut, lengkap dengan baris (line) keberapa error itu terjadi.`;

    try {
        // Request ke API Groq menggunakan Fetch bawaan Node.js
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Model paling cerdas untuk coding
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `\nKODE:\n${code}\n\nJalankan kode di atas dan berikan outputnya.` }
                ],
                temperature: 0.1 // Sangat rendah agar jawaban konsisten dan tidak kreatif (mirip mesin)
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const output = data.choices[0].message.content;
        res.json({ output: output.trim() });

    } catch (error) {
        res.status(500).json({ error: "Gagal terhubung ke server AI Virtual Compiler." });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
