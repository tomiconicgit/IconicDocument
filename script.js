// script.js
function execCmd(command, value = null) {
    document.execCommand(command, false, value);
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

function insertTable() {
    const rows = prompt('Rows:');
    const cols = prompt('Columns:');
    if (rows && cols) {
        let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += '<td contenteditable="true">Cell</td>';
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
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let text = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                text += event.results[i][0].transcript;
            }
            document.getElementById('editor').innerHTML += text;
        };
        recognition.start();
        setTimeout(() => recognition.stop(), 10000); // Stop after 10s to avoid infinite
    } else {
        alert('Voice input not supported.');
    }
}

function autoSuggest() {
    const editor = document.getElementById('editor');
    const text = editor.innerText.trim();
    const lastSentence = text.split(/[.!?]/).pop().trim();
    let suggestion = '';
    if (lastSentence.toLowerCase().includes('hello')) suggestion = ' How are you?';
    else if (lastSentence.toLowerCase().includes('the')) suggestion = ' quick brown fox jumps over the lazy dog.';
    // Expand with more patterns
    if (suggestion) {
        const confirm = prompt(`Suggest: "${suggestion}"? (y/n)`);
        if (confirm.toLowerCase() === 'y') {
            editor.innerHTML += suggestion;
        }
    } else {
        alert('No suggestion available.');
    }
}

function grammarCheck() {
    const editor = document.getElementById('editor');
    let text = editor.innerText;
    
    // Basic grammar checks with regex
    // Check for double spaces
    text = text.replace(/\s{2,}/g, ' ');
    
    // Capitalize after periods
    text = text.replace(/([.?!]\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    // Simple passive voice detection (basic)
    const passiveRegex = /\b(is|was|were|been|being|be)\b\s+\b\w+ed\b/gi;
    if (passiveRegex.test(text)) {
        alert('Possible passive voice detected. Consider active voice for clarity.');
    }
    
    // Check for common errors like "your" vs "you're"
    if (/\byour\b/gi.test(text)) {
        alert('Check if "your" should be "you\'re".');
    }
    
    editor.innerText = text;
    alert('Basic grammar check complete. For advanced checks, use external tools.');
}

function wordCount() {
    const text = document.getElementById('editor').innerText.trim();
    const count = text.split(/\s+/).length;
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
    localStorage.setItem('autoSavePro', content);
    alert('Saved!');
}

// Load auto-saved content
window.onload = () => {
    const saved = localStorage.getItem('autoSavePro');
    if (saved) {
        document.getElementById('editor').innerHTML = saved;
    }
};

// Auto-save every 30 seconds
setInterval(() => {
    const content = document.getElementById('editor').innerHTML;
    localStorage.setItem('autoSavePro', content);
}, 30000);

// Auto-capitalize on input
document.getElementById('editor').addEventListener('input', (e) => {
    // Smooth typing feel: Could add debounce or something, but basic
});