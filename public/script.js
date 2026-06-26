let editor; // Variabel global untuk menampung Monaco Editor
let files = JSON.parse(localStorage.getItem('webIdeFiles')) || {
    "main.py": 'print("Halo dari Python!")\n\n# Coba ketik "pri" di bawah ini untuk tes Autocomplete:\n',
    "script.js": 'console.log("Halo dari JavaScript!");\n// Coba ketik "doc" atau "con"',
    "index.html": '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Halo Dunia</h1>\n</body>\n</html>',
    "app.php": '<?php\necho "Halo dari PHP";\n?>',
    "main.cpp": '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Halo dari C++" << endl;\n    return 0;\n}'
};
let currentFile = "main.py";

// Konfigurasi awal Monaco Editor dari Microsoft CDN
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function() {
    // Inisialisasi Editor dengan tema VS Code Dark
    editor = monaco.editor.create(document.getElementById('editorContainer'), {
        value: files[currentFile],
        language: 'python',
        theme: 'vs-dark',
        fontSize: 15,
        fontFamily: 'Fira Code, Consolas, monospace',
        automaticLayout: true, // Otomatis menyesuaikan ukuran layar jika ditarik
        suggestOnTriggerCharacters: true, // Aktifkan autocomplete cerdas saat mengetik huruf
        minimap: { enabled: true } // Peta mini kode di sebelah kanan ala VS Code
    });

    updateFileList();
    openFile(currentFile);
});

function getLanguageByExtension(filename) {
    const ext = filename.split('.').pop();
    switch(ext) {
        case 'py': return 'python';
        case 'js': return 'javascript';
        case 'html': return 'html';
        case 'php': return 'php';
        case 'cpp': return 'cpp';
        default: return 'plaintext';
    }
}

function updateFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    Object.keys(files).forEach(name => {
        const li = document.createElement('li');
        li.className = `file-item ${currentFile === name ? 'active' : ''}`;
        
        let icon = 'fa-file-code';
        if(name.endsWith('.py')) icon = 'fa-brands fa-python';
        if(name.endsWith('.js')) icon = 'fa-brands fa-js';
        if(name.endsWith('.html')) icon = 'fa-solid fa-code';
        
        li.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${name}</span>`;
        li.onclick = () => openFile(name);
        list.appendChild(li);
    });
}

function openFile(name) {
    if (editor) {
        // Simpan kode file lama sebelum pindah
        files[currentFile] = editor.getValue();
    }
    
    currentFile = name;
    document.getElementById('currentFileName').innerText = name;
    updateFileList();

    if (editor) {
        // Update isi konten dan bahasa pemrograman pada editor secara dinamis
        editor.setValue(files[name]);
        monaco.editor.setModelLanguage(editor.getModel(), getLanguageByExtension(name));
    }
}

function createNewFile() {
    const input = document.getElementById('newFileName');
    const name = input.value.trim();
    if (!name || files[name]) return alert("Nama file tidak valid atau sudah ada!");
    
    files[name] = '# Tulis kodemu di sini...';
    input.value = '';
    openFile(name);
    saveFile();
}

function saveFile() {
    if (editor) {
        files[currentFile] = editor.getValue();
    }
    localStorage.setItem('webIdeFiles', JSON.stringify(files));
}

async function runCode() {
    saveFile();
    const code = editor.getValue();
    const ext = currentFile.split('.').pop();
    const terminal = document.getElementById('terminalOutput');
    const iframe = document.getElementById('htmlPreview');

    if (ext === 'html') {
        terminal.style.display = 'none';
        iframe.style.display = 'block';
        iframe.srcdoc = code;
        return;
    }

    terminal.style.display = 'block';
    iframe.style.display = 'none';
    terminal.innerText = "Menjalankan program... ⏳";

    try {
        // Ganti URL di bawah dengan alamat Render punyamu!
        const res = await fetch('https://alamat-web-kamu.onrender.com/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: ext, code: code })
        });
        const data = await res.json();
        terminal.innerText = data.output || "Program selesai dijalankan (Tanpa Output).";
    } catch (err) {
        terminal.innerText = "Error: Gagal terhubung ke server eksekusi.";
    }
}
