// ============================================
// LOGO LOOP ANIMATION - Vanilla JS
// Seamless infinite scroll
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const logoLoops = document.querySelectorAll('.logo-loop');

    logoLoops.forEach(loop => {
        const track = loop.querySelector('.logo-loop__track');
        const firstList = track.querySelector('.logo-loop__list');

        if (!track || !firstList) return;

        // Wait for images to load then calculate proper animation
        const images = firstList.querySelectorAll('img');
        let loadedImages = 0;

        const initAnimation = () => {
            // Get the width of one list (first copy)
            const listWidth = firstList.offsetWidth;

            // Calculate animation duration based on width (slower for longer content)
            const speed = 50; // pixels per second
            const duration = listWidth / speed;

            // Set CSS custom property for animation
            track.style.setProperty('--scroll-width', `-${listWidth}px`);
            track.style.animationDuration = `${duration}s`;
        };

        // Wait for all images to load
        if (images.length === 0) {
            initAnimation();
        } else {
            images.forEach(img => {
                if (img.complete) {
                    loadedImages++;
                    if (loadedImages === images.length) initAnimation();
                } else {
                    img.addEventListener('load', () => {
                        loadedImages++;
                        if (loadedImages === images.length) initAnimation();
                    });
                    img.addEventListener('error', () => {
                        loadedImages++;
                        if (loadedImages === images.length) initAnimation();
                    });
                }
            });
        }
    });
});
