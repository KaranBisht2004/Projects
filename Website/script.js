const scroll = new LocomotiveScroll({
    el: document.querySelector('#main'),
    smooth: true

});

const elementContainer = document.getElementById("elementContainer");
const fixedImg = document.getElementById("fixed-image");
const elements = document.querySelectorAll(".element");

elementContainer.addEventListener("mouseenter", () => {
    if (fixedImg) fixedImg.style.display = "block";
});

elementContainer.addEventListener("mouseleave", () => {
    if (fixedImg) fixedImg.style.display = "none";
});

elements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
        const imageSrc = element.getAttribute("data-img");
        if (fixedImg) {
            fixedImg.style.backgroundImage = `url("${imageSrc}")`;
        }
    });
});