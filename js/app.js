/**
 * MOTHER Terminal - Main Application
 * Entry point and orchestration
 */

import Terminal from './modules/terminal.js';
import Intelligence from './modules/intelligence.js';
import Commands from './modules/commands.js';
import Animation from './modules/animation.js';
import Audio from './modules/audio.js';

class MotherApp {
    constructor() {
        this.terminal = null;
        this.intelligence = null;
        this.commands = null;
        this.animation = null;
        this.audio = null;
        this.settings = {
            soundEnabled: true,
            animationsEnabled: true,
            scanlineEnabled: true
        };
    }

    async init() {
        // Initialize modules
        this.audio = new Audio();
        this.animation = new Animation();
        this.terminal = new Terminal();
        this.intelligence = new Intelligence();
        this.commands = new Commands(this.terminal, this.intelligence, this.audio);

        // Load settings from localStorage
        this.loadSettings();

        // Boot sequence
        await this.runBootSequence();

        // Initialize terminal
        this.terminal.init(this.handleCommand.bind(this));

        // Setup event listeners
        this.setupEventListeners();

        // Welcome message
        this.showWelcomeMessage();
    }

    async runBootSequence() {
        const bootOverlay = document.getElementById('boot-overlay');
        
        // Play boot sound
        if (this.settings.soundEnabled) {
            this.audio.playBoot();
        }

        // Wait for boot animation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Hide boot overlay
        bootOverlay.classList.add('hidden');
        
        // Remove from DOM after transition
        setTimeout(() => {
            bootOverlay.remove();
        }, 500);
    }

    showWelcomeMessage() {
        const messages = [
            { text: 'MOTHER SYSTEM v7.3.0', type: 'system' },
            { text: 'Neural interface initialized', type: 'system' },
            { text: 'Connection established', type: 'system' },
            { text: '', type: 'output' },
            { text: 'Hello. I am MOTHER, your intelligent terminal interface.', type: 'output' },
            { text: 'Type "help" to see available commands, or simply ask me anything.', type: 'output' },
            { text: '', type: 'output' }
        ];

        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.terminal.addLine(msg.text, msg.type);
            }, index * 150);
        });
    }

    async handleCommand(input) {
        const trimmedInput = input.trim();
        
        if (!trimmedInput) return;

        // Play command sound
        if (this.settings.soundEnabled) {
            this.audio.playCommand();
        }

        // Add command to terminal
        this.terminal.addLine(`> ${trimmedInput}`, 'command');

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if it's a registered command
        const response = await this.commands.execute(trimmedInput);

        if (response) {
            // Command found and executed
            if (Array.isArray(response)) {
                response.forEach(line => {
                    this.terminal.addLine(line.text, line.type || 'output');
                });
            } else {
                this.terminal.addLine(response, 'output');
            }
        } else {
            // No command found, use intelligence layer
            const aiResponse = await this.intelligence.process(trimmedInput);
            this.terminal.addLine(aiResponse, 'output');
        }

        // Play success sound
        if (this.settings.soundEnabled) {
            this.audio.playSuccess();
        }

        this.terminal.addLine('', 'output');
    }

    setupEventListeners() {
        // Quick command buttons
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                this.terminal.setInput(cmd);
                this.terminal.submit();
            });
        });

        // Sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.addEventListener('click', () => {
            this.settings.soundEnabled = !this.settings.soundEnabled;
            soundToggle.querySelector('.sound-icon').textContent = 
                this.settings.soundEnabled ? '🔊' : '🔇';
            this.saveSettings();
            
            if (this.settings.soundEnabled) {
                this.audio.playSuccess();
            }
        });

        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        
        menuToggle.addEventListener('click', () => {
            settingsPanel.classList.remove('hidden');
        });

        // Close settings
        const closeSettings = document.getElementById('close-settings');
        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.add('hidden');
        });

        // Settings checkboxes
        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('animations-enabled').addEventListener('change', (e) => {
            this.settings.animationsEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('scanline-enabled').addEventListener('change', (e) => {
            this.settings.scanlineEnabled = e.target.checked;
            const scanline = document.querySelector('.scanline');
            scanline.style.display = e.target.checked ? 'block' : 'none';
            this.saveSettings();
        });

        // Prevent zoom on double-tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    loadSettings() {
        const saved = localStorage.getItem('mother_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            
            // Apply settings
            document.getElementById('sound-enabled').checked = this.settings.soundEnabled;
            document.getElementById('animations-enabled').checked = this.settings.animationsEnabled;
            document.getElementById('scanline-enabled').checked = this.settings.scanlineEnabled;
            
            document.querySelector('.sound-icon').textContent = 
                this.settings.soundEnabled ? '🔊' : '🔇';
            
            const scanline = document.querySelector('.scanline');
            scanline.style.display = this.settings.scanlineEnabled ? 'block' : 'none';
        }
    }

    saveSettings() {
        localStorage.setItem('mother_settings', JSON.stringify(this.settings));
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new MotherApp();
        app.init();
    });
} else {
    const app = new MotherApp();
    app.init();
}
