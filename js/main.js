// ==============================
// SAFEDOC AI — JAVASCRIPT PRINCIPAL
// ==============================

// URL base da API — altere para a URL do back-end quando estiver rodando
const API_URL = "http://localhost:5000/api";

// ==============================
// FUNÇÕES DE SESSÃO
// ==============================

// Salva o usuário logado no navegador
function salvarSessao(usuario) {
    localStorage.setItem("safedoc_usuario", JSON.stringify(usuario));
}

// Recupera o usuário logado
function obterSessao() {
    const dados = localStorage.getItem("safedoc_usuario");
    return dados ? JSON.parse(dados) : null;
}

// Remove a sessão e volta para o login
function sair() {
    localStorage.removeItem("safedoc_usuario");
    window.location.href = "login.html";
}

// Protege páginas internas — redireciona se não estiver logado
function verificarSessao() {
    const usuario = obterSessao();
    if (!usuario) {
        window.location.href = "login.html";
        return null;
    }
    return usuario;
}

// ==============================
// LOGIN
// ==============================

async function fazerLogin() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erroDiv = document.getElementById("erro-login");

    erroDiv.style.display = "none";

    if (!email || !senha) {
        erroDiv.textContent = "Preencha o e-mail e a senha.";
        erroDiv.style.display = "block";
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (!resposta.ok) {
            erroDiv.textContent = "Email ou senha inválidos.";
            erroDiv.style.display = "block";
            return;
        }

        const usuario = await resposta.json();
        salvarSessao(usuario);
        window.location.href = "dashboard.html";

    } catch (erro) {
        erroDiv.textContent = "Erro ao conectar com o servidor. Tente novamente.";
        erroDiv.style.display = "block";
    }
}

// ==============================
// DASHBOARD
// ==============================

async function carregarDashboard() {
    const usuario = verificarSessao();
    if (!usuario) return;

    document.getElementById("nome-usuario").textContent = usuario.nome;

    try {
        const resposta = await fetch(`${API_URL}/unidades`);
        const unidades = await resposta.json();

        const emDia    = unidades.filter(u => u.status === "Em dia").length;
        const pendente = unidades.filter(u => u.status === "Pendente").length;
        const vencido  = unidades.filter(u => u.status === "Vencido").length;

        document.getElementById("total-em-dia").textContent  = emDia;
        document.getElementById("total-pendente").textContent = pendente;
        document.getElementById("total-vencido").textContent  = vencido;
        document.getElementById("total-unidades").textContent = unidades.length;

    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}

// ==============================
// UNIDADES
// ==============================

async function carregarUnidades() {
    const usuario = verificarSessao();
    if (!usuario) return;

    document.getElementById("nome-usuario").textContent = usuario.nome;

    try {
        const resposta = await fetch(`${API_URL}/unidades`);
        const unidades = await resposta.json();

        const tbody = document.getElementById("lista-unidades");
        tbody.innerHTML = "";

        unidades.forEach(u => {
            const badge = badgeStatus(u.status);
            tbody.innerHTML += `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.nome}</td>
                    <td>${u.cidade}</td>
                    <td>${u.estado}</td>
                    <td>${u.responsavel}</td>
                    <td>${badge}</td>
                    <td>
                        <button class="btn-detalhe" onclick="verDetalhe(${u.id})">
                            Ver detalhes
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (erro) {
        document.getElementById("lista-unidades").innerHTML =
            `<tr><td colspan="7" class="carregando">Erro ao carregar unidades.</td></tr>`;
    }
}

function badgeStatus(status) {
    if (status === "Em dia")   return `<span class="badge badge-verde">Em dia</span>`;
    if (status === "Pendente") return `<span class="badge badge-amarelo">Pendente</span>`;
    if (status === "Vencido")  return `<span class="badge badge-vermelho">Vencido</span>`;
    return `<span class="badge">${status}</span>`;
}

function verDetalhe(id) {
    window.location.href = `unidade-detalhe.html?id=${id}`;
}

// ==============================
// INICIALIZAÇÃO AUTOMÁTICA POR PÁGINA
// ==============================

const pagina = window.location.pathname;

if (pagina.includes("dashboard.html")) carregarDashboard();
if (pagina.includes("unidades.html"))  carregarUnidades();
