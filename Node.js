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
        'py': { language: 'python', version: '3.10.0' },
        'js': { language: 'javascript', version: '18.15.0' },
        'php': { language: 'php', version: '8.2.3' },
        'cpp': { language: 'c++', version: '10.2.0' }
    };
    const targetLang = langMap[language];
    if (!targetLang) return res.status(400).json({ error: "Bahasa tidak didukung." });

    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: targetLang.language,
            version: targetLang.version,
            files: [{ content: code }]
        });
        res.json({ output: response.data.run.output || response.data.run.stderr });
    } catch (error) {
        res.status(500).json({ error: "Gagal eksekusi kode." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
