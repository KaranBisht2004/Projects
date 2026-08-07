// Lenis ────────────────────────────────────────────────────────
const lenis = new Lenis({
    duration: 3.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 2.0,
    touchMultiplier: 2.5,
    infinite: false,
});


function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


// Cursor ────────────────────────────────────────────────────────
let body = document.body;
let x = 9999;
let y = 9999;
body.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    gsap.to('#cursor', {
        x: x,
        y: y,
        ease: "power3.out",
        duration: 0.5
    })

})

let element = document.querySelectorAll('a , h1, p , img');
element.forEach((el) => {
    el.addEventListener('mouseenter', function () {

        gsap.to('#cursor', {
            scale: 2,
            background: "white",

        })
    })

    el.addEventListener('mouseleave', function () {
        gsap.to('#cursor', {
            scale: 1,
            background: "black",
        })
    })
})


// counter ------------------------------------------------
function runCounter(elementId, targetNumber, suffix = '') {
    let element = document.getElementById(elementId);

    if (!element) return;

    let count = 1;

    let timer = setInterval(() => {
        count++;
        element.textContent = count + suffix;

        if (count >= targetNumber) {
            clearInterval(timer);
        }
    }, 30);
}

let section = document.querySelector('#number-boxes');

let observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        runCounter('box1', 35, '+');
        runCounter('box2', 27, '%');
        runCounter('box3', 50, '');

        observer.unobserve(section);
    }
}, { threshold: 0.3 });

if (section) {
    observer.observe(section);
}


// // ---- MAGNETIC CTA BUTTON ----
// const ctaBtn = document.querySelector('.ctc-Button');

// ctaBtn.addEventListener('mousemove', (e) => {

//     const rect = ctaBtn.getBoundingClientRect();
//     const x = e.clientX - rect.left - rect.width / 2;
//     const y = e.clientY - rect.top - rect.height / 2;
//     gsap.to(ctaBtn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
// });
// ctaBtn.addEventListener('mouseleave', () => {
//     gsap.to(ctaBtn, { x: 0, y: 0, duration: 0.4 });
// });



// feature-img-Animation -----------------------------------------------
const card = document.getElementById('image-card');
const images = card.querySelectorAll('.fade-img');
let index = 0, timer;

card.addEventListener('mouseenter', () => {
    timer = setInterval(() => {
        images[index].classList.remove('active');
        index = (index + 1) % images.length;
        images[index].classList.add('active');
    }, 1000);
});

card.addEventListener('mouseleave', () => {
    clearInterval(timer);
});