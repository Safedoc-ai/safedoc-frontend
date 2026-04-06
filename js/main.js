const STORAGE_KEYS = {
  requiredDocs: 'safedoc_required_docs',
  units: 'safedoc_units',
  unitDocs: 'safedoc_unit_docs',
  pendingUpload: 'safedoc_pending_upload'
};

const DEFAULT_REQUIRED_DOCS = [
  { nome: 'Alvará de Funcionamento', frequencia: 'Anual' },
  { nome: 'AVCB - Corpo de Bombeiros', frequencia: 'Anual' },
  { nome: 'Licença Sanitária', frequencia: 'Anual' },
  { nome: 'Contrato Social', frequencia: 'Mensal' },
  { nome: 'Certidão Negativa de Débitos', frequencia: 'Mensal' }
];

const DEFAULT_UNITS = [
  { nome: 'Unidade Centro', responsavel: 'Mariana Costa', cidade: 'São Paulo', status: 'Crítico', vencidos: 4 },
  { nome: 'Unidade Savassi', responsavel: 'Pedro Lima', cidade: 'Belo Horizonte', status: 'Atenção', vencidos: 2 },
  { nome: 'Unidade Pampulha', responsavel: 'Juliana Rocha', cidade: 'Belo Horizonte', status: 'Em Dia', vencidos: 0 },
  { nome: 'Unidade Norte', responsavel: 'Carlos Mendes', cidade: 'Campinas', status: 'Vencendo', vencidos: 1 },
  { nome: 'Unidade Sul', responsavel: 'Fernanda Alves', cidade: 'Santos', status: 'Em Dia', vencidos: 0 },
  { nome: 'Unidade Oeste', responsavel: 'Renata Souza', cidade: 'Sorocaba', status: 'Vencido', vencidos: 3 },
  { nome: 'Unidade Leste', responsavel: 'Bruno Castro', cidade: 'São José dos Campos', status: 'Em Dia', vencidos: 0 }
];

const DEFAULT_UNIT_DOCS = [
  { nome: 'Alvará de Funcionamento', emissao: '15/08/2025', validade: '15/08/2026', status: 'Em Dia' },
  { nome: 'AVCB - Corpo de Bombeiros', emissao: '05/05/2025', validade: '05/05/2026', status: 'Vencendo' },
  { nome: 'Licença Sanitária', emissao: '20/04/2024', validade: '20/04/2025', status: 'Vencido' }
];

function readStorage(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureMockData() {
  if (!localStorage.getItem(STORAGE_KEYS.requiredDocs)) writeStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
  if (!localStorage.getItem(STORAGE_KEYS.units)) writeStorage(STORAGE_KEYS.units, DEFAULT_UNITS);
  if (!localStorage.getItem(STORAGE_KEYS.unitDocs)) writeStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);
}

function badgeClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes('dia')) return 'badge badge-success';
  if (normalized.includes('aten') || normalized.includes('vencendo')) return 'badge badge-warning';
  return 'badge badge-danger';
}

function renderRequiredDocs() {
  const body = document.getElementById('required-docs-body');
  if (!body) return;
  const docs = readStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
  body.innerHTML = docs.map(doc => `
    <tr>
      <td>${doc.nome}</td>
      <td><span class="badge badge-neutral">${doc.frequencia}</span></td>
    </tr>
  `).join('');
}

function renderUnits() {
  const body = document.getElementById('units-table-body');
  if (!body) return;
  const units = readStorage(STORAGE_KEYS.units, DEFAULT_UNITS);
  body.innerHTML = units.map(unit => `
    <tr>
      <td>${unit.nome}</td>
      <td>${unit.responsavel}</td>
      <td>${unit.cidade}</td>
      <td><span class="${badgeClass(unit.status)}">${unit.status}</span></td>
      <td>${unit.vencidos}</td>
      <td><a class="link-action" href="unidade-detalhe.html">Ver documentos</a></td>
    </tr>
  `).join('');
}

function renderUnitDocs() {
  const body = document.getElementById('unit-docs-body');
  if (!body) return;
  const docs = readStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);
  body.innerHTML = docs.map(doc => `
    <tr>
      <td>${doc.nome}</td>
      <td>${doc.emissao}</td>
      <td>${doc.validade}</td>
      <td><span class="${badgeClass(doc.status)}">${doc.status}</span></td>
      <td><a class="link-action" href="analise-ia.html">Ver detalhes</a></td>
    </tr>
  `).join('');

  const summaryContainer = document.getElementById('unit-summary-cards');
  if (!summaryContainer) return;
  const counts = docs.reduce((acc, doc) => {
    if (doc.status === 'Em Dia') acc.emDia += 1;
    else if (doc.status === 'Vencendo') acc.vencendo += 1;
    else acc.vencidos += 1;
    return acc;
  }, { emDia: 0, vencendo: 0, vencidos: 0 });

  summaryContainer.innerHTML = `
    <article class="stat-card stat-success"><div class="stat-icon">✓</div><div><div class="label">Em Dia</div><div class="value">${counts.emDia}</div></div></article>
    <article class="stat-card stat-warning"><div class="stat-icon">!</div><div><div class="label">Vencendo</div><div class="value">${counts.vencendo}</div></div></article>
    <article class="stat-card stat-danger"><div class="stat-icon">×</div><div><div class="label">Vencidos</div><div class="value">${counts.vencidos}</div></div></article>
  `;
}

function setupRequiredDocsModal() {
  const modal = document.getElementById('required-doc-modal');
  const openBtn = document.getElementById('novo-documento-btn');
  const closeBtn = document.getElementById('fechar-modal-btn');
  const cancelBtn = document.getElementById('cancelar-modal-btn');
  const form = document.getElementById('required-doc-form');
  if (!modal || !openBtn || !form) return;

  const closeModal = () => {
    modal.classList.add('hidden');
    form.reset();
  };

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nome = document.getElementById('novo-doc-nome').value.trim();
    const frequencia = document.getElementById('novo-doc-frequencia').value;
    if (!nome || !frequencia) return;
    const docs = readStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
    docs.push({ nome, frequencia });
    writeStorage(STORAGE_KEYS.requiredDocs, docs);
    renderRequiredDocs();
    closeModal();
  });
}

function setupUpload() {
  const fileInput = document.getElementById('arquivo-documento');
  const fileName = document.getElementById('upload-file-name');
  const sendButton = document.getElementById('enviar-documento-btn');
  const form = document.getElementById('upload-form');
  const issueDate = document.getElementById('data-emissao');
  const expiryDate = document.getElementById('data-validade');
  const documentType = document.getElementById('tipo-documento');
  const unitName = document.getElementById('nome-unidade');
  if (!form) return;

  const pending = readStorage(STORAGE_KEYS.pendingUpload, null);
  if (pending) {
    if (fileName) fileName.textContent = `Arquivo selecionado: ${pending.fileName || 'Nenhum arquivo selecionado'}`;
    if (issueDate) issueDate.value = pending.issueDate || '';
    if (expiryDate) expiryDate.value = pending.expiryDate || '';
    if (documentType) documentType.value = pending.documentType || '';
    if (unitName) unitName.value = pending.unitName || 'Unidade Centro';
  }

  fileInput?.addEventListener('change', () => {
    const selected = fileInput.files && fileInput.files[0];
    fileName.textContent = selected ? `Arquivo selecionado: ${selected.name}` : 'Nenhum arquivo selecionado';
  });

  const collectUploadData = () => {
    const selected = fileInput?.files && fileInput.files[0];
    const uploadData = {
      fileName: selected ? selected.name : (pending?.fileName || ''),
      issueDate: issueDate?.value.trim() || '',
      expiryDate: expiryDate?.value.trim() || '',
      documentType: documentType?.value || '',
      unitName: unitName?.value || 'Unidade Centro',
      status: 'Em Dia'
    };
    return uploadData;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const uploadData = collectUploadData();
    if (!uploadData.fileName || !uploadData.issueDate || !uploadData.expiryDate || !uploadData.documentType) {
      alert('Preencha arquivo, tipo do documento, data de emissão e data de validade antes de analisar.');
      return;
    }
    writeStorage(STORAGE_KEYS.pendingUpload, uploadData);
    window.location.href = 'analise-ia.html';
  });

  sendButton?.addEventListener('click', () => {
    const uploadData = collectUploadData();
    if (!uploadData.fileName || !uploadData.issueDate || !uploadData.expiryDate || !uploadData.documentType) {
      alert('Preencha todos os campos antes de enviar.');
      return;
    }
    const docs = readStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);
    docs.unshift({
      nome: uploadData.documentType,
      emissao: uploadData.issueDate,
      validade: uploadData.expiryDate,
      status: uploadData.status
    });
    writeStorage(STORAGE_KEYS.unitDocs, docs);
    localStorage.removeItem(STORAGE_KEYS.pendingUpload);
    window.location.href = 'unidade-detalhe.html';
  });
}

function setupAnalysis() {
  const fileNameEl = document.getElementById('analysis-file-name');
  const typeEl = document.getElementById('analysis-document-type');
  const unitEl = document.getElementById('analysis-unit-name');
  const issueEl = document.getElementById('analysis-issue-date');
  const expiryEl = document.getElementById('analysis-expiry-date');
  const confirmBtn = document.getElementById('confirmar-analise-btn');
  const backBtn = document.getElementById('voltar-upload-btn');
  if (!confirmBtn) return;

  const pending = readStorage(STORAGE_KEYS.pendingUpload, {
    fileName: 'Nenhum arquivo selecionado',
    documentType: 'Alvará de Funcionamento',
    unitName: 'Unidade Centro',
    issueDate: '15/08/2025',
    expiryDate: '15/08/2026',
    status: 'Em Dia'
  });

  if (fileNameEl) fileNameEl.textContent = pending.fileName || 'Nenhum arquivo selecionado';
  if (typeEl) typeEl.textContent = pending.documentType || '-';
  if (unitEl) unitEl.textContent = pending.unitName || 'Unidade Centro';
  if (issueEl) issueEl.textContent = pending.issueDate || '-';
  if (expiryEl) expiryEl.textContent = pending.expiryDate || '-';

  confirmBtn.addEventListener('click', () => {
    const docs = readStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);
    docs.unshift({
      nome: pending.documentType,
      emissao: pending.issueDate,
      validade: pending.expiryDate,
      status: pending.status || 'Em Dia'
    });
    writeStorage(STORAGE_KEYS.unitDocs, docs);
    localStorage.removeItem(STORAGE_KEYS.pendingUpload);
    window.location.href = 'unidade-detalhe.html';
  });

  backBtn?.addEventListener('click', () => {
    window.location.href = 'upload-documento.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureMockData();

  const current = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === current) link.classList.add('active');
  });

  renderRequiredDocs();
  renderUnits();
  renderUnitDocs();
  setupRequiredDocsModal();
  setupUpload();
  setupAnalysis();
});
