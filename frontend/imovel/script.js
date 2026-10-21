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
            <aside class="property-sidebar">
                <section class="visit-card" id="agendar-visita">
                    <span class="visit-overline"><i class="fa-regular fa-calendar-check"></i> CONHEÇA PESSOALMENTE</span>
                    <h2>Agende sua visita</h2>
                    <p class="visit-intro">Escolha o melhor dia e horário. Nossa equipe vai confirmar a disponibilidade pelo WhatsApp.</p>
                    <div class="visit-price"><small>Valor anunciado</small><strong>${preco}</strong></div>
                    <form id="formVisita" class="visit-form">
                        <label for="visitaNome">Seu nome</label>
                        <input id="visitaNome" name="nome" type="text" autocomplete="name" placeholder="Como podemos chamar você?" maxlength="100" required>
                        <label for="visitaTelefone">Seu WhatsApp</label>
                        <input id="visitaTelefone" name="telefone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999" maxlength="20" required>
                        <div class="visit-form-row">
                            <div><label for="visitaData">Data desejada</label><input id="visitaData" name="data" type="date" required></div>
                            <div><label for="visitaHora">Horário</label><input id="visitaHora" name="hora" type="time" required></div>
                        </div>
                        <label for="visitaMensagem">Observação <span>(opcional)</span></label>
                        <textarea id="visitaMensagem" name="observacao" rows="3" maxlength="400" placeholder="Alguma preferência para a visita?"></textarea>
                        <button type="submit" class="visit-submit"><i class="fa-brands fa-whatsapp"></i> Solicitar visita</button>
                        <p class="visit-disclaimer"><i class="fa-solid fa-circle-info"></i> A visita só fica agendada após confirmação da imobiliária.</p>
                    </form>
                    <a class="visit-contact" href="https://w.app/hangarprimeim" target="_blank" rel="noopener noreferrer">Prefere conversar primeiro? <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </section>
            </aside>
        </div>`;

    // Enviar pedido de visita ao WhatsApp da imobiliária (sem confirmar automaticamente).
    const formVisita = document.getElementById("formVisita");
    const campoData = document.getElementById("visitaData");
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    campoData.min = `${ano}-${mes}-${dia}`;

    formVisita.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!formVisita.reportValidity()) return;
        const nome = document.getElementById("visitaNome").value.trim();
        const telefone = document.getElementById("visitaTelefone").value.trim();
        const data = campoData.value;
        const hora = document.getElementById("visitaHora").value;
        const observacao = document.getElementById("visitaMensagem").value.trim();
        if (data < campoData.min) {
            campoData.setCustomValidity("Escolha uma data de hoje em diante.");
            campoData.reportValidity();
            return;
        }
        campoData.setCustomValidity("");
        const [y, m, d] = data.split("-");
        const texto = [
            "Olá, Hangar Prime! Gostaria de solicitar uma visita a este imóvel:",
            `Imóvel: ${imovel.titulo || "Imóvel"}`,
            `Código: ${imovel._id || id}`,
            `Link: ${window.location.href}`,
            `Nome: ${nome}`,
            `WhatsApp: ${telefone}`,
            `Data desejada: ${d}/${m}/${y}`,
            `Horário desejado: ${hora}`,
            observacao ? `Observação: ${observacao}` : "",
            "Podem confirmar a disponibilidade?"
        ].filter(Boolean).join("\n");
        const link = `https://wa.me/5511995821428?text=${encodeURIComponent(texto)}`;
        window.open(link, "_blank", "noopener,noreferrer");
    });
    campoData.addEventListener("input", () => campoData.setCustomValidity(""));

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
