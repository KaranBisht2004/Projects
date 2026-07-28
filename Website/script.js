// ─── Lenis Smooth Scroll ─────────────────────────────────────────────────────
const lenis = new Lenis({
    duration: 2.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1.8,
    touchMultiplier: 2.5,
    infinite: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

