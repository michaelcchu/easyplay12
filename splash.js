const start = document.getElementById("start");
start.addEventListener("click", begin);

function begin() {
    const splash = document.querySelector(".splash")
    splash.classList.toggle("splash-toggle");
}