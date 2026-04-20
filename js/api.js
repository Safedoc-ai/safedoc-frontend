const API_URL = "http://localhost:5291/api";

async function fetchDashboard() {
  const response = await fetch(`${API_URL}/dashboard`);
  if (!response.ok) {
    throw new Error("Erro ao buscar dashboard");
  }
  return await response.json();
}

async function fetchUnidades() {
  const response = await fetch(`${API_URL}/unidades`);
  if (!response.ok) {
    throw new Error("Erro ao buscar unidades");
  }
  return await response.json();
}

async function fetchUnidadeDetalhe(id) {
  const response = await fetch(`${API_URL}/unidades/${id}`);
  if (!response.ok) {
    throw new Error("Erro ao buscar detalhe da unidade");
  }
  return await response.json();
}
