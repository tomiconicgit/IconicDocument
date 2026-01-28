/**
 * UI MANAGER MODULE
 * Handles all UI interactions and panel management
 */

export class UIManager {
    constructor(app) {
        this.app = app;
        this.mobileMenuOpen = false;
        this.legendCollapsed = false;
        this.setupLegendToggle();
        this.setupMobileCloseHandlers();
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
            document.body.classList.add('menu-open');
        } else {
            panel.classList.remove('mobile-open');
            toggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }
    
    setupLegendToggle() {
        const legend = document.getElementById('legend');
        const legendTitle = legend.querySelector('h4');
        
        // Make legend collapsible on mobile
        if (window.innerWidth <= 768) {
            legendTitle.addEventListener('click', () => {
                this.legendCollapsed = !this.legendCollapsed;
                if (this.legendCollapsed) {
                    legend.classList.add('collapsed');
                } else {
                    legend.classList.remove('collapsed');
                }
            });
        }
    }
    
    setupMobileCloseHandlers() {
        // Close menu when clicking close button (the ::before pseudo-element)
        const panel = document.getElementById('control-panel');
        panel.addEventListener('click', (e) => {
            const rect = panel.getBoundingClientRect();
            const closeButtonArea = {
                top: 16,
                right: 16,
                width: 40,
                height: 40
            };
            
            if (
                e.clientX >= rect.right - closeButtonArea.right - closeButtonArea.width &&
                e.clientX <= rect.right - closeButtonArea.right &&
                e.clientY >= rect.top + closeButtonArea.top &&
                e.clientY <= rect.top + closeButtonArea.top + closeButtonArea.height
            ) {
                this.toggleMobileMenu();
            }
        });
        
        // Close menu when clicking backdrop
        document.body.addEventListener('click', (e) => {
            if (
                this.mobileMenuOpen &&
                !panel.contains(e.target) &&
                e.target.id !== 'mobile-menu-toggle' &&
                !e.target.closest('#mobile-menu-toggle')
            ) {
                this.toggleMobileMenu();
            }
        });
    }
}
