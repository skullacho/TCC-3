document.addEventListener("DOMContentLoaded", () => {

    console.log("JS funcionando");

    const buttons = document.querySelectorAll(".toggle-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".card");
            card.classList.toggle("active");
        });
    });

});