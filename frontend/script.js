
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURAÇÕES
    // ==========================================

    const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";
    const API_AGENDA = "https://tcc-3-nnmd.onrender.com/api/agendamentos";
    const LOGIN_URL = "https://tcc-3-login.vercel.app/";

    const PENDENTE_KEY = "hangar_imovel_agendar";
    const TOKEN_KEY = "hangar_token";

    let todosImoveis = [];
    let imoveisExibidos = [];

    let imovelEscolhido = null;
    let horarioEscolhido = null;
    let disponibilidadeConfirmada = false;
    let consultaAtual = 0;

    const container = document.querySelector(".cards-container");
    const contador = document.getElementById("contador");
    const btnFiltrar = document.querySelector(".btn-filtrar");
    const selectOrdenar = document.getElementById("ordenar");

    const modalAgenda = document.getElementById("modal-agendamento");
    const formAgenda = document.getElementById("form-agendamento");
    const mensagemAgenda = document.getElementById("agenda-mensagem");
    const listaAgenda = document.getElementById("lista-agendamentos");

    const campoData = document.getElementById("agenda-data");
    const campoTelefone = document.getElementById("agenda-telefone");

    const botoesHorario = [
        ...document.querySelectorAll(".agenda-horarios button")
    ];

    const token = () => sessionStorage.getItem(TOKEN_KEY);

    // ==========================================
    // RECEBER LOGIN
    // ==========================================

    const retornoAuth = new URLSearchParams(
        window.location.hash.slice(1)
    );

    if (retornoAuth.has("hangar_auth")) {
        const recebido = retornoAuth.get("hangar_auth");

        if (recebido) {
            sessionStorage.setItem(TOKEN_KEY, recebido);
        }

        history.replaceState(
            null,
            "",
            location.pathname + location.search
        );
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================

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

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
    }

    function diaSP() {
        const partes = new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date());

        const parte = tipo =>
            partes.find(item => item.type === tipo).value;

        return `${parte("year")}-${parte("month")}-${parte("day")}`;
    }

    function amanhaSP() {
        const data = new Date(`${diaSP()}T12:00:00Z`);

        data.setUTCDate(data.getUTCDate() + 1);

        return data.toISOString().slice(0, 10);
    }

    async function lerResposta(resposta) {
        try {
            return await resposta.json();
        } catch {
            throw new Error("Resposta inválida do servidor.");
        }
    }

    function atualizarContador(quantidade) {
        if (contador) {
            contador.textContent =
                `${quantidade} imóveis encontrados`;
        }
    }

    // ==========================================
    // MENU MOBILE
    // ==========================================

    window.toggleMenu = function () {
        const nav = document.getElementById("nav-container");

        if (nav) {
            nav.classList.toggle("active");
        }
    };

    // ==========================================
    // LOGIN
    // ==========================================

    function irParaLogin(imovelId = null) {
        if (imovelId) {
            sessionStorage.setItem(
                PENDENTE_KEY,
                String(imovelId)
            );
        }

        const destino = new URL(LOGIN_URL);

        destino.searchParams.set(
            "retorno",
            location.origin + location.pathname + location.search
        );

        window.location.assign(destino.href);
    }

    // ==========================================
    // LINK DE LOGIN NO AGENDAMENTO
    // ==========================================

    if (modalAgenda && formAgenda) {
        const linkExistente = modalAgenda.querySelector(
            "#agenda-link-login"
        );

        const link = linkExistente ||
            document.createElement("a");

        link.id = "agenda-link-login";

        link.textContent = token()
            ? "Você está conectado • Trocar de conta"
            : "Entrar ou criar conta para agendar";

        const destino = new URL(LOGIN_URL);

        destino.searchParams.set(
            "retorno",
            location.href.split("#")[0]
        );

        link.href = destino.href;

        link.style.cssText = `
            display: inline-block;
            margin: 12px 0;
            color: #743737;
            font-weight: 700;
            text-decoration: underline;
        `;

        if (!linkExistente) {
            formAgenda.before(link);
        }
    }

    // ==========================================
    // DISPONIBILIDADE DOS HORÁRIOS
    // ==========================================

    function limparHorarios() {
        horarioEscolhido = null;
        disponibilidadeConfirmada = false;

        botoesHorario.forEach(botao => {
            botao.disabled = true;
            botao.classList.remove("selecionado");
            botao.classList.remove("ocupado");
            botao.title = "";
        });
    }

    async function atualizarDisponibilidade() {
        const numeroConsulta = ++consultaAtual;

        limparHorarios();

        const data = campoData?.value;

        if (!imovelEscolhido || !data) {
            if (mensagemAgenda) {
                mensagemAgenda.textContent =
                    "Escolha uma data para consultar os horários.";
            }
            return;
        }

        if (data <= diaSP()) {
            mensagemAgenda.textContent =
                "Escolha uma data futura.";
            return;
        }

        mensagemAgenda.textContent =
            "Consultando horários disponíveis...";

        try {
            const url = new URL(
                `${API_AGENDA}/disponibilidade`
            );

            url.searchParams.set(
                "imovelId",
                imovelEscolhido._id
            );

            url.searchParams.set("data", data);

            const resposta = await fetch(url.href, {
                cache: "no-store"
            });

            const dados = await lerResposta(resposta);

            if (numeroConsulta !== consultaAtual) {
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            if (!Array.isArray(dados.ocupados)) {
                throw new Error(
                    "O servidor não retornou os horários corretamente."
                );
            }

            const ocupados = new Set(dados.ocupados);

            botoesHorario.forEach(botao => {
                const ocupado = ocupados.has(
                    botao.dataset.hora
                );

                botao.disabled = ocupado;

                botao.classList.toggle(
                    "ocupado",
                    ocupado
                );

                botao.title = ocupado
                    ? "Horário já reservado"
                    : "Horário disponível";
            });

            disponibilidadeConfirmada = true;

            const todosOcupados = botoesHorario.every(
                botao => botao.disabled
            );

            mensagemAgenda.textContent = todosOcupados
                ? "Todos os horários estão ocupados nessa data."
                : "Selecione um horário disponível.";

        } catch (erro) {
            if (numeroConsulta !== consultaAtual) {
                return;
            }

            limparHorarios();

            mensagemAgenda.textContent =
                "Não foi possível consultar os horários. " +
                "Isso não significa que estejam ocupados. " +
                erro.message;

            console.error(
                "Erro ao consultar disponibilidade:",
                erro
            );
        }
    }

    if (campoData) {
        campoData.min = amanhaSP();

        campoData.addEventListener(
            "change",
            atualizarDisponibilidade
        );
    }

    // ==========================================
    // SELECIONAR HORÁRIO
    // ==========================================

    botoesHorario.forEach(botao => {
        botao.addEventListener("click", () => {
            if (
                botao.disabled ||
                !disponibilidadeConfirmada
            ) {
                return;
            }

            horarioEscolhido = botao.dataset.hora;

            botoesHorario.forEach(outro => {
                outro.classList.toggle(
                    "selecionado",
                    outro === botao
                );
            });

            mensagemAgenda.textContent =
                `Horário selecionado: ${horarioEscolhido}`;
        });
    });

    // ==========================================
    // ABRIR AGENDAMENTO
    // ==========================================

    function abrirAgenda(imovel) {
        if (!token()) {
            irParaLogin(imovel._id);
            return;
        }

        if (!modalAgenda || !formAgenda) {
            console.error(
                "O formulário de agendamento não foi encontrado."
            );
            return;
        }

        imovelEscolhido = imovel;

        consultaAtual++;

        limparHorarios();

        formAgenda.reset();

        document.getElementById(
            "agenda-imovel"
        ).textContent = imovel.titulo || "Imóvel";

        mensagemAgenda.textContent =
            "Escolha uma data para consultar os horários.";

        if (campoData) {
            campoData.min = amanhaSP();
            campoData.value = amanhaSP();
        }

        modalAgenda.hidden = false;

        atualizarDisponibilidade();

        campoData?.focus();
    }

    // ==========================================
    // FECHAR AGENDAMENTO
    // ==========================================

    function fecharAgenda() {
        if (modalAgenda) {
            modalAgenda.hidden = true;
        }

        consultaAtual++;
    }

    document.getElementById(
        "fechar-agendamento"
    )?.addEventListener("click", fecharAgenda);

    modalAgenda?.addEventListener("click", event => {
        if (event.target === modalAgenda) {
            fecharAgenda();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            fecharAgenda();
        }
    });

    // ==========================================
    // ENVIAR AGENDAMENTO
    // ==========================================

    formAgenda?.addEventListener("submit", async event => {
        event.preventDefault();

        if (!token()) {
            irParaLogin(imovelEscolhido?._id);
            return;
        }

        if (
            !imovelEscolhido ||
            !disponibilidadeConfirmada ||
            !horarioEscolhido
        ) {
            mensagemAgenda.textContent =
                "Selecione um horário disponível.";
            return;
        }

        const botaoEnviar = formAgenda.querySelector(
            'button[type="submit"]'
        );

        const data = campoData.value;
        const horario = horarioEscolhido;

        botaoEnviar.disabled = true;

        mensagemAgenda.textContent =
            "Registrando solicitação de visita...";

        try {
            const resposta = await fetch(API_AGENDA, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({
                    imovelId: imovelEscolhido._id,
                    data,
                    horario,
                    telefone: campoTelefone.value.trim()
                })
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                if (resposta.status === 401) {
                    sessionStorage.removeItem(TOKEN_KEY);
                }

                throw new Error(
                    dados.erro ||
                    `Erro ao agendar (${resposta.status}).`
                );
            }

            await carregarMeusAgendamentos();

            await atualizarDisponibilidade();

            campoTelefone.value = "";

            mensagemAgenda.textContent =
                dados.mensagem ||
                "Visita solicitada com sucesso!";

        } catch (erro) {
            mensagemAgenda.textContent = erro.message;

            console.error("Erro no agendamento:", erro);

            if (
                /horário|ocupado|solicitado/i.test(
                    erro.message
                )
            ) {
                await atualizarDisponibilidade();

                mensagemAgenda.textContent =
                    "Esse horário não está mais disponível. " +
                    "Escolha outro.";
            }
        } finally {
            botaoEnviar.disabled = false;
        }
    });

    // ==========================================
    // MEUS AGENDAMENTOS
    // ==========================================

    async function carregarMeusAgendamentos() {
        if (!listaAgenda) return;

        if (!token()) {
            listaAgenda.textContent =
                "Entre na sua conta para consultar suas visitas.";
            return;
        }

        listaAgenda.textContent = "Carregando...";

        try {
            const resposta = await fetch(
                `${API_AGENDA}/meus`,
                {
                    headers: {
                        Authorization: `Bearer ${token()}`
                    }
                }
            );

            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    dados.erro ||
                    "Erro ao consultar visitas."
                );
            }

            listaAgenda.replaceChildren();

            if (!Array.isArray(dados) || !dados.length) {
                listaAgenda.textContent =
                    "Você ainda não solicitou visitas.";
                return;
            }

            dados.forEach(item => {
                const linha = document.createElement("div");
                linha.className = "agenda-item";

                const titulo = document.createElement("strong");

                titulo.textContent =
                    item.imovel?.titulo ||
                    "Imóvel indisponível";

                const descricao = document.createElement("span");

                const dataFormatada = String(
                    item.data || ""
                ).split("-").reverse().join("/");

                descricao.textContent =
                    `${dataFormatada} às ${item.horario} • ${item.status}`;

                linha.append(titulo, descricao);

                if (item.status === "pendente") {
                    const cancelar = document.createElement(
                        "button"
                    );

                    cancelar.className = "agenda-cancelar";
                    cancelar.type = "button";
                    cancelar.textContent = "Cancelar";
                    cancelar.style.marginLeft = "12px";

                    cancelar.addEventListener(
                        "click",
                        async () => {
                            if (
                                !confirm(
                                    "Cancelar esta solicitação?"
                                )
                            ) {
                                return;
                            }

                            try {
                                const respostaCancelar = await fetch(
                                    `${API_AGENDA}/${item._id}/cancelar`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            Authorization:
                                                `Bearer ${token()}`
                                        }
                                    }
                                );

                                const dadosCancelar =
                                    await lerResposta(
                                        respostaCancelar
                                    );

                                if (!respostaCancelar.ok) {
                                    throw new Error(
                                        dadosCancelar.erro ||
                                        "Erro ao cancelar."
                                    );
                                }

                                await carregarMeusAgendamentos();

                                if (
                                    modalAgenda &&
                                    !modalAgenda.hidden
                                ) {
                                    await atualizarDisponibilidade();
                                }
                            } catch (erro) {
                                alert(erro.message);
                            }
                        }
                    );

                    linha.append(cancelar);
                }

                listaAgenda.append(linha);
            });

        } catch (erro) {
            listaAgenda.textContent = erro.message;
        }
    }

    document.getElementById(
        "btn-meus-agendamentos"
    )?.addEventListener("click", () => {
        if (!token()) {
            sessionStorage.setItem(
                "hangar_abrir_meus",
                "1"
            );

            irParaLogin();
            return;
        }

        carregarMeusAgendamentos();
    });

    if (token()) {
        carregarMeusAgendamentos();

        if (
            sessionStorage.getItem(
                "hangar_abrir_meus"
            ) === "1"
        ) {
            sessionStorage.removeItem(
                "hangar_abrir_meus"
            );

            requestAnimationFrame(() => {
                document.getElementById(
                    "meus-agendamentos"
                )?.scrollIntoView({
                    behavior: "smooth"
                });
            });
        }
    }

    // ==========================================
    // CARREGAR IMÓVEIS
    // ==========================================

    async function carregarImoveis() {
        if (!container) return;

        container.innerHTML = `
            <p style="padding:20px">
                Carregando imóveis...
            </p>
        `;

        try {
            const resposta = await fetch(API);

            if (!resposta.ok) {
                throw new Error("Erro ao buscar imóveis.");
            }

            const imoveis = await lerResposta(resposta);

            if (!Array.isArray(imoveis)) {
                throw new Error(
                    "Lista de imóveis inválida."
                );
            }

            todosImoveis = imoveis;
            imoveisExibidos = [...imoveis];

            renderizarImoveis(imoveis);

            // Retomar agendamento após login
            const pendenteId = sessionStorage.getItem(
                PENDENTE_KEY
            );

            if (pendenteId && token()) {
                const escolhido = imoveis.find(
                    item => String(item._id) === pendenteId
                );

                sessionStorage.removeItem(PENDENTE_KEY);

                if (escolhido) {
                    requestAnimationFrame(() => {
                        abrirAgenda(escolhido);
                    });
                }
            }

        } catch (erro) {
            console.error(
                "Erro ao carregar imóveis:",
                erro
            );

            container.innerHTML = `
                <p style="padding:20px">
                    Não foi possível carregar os imóveis.
                </p>
            `;

            atualizarContador(0);
        }
    }

    // ==========================================
    // RENDERIZAR CARDS
    // ==========================================

    function renderizarImoveis(imoveis) {
        if (!container) return;

        container.innerHTML = "";

        if (imoveis.length === 0) {
            container.innerHTML = `
                <p style="padding:20px">
                    Nenhum imóvel encontrado.
                </p>
            `;

            atualizarContador(0);
            return;
        }

        imoveis.forEach(imovel => {
            const card = document.createElement("div");

            card.className = "card";

            card.dataset.id = imovel._id;
            card.dataset.tipo = normalizar(imovel.tipo);
            card.dataset.cidade = normalizar(imovel.cidade);
            card.dataset.bairro = normalizar(imovel.bairro);
            card.dataset.preco = imovel.preco || 0;

            const imagem =
                Array.isArray(imovel.imagens) &&
                imovel.imagens.length > 0
                    ? imovel.imagens[0]
                    : "https://via.placeholder.com/600x400?text=Sem+imagem";

            let tag = "";

            if (imovel.lancamento) {
                tag = "LANÇAMENTO";
            } else if (imovel.destaque) {
                tag = "DESTAQUE";
            }

            const preco = Number(
                imovel.preco || 0
            ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

            const area = Number(imovel.area) > 0
                ? `${imovel.area}m²`
                : "-";

            const quartos = Number(imovel.quartos) > 0
                ? `${imovel.quartos} quartos`
                : "-";

            const vagas = Number(imovel.vagas) > 0
                ? `${imovel.vagas} vagas`
                : "-";

            const banheiros = Number(imovel.banheiros) > 0
                ? `${imovel.banheiros} banhos`
                : "-";

            card.innerHTML = `
                <div class="card-image">
                    <img
                        src="${escapar(imagem)}"
                        alt="${escapar(imovel.titulo || "Imóvel")}"
                    >

                    ${
                        tag
                            ? `<span class="tag">${tag}</span>`
                            : ""
                    }
                </div>

                <div class="card-content">
                    <h3>
                        ${escapar(imovel.bairro || "")}
                        ${
                            imovel.cidade
                                ? ` | ${escapar(imovel.cidade)}`
                                : ""
                        }
                    </h3>

                    <p class="descricao">
                        ${escapar(imovel.titulo || "Imóvel")}
                    </p>

                    <p class="preco">
                        ${preco}
                    </p>
                </div>

                <div class="divider"></div>

                <div class="toggle-btn">
                    <i class="fa-solid fa-chevron-down"></i>
                </div>

                <div class="extra-info">
                    <div class="info">
                        <span>${escapar(area)}</span>
                        <span>${escapar(quartos)}</span>
                        <span>${escapar(vagas)}</span>
                        <span>${escapar(banheiros)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    class="card-agendar"
                >
                    Agendar visita
                </button>
            `;

            // Agendar pelo card
            card.querySelector(
                ".card-agendar"
            ).addEventListener("click", event => {
                event.stopPropagation();

                abrirAgenda(imovel);
            });

            // Expandir detalhes
            card.querySelector(
                ".toggle-btn"
            ).addEventListener("click", event => {
                event.stopPropagation();

                card.classList.toggle("active");
            });

            // Abrir página individual do imóvel
            card.addEventListener("click", () => {
                const destino = new URL(
                    "./imovel/index.html",
                    window.location.href
                );

                destino.searchParams.set(
                    "id",
                    imovel._id
                );

                window.location.href = destino.href;
            });

            container.appendChild(card);
        });

        atualizarContador(imoveis.length);
    }

    // ==========================================
    // FILTRAR IMÓVEIS
    // ==========================================

    function filtrarImoveis() {
        const cidade =
            document.getElementById("cidade")?.value ||
            "todos";

        const bairro =
            document.getElementById("bairro")?.value ||
            "todos";

        const precoMin = Number(
            document.getElementById("precoMin")?.value
        ) || 0;

        const precoMaxInput =
            document.getElementById("precoMax")?.value;

        const precoMax = precoMaxInput
            ? Number(precoMaxInput)
            : Infinity;

        const tiposSelecionados = Array.from(
            document.querySelectorAll(
                ".opcoes button.active"
            )
        ).map(botao => normalizar(botao.textContent));

        const filtrados = todosImoveis.filter(imovel => {
            if (
                cidade !== "todos" &&
                normalizar(imovel.cidade) !==
                normalizar(cidade)
            ) {
                return false;
            }

            if (
                bairro !== "todos" &&
                normalizar(imovel.bairro) !==
                normalizar(bairro)
            ) {
                return false;
            }

            if (
                tiposSelecionados.length > 0 &&
                !tiposSelecionados.includes(
                    normalizar(imovel.tipo)
                )
            ) {
                return false;
            }

            const preco = Number(imovel.preco || 0);

            if (
                preco < precoMin ||
                preco > precoMax
            ) {
                return false;
            }

            return true;
        });

        imoveisExibidos = filtrados;

        aplicarOrdenacao(filtrados);
    }

    // ==========================================
    // ORDENAR IMÓVEIS
    // ==========================================

    function aplicarOrdenacao(imoveis) {
        const ordem =
            selectOrdenar?.value ||
            "Mais relevantes";

        const ordenados = [...imoveis];

        if (ordem === "Menor preço") {
            ordenados.sort(
                (a, b) =>
                    Number(a.preco || 0) -
                    Number(b.preco || 0)
            );
        }

        if (ordem === "Maior preço") {
            ordenados.sort(
                (a, b) =>
                    Number(b.preco || 0) -
                    Number(a.preco || 0)
            );
        }

        renderizarImoveis(ordenados);
    }

    // ==========================================
    // BOTÕES DE TIPO
    // ==========================================

    document.querySelectorAll(
        ".opcoes button"
    ).forEach(botao => {
        botao.addEventListener("click", () => {
            botao.classList.toggle("active");
        });
    });

    // ==========================================
    // BOTÃO FILTRAR
    // ==========================================

    btnFiltrar?.addEventListener(
        "click",
        filtrarImoveis
    );

    // ==========================================
    // ORDENAÇÃO
    // ==========================================

    selectOrdenar?.addEventListener(
        "change",
        () => {
            aplicarOrdenacao(imoveisExibidos);
        }
    );

    // ==========================================
    // INICIAR PÁGINA
    // ==========================================

    carregarImoveis();

});
