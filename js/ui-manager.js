/**
 * UI MANAGER MODULE
 * Handles all UI interactions and panel management
 */

export class UIManager {
    constructor(app) {
        this.app = app;
        this.mobileMenuOpen = false;
    }
    
    showInfoPanel(content) {
        const panel = document.getElementById('info-panel');
        const contentDiv = document.getElementById('info-content');
        
        contentDiv.innerHTML = content;
        panel.classList.remove('hidden');
    }
    
    hideInfoPanel() {
        const panel = document.getElementById('info-panel');
        panel.classList.add('hidden');
    }
    
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        
        const panel = document.getElementById('control-panel');
        const toggle = document.getElementById('mobile-menu-toggle');
        
        if (this.mobileMenuOpen) {
            panel.classList.add('mobile-open');
            toggle.classList.add('active');
        } else {
            panel.classList.remove('mobile-open');
            toggle.classList.remove('active');
        }
    }
}
