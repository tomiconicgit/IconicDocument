/**
 * Terminal Core Engine
 * Handles input, output, and terminal UI
 */

export default class Terminal {
    constructor() {
        this.output = null;
        this.input = null;
        this.container = null;
        this.history = [];
        this.historyIndex = -1;
        this.commandHandler = null;
    }

    init(commandHandler) {
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.container = document.getElementById('terminal-container');
        this.commandHandler = commandHandler;

        this.setupInputHandlers();
    }

    setupInputHandlers() {
        // Handle enter key
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });

        // Auto-focus input
        this.output.addEventListener('click', () => {
            this.input.focus();
        });

        // Focus on load
        setTimeout(() => this.input.focus(), 100);
    }

    async submit() {
        const value = this.input.value.trim();
        
        if (!value) return;

        // Add to history
        this.history.push(value);
        this.historyIndex = this.history.length;

        // Clear input
        this.input.value = '';

        // Execute command
        if (this.commandHandler) {
            await this.commandHandler(value);
        }
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return;

        if (direction === 'up') {
            this.historyIndex = Math.max(0, this.historyIndex - 1);
        } else {
            this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
        }

        if (this.historyIndex < this.history.length) {
            this.input.value = this.history[this.historyIndex];
        } else {
            this.input.value = '';
        }
    }

    addLine(text, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = text;
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    addLineHTML(html, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.innerHTML = html;
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    clear() {
        this.output.innerHTML = '';
    }

    setInput(text) {
        this.input.value = text;
        this.input.focus();
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    async typeText(text, type = 'output', speed = 30) {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        this.output.appendChild(line);

        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            this.scrollToBottom();
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }
}
