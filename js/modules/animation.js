/**
 * Animation System
 * Handles visual effects and transitions
 */

export default class Animation {
    constructor() {
        this.activeAnimations = [];
    }

    // Typing effect for text
    async typeText(element, text, speed = 30) {
        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.sleep(speed);
        }
    }

    // Fade in animation
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    // Fade out animation
    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '0';

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    // Slide in from bottom
    slideInBottom(element, duration = 400) {
        element.style.transform = 'translateY(20px)';
        element.style.opacity = '0';
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        });

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    // Pulse effect
    pulse(element, scale = 1.05, duration = 200) {
        const originalTransform = element.style.transform;
        element.style.transition = `transform ${duration}ms ease-in-out`;
        element.style.transform = `scale(${scale})`;

        setTimeout(() => {
            element.style.transform = originalTransform;
        }, duration);
    }

    // Glow effect
    glow(element, color = 'rgba(0, 255, 255, 0.5)', duration = 500) {
        element.style.transition = `box-shadow ${duration}ms ease-in-out`;
        element.style.boxShadow = `0 0 20px ${color}`;

        setTimeout(() => {
            element.style.boxShadow = 'none';
        }, duration);
    }

    // Shake effect
    shake(element, intensity = 5, duration = 300) {
        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: `translateX(-${intensity}px)` },
            { transform: 'translateX(0)' }
        ];

        const animation = element.animate(keyframes, {
            duration: duration,
            easing: 'ease-in-out'
        });

        return animation.finished;
    }

    // Helper: Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cancel all active animations
    cancelAll() {
        this.activeAnimations.forEach(anim => anim.cancel());
        this.activeAnimations = [];
    }
}
