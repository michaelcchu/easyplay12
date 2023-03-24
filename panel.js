const panelElements = document.querySelector(".side-panel-toggle");
panelElements.addEventListener("click", toggle);

function toggle() {
    const wrapper = document.querySelector(".wrapper");
    wrapper.classList.toggle("side-panel-close");
}