/// Shared checks ────────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(hover: none)').matches;

// Loader ────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');

    // Skip the intro entirely for reduced-motion users
    if (prefersReducedMotion) {
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
        return;
    }

    document.body.style.overflow = 'hidden';

    // Failsafe timer
    let failsafeTriggered = false;
    const failsafe = setTimeout(() => {
        failsafeTriggered = true;
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
    }, 6000);

    if (typeof gsap === 'undefined') {
        clearTimeout(failsafe);
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
        return;
    }

    const tl = gsap.timeline({
        onComplete: () => {
            if (failsafeTriggered) return;
            clearTimeout(failsafe);
            document.body.style.overflow = 'auto';
            if (loader) loader.style.display = 'none';
        }
    });

    // Animate Text
    tl.to('.loader-title .char', {
        y: '0%',
        rotate: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.04,
        ease: 'power4.out'
    })
        .to('.loader-tagline span', {
            y: '0%',
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.6');

    // Animate Counter Percent & Progress Line
    const counter = { value: 0 };
    const percentEl = document.getElementById('loader-percent');

    tl.to(counter, {
        value: 100,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
            if (percentEl) percentEl.textContent = Math.floor(counter.value);
        }
    }, '-=0.4')
        .to('.loader-line-fill', {
            width: '100%',
            duration: 1.8,
            ease: 'power2.inOut'
        }, '<');

    // Fade Out Loader Content
    tl.to('.loader-content', {
        opacity: 0,
        y: -30,
        duration: 0.5,
        ease: 'power3.in'
    });

    // Liquid Curtain Exit Morphing
    tl.to('#curtain-path', {
        attr: { d: 'M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z' },
        duration: 1.1,
        ease: 'power4.inOut'
    }, '-=0.1');

    // Smooth Hero Section Reveal
    const heroElements = document.querySelectorAll('header, #section-1');
    if (heroElements.length > 0) {
        tl.from(heroElements, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out'
        }, '-=0.6');
    }
});

// Lenis ────────────────────────────────────────────────────────
// Lenis Smooth Scroll Setup ────────────────────────────────────
if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential curve
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        smoothTouch: false, // Preserves natural mobile momentum
        infinite: false,
    });

    // Synchronize Lenis with GSAP ScrollTrigger if present
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    } else {
        // Fallback RAF loop if GSAP isn't present
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
}
// Mobile nav toggle ────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navList = document.getElementById('navList');

if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navList.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

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


// feature-img-Animation -----------------------------------------------
const card = document.getElementById('image-card');

if (card) {
    const images = card.querySelectorAll('.fade-img');
    let index = 0, timer;

    function advanceFeatureImage() {
        images[index].classList.remove('active');
        index = (index + 1) % images.length;
        images[index].classList.add('active');
    }

    if (isTouchDevice) {
        timer = setInterval(advanceFeatureImage, 1600);
    } else {
        card.addEventListener('mouseenter', () => {
            timer = setInterval(advanceFeatureImage, 1000);
        });
        card.addEventListener('mouseleave', () => {
            clearInterval(timer);
        });
    }
}


// Card-Render -----------------------------------------------
const propertiesData = [
    {
        id: 1,
        title: "BRUTALIST CONCRETE VILLA",
        price: "$850,000",
        specs: "420 M2 - 6 ROOMS",
        images: [
            "media/card1/image_1.png",
            "media/card1/image_2.png",
            "media/card1/image_3.png",
            "media/card1/image_4.png",
            "media/card1/image_5.png"
        ]
    },
    {
        id: 2,
        title: "TROPICAL TIMBER RESIDENCE",
        price: "$1,120,000",
        specs: "510 M2 - 8 ROOMS",
        images: [
            "media/card2/image_1.png",
            "media/card2/image_2.png",
            "media/card2/image_3.png",
            "media/card2/image_4.png",
            "media/card2/image_5.png"
        ]
    },
    {
        id: 3,
        title: "MINIMALIST MONOLITH HOUSE",
        price: "$680,000",
        specs: "310 M2 - 5 ROOMS",
        images: [
            "media/card3/image_1.png",
            "media/card3/image_2.png",
            "media/card3/image_3.png",
            "media/card3/image_4.png",
            "media/card3/image_5.png"
        ]
    },
    {
        id: 4,
        title: "CUBIC WOODEN FACADE VILLA",
        price: "$790,000",
        specs: "380 M2 - 6 ROOMS",
        images: [
            "media/card4/image_1.png",
            "media/card4/image_2.png",
            "media/card4/image_3.png",
            "media/card4/image_4.png",
            "media/card4/image_5.png"
        ]
    },
    {
        id: 5,
        title: "GRAND GLASS MANOR",
        price: "$1,650,000",
        specs: "640 M2 - 9 ROOMS",
        images: [
            "media/card5/image_1.png",
            "media/card5/image_2.png",
            "media/card5/image_3.png",
            "media/card5/image_4.png",
            "media/card5/image_5.png"
        ]
    },
    {
        id: 6,
        title: "SANCTUARY COURTYARD VILLA",
        price: "$590,000",
        specs: "270 M2 - 4 ROOMS",
        images: [
            "media/card6/image_1.png",
            "media/card6/image_2.png",
            "media/card6/image_3.png",
            "media/card6/image_4.png",
            "media/card6/image_5.png"
        ]
    }
];

const propertyCardRender = document.getElementById('properties-card-grid');

const cardsHTML = propertiesData.map((card) => {
    const imagesHTML = card.images.map((imgSrc, index) => `
        <img src="${imgSrc}" class="p-cardFade-img ${index === 0 ? 'active' : ''}" alt="${card.title}" loading="lazy">
    `).join('');

    return `
        <div class="property-card" id="property-card-${card.id}">
            <div class="card-img">
                ${imagesHTML}
            </div>
 
            <div class="property-info">
                <div class="property-header">
                    <h3 class="property-title">${card.title}</h3>
                    <span class="property-price">${card.price}</span>
                </div>
 
                <div class="property-meta">
                    <span class="property-specs">${card.specs}</span>
                </div>
            </div>
        </div>
    `;
}).join('');

if (propertyCardRender) {
    propertyCardRender.innerHTML = cardsHTML;

    const allCards = document.querySelectorAll('.property-card');

    allCards.forEach((propCard) => {
        const images = propCard.querySelectorAll('.p-cardFade-img');
        let currentIndex = 0;
        let propTimer = null;

        function advancePropertyImage() {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }

        if (isTouchDevice) {
            propTimer = setInterval(advancePropertyImage, 900);
        } else {
            propCard.addEventListener('mouseenter', () => {
                propTimer = setInterval(advancePropertyImage, 800);
            });

            propCard.addEventListener('mouseleave', () => {
                clearInterval(propTimer);
                images[currentIndex].classList.remove('active');
                currentIndex = 0;
                images[0].classList.add('active');
            });
        }
    });
}



// Blog-Cards-Readers --------------------------------------
const blogCards = [
    {
        id: 1,
        date: "DEC 12, 2025",
        title: "TOP 5 TIPS FOR FINDING YOUR DREAM HOME",
        ctaText: "READ MORE",
        images: [
            "media/section-5Card-img/image_1.png"
        ]
    },
    {
        id: 2,
        date: "DEC 3, 2025",
        title: "HOW TO MAXIMIZE THE VALUE OF PROPERTY",
        ctaText: "READ MORE",
        images: [
            "media/section-5Card-img/image_2.png"
        ]
    },
    {
        id: 3,
        date: "NOV 24, 2025",
        title: "HOW TO SPOT HIDDEN COSTS IN HOME BUYING",
        ctaText: "READ MORE",
        images: [
            "media/section-5Card-img/image_3.png"
        ]
    },
    {
        id: 4,
        date: "NOV 8, 2025",
        title: "RENOVATION OR MOVE? DECIDING WHAT'S BEST",
        ctaText: "READ MORE",
        images: [
            "media/section-5Card-img/image_4.png"
        ]
    }
];

const container = document.getElementById('section-5-cards-container');

if (container) {
    const cardsMarkup = blogCards.map((card) => `
        <div class="section-5-card">
            <div class="section-5-cardImg-container">
                <img class="section-5-cardImg" src="${card.images[0]}" alt="${card.title}" loading="lazy">
            </div>
            <div class="section-5-card-Detail">
                <div class="upper-Detail">
                    <p class="card-date">${card.date}</p>
                    <p id='text-title' class="card-title">${card.title}</p>
                </div>
                <div class="read-moreBTN">
                    <a href="#">${card.ctaText}</a>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = cardsMarkup;
}



