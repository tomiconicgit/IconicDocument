/**
 * Audio Engine
 * Web Audio API for sound generation
 */

export default class Audio {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Boot sound - deep hum
    playBoot() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2);

        osc.start(now);
        osc.stop(now + 2);
    }

    // Command sound - short beep
    playCommand() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Success sound - rising tone
    playSuccess() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Error sound - low buzz
    playError() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Notification sound
    playNotification() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        // Two-tone notification
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.setValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Key tap sound
    playKeyTap() {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        osc.start(now);
        osc.stop(now + 0.03);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
