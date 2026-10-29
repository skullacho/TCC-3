document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // CONFIGURAÇÃO DA API
    // ==========================

    const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";

    const API_AGENDA = "https://tcc-3-nnmd.onrender.com/api/agendamentos";
    const LOGIN_URL = "https://tcc-3-login.vercel.app/";
    // Recebe a sessão do login hospedado em outro domínio.
    // O token chega no fragmento (#), que não é enviado ao servidor.
    const retornoAuth = new URLSearchParams(location.hash.slice(1));
    if (retornoAuth.has("hangar_auth")) {
        const recebido = retornoAuth.get("hangar_auth");
        if (recebido) sessionStorage.setItem("hangar_token", recebido);
        history.replaceState(null, "", location.pathname + location.search);
    }
    let imovelEscolhido = null;
    let horarioEscolhido = null;
    const modalAgenda = document.getElementById("modal-agendamento");
    // Link de login sempre visível na janela de agendamento.
    if (modalAgenda) {
        const link = document.createElement("a");
        link.textContent = "Entrar ou criar conta para agendar";
        link.href = LOGIN_URL + "?retorno=" + encodeURIComponent(location.href.split("#")[0]);
        link.style.cssText = "display:inline-block;margin:12px 0;color:#743737;font-weight:700;text-decoration:underline";
        const form = modalAgenda.querySelector("form");
        if (form) form.before(link);
    }

    const formAgenda = document.getElementById("form-agendamento");
    const mensagemAgenda = document.getElementById("agenda-mensagem");
    const token = () => sessionStorage.getItem("hangar_token");
    const PENDENTE_KEY = "hangar_imovel_agendar";
    function irParaLogin(imovelId = null) {
        if (imovelId) sessionStorage.setItem(PENDENTE_KEY, String(imovelId));
        const destino = new URL(LOGIN_URL);
        destino.searchParams.set("retorno", location.origin + location.pathname + location.search);
        location.assign(destino.toString());
    }
    async function atualizarDisponibilidade() {
        const data = document.getElementById("agenda-data").value;
        const botoes = [...document.querySelectorAll(".agenda-horarios button")];
        horarioEscolhido = null;
        botoes.forEach(b => { b.classList.remove("selecionado"); b.disabled = true; b.title = "Selecione uma data"; });
        if (!imovelEscolhido || !data) return;
        mensagemAgenda.textContent = "Consultando horários disponíveis...";
        try {
            const url = `${API_AGENDA}/disponibilidade?imovelId=${encodeURIComponent(imovelEscolhido._id)}&data=${encodeURIComponent(data)}`;
            const resposta = await fetch(url, { cache: "no-store" });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Erro ao consultar horários.");
            const ocupados = new Set(dados.ocupados);
            botoes.forEach(b => {
                b.disabled = ocupados.has(b.dataset.hora);
                b.title = b.disabled ? "Horário indisponível" : "Horário disponível";
            });
            mensagemAgenda.textContent = botoes.every(b => b.disabled) ? "Não há horários disponíveis nessa data." : "Selecione um horário disponível.";
        } catch (erro) {
            mensagemAgenda.textContent = erro.message;
        }
    }
    document.getElementById("agenda-data").addEventListener("change", atualizarDisponibilidade);
    function abrirAgenda(imovel) {
        if (!token()) {
            irParaLogin(imovel._id);
            return;
        }
        imovelEscolhido = imovel;
        horarioEscolhido = null;
        document.querySelectorAll(".agenda-horarios button").forEach(b => b.classList.remove("selecionado"));
        document.getElementById("agenda-imovel").textContent = imovel.titulo || "Imóvel";
        mensagemAgenda.textContent = "";
        formAgenda.reset();
        document.querySelectorAll(".agenda-horarios button").forEach(b => b.disabled = true);
        modalAgenda.hidden = false;
        document.getElementById("agenda-data").focus();
    }
    document.getElementById("fechar-agendamento").onclick = () => modalAgenda.hidden = true;
    modalAgenda.addEventListener("click", e => { if (e.target === modalAgenda) modalAgenda.hidden = true; });
    document.addEventListener("keydown", e => { if (e.key === "Escape") modalAgenda.hidden = true; });
    document.querySelectorAll(".agenda-horarios button").forEach(btn => btn.addEventListener("click", () => {
        if (btn.disabled) return;
        horarioEscolhido = btn.dataset.hora;
        document.querySelectorAll(".agenda-horarios button").forEach(b => b.classList.toggle("selecionado", b === btn));
    }));
    const diaSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    document.getElementById("agenda-data").min = diaSP();
    formAgenda.addEventListener("submit", async e => {
        e.preventDefault();
        if (!horarioEscolhido) { mensagemAgenda.textContent = "Escolha um horário."; return; }
        const btn = formAgenda.querySelector('button[type="submit"]');
        btn.disabled = true;
        mensagemAgenda.textContent = "Registrando solicitação...";
        try {
            const resposta = await fetch(API_AGENDA, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ imovelId: imovelEscolhido._id, data: document.getElementById("agenda-data").value, horario: horarioEscolhido, telefone: document.getElementById("agenda-telefone").value }) });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Falha ao solicitar visita.");
            mensagemAgenda.textContent = dados.mensagem;
            await carregarMeusAgendamentos();
            await atualizarDisponibilidade();
            formAgenda.reset();
            horarioEscolhido = null;
            document.querySelectorAll(".agenda-horarios button").forEach(b => b.classList.remove("selecionado"));
        } catch (erro) {
            mensagemAgenda.textContent = erro.message;
            if (/sessão|login/i.test(erro.message)) sessionStorage.removeItem("hangar_token");
            if (/horário|ocupado|solicitado/i.test(erro.message)) await atualizarDisponibilidade();
        } finally { btn.disabled = false; }
    });
    const listaAgenda = document.getElementById("lista-agendamentos");
    async function carregarMeusAgendamentos() {
        if (!token()) { listaAgenda.textContent = "Entre na sua conta para consultar suas visitas."; return; }
        listaAgenda.textContent = "Carregando...";
        try {
            const resposta = await fetch(`${API_AGENDA}/meus`, { headers: { Authorization: `Bearer ${token()}` } });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Erro ao consultar visitas.");
            listaAgenda.replaceChildren();
            if (!dados.length) { listaAgenda.textContent = "Você ainda não solicitou visitas."; return; }
            dados.forEach(item => {
                const linha = document.createElement("div"); linha.className = "agenda-item";
                const titulo = document.createElement("strong"); titulo.textContent = item.imovel?.titulo || "Imóvel indisponível";
                const descricao = document.createElement("span"); descricao.textContent = `${item.data.split("-").reverse().join("/")} às ${item.horario} • ${item.status}`;
                linha.append(titulo, descricao);
                if (item.status === "pendente") {
                    const cancelar = document.createElement("button"); cancelar.className = "agenda-cancelar"; cancelar.type = "button"; cancelar.textContent = "Cancelar";
                    cancelar.style.marginLeft = "12px";
                    cancelar.onclick = async () => {
                        if (!confirm("Cancelar esta solicitação?")) return;
                        try {
                            const r = await fetch(`${API_AGENDA}/${item._id}/cancelar`, { method: "PATCH", headers: { Authorization: `Bearer ${token()}` } });
                            if (!r.ok) { const d = await r.json(); throw Error(d.erro || "Erro ao cancelar."); }
                            await carregarMeusAgendamentos();
                        } catch (erro) { alert(erro.message); }
                    };
                    linha.append(cancelar);
                }
                listaAgenda.append(linha);
            });
        } catch (erro) { listaAgenda.textContent = erro.message; }
    }
    document.getElementById("btn-meus-agendamentos").addEventListener("click", () => {
        if (!token()) { sessionStorage.setItem("hangar_abrir_meus", "1"); irParaLogin(); return; }
        carregarMeusAgendamentos();
    });
    if (token()) {
        carregarMeusAgendamentos();
        if (sessionStorage.getItem("hangar_abrir_meus") === "1") {
            sessionStorage.removeItem("hangar_abrir_meus");
            requestAnimationFrame(() => document.getElementById("meus-agendamentos")?.scrollIntoView({ behavior: "smooth" }));
        }
    }

    let todosImoveis = [];
    let imoveisExibidos = [];


    // ==========================
    // MENU MOBILE TOGGLE
    // ==========================

    window.toggleMenu = function () {
        const nav = document.getElementById("nav-container");

        if (nav) {
            nav.classList.toggle("active");
        }
    };


    // ==========================
    // ELEMENTOS DA PÁGINA
    // ==========================

    const container = document.querySelector(".cards-container");
    const contador = document.getElementById("contador");
    const btnFiltrar = document.querySelector(".btn-filtrar");
    const selectOrdenar = document.getElementById("ordenar");


    // ==========================
    // CARREGAR IMÓVEIS DA API
    // ==========================

    async function carregarImoveis() {

        if (!container) return;

        container.innerHTML = `
            <p style="padding: 20px;">
                Carregando imóveis...
            </p>
        `;

        try {

            const resposta = await fetch(API);

            if (!resposta.ok) {
                throw new Error("Erro ao buscar imóveis");
            }

            const imoveis = await resposta.json();

            todosImoveis = imoveis;
            // Após autenticar, retoma o imóvel escolhido antes do login.
            const pendenteId = sessionStorage.getItem(PENDENTE_KEY);
            if (pendenteId && token()) {
                const escolhido = imoveis.find(item => String(item._id) === pendenteId);
                sessionStorage.removeItem(PENDENTE_KEY);
                if (escolhido) requestAnimationFrame(() => abrirAgenda(escolhido));
            }
            imoveisExibidos = [...imoveis];

            renderizarImoveis(imoveis);

        } catch (error) {

            console.error("Erro ao carregar imóveis:", error);

            container.innerHTML = `
                <p style="padding: 20px;">
                    Não foi possível carregar os imóveis.
                </p>
            `;

            atualizarContador(0);
        }
    }


    // ==========================
    // RENDERIZAR CARDS
    // ==========================

    function renderizarImoveis(imoveis) {

        if (!container) return;

        container.innerHTML = "";

        if (imoveis.length === 0) {

            container.innerHTML = `
                <p style="padding: 20px;">
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


            // ==========================
            // IMAGEM
            // ==========================

            const imagem =
                imovel.imagens &&
                imovel.imagens.length > 0
                    ? imovel.imagens[0]
                    : "https://via.placeholder.com/600x400?text=Sem+imagem";


            // ==========================
            // TAG
            // ==========================

            let tag = "";

            if (imovel.lancamento) {
                tag = "LANÇAMENTO";
            } else if (imovel.destaque) {
                tag = "DESTAQUE";
            }


            // ==========================
            // PREÇO
            // ==========================

            const preco = Number(imovel.preco || 0).toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );


            // ==========================
            // INFORMAÇÕES
            // ==========================

            const area =
                imovel.area && imovel.area > 0
                    ? `${imovel.area}m²`
                    : "-";

            const quartos =
                imovel.quartos && imovel.quartos > 0
                    ? `${imovel.quartos} quartos`
                    : "-";

            const vagas =
                imovel.vagas && imovel.vagas > 0
                    ? `${imovel.vagas} vagas`
                    : "-";

            const banheiros =
                imovel.banheiros && imovel.banheiros > 0
                    ? `${imovel.banheiros} banhos`
                    : "-";


            // ==========================
            // CARD
            // ==========================

            card.innerHTML = `

                <div class="card-image">

                    <img
                        src="${imagem}"
                        alt="${imovel.titulo || "Imóvel"}"
                    >

                    ${
                        tag
                            ? `<span class="tag">${tag}</span>`
                            : ""
                    }

                </div>


                <div class="card-content">

                    <h3>
                        ${imovel.bairro || ""}
                        ${imovel.cidade ? ` | ${imovel.cidade}` : ""}
                    </h3>

                    <p class="descricao">
                        ${imovel.titulo || "Imóvel"}
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

                        <span>${area}</span>

                        <span>${quartos}</span>

                        <span>${vagas}</span>

                        <span>${banheiros}</span>

                    </div>

                </div>
                <button type="button" class="card-agendar">Agendar visita</button>
            `;
            card.querySelector(".card-agendar").addEventListener("click", event => {
                event.stopPropagation();
                abrirAgenda(imovel);
            });

            // ==========================
            // ABRIR / FECHAR DETALHES
            // ==========================

            const toggleBtn = card.querySelector(".toggle-btn");

            toggleBtn.addEventListener("click", (event) => {

                event.stopPropagation();

                card.classList.toggle("active");

            });


            // ==========================
            // ABRIR PÁGINA DO IMÓVEL
            // ==========================

            card.addEventListener("click", () => {

                window.location.href =
                    `../imovel/index.html?id=${imovel._id}`;

            });


            container.appendChild(card);

        });


        atualizarContador(imoveis.length);
    }


    // ==========================
    // CONTADOR
    // ==========================

    function atualizarContador(quantidade) {

        if (contador) {

            contador.textContent =
                `${quantidade} imóveis encontrados`;

        }
    }


    // ==========================
    // NORMALIZAR TEXTO
    // ==========================

    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");

    }


    // ==========================
    // FILTRAGEM
    // ==========================

    function filtrarImoveis() {

        const cidade =
            document.getElementById("cidade")?.value || "todos";

        const bairro =
            document.getElementById("bairro")?.value || "todos";

        const precoMin =
            Number(
                document.getElementById("precoMin")?.value
            ) || 0;

        const precoMaxInput =
            document.getElementById("precoMax")?.value;

        const precoMax =
            precoMaxInput
                ? Number(precoMaxInput)
                : Infinity;


        const tiposSelecionados =
            Array.from(
                document.querySelectorAll(".opcoes button.active")
            )
            .map(btn => normalizar(btn.textContent));


        const filtrados = todosImoveis.filter(imovel => {

            let mostrar = true;


            // ==========================
            // CIDADE
            // ==========================

            if (
                cidade !== "todos" &&
                normalizar(imovel.cidade) !== normalizar(cidade)
            ) {

                mostrar = false;

            }


            // ==========================
            // BAIRRO
            // ==========================

            if (
                bairro !== "todos" &&
                normalizar(imovel.bairro) !== normalizar(bairro)
            ) {

                mostrar = false;

            }


            // ==========================
            // TIPO
            // ==========================

            if (
                tiposSelecionados.length > 0 &&
                !tiposSelecionados.includes(normalizar(imovel.tipo))
            ) {

                mostrar = false;

            }


            // ==========================
            // PREÇO
            // ==========================

            const preco = Number(imovel.preco || 0);

            if (
                preco < precoMin ||
                preco > precoMax
            ) {

                mostrar = false;

            }


            return mostrar;

        });


        imoveisExibidos = filtrados;

        aplicarOrdenacao(filtrados);

    }


    // ==========================
    // ORDENAÇÃO
    // ==========================

    function aplicarOrdenacao(imoveis) {

        const ordem =
            selectOrdenar?.value || "Mais relevantes";


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


    // ==========================
    // BOTÕES DE TIPO
    // ==========================

    document
        .querySelectorAll(".opcoes button")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                btn.classList.toggle("active");

            });

        });


    // ==========================
    // BOTÃO FILTRAR
    // ==========================

    if (btnFiltrar) {

        btnFiltrar.addEventListener(
            "click",
            filtrarImoveis
        );

    }


    // ==========================
    // ORDENAÇÃO
    // ==========================

    if (selectOrdenar) {

        selectOrdenar.addEventListener(
            "change",
            () => {

                aplicarOrdenacao(imoveisExibidos);

            }
        );

    }


    // ==========================
    // INICIAR
    // ==========================

    carregarImoveis();

});
