function toggleMenu() {
    const nav = document.getElementById('nav-container');
    if (nav) {
        nav.classList.toggle('active');
    }
}

function setAba(tipo) {
    const btnCompreja = document.getElementById('btn-buscar-main');
}

function buscar() {
    const local = document.getElementById('select-local') ? document.getElementById('select-local').value : "";
    if (local === "") {
        alert("Por favor, selecione uma localização!");
    } else {
        alert("Buscando imóveis em: " + local);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Abas
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    // Mapa Leaflet
    const mapElement = document.getElementById('map');
    if (mapElement) {
        var map = L.map('map').setView([-23.55, -46.63], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        var imoveis = [
            { nome: "Arte Vila Matilde", lat: -23.5315, lng: -46.5200 },
            { nome: "Aviva Residencial Vila Matilde", lat: -23.5280, lng: -46.5150 },
            { nome: "Inspire Esperança", lat: -23.5265, lng: -46.5175 },
            { nome: "Apartamento no Tatuapé", lat: -23.5405, lng: -46.5760 }
        ];

        imoveis.forEach(imovel => {
            L.marker([imovel.lat, imovel.lng]).addTo(map).bindPopup(`<b>${imovel.nome}</b>`);
        });
    }
});