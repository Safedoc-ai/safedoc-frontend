const STORAGE_KEYS = {
  requiredDocs: 'safedoc_required_docs',
  units: 'safedoc_units',
  unitDocs: 'safedoc_unit_docs',
  pendingUpload: 'safedoc_pending_upload',
  pendingAnalysis: 'safedoc_pending_analysis'
};

const DEFAULT_REQUIRED_DOCS = [
  { nome: 'Alvará de Funcionamento', frequencia: 'Anual' },
  { nome: 'AVCB - Corpo de Bombeiros', frequencia: 'Anual' },
  { nome: 'Licença Sanitária', frequencia: 'Anual' },
  { nome: 'Contrato Social', frequencia: 'Mensal' },
  { nome: 'Certidão Negativa de Débitos', frequencia: 'Mensal' }
];

const DEFAULT_UNITS = [
  { id: 1, nome: 'Unidade Centro', responsavel: 'Mariana Costa', cidade: 'São Paulo', status: 'Crítico', vencidos: 4 },
  { id: 2, nome: 'Unidade Savassi', responsavel: 'Pedro Lima', cidade: 'Belo Horizonte', status: 'Atenção', vencidos: 2 },
  { id: 3, nome: 'Unidade Pampulha', responsavel: 'Juliana Rocha', cidade: 'Belo Horizonte', status: 'Em Dia', vencidos: 0 },
  { id: 4, nome: 'Unidade Norte', responsavel: 'Carlos Mendes', cidade: 'Campinas', status: 'Vencendo', vencidos: 1 },
  { id: 5, nome: 'Unidade Sul', responsavel: 'Fernanda Alves', cidade: 'Santos', status: 'Em Dia', vencidos: 0 },
  { id: 6, nome: 'Unidade Oeste', responsavel: 'Renata Souza', cidade: 'Sorocaba', status: 'Vencido', vencidos: 3 },
  { id: 7, nome: 'Unidade Leste', responsavel: 'Bruno Castro', cidade: 'São José dos Campos', status: 'Em Dia', vencidos: 0 }
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
  if (!localStorage.getItem(STORAGE_KEYS.requiredDocs)) {
    writeStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.units)) {
    writeStorage(STORAGE_KEYS.units, DEFAULT_UNITS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.unitDocs)) {
    writeStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);
  }
}

function badgeClass(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized.includes('dia')) return 'badge badge-success';
  if (normalized.includes('aten') || normalized.includes('vencendo')) return 'badge badge-warning';

  return 'badge badge-danger';
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString('pt-BR');
}

function formatDateForApi(dateValue) {
  if (!dateValue) return '';

  if (dateValue.includes('T')) return dateValue;

  return `${dateValue}T00:00:00`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, fileName, mimeType) {
  const arr = dataUrl.split(',');
  const base64 = arr[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mimeType || 'application/octet-stream' });
}

async function testarConexaoApi() {
  try {
    const response = await fetch('http://localhost:5291/api/Health');

    if (!response.ok) {
      throw new Error('API respondeu com erro');
    }

    const dados = await response.json();

    const statusEl = document.getElementById('api-status');

    if (statusEl) {
      statusEl.textContent = `API conectada: ${dados.message}`;
      statusEl.className = 'api-status api-status--ok';
    }

    console.log('Health OK:', dados);
    return true;
  } catch (erro) {
    const statusEl = document.getElementById('api-status');

    if (statusEl) {
      statusEl.textContent = 'API offline ou inacessível.';
      statusEl.className = 'api-status api-status--erro';
    }

    console.error('Erro ao testar API:', erro);
    return false;
  }
}

async function renderRequiredDocs() {
  const body = document.getElementById('required-docs-body');

  if (!body) return;

  try {
    let docs = [];

    if (typeof fetchDocumentosObrigatorios === 'function') {
      docs = await fetchDocumentosObrigatorios();
    } else {
      docs = readStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
    }

    if (!docs.length) {
      body.innerHTML = `
        <tr>
          <td>Nenhum documento obrigatório cadastrado.</td>
          <td>-</td>
          <td>-</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = docs.map((doc, index) => `
      <tr>
        <td>${doc.nome}</td>
        <td><span class="badge badge-neutral">${doc.frequencia}</span></td>
        <td>
          <button
            class="btn btn-secondary"
            type="button"
            data-delete-required-doc="${doc.id ?? index}"
            data-delete-required-index="${index}"
          >
            Excluir
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar documentos obrigatórios:', error);

    body.innerHTML = `
      <tr>
        <td>Erro ao carregar documentos obrigatórios.</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `;
  }
}

function renderUnits(unitsFromApi = null) {
  const body = document.getElementById('units-table-body');

  if (!body) return;

  const units = unitsFromApi || readStorage(STORAGE_KEYS.units, DEFAULT_UNITS);

  body.innerHTML = units.map(unit => `
    <tr>
      <td>${unit.nome}</td>
      <td>${unit.responsavel || '-'}</td>
      <td>${unit.cidade || '-'}</td>
      <td><span class="${badgeClass(unit.status || 'Em Dia')}">${unit.status || 'Em Dia'}</span></td>
      <td>${unit.vencidos ?? '-'}</td>
      <td><a class="link-action" href="unidade-detalhe.html?id=${unit.id || 1}">Ver documentos</a></td>
    </tr>
  `).join('');
}

function renderUnitDocs(docsFromApi = null) {
  const body = document.getElementById('unit-docs-body');

  if (!body) return;

  const docs = docsFromApi || readStorage(STORAGE_KEYS.unitDocs, DEFAULT_UNIT_DOCS);

  body.innerHTML = docs.map(doc => `
    <tr>
      <td>${doc.nome}</td>
      <td>${doc.emissao || formatDate(doc.dataEmissao)}</td>
      <td>${doc.validade || formatDate(doc.dataValidade)}</td>
      <td><span class="${badgeClass(doc.status)}">${doc.status}</span></td>
      <td><a class="link-action" href="analise-ia.html">Ver detalhes</a></td>
    </tr>
  `).join('');

  const summaryContainer = document.getElementById('unit-summary-cards');

  if (!summaryContainer) return;

  const counts = docs.reduce((acc, doc) => {
    const status = String(doc.status || '');

    if (status === 'Em Dia' || status === 'EmDia') {
      acc.emDia += 1;
    } else if (status === 'Vencendo') {
      acc.vencendo += 1;
    } else {
      acc.vencidos += 1;
    }

    return acc;
  }, { emDia: 0, vencendo: 0, vencidos: 0 });

  summaryContainer.innerHTML = `
    <article class="stat-card stat-success">
      <div class="stat-icon">✓</div>
      <div>
        <div class="label">Em Dia</div>
        <div class="value">${counts.emDia}</div>
      </div>
    </article>

    <article class="stat-card stat-warning">
      <div class="stat-icon">!</div>
      <div>
        <div class="label">Vencendo</div>
        <div class="value">${counts.vencendo}</div>
      </div>
    </article>

    <article class="stat-card stat-danger">
      <div class="stat-icon">×</div>
      <div>
        <div class="label">Vencidos</div>
        <div class="value">${counts.vencidos}</div>
      </div>
    </article>
  `;
}

function setupRequiredDocsModal() {
  const modal = document.getElementById('required-doc-modal');
  const openBtn = document.getElementById('novo-documento-btn');
  const closeBtn = document.getElementById('fechar-modal-btn');
  const cancelBtn = document.getElementById('cancelar-modal-btn');
  const form = document.getElementById('required-doc-form');
  const body = document.getElementById('required-docs-body');

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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('novo-doc-nome').value.trim();
    const frequencia = document.getElementById('novo-doc-frequencia').value;

    if (!nome || !frequencia) return;

    try {
      if (typeof criarDocumentoObrigatorio === 'function') {
        await criarDocumentoObrigatorio({ nome, frequencia });
      } else {
        const docs = readStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
        docs.push({ nome, frequencia });
        writeStorage(STORAGE_KEYS.requiredDocs, docs);
      }

      await renderRequiredDocs();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar documento obrigatório:', error);
      alert('Erro ao salvar documento obrigatório.');
    }
  });

  body?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-required-doc]');

    if (!button) return;

    const id = button.dataset.deleteRequiredDoc;
    const index = Number(button.dataset.deleteRequiredIndex);

    const confirmar = confirm('Deseja excluir este documento obrigatório?');

    if (!confirmar) return;

    try {
      if (typeof deletarDocumentoObrigatorio === 'function') {
        await deletarDocumentoObrigatorio(id);
      } else {
        const docs = readStorage(STORAGE_KEYS.requiredDocs, DEFAULT_REQUIRED_DOCS);
        docs.splice(index, 1);
        writeStorage(STORAGE_KEYS.requiredDocs, docs);
      }

      await renderRequiredDocs();
    } catch (error) {
      console.error('Erro ao excluir documento obrigatório:', error);
      alert('Erro ao excluir documento obrigatório.');
    }
  });
}

async function setupUpload() {
  const fileInput = document.getElementById('arquivo-documento');
  const fileName = document.getElementById('upload-file-name');
  const form = document.getElementById('upload-form');
  const issueDate = document.getElementById('data-emissao');
  const expiryDate = document.getElementById('data-validade');
  const documentType = document.getElementById('tipo-documento');
  const unitSelect = document.getElementById('unidade-id');

  if (!form) return;

  try {
    if (unitSelect && typeof fetchUnidades === 'function') {
      const unidades = await fetchUnidades();

      if (unidades.length) {
        unitSelect.innerHTML = unidades.map(unidade => `
          <option value="${unidade.id}">
            ${unidade.nome}
          </option>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Erro ao carregar unidades no upload:', error);
  }

  fileInput?.addEventListener('change', () => {
    const selected = fileInput.files && fileInput.files[0];

    if (fileName) {
      fileName.textContent = selected
        ? `Arquivo selecionado: ${selected.name}`
        : 'Nenhum arquivo selecionado';
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const selected = fileInput?.files && fileInput.files[0];
    const nomeDocumento = documentType?.value || '';
    const dataEmissao = issueDate?.value || '';
    const dataValidade = expiryDate?.value || '';
    const unidadeId = unitSelect?.value || '1';
    const unidadeNome = unitSelect?.options[unitSelect.selectedIndex]?.text?.trim() || 'Matriz BH';

    if (!selected || !nomeDocumento || !dataEmissao || !dataValidade || !unidadeId) {
      alert('Preencha arquivo, tipo do documento, data de emissão, data de validade e unidade.');
      return;
    }

    try {
      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Analisando...';
      }

      const resultadoAnalise = await analisarIaMock({
        nomeDocumento,
        dataEmissao: formatDateForApi(dataEmissao),
        dataValidade: formatDateForApi(dataValidade),
        unidadeId: Number(unidadeId)
      });

      const fileDataUrl = await fileToDataUrl(selected);

      writeStorage(STORAGE_KEYS.pendingUpload, {
        fileName: selected.name,
        fileType: selected.type,
        fileDataUrl,
        documentType: nomeDocumento,
        issueDate: dataEmissao,
        expiryDate: dataValidade,
        unidadeId,
        unitName: unidadeNome,
        status: resultadoAnalise.status
      });

      writeStorage(STORAGE_KEYS.pendingAnalysis, resultadoAnalise);

      window.location.href = 'analise-ia.html';
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      alert('Erro ao analisar documento com IA mock.');

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Analisar com IA Mock';
      }
    }
  });
}

function setupAnalysis() {
  const fileNameEl = document.getElementById('analysis-file-name');
  const typeEl = document.getElementById('analysis-document-type');
  const unitEl = document.getElementById('analysis-unit-name');
  const issueEl = document.getElementById('analysis-issue-date');
  const expiryEl = document.getElementById('analysis-expiry-date');
  const statusEl = document.getElementById('analysis-status');
  const messageEl = document.getElementById('analysis-message');
  const suggestedDateEl = document.getElementById('analysis-suggested-date');
  const cnpjEl = document.getElementById('analysis-cnpj');
  const orgaoEl = document.getElementById('analysis-orgao');
  const confirmBtn = document.getElementById('confirmar-analise-btn');
  const backBtn = document.getElementById('voltar-upload-btn');

  if (!confirmBtn) return;

  const pending = readStorage(STORAGE_KEYS.pendingUpload, null);
  const analysis = readStorage(STORAGE_KEYS.pendingAnalysis, null);

  if (!pending || !analysis) {
    if (messageEl) {
      messageEl.textContent = 'Nenhuma análise pendente encontrada. Volte e envie um documento.';
    }

    confirmBtn.disabled = true;

    backBtn?.addEventListener('click', () => {
      window.location.href = 'upload-documento.html';
    });

    return;
  }

  if (fileNameEl) fileNameEl.textContent = pending.fileName || 'Nenhum arquivo selecionado';
  if (typeEl) typeEl.textContent = analysis.tipoDocumento || pending.documentType || '-';
  if (unitEl) unitEl.textContent = pending.unitName || 'Matriz BH';
  if (issueEl) issueEl.textContent = formatDate(pending.issueDate);
  if (expiryEl) expiryEl.textContent = formatDate(pending.expiryDate);
  if (statusEl) statusEl.textContent = analysis.status || '-';
  if (messageEl) messageEl.textContent = analysis.mensagem || 'Análise mock realizada.';
  if (suggestedDateEl) suggestedDateEl.textContent = formatDate(analysis.dataValidadeSugerida);
  if (cnpjEl) cnpjEl.textContent = analysis.cnpjDetectado || '-';
  if (orgaoEl) orgaoEl.textContent = analysis.orgaoEmissor || '-';

  confirmBtn.addEventListener('click', async () => {
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Enviando...';

      if (!pending.fileDataUrl) {
        throw new Error('Arquivo pendente não encontrado.');
      }

      const arquivo = dataUrlToFile(pending.fileDataUrl, pending.fileName, pending.fileType);

      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('nome', pending.documentType);
      formData.append('dataEmissao', formatDateForApi(pending.issueDate));
      formData.append('dataValidade', formatDateForApi(pending.expiryDate));
      formData.append('unidadeId', pending.unidadeId || '1');

      await uploadDocumento(formData);

      localStorage.removeItem(STORAGE_KEYS.pendingUpload);
      localStorage.removeItem(STORAGE_KEYS.pendingAnalysis);

      window.location.href = `unidade-detalhe.html?id=${pending.unidadeId || 1}`;
    } catch (error) {
      console.error('Erro ao confirmar envio:', error);
      alert('Erro ao confirmar envio do documento.');

      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar envio';
    }
  });

  backBtn?.addEventListener('click', () => {
    window.location.href = 'upload-documento.html';
  });
}

async function integrarDashboard() {
  const totalEl = document.getElementById('total-unidades');
  const emDiaEl = document.getElementById('docs-em-dia');
  const vencendoEl = document.getElementById('docs-vencendo');
  const vencidosEl = document.getElementById('docs-vencidos');

  if (!emDiaEl || !vencendoEl || !vencidosEl) return;
  if (typeof fetchDashboard !== 'function') return;

  try {
    const dashboard = await fetchDashboard();

    if (totalEl) {
      totalEl.textContent = dashboard.totalUnidades;
    }

    emDiaEl.textContent = dashboard.documentosEmDia;
    vencendoEl.textContent = dashboard.documentosVencendo;
    vencidosEl.textContent = dashboard.documentosVencidos;
  } catch (error) {
    console.error('Erro ao integrar dashboard:', error);
  }
}

async function integrarUnidades() {
  const body = document.getElementById('units-table-body');

  if (!body) return;
  if (typeof fetchUnidades !== 'function') return;

  try {
    const unidades = await fetchUnidades();

    const unidadesAdaptadas = unidades.map((u) => ({
      id: u.id,
      nome: u.nome,
      responsavel: '-',
      cidade: u.cidade,
      status: u.ativa ? 'Em Dia' : 'Vencido',
      vencidos: '-'
    }));

    renderUnits(unidadesAdaptadas);
  } catch (error) {
    console.error('Erro ao integrar unidades:', error);
  }
}

async function integrarDetalheUnidade() {
  const body = document.getElementById('unit-docs-body');

  if (!body) return;
  if (typeof fetchUnidadeDetalhe !== 'function') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '1';

    const unidade = await fetchUnidadeDetalhe(id);

    const nomeUnidadeEl = document.getElementById('nome-unidade-detalhe');
    const cidadeUnidadeEl = document.getElementById('cidade-unidade-detalhe');

    if (nomeUnidadeEl) {
      nomeUnidadeEl.textContent = unidade.nome;
    }

    if (cidadeUnidadeEl) {
      cidadeUnidadeEl.textContent = `${unidade.cidade} - ${unidade.estado}`;
    }

    const docsAdaptados = unidade.documentos.map((doc) => ({
      nome: doc.nome,
      emissao: formatDate(doc.dataEmissao),
      validade: formatDate(doc.dataValidade),
      status: doc.status
    }));

    renderUnitDocs(docsAdaptados);
  } catch (error) {
    console.error('Erro ao integrar detalhe da unidade:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  ensureMockData();

  const current = document.body.dataset.page;

  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === current) {
      link.classList.add('active');
    }
  });

  await renderRequiredDocs();
  renderUnits();
  renderUnitDocs();
  setupRequiredDocsModal();
  await setupUpload();
  setupAnalysis();

  if (current === 'dashboard') {
    await testarConexaoApi();
    await integrarDashboard();
    await integrarUnidades();
  }

  if (current === 'unidades') {
    await integrarUnidades();
  }

  if (current === 'unidade-detalhe') {
    await integrarDetalheUnidade();
  }
});