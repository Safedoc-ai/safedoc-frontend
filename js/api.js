const API_URL = "http://localhost:5291/api";

async function fetchDashboard() {
  const response = await fetch(`${API_URL}/Dashboard`);

  if (!response.ok) {
    throw new Error("Erro ao buscar dashboard");
  }

  return await response.json();
}

async function fetchUnidades() {
  const response = await fetch(`${API_URL}/Unidades`);

  if (!response.ok) {
    throw new Error("Erro ao buscar unidades");
  }

  return await response.json();
}

async function fetchDocumentos() {
  const response = await fetch(`${API_URL}/Documentos`);

  if (!response.ok) {
    throw new Error("Erro ao buscar documentos");
  }

  return await response.json();
}

async function fetchUnidadeDetalhe(id) {
  const response = await fetch(`${API_URL}/Unidades/${id}`);

  if (!response.ok) {
    throw new Error("Erro ao buscar detalhe da unidade");
  }

  return await response.json();
}