const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;
    
    const langMap = {
        'py': { url: 'https://glot.io/api/run/python/latest', filename: 'main.py' },
        'js': { url: 'https://glot.io/api/run/javascript/latest', filename: 'main.js' },
        'php': { url: 'https://glot.io/api/run/php/latest', filename: 'main.php' },
        'cpp': { url: 'https://glot.io/api/run/cpp/latest', filename: 'main.cpp' }
    };
    
    const targetLang = langMap[language];
    if (!targetLang) return res.status(400).json({ error: "Bahasa belum didukung." });

    try {
        const response = await axios.post(targetLang.url, {
            files: [
                {
                    name: targetLang.filename,
                    content: code
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const output = response.data.stdout + response.data.stderr;
        res.json({ output: output || "Program selesai dijalankan tanpa output." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal eksekusi kode di server compiler." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
