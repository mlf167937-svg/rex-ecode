let files = JSON.parse(localStorage.getItem('webIdeFiles')) || {
    "main.py": 'print("Halo dari Python!")',
    "script.js": 'console.log("Halo dari JavaScript!");',
    "index.html": '<h1>Halo dari HTML</h1>',
    "app.php": '<?php echo "Halo dari PHP"; ?>',
    "main.cpp": '#include <iostream>\nint main() { std::cout << "Halo C++"; return 0; }'
};
let currentFile = "main.py";

window.onload = () => { updateFileList(); openFile(currentFile); };

function updateFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    Object.keys(files).forEach(name => {
        const li = document.createElement('li');
        li.innerText = name;
        li.style.padding = '8px';
        li.style.cursor = 'pointer';
        li.style.color = currentFile === name ? '#569cd6' : '#fff';
        li.onclick = () => openFile(name);
        list.appendChild(li);
    });
}

function openFile(name) {
    currentFile = name;
    document.getElementById('currentFileName').innerText = name;
    document.getElementById('codeEditor').value = files[name];
    updateFileList();
}

function createNewFile() {
    const input = document.getElementById('newFileName');
    const name = input.value.trim();
    if (!name || files[name]) return;
    files[name] = '// Kode baru';
    input.value = '';
    openFile(name);
}

function saveFile() {
    files[currentFile] = document.getElementById('codeEditor').value;
    localStorage.setItem('webIdeFiles', JSON.stringify(files));
}

async function runCode() {
    saveFile();
    const code = document.getElementById('codeEditor').value;
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
    terminal.innerText = "Menjalankan kode...";

    try {
        const res = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: ext, code: code })
        });
        const data = await res.json();
        terminal.innerText = data.output || "Selesai tanpa output.";
    } catch (err) {
        terminal.innerText = "Error koneksi server.";
    }
}
