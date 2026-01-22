// script.js
function execCmd(command, value = null) {
    document.execCommand(command, false, value);
}

function highlightText() {
    execCmd('hiliteColor', '#FFFF00'); // Yellow highlight
}

function findReplace() {
    const find = prompt('Find:');
    if (!find) return;
    const replace = prompt('Replace with:');
    const editor = document.getElementById('editor');
    const text = editor.innerHTML;
    const regex = new RegExp(find, 'gi');
    editor.innerHTML = text.replace(regex, replace);
}

function insertImage() {
    const url = prompt('Image URL:');
    if (url) {
        execCmd('insertImage', url);
    }
}

function insertTable() {
    const rows = prompt('Rows:');
    const cols = prompt('Columns:');
    if (rows && cols) {
        let table = '<table border="1">';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += '<td>Cell</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        execCmd('insertHTML', table);
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.getElementById('editor').classList.toggle('dark-mode');
}

function startVoiceInput() {
    if ('webkitSpeechRecognition' in window) { // Safari compatible
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('editor').innerHTML += text + ' ';
        };
        recognition.start();
    } else {
        alert('Voice input not supported in this browser.');
    }
}

function autoSuggest() {
    // Basic auto-suggest: Suggest common phrases or corrections (client-side simple)
    const editor = document.getElementById('editor');
    const text = editor.innerText;
    const lastWord = text.split(' ').pop().toLowerCase();
    let suggestion = '';
    if (lastWord === 'hello') suggestion = 'world';
    else if (lastWord === 'the') suggestion = 'quick brown fox';
    // Add more smart suggestions here, e.g., based on patterns
    if (suggestion) {
        const confirm = prompt(`Suggest: ${suggestion}? (y/n)`);
        if (confirm.toLowerCase() === 'y') {
            editor.innerHTML += ' ' + suggestion;
        }
    } else {
        alert('No suggestion available.');
    }
}

function wordCount() {
    const text = document.getElementById('editor').innerText;
    const count = text.trim().split(/\s+/).length;
    alert(`Word count: ${count}`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const text = document.getElementById('editor').innerText;
    doc.text(text, 10, 10);
    doc.save('document.pdf');
}

function autoSave() {
    const content = document.getElementById('editor').innerHTML;
    localStorage.setItem('autoSave', content);
    alert('Saved!');
}

// Load auto-saved content on load
window.onload = () => {
    const saved = localStorage.getItem('autoSave');
    if (saved) {
        document.getElementById('editor').innerHTML = saved;
    }
};

// Auto-save every 30 seconds
setInterval(() => {
    const content = document.getElementById('editor').innerHTML;
    localStorage.setItem('autoSave', content);
}, 30000);

// New automation: Auto-capitalize sentences (basic)
document.getElementById('editor').addEventListener('input', (e) => {
    const text = e.target.innerText;
    if (text.endsWith('. ')) {
        // Capitalize next letter (simple hack)
        e.target.innerHTML = text.replace(/\. (\w)/, '. $1'.toUpperCase());
    }
});