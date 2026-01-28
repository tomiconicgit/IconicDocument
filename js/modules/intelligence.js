/**
 * Intelligence Layer
 * Pattern-based reasoning and natural language processing
 */

export default class Intelligence {
    constructor() {
        this.context = {
            userName: null,
            sessionStart: Date.now(),
            interactionCount: 0,
            topics: []
        };

        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        return [
            // Greetings
            {
                pattern: /^(hi|hello|hey|greetings|good morning|good evening)$/i,
                responses: [
                    'Hello. How can I assist you today?',
                    'Greetings. What do you need?',
                    'Hello. I\'m here to help.'
                ]
            },
            // Questions about MOTHER
            {
                pattern: /^(who|what) are you\??$/i,
                responses: [
                    'I am MOTHER, an intelligent terminal interface designed to assist you with various tasks and queries. Think of me as a capable, reasoning assistant.',
                    'MOTHER stands for Multi-Operational Terminal with Heuristic Electronic Response. I\'m here to help you navigate information and execute commands.'
                ]
            },
            // Time-related
            {
                pattern: /(what time|current time|time now)/i,
                handler: () => {
                    const now = new Date();
                    return `Current time: ${now.toLocaleTimeString()}`;
                }
            },
            // Date-related
            {
                pattern: /(what date|today's date|current date)/i,
                handler: () => {
                    const now = new Date();
                    return `Today is ${now.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}`;
                }
            },
            // Capabilities
            {
                pattern: /(what can you do|capabilities|features)/i,
                responses: [
                    'I can process commands, answer questions, perform calculations, track time, manage notes, and provide information. Type "help" for a list of available commands.',
                    'My capabilities include command execution, information retrieval, calculations, time tracking, and contextual assistance. Use "help" to explore specific functions.'
                ]
            },
            // Thanks
            {
                pattern: /^(thanks|thank you|thx)$/i,
                responses: [
                    'You\'re welcome.',
                    'Glad to help.',
                    'Anytime.'
                ]
            },
            // Math expressions
            {
                pattern: /^[\d\s\+\-\*\/\(\)\.]+$/,
                handler: (input) => {
                    try {
                        // Safe eval using Function constructor
                        const result = Function(`'use strict'; return (${input})`)();
                        return `Result: ${result}`;
                    } catch (e) {
                        return 'Invalid mathematical expression.';
                    }
                }
            },
            // General questions
            {
                pattern: /(how|why|when|where|what|who).+\?$/i,
                responses: [
                    'That\'s an interesting question. While I can process many queries, some require external knowledge sources. Try rephrasing as a command, or explore "help" for available functions.',
                    'I process information within my defined parameters. For complex queries, consider breaking them into specific commands or calculations.'
                ]
            }
        ];
    }

    async process(input) {
        this.context.interactionCount++;

        // Try to match patterns
        for (const pattern of this.patterns) {
            if (pattern.pattern.test(input)) {
                if (pattern.handler) {
                    return pattern.handler(input);
                } else if (pattern.responses) {
                    return this.selectResponse(pattern.responses);
                }
            }
        }

        // Contextual fallback responses
        return this.generateContextualResponse(input);
    }

    selectResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateContextualResponse(input) {
        // Analyze input for keywords
        const lowerInput = input.toLowerCase();

        // Weather
        if (lowerInput.includes('weather')) {
            return 'I don\'t have access to real-time weather data. Try using a weather command or API integration.';
        }

        // News
        if (lowerInput.includes('news')) {
            return 'I don\'t have access to current news feeds. Consider using a news API or RSS integration.';
        }

        // Emotions
        if (lowerInput.match(/\b(sad|happy|angry|frustrated|tired)\b/)) {
            return 'I understand. I\'m here to assist you. Let me know if there\'s something specific I can help with.';
        }

        // Default intelligent fallback
        const fallbacks = [
            'I\'m processing your request, but I may need more context. Could you rephrase or try a specific command?',
            'Interesting query. While I don\'t have a direct answer, try "help" to see what I can do.',
            'I\'m designed to assist with various tasks. Type "help" to explore available commands.',
            'That\'s outside my current scope, but I\'m continuously learning. Try a different approach or command.'
        ];

        return this.selectResponse(fallbacks);
    }

    updateContext(key, value) {
        this.context[key] = value;
    }

    getContext() {
        return this.context;
    }
}
