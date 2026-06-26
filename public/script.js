let editor; 
let files = JSON.parse(localStorage.getItem('webIdeFiles')) || {
    "main.py": 'print("Halo dari Python!")\n\n# Coba ketik huruf p di bawah ini, kotak print akan langsung muncul:\n',
    "script.js": 'console.log("Halo dari JavaScript!");',
    "index.html": '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Halo Dunia</h1>\n</body>\n</html>',
    "app.php": '<?php\necho "Halo dari PHP";\n?>',
    "main.cpp": '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Halo dari C++" << endl;\n    return 0;\n}'
};
let currentFile = "main.py";

// Load Monaco Editor dari Microsoft CDN
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function() {
    
    // Inisialisasi Editor dengan pengaturan Autocomplete Super Sensitif
    editor = monaco.editor.create(document.getElementById('editorContainer'), {
        value: files[currentFile],
        language: 'python',
        theme: 'vs-dark',
        fontSize: 15,
        fontFamily: 'Fira Code, Consolas, monospace',
        automaticLayout: true,
        
        // PENGATURAN AGAR AUTOCOMPLETE MUNCUL OTOMATIS SAAT KETIK HURUF BIASA
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
            other: true,
            comments: false,
            strings: false
        },
        wordBasedSuggestions: "allDocuments",
        snippetSuggestions: "top",
        
        minimap: { enabled: true }
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
        files[currentFile] = editor.getValue();
    }
    
    currentFile = name;
    document.getElementById('currentFileName').innerText = name;
    updateFileList();

    if (editor) {
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
        // MENGGUNAKAN URL RENDER KAMU SECARA OTOMATIS ATAU REKSA KODE LANGSUNG
        const res = await fetch('https://rex-ecode.onrender.com/api/execute', {
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
