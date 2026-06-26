let files = JSON.parse(localStorage.getItem('webIdeFiles')) || {
    "main.py": 'print("Halo dari Python!")\n\n# Coba run file ini!',
    "script.js": 'console.log("Halo dari JavaScript!");',
    "index.html": '<h1>Halo Dunia!</h1>\n<p>HTML berjalan langsung di browser.</p>',
    "app.php": '<?php\n  echo "Halo dari PHP!";\n?>',
    "main.cpp": '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Halo dari C++!";\n    return 0;\n}'
};

let currentFile = "main.py";

window.onload = () => { updateFileList(); openFile(currentFile); };

function updateFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    Object.keys(files).forEach(fileName => {
        const li = document.createElement('li');
        li.className = `file-item ${currentFile === fileName ? 'active' : ''}`;
        li.innerHTML = `<i class="fa-solid fa-file-code"></i> ${fileName}`;
        li.onclick = () => openFile(fileName);
        list.appendChild(li);
    });
}

function openFile(fileName) {
    currentFile = fileName;
    document.getElementById('currentFileName').innerText = fileName;
    document.getElementById('codeEditor').value = files[fileName];
    updateFileList();
    
    // Reset output area
    document.getElementById('terminalOutput').style.display = 'block';
    document.getElementById('terminalOutput').innerText = 'Hasil eksekusi akan muncul di sini...';
    document.getElementById('htmlPreview').style.display = 'none';
}

function createNewFile() {
    const nameInput = document.getElementById('newFileName');
    const fileName = nameInput.value.trim();
    if (!fileName) return;
    if (files[fileName]) return alert("File sudah ada!");

    files[fileName] = `// Mulai koding ${fileName}`;
    nameInput.value = "";
    saveFile();
    openFile(fileName);
}

function saveFile() {
    files[currentFile] = document.getElementById('codeEditor').value;
    localStorage.setItem('webIdeFiles', JSON.stringify(files));
}

// FUNGSI UNTUK MENJALANKAN KODE
async function runCode() {
    saveFile(); // Simpan sebelum jalan
    const code = document.getElementById('codeEditor').value;
    const extension = currentFile.split('.').pop();
    
    const terminal = document.getElementById('terminalOutput');
    const iframe = document.getElementById('htmlPreview');

    // Jika file HTML, jalankan di iframe
    if (extension === 'html') {
        terminal.style.display = 'none';
        iframe.style.display = 'block';
        iframe.srcdoc = code;
        return;
    }

    // Jika bukan HTML, jalankan via Backend
    terminal.style.display = 'block';
    iframe.style.display = 'none';
    terminal.innerText = "Menjalankan kode... Mohon tunggu ⏳";

    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: extension, code: code })
        });
        
        const data = await response.json();
        
        if (data.error) {
            terminal.innerText = `Error: ${data.error}`;
        } else {
            terminal.innerText = data.output || "Program selesai tanpa output.";
        }
    } catch (err) {
        terminal.innerText = "Gagal terhubung ke server eksekusi.";
    }
}
