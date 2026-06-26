const express = require('express');
const path = require('path');

const app = express();
// Gunakan port dari environment variable (wajib untuk Render.com) atau 3000 untuk lokal
const PORT = process.env.PORT || 3000;

// Middleware untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rute utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan lancar di http://localhost:${PORT}`);
});
