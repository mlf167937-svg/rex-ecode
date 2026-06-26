const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Menyediakan file statis dari folder public (HTML, CSS, JS Premium)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint API untuk menerima kodingan dari Monaco Editor dan mengeksekusinya
app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;
    
    // Pemetaan ekstensi ke bahasa dan versi yang didukung Piston API
    const langMap = {
        'py': { language: 'python', version: '3.10.0' },
        'js': { language: 'javascript', version: '18.15.0' },
        'php': { language: 'php', version: '8.2.3' },
        'cpp': { language: 'c++', version: '10.2.0' }
    };
    
    const targetLang = langMap[language];
    if (!targetLang) return res.status(400).json({ error: "Bahasa tidak didukung untuk dieksekusi." });

    try {
        // Mengirimkan kode ke sandbox Piston API yang aman
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: targetLang.language,
            version: targetLang.version,
            files: [{ content: code }]
        });
        
        // Mengembalikan hasil output console/terminal atau error bawaan compiler ke frontend
        res.json({ output: response.data.run.output || response.data.run.stderr });
    } catch (error) {
        res.status(500).json({ error: "Gagal eksekusi kode di server compiler." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
