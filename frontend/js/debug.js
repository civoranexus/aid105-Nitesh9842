// Debug utilities for troubleshooting
export function debugNavigation() {
    console.log('=== Navigation Debug Info ===');
    console.log('All sections:', document.querySelectorAll('.section'));
    console.log('Hero section:', document.querySelector('.hero'));
    console.log('Nav links:', document.querySelectorAll('.nav-link'));
    
    document.querySelectorAll('.section').forEach(section => {
        console.log(`Section ${section.id}: hidden=${section.classList.contains('hidden')}, display=${getComputedStyle(section).display}`);
    });
}

// Expose for console debugging
window.debugNavigation = debugNavigation;
