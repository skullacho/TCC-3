
const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";
const API_AGENDA = "https://tcc-3-nnmd.onrender.com/api/agendamentos";
const LOGIN_URL = "https://tcc-3-login.vercel.app/";

const container = document.getElementById("imovel");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

function receberLogin() {
    const parametros = new URLSearchParams(
        window.location.hash.slice(1)
    );

    if (parametros.has("hangar_auth")) {
        const token = parametros.get("hangar_auth");

        if (token) {
            sessionStorage.setItem("hangar_token", token);
        }

        history.replaceState(
            null,
            "",
            location.pathname + location.search
        );
    }
}

function escapar(valor) {
    return String(valor ?? "").replace(
        /[&<>"']/g,
        caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caractere]
    );
}

function dataHojeSP() {
    const partes = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).formatToParts(new Date());

    const obter = tipo =>
        partes.find(parte => parte.type === tipo).value;

    return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

function dataAmanhaSP() {
    const hoje = dataHojeSP();
    const data = new Date(`${hoje}T12:00:00Z`);

    data.setUTCDate(data.getUTCDate() + 1);

    return data.toISOString().slice(0, 10);
}

async function carregarImovel() {
    receberLogin();

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
        const resposta = await fetch(
            `${API}/${encodeURIComponent(id)}`
        );

        if (!resposta.ok) {
            throw new Error("Imóvel não encontrado.");
        }

        const imovel = await resposta.json();

        mostrarImovel(imovel);
    } catch (erro) {
        console.error(erro);

        container.innerHTML = `
            <section class="informacoes">
                <h1>Imóvel não encontrado</h1>
                <p>Não foi possível carregar este imóvel.</p>
            </section>
        `;
    }
}

function mostrarImovel(imovel) {
    document.title = imovel.titulo || "Imóvel";

    const imagem = Array.isArray(imovel.imagens) &&
        imovel.imagens.length > 0
        ? imovel.imagens[0]
        : "";

    const caracteristicas = Array.isArray(imovel.caracteristicas)
        ? imovel.caracteristicas
        : [];

    const possuiLocalizacao =
        imovel.latitude !== null &&
        imovel.latitude !== undefined &&
        imovel.longitude !== null &&
        imovel.longitude !== undefined &&
        Number.isFinite(Number(imovel.latitude)) &&
        Number.isFinite(Number(imovel.longitude));

    const preco = Number(imovel.preco || 0)
        .toLocaleString("pt-BR");

    container.innerHTML = `
        <section class="galeria">
            ${
                imagem
                    ? `<img src="${escapar(imagem)}"
                         alt="${escapar(imovel.titulo)}">`
                    : `<div class="sem-mapa">
                         Imagem não cadastrada
                       </div>`
            }
        </section>

        <section class="informacoes">
            <p>${escapar(imovel.tipo)}</p>

            <h1>${escapar(imovel.titulo)}</h1>

            <div class="preco">
                R$ ${preco}
            </div>

            <p class="localizacao">
                <i class="fa-solid fa-location-dot"></i>
                ${escapar(imovel.bairro)} -
                ${escapar(imovel.cidade)}
            </p>

            <div class="detalhes">
                <div class="detalhe">
                    <strong>${escapar(imovel.area ?? 0)}</strong>
                    <span>m²</span>
                </div>

                <div class="detalhe">
                    <strong>${escapar(imovel.quartos ?? 0)}</strong>
                    <span>Quartos</span>
                </div>

                <div class="detalhe">
                    <strong>${escapar(imovel.banheiros ?? 0)}</strong>
                    <span>Banheiros</span>
                </div>

                <div class="detalhe">
                    <strong>${escapar(imovel.vagas ?? 0)}</strong>
                    <span>Vagas</span>
                </div>
            </div>

            <h2>Descrição</h2>
            <p>${escapar(imovel.descricao || "Sem descrição.")}</p>

            <h2>Características</h2>

            <div class="caracteristicas">
                ${
                    caracteristicas.length
                        ? caracteristicas.map(item => `
                            <span class="caracteristica">
                                ✓ ${escapar(item)}
                            </span>
                        `).join("")
                        : "<p>Nenhuma característica cadastrada.</p>"
                }
            </div>

            <div class="secao-localizacao">
                <h2>Localização</h2>

                ${
                    imovel.endereco
                        ? `<p class="endereco-imovel">
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapar(imovel.endereco)}
                           </p>`
                        : ""
                }

                ${
                    possuiLocalizacao
                        ? '<div id="mapaImovel"></div>'
                        : `<p class="sem-mapa">
                            Localização no mapa não cadastrada.
                           </p>`
                }
            </div>
        </section>

        <section class="agendar-visita" aria-labelledby="visita-titulo">
            <h2 id="visita-titulo">Agende sua visita</h2>

            <p>
                Escolha uma data e um horário disponível
                para conhecer este imóvel.
            </p>

            <p class="visita-login">
                <a id="visita-link-login" href="#">
                    Entrar ou criar conta para agendar
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </p>

            <form id="form-visita">
                <label for="visita-data">Data da visita</label>

                <input
                    id="visita-data"
                    type="date"
                    required
                >

                <label>Horário</label>

                <div class="visita-horarios"
                     role="group"
                     aria-label="Horários disponíveis">

                    <button type="button"
                            data-hora="09:00" disabled>
                        09:00
                    </button>

                    <button type="button"
                            data-hora="11:00" disabled>
                        11:00
                    </button>

                    <button type="button"
                            data-hora="14:00" disabled>
                        14:00
                    </button>

                    <button type="button"
                            data-hora="16:00" disabled>
                        16:00
                    </button>
                </div>

                <label for="visita-telefone">
                    WhatsApp para contato
                </label>

                <input
                    id="visita-telefone"
                    type="tel"
                    maxlength="30"
                    placeholder="(11) 99999-9999"
                    required
                >

                <p id="visita-mensagem"
                   role="status"
                   aria-live="polite"></p>

                <button class="visita-enviar" type="submit">
                    Solicitar visita
                </button>
            </form>
        </section>
    `;

    iniciarAgendamento(imovel);

    if (possuiLocalizacao && typeof L !== "undefined") {
        const latitude = Number(imovel.latitude);
        const longitude = Number(imovel.longitude);

        const mapa = L.map("mapaImovel").setView(
            [latitude, longitude],
            16
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap"
            }
        ).addTo(mapa);

        const marcador = L.marker([
            latitude,
            longitude
        ]).addTo(mapa);

        const popup = document.createElement("div");
        const titulo = document.createElement("strong");
        titulo.textContent = imovel.titulo || "Imóvel";
        popup.appendChild(titulo);

        if (imovel.endereco) {
            popup.appendChild(document.createElement("br"));
            popup.appendChild(
                document.createTextNode(imovel.endereco)
            );
        }

        marcador.bindPopup(popup);
    }
}

function iniciarAgendamento(imovel) {
    const form = document.getElementById("form-visita");
    const dataInput = document.getElementById("visita-data");
    const mensagem = document.getElementById("visita-mensagem");
    const linkLogin = document.getElementById("visita-link-login");
    const botoes = [...form.querySelectorAll("[data-hora]")];
    const botaoEnviar = form.querySelector('[type="submit"]');

    let horarioEscolhido = null;
    let consultaAtual = 0;
    let disponibilidadeConfirmada = false;

    const destinoLogin = new URL(LOGIN_URL);
    destinoLogin.searchParams.set(
        "retorno",
        location.href.split("#")[0]
    );

    linkLogin.href = destinoLogin.href;

    if (sessionStorage.getItem("hangar_token")) {
        linkLogin.textContent = "Você está conectado • Trocar de conta";
    }

    dataInput.min = dataAmanhaSP();
    dataInput.value = dataAmanhaSP();

    function limparSelecao() {
        horarioEscolhido = null;

        botoes.forEach(botao => {
            botao.classList.remove("selecionado");
            botao.classList.remove("ocupado");
            botao.title = "";
            botao.disabled = true;
        });
    }

    async function consultarDisponibilidade() {
        const numero = ++consultaAtual;

        disponibilidadeConfirmada = false;
        limparSelecao();
        botaoEnviar.disabled = true;

        const data = dataInput.value;

        if (!data || data <= dataHojeSP()) {
            mensagem.textContent = "Escolha uma data futura.";
            return;
        }

        mensagem.textContent = "Consultando horários disponíveis...";

        try {
            const url = new URL(
                `${API_AGENDA}/disponibilidade`
            );

            url.searchParams.set("imovelId", imovel._id);
            url.searchParams.set("data", data);

            const resposta = await fetch(url.href, {
                cache: "no-store"
            });

            let dados = {};

            try {
                dados = await resposta.json();
            } catch {
                throw new Error(
                    "O servidor retornou uma resposta inválida."
                );
            }

            if (numero !== consultaAtual) return;

            if (!resposta.ok) {
                throw new Error(
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            if (!Array.isArray(dados.ocupados)) {
                throw new Error(
                    "Resposta de disponibilidade inválida."
                );
            }

            const ocupados = new Set(dados.ocupados);

            botoes.forEach(botao => {
                const ocupado = ocupados.has(botao.dataset.hora);

                botao.disabled = ocupado;
                botao.classList.toggle("ocupado", ocupado);
                botao.title = ocupado
                    ? "Horário já agendado"
                    : "Horário disponível";
            });

            disponibilidadeConfirmada = true;

            mensagem.textContent = botoes.every(b => b.disabled)
                ? "Todos os horários estão ocupados nesta data."
                : "Selecione um horário disponível.";

        } catch (erro) {
            if (numero !== consultaAtual) return;

            disponibilidadeConfirmada = false;

            limparSelecao();

            mensagem.textContent =
                "Não foi possível consultar os horários. " +
                "Isso não significa que estejam ocupados. " +
                erro.message;

            console.error(
                "Erro ao consultar disponibilidade:",
                erro
            );
        }
    }

    dataInput.addEventListener(
        "change",
        consultarDisponibilidade
    );

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            if (
                botao.disabled ||
                !disponibilidadeConfirmada
            ) {
                return;
            }

            horarioEscolhido = botao.dataset.hora;

            botoes.forEach(outro => {
                outro.classList.toggle(
                    "selecionado",
                    outro === botao
                );
            });

            botaoEnviar.disabled = false;
            mensagem.textContent =
                `Horário selecionado: ${horarioEscolhido}`;
        });
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!disponibilidadeConfirmada || !horarioEscolhido) {
            mensagem.textContent =
                "Escolha um horário disponível.";
            return;
        }

        const token = sessionStorage.getItem("hangar_token");

        if (!token) {
            location.assign(destinoLogin.href);
            return;
        }

        botaoEnviar.disabled = true;
        mensagem.textContent = "Registrando sua solicitação...";

        try {
            const resposta = await fetch(API_AGENDA, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    imovelId: imovel._id,
                    data: dataInput.value,
                    horario: horarioEscolhido,
                    telefone: document.getElementById(
                        "visita-telefone"
                    ).value.trim()
                })
            });

            let dados = {};

            try {
                dados = await resposta.json();
            } catch {}

            if (!resposta.ok) {
                if (resposta.status === 401) {
                    sessionStorage.removeItem("hangar_token");
                    linkLogin.textContent =
                        "Entrar ou criar conta para agendar";
                }

                throw new Error(
                    dados.erro ||
                    `Não foi possível agendar (${resposta.status}).`
                );
            }

            await consultarDisponibilidade();

            mensagem.textContent =
                dados.mensagem ||
                "Solicitação de visita registrada com sucesso!";

            document.getElementById(
                "visita-telefone"
            ).value = "";

        } catch (erro) {
            mensagem.textContent = erro.message;

            if (
                /horário|ocupado|solicitado/i.test(erro.message)
            ) {
                await consultarDisponibilidade();
                mensagem.textContent =
                    "Esse horário já foi reservado. Escolha outro.";
            }
        } finally {
            botaoEnviar.disabled = true;
        }
    });

    consultarDisponibilidade();
}

carregarImovel();
