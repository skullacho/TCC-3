const API =
    "https://tcc-3-nnmd.onrender.com/api/imoveis";


const container =
    document.getElementById("imovel");


const params =
    new URLSearchParams(
        window.location.search
    );


const id =
    params.get("id");


async function carregarImovel() {

    if (!id) {

        container.innerHTML = `
            <section class="informacoes">
                <h1>Imóvel não encontrado</h1>
                <p>ID do imóvel não informado.</p>
            </section>
        `;

        return;
    }


    try {

        const resposta =
            await fetch(`${API}/${id}`);


        if (!resposta.ok) {

            throw new Error(
                "Imóvel não encontrado"
            );

        }


        const imovel =
            await resposta.json();


        mostrarImovel(imovel);


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <section class="informacoes">

                <h1>
                    Imóvel não encontrado
                </h1>

                <p>
                    Não foi possível carregar
                    este imóvel.
                </p>

            </section>
        `;

    }

}


function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[caractere]));
}

function mostrarImovel(imovel) {
    document.title = `${imovel.titulo || "Imóvel"} | Hangar Prime Imóveis`;

    const titulo = escaparHTML(imovel.titulo || "Imóvel disponível");
    const tipo = escaparHTML(imovel.tipo || "Imóvel");
    const finalidade = escaparHTML(imovel.finalidade || "");
    const bairro = escaparHTML(imovel.bairro || "");
    const cidade = escaparHTML(imovel.cidade || "");
    const endereco = escaparHTML(imovel.endereco || "");
    const descricao = escaparHTML(imovel.descricao || "Descrição não cadastrada para este imóvel.");
    const caracteristicas = Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : [];
    const imagens = Array.isArray(imovel.imagens) ? imovel.imagens.filter(item => typeof item === "string" && /^https?:\/\//i.test(item)) : [];
    const fallback = "https://placehold.co/1200x800/f0ece9/76615d?text=Hangar+Prime";
    const imagemPrincipal = escaparHTML(imagens[0] || fallback);
    const preco = Number(imovel.preco || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL",maximumFractionDigits:0});
    const possuiLocalizacao = imovel.latitude != null && imovel.longitude != null &&
        Number.isFinite(Number(imovel.latitude)) && Number.isFinite(Number(imovel.longitude));
    const dados = [
        {icone:"fa-ruler-combined", valor: imovel.area != null ? `${escaparHTML(imovel.area)} m²` : "—", nome:"Área"},
        {icone:"fa-bed", valor: imovel.quartos ?? "—", nome:"Quartos"},
        {icone:"fa-bath", valor: imovel.banheiros ?? "—", nome:"Banheiros"},
        {icone:"fa-car", valor: imovel.vagas ?? "—", nome:"Vagas"}
    ];

    container.innerHTML = `
        <div class="breadcrumb"><a href="/">Início</a><i class="fa-solid fa-chevron-right"></i><a href="/filter-main/">Imóveis</a><i class="fa-solid fa-chevron-right"></i><span>${titulo}</span></div>
        <div class="heading-row">
            <div><div class="eyebrow"><span class="eyebrow-dot"></span> ${tipo} ${finalidade ? `· ${finalidade}` : ""}</div>
            <h1>${titulo}</h1><p class="heading-location"><i class="fa-solid fa-location-dot"></i> ${bairro}${bairro && cidade ? ", " : ""}${cidade}</p></div>
            <div class="heading-price"><small>Valor do imóvel</small><strong>${preco}</strong></div>
        </div>
        <section class="galeria" aria-label="Fotos do imóvel">
            <div class="gallery-main"><img id="fotoPrincipal" src="${imagemPrincipal}" alt="Foto do imóvel ${titulo}" onerror="this.onerror=null;this.src='${fallback}'"><span class="gallery-label"><i class="fa-solid fa-camera"></i> Fotos do imóvel</span></div>
            ${imagens.length > 1 ? `<div class="gallery-thumbs">${imagens.slice(0,4).map((foto,i)=>`<button type="button" class="gallery-thumb ${i===0?'active':''}" data-image="${escaparHTML(foto)}" aria-label="Ver foto ${i+1}"><img src="${escaparHTML(foto)}" alt="Miniatura ${i+1}" loading="lazy"></button>`).join("")}</div>` : ""}
        </section>
        <div class="property-layout">
            <div class="property-main">
                <section class="info-card overview"><div class="section-heading"><span class="section-kicker">CONHEÇA O IMÓVEL</span><h2>Detalhes que fazem a diferença</h2></div>
                    <div class="detalhes">${dados.map(d=>`<div class="detalhe"><span class="detail-icon"><i class="fa-solid ${d.icone}"></i></span><strong>${d.valor}</strong><span>${d.nome}</span></div>`).join("")}</div>
                </section>
                <section class="info-card description"><div class="section-heading"><span class="section-kicker">SOBRE ESTE IMÓVEL</span><h2>Descrição</h2></div><p>${descricao}</p></section>
                <section class="info-card features"><div class="section-heading"><span class="section-kicker">COMODIDADES</span><h2>Características</h2></div>
                    <div class="caracteristicas">${caracteristicas.length ? caracteristicas.map(item=>`<span class="caracteristica"><i class="fa-solid fa-check"></i>${escaparHTML(item)}</span>`).join("") : `<p class="empty-features">Nenhuma característica adicional cadastrada.</p>`}</div>
                </section>
                <section class="info-card secao-localizacao"><div class="section-heading"><span class="section-kicker">ONDE FICA</span><h2>Localização</h2></div>
                    ${endereco ? `<p class="endereco-imovel"><i class="fa-solid fa-location-dot"></i>${endereco}</p>` : ""}
                    ${possuiLocalizacao ? `<div id="mapaImovel"></div>` : `<p class="sem-mapa">Localização no mapa não cadastrada para este imóvel.</p>`}
                </section>
            </div>
            <aside class="property-sidebar"><div class="contact-card"><div class="contact-icon"><i class="fa-solid fa-house"></i></div><span class="contact-overline">HANGAR PRIME IMÓVEIS</span><h2>Seu próximo capítulo começa aqui.</h2><p>Gostou deste imóvel? Fale com nossa equipe e saiba mais sobre ele.</p><a class="contact-button" href="https://w.app/hangarprimeim" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-whatsapp"></i> Conversar com especialista <i class="fa-solid fa-arrow-up-right-from-square"></i></a><div class="contact-foot"><i class="fa-solid fa-shield-halved"></i> Atendimento personalizado</div></div></aside>
        </div>`;

    // Alternar fotos sem interferir na busca, no mapa ou no formulário administrativo.
    const fotoPrincipal = document.getElementById("fotoPrincipal");
    container.querySelectorAll(".gallery-thumb").forEach(botao => {
        botao.addEventListener("click", () => {
            fotoPrincipal.src = botao.dataset.image;
            container.querySelectorAll(".gallery-thumb").forEach(b => b.classList.remove("active"));
            botao.classList.add("active");
        });
    });

    // ==========================
    // MAPA DO IMÓVEL
    // ==========================

    if (possuiLocalizacao) {

        const latitude =
            Number(imovel.latitude);

        const longitude =
            Number(imovel.longitude);


        const mapa =
            L.map("mapaImovel").setView(
                [
                    latitude,
                    longitude
                ],
                16
            );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap"
            }
        ).addTo(mapa);


        const marcador =
            L.marker([
                latitude,
                longitude
            ])
            .addTo(mapa);


        marcador.bindPopup(`
            <strong>
                ${titulo}
            </strong>

            ${
                imovel.endereco

                ? `<br>${endereco}`

                : ""
            }
        `);

    }

}


carregarImovel();
