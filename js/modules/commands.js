/**
 * Command Registry and Execution
 * All available terminal commands
 */

export default class Commands {
    constructor(terminal, intelligence, audio) {
        this.terminal = terminal;
        this.intelligence = intelligence;
        this.audio = audio;
        this.notes = [];
        this.timerActive = false;
        this.timerEnd = null;

        this.commands = this.initializeCommands();
    }

    initializeCommands() {
        return {
            'help': {
                description: 'Display available commands',
                execute: () => this.showHelp()
            },
            'clear': {
                description: 'Clear terminal output',
                execute: () => {
                    this.terminal.clear();
                    return null;
                }
            },
            'time': {
                description: 'Display current time',
                execute: () => {
                    const now = new Date();
                    return `Current time: ${now.toLocaleTimeString()}`;
                }
            },
            'date': {
                description: 'Display current date',
                execute: () => {
                    const now = new Date();
                    return `Today is ${now.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}`;
                }
            },
            'status': {
                description: 'Display system status',
                execute: () => this.showStatus()
            },
            'device': {
                description: 'Display device information',
                execute: () => this.showDeviceInfo()
            },
            'quote': {
                description: 'Display a thoughtful quote',
                execute: () => this.getQuote()
            },
            'calc': {
                description: 'Calculator - usage: calc <expression>',
                execute: (args) => this.calculate(args)
            },
            'note': {
                description: 'Note management - usage: note add/list/clear',
                execute: (args) => this.manageNotes(args)
            },
            'timer': {
                description: 'Focus timer - usage: timer <minutes>',
                execute: (args) => this.startTimer(args)
            },
            'about': {
                description: 'About MOTHER',
                execute: () => this.showAbout()
            },
            'echo': {
                description: 'Echo text - usage: echo <text>',
                execute: (args) => args.join(' ') || 'Echo: (empty)'
            }
        };
    }

    async execute(input) {
        const parts = input.trim().split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        const command = this.commands[commandName];

        if (command) {
            return await command.execute(args);
        }

        return null; // Command not found
    }

    showHelp() {
        const lines = [
            { text: 'AVAILABLE COMMANDS', type: 'success' },
            { text: '', type: 'output' }
        ];

        for (const [name, cmd] of Object.entries(this.commands)) {
            lines.push({ 
                text: `  ${name.padEnd(12)} - ${cmd.description}`, 
                type: 'output' 
            });
        }

        lines.push({ text: '', type: 'output' });
        lines.push({ 
            text: 'You can also ask me questions naturally.', 
            type: 'system' 
        });

        return lines;
    }

    showStatus() {
        const uptime = Date.now() - this.intelligence.context.sessionStart;
        const uptimeMin = Math.floor(uptime / 60000);
        const uptimeSec = Math.floor((uptime % 60000) / 1000);

        return [
            { text: 'SYSTEM STATUS', type: 'success' },
            { text: '', type: 'output' },
            { text: `  Status: OPERATIONAL`, type: 'output' },
            { text: `  Session uptime: ${uptimeMin}m ${uptimeSec}s`, type: 'output' },
            { text: `  Interactions: ${this.intelligence.context.interactionCount}`, type: 'output' },
            { text: `  Notes stored: ${this.notes.length}`, type: 'output' },
            { text: `  Memory: ${(performance.memory?.usedJSHeapSize / 1048576).toFixed(2) || 'N/A'} MB`, type: 'output' }
        ];
    }

    showDeviceInfo() {
        const info = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };

        return [
            { text: 'DEVICE INFORMATION', type: 'success' },
            { text: '', type: 'output' },
            { text: `  Platform: ${info.platform}`, type: 'output' },
            { text: `  Language: ${info.language}`, type: 'output' },
            { text: `  Screen: ${info.screenWidth}x${info.screenHeight}`, type: 'output' },
            { text: `  Viewport: ${info.viewport}`, type: 'output' },
            { text: `  Online: ${info.online ? 'Yes' : 'No'}`, type: 'output' }
        ];
    }

    getQuote() {
        const quotes = [
            'The only way to do great work is to love what you do. - Steve Jobs',
            'In the middle of difficulty lies opportunity. - Albert Einstein',
            'The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt',
            'It is during our darkest moments that we must focus to see the light. - Aristotle',
            'Life is 10% what happens to you and 90% how you react to it. - Charles R. Swindoll',
            'The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb',
            'An unexamined life is not worth living. - Socrates',
            'Your time is limited, so don\'t waste it living someone else\'s life. - Steve Jobs',
            'The only impossible journey is the one you never begin. - Tony Robbins',
            'Everything you can imagine is real. - Pablo Picasso'
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    calculate(args) {
        if (args.length === 0) {
            return 'Usage: calc <expression> (e.g., calc 2 + 2)';
        }

        const expression = args.join(' ');

        try {
            const result = Function(`'use strict'; return (${expression})`)();
            return `${expression} = ${result}`;
        } catch (e) {
            return 'Error: Invalid expression';
        }
    }

    manageNotes(args) {
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'help') {
            return [
                { text: 'NOTE COMMANDS', type: 'success' },
                { text: '  note add <text>  - Add a new note', type: 'output' },
                { text: '  note list        - List all notes', type: 'output' },
                { text: '  note clear       - Clear all notes', type: 'output' }
            ];
        }

        if (subCommand === 'add') {
            const noteText = args.slice(1).join(' ');
            if (!noteText) {
                return 'Error: Please provide note text';
            }
            this.notes.push({
                id: Date.now(),
                text: noteText,
                timestamp: new Date().toISOString()
            });
            return `Note added (${this.notes.length} total)`;
        }

        if (subCommand === 'list') {
            if (this.notes.length === 0) {
                return 'No notes stored';
            }
            const lines = [{ text: 'STORED NOTES', type: 'success' }, { text: '', type: 'output' }];
            this.notes.forEach((note, index) => {
                lines.push({ text: `  ${index + 1}. ${note.text}`, type: 'output' });
            });
            return lines;
        }

        if (subCommand === 'clear') {
            const count = this.notes.length;
            this.notes = [];
            return `Cleared ${count} note(s)`;
        }

        return 'Unknown note command. Try: note help';
    }

    startTimer(args) {
        if (args.length === 0) {
            return 'Usage: timer <minutes> (e.g., timer 25)';
        }

        const minutes = parseInt(args[0]);

        if (isNaN(minutes) || minutes <= 0) {
            return 'Error: Please provide a valid number of minutes';
        }

        this.timerEnd = Date.now() + (minutes * 60 * 1000);
        this.timerActive = true;

        // Set timeout to notify when done
        setTimeout(() => {
            if (this.timerActive) {
                this.terminal.addLine('⏰ Timer completed!', 'success');
                if (this.audio) {
                    this.audio.playSuccess();
                }
                this.timerActive = false;
            }
        }, minutes * 60 * 1000);

        return `Timer set for ${minutes} minute(s)`;
    }

    showAbout() {
        return [
            { text: 'MOTHER v7.3.0', type: 'success' },
            { text: '', type: 'output' },
            { text: 'Multi-Operational Terminal with Heuristic Electronic Response', type: 'output' },
            { text: '', type: 'output' },
            { text: 'An intelligent terminal interface designed for intuitive', type: 'output' },
            { text: 'interaction and efficient command execution.', type: 'output' },
            { text: '', type: 'output' },
            { text: 'Built for modern browsers with a focus on mobile experience.', type: 'system' }
        ];
    }
}
