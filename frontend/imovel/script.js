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


function mostrarImovel(imovel) {

    document.title =
        imovel.titulo;


    const imagem =
        imovel.imagens &&
        imovel.imagens.length > 0

            ? imovel.imagens[0]

            : "https://via.placeholder.com/1200x600?text=Sem+imagem";


    const caracteristicas =
        imovel.caracteristicas || [];


    const possuiLocalizacao =
        imovel.latitude !== null &&
        imovel.latitude !== undefined &&
        imovel.longitude !== null &&
        imovel.longitude !== undefined &&
        !isNaN(Number(imovel.latitude)) &&
        !isNaN(Number(imovel.longitude));


    container.innerHTML = `

        <section class="galeria">

            <img
                src="${imagem}"
                alt="${imovel.titulo}"
            >

        </section>


        <section class="informacoes">

            <p>
                ${imovel.tipo}
            </p>


            <h1>
                ${imovel.titulo}
            </h1>


            <div class="preco">

                R$
                ${Number(imovel.preco)
                    .toLocaleString("pt-BR")}

            </div>


            <p class="localizacao">

                📍
                ${imovel.bairro}
                -
                ${imovel.cidade}

            </p>


            <div class="detalhes">

                <div class="detalhe">

                    <strong>
                        ${imovel.area}
                    </strong>

                    <span>
                        m²
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.quartos}
                    </strong>

                    <span>
                        Quartos
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.banheiros}
                    </strong>

                    <span>
                        Banheiros
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.vagas}
                    </strong>

                    <span>
                        Vagas
                    </span>

                </div>

            </div>


            <h2>
                Descrição
            </h2>


            <p>
                ${imovel.descricao || "Sem descrição."}
            </p>


            <h2>
                Características
            </h2>


            <div class="caracteristicas">

                ${
                    caracteristicas.length > 0

                    ? caracteristicas
                        .map(item => `
                            <span
                                class="caracteristica"
                            >
                                ✓ ${item}
                            </span>
                        `)
                        .join("")

                    : "<p>Nenhuma característica cadastrada.</p>"
                }

            </div>


            <div class="secao-localizacao">

                <h2>
                    Localização
                </h2>

                ${
                    imovel.endereco

                    ? `
                        <p class="endereco-imovel">
                            <i class="fa-solid fa-location-dot"></i>
                            ${imovel.endereco}
                        </p>
                    `

                    : ""
                }


                ${
                    possuiLocalizacao

                    ? `
                        <div id="mapaImovel"></div>
                    `

                    : `
                        <p class="sem-mapa">
                            Localização no mapa não cadastrada
                            para este imóvel.
                        </p>
                    `
                }

            </div>

        </section>

        <section class="agendar-visita" aria-labelledby="visita-titulo">
            <h2 id="visita-titulo">Agende sua visita</h2>
            <p>Escolha uma data e um dos horários disponíveis para conhecer este imóvel.</p>
            <p class="visita-login"><a id="visita-link-login" href="https://tcc-3-login.vercel.app/">Entrar ou criar conta para agendar <i class="fa-solid fa-arrow-up-right-from-square"></i></a></p>
            <form id="form-visita">
                <label for="visita-data">Data</label>
                <input id="visita-data" type="date" required>
                <label>Horário</label>
                <div class="visita-horarios" role="group" aria-label="Horários disponíveis">
                    <button type="button" data-hora="09:00" disabled>09:00</button>
                    <button type="button" data-hora="11:00" disabled>11:00</button>
                    <button type="button" data-hora="14:00" disabled>14:00</button>
                    <button type="button" data-hora="16:00" disabled>16:00</button>
                </div>
                <label for="visita-telefone">WhatsApp para contato</label>
                <input id="visita-telefone" type="tel" maxlength="30" placeholder="(11) 99999-9999" required>
                <p id="visita-mensagem" role="status" aria-live="polite"></p>
                <button class="visita-enviar" type="submit">Solicitar visita</button>
            </form>
        </section>

    `;

    iniciarAgendamento(imovel);


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
                ${imovel.titulo}
            </strong>

            ${
                imovel.endereco

                ? `<br>${imovel.endereco}`

                : ""
            }
        `);

    }

}


carregarImovel();
// Integração com os agendamentos já existentes no backend.
function iniciarAgendamento(imovel) {
    const API_AGENDA = "https://tcc-3-nnmd.onrender.com/api/agendamentos";
    const LOGIN_URL = "https://tcc-3-login.vercel.app/";
    const linkLogin = document.getElementById("visita-link-login");
    const urlLogin = new URL(LOGIN_URL);
    urlLogin.searchParams.set("retorno", location.href.split("#")[0]);
    linkLogin.href = urlLogin.href;
    const form = document.getElementById("form-visita");
    const dataInput = document.getElementById("visita-data");
    const mensagem = document.getElementById("visita-mensagem");
    const botoes = [...form.querySelectorAll("[data-hora]")];
    let horarioEscolhido = null;
    let consultaAtual = 0;
    const retornoAuth = new URLSearchParams(location.hash.slice(1));
    if (retornoAuth.has("hangar_auth")) {
        const recebido = retornoAuth.get("hangar_auth");
        if (recebido) sessionStorage.setItem("hangar_token", recebido);
        history.replaceState(null, "", location.pathname + location.search);
    }
    const diaSP = () => new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
    const hoje = diaSP();
    if (sessionStorage.getItem("hangar_token")) linkLogin.textContent = "Trocar de conta";
    dataInput.min = hoje;
    const amanha = new Date(`${hoje}T12:00:00Z`);
    amanha.setUTCDate(amanha.getUTCDate() + 1);
    dataInput.value = amanha.toISOString().slice(0, 10);
    async function consultar() {
        const numeroConsulta = ++consultaAtual;
        horarioEscolhido = null;
        botoes.forEach(b => { b.disabled = true; b.classList.remove("selecionado"); b.title = "Consultando"; });
        if (!dataInput.value || dataInput.value <= diaSP()) {
            mensagem.textContent = "Escolha uma data futura.";
            return;
        }
        mensagem.textContent = "Consultando horários...";
        try {
            const url = `${API_AGENDA}/disponibilidade?imovelId=${encodeURIComponent(imovel._id)}&data=${encodeURIComponent(dataInput.value)}`;
            const resposta = await fetch(url, { cache: "no-store" });
            const dados = await resposta.json();
            if (numeroConsulta !== consultaAtual) return;
            if (!resposta.ok) throw new Error(dados.erro || "Erro ao consultar horários.");
            const ocupados = new Set(dados.ocupados);
            botoes.forEach(b => {
                b.disabled = ocupados.has(b.dataset.hora);
                b.title = b.disabled ? "Indisponível" : "Disponível";
            });
            mensagem.textContent = botoes.every(b => b.disabled)
                ? "Todos os horários estão ocupados nesta data." : "Selecione um horário disponível.";
        } catch (erro) {
            if (numeroConsulta === consultaAtual) mensagem.textContent = erro.message;
        }
    }
    dataInput.addEventListener("change", consultar);
    botoes.forEach(b => b.addEventListener("click", () => {
        if (b.disabled) return;
        horarioEscolhido = b.dataset.hora;
        botoes.forEach(outro => outro.classList.toggle("selecionado", outro === b));
    }));
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!horarioEscolhido) { mensagem.textContent = "Selecione um horário disponível."; return; }
        const token = sessionStorage.getItem("hangar_token");
        if (!token) {
            const url = new URL(LOGIN_URL);
            url.searchParams.set("retorno", location.href.split("#")[0]);
            location.assign(url.href);
            return;
        }
        const enviar = form.querySelector('[type="submit"]');
        enviar.disabled = true;
        mensagem.textContent = "Registrando sua solicitação...";
        try {
            const resposta = await fetch(API_AGENDA, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    imovelId: imovel._id, data: dataInput.value, horario: horarioEscolhido,
                    telefone: document.getElementById("visita-telefone").value
                })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Erro ao registrar a visita.");
            await consultar();
            mensagem.textContent = dados.mensagem || "Solicitação registrada!";
        } catch (erro) {
            mensagem.textContent = erro.message;
            if (/sessão|login/i.test(erro.message)) sessionStorage.removeItem("hangar_token");
            if (/horário|ocupado|solicitado/i.test(erro.message)) await consultar();
        } finally { enviar.disabled = false; }
    });
    consultar();
}
