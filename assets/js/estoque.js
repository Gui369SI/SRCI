/* ==========================================================================
   SRCI — Consulta de Estoque Logic
   ========================================================================== */

let currentUserProfile = null;
let allStockItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth();
  if (!currentUserProfile) return;

  // Exibe ações administrativas se almoxarife ou admin
  if (['almoxarife', 'admin'].includes(currentUserProfile.perfil)) {
    document.getElementById('gestor-actions').style.display = 'block';
  }

  loadEstoqueData();
});

async function loadEstoqueData() {
  const container = document.getElementById('estoque-container');

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Carregando saldos do estoque...</p>
    </div>
  `;

  try {
    const { data, error } = await window.supabaseClient
      .from('vw_estoque')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });

    if (error) throw error;

    allStockItems = data || [];
    filterEstoqueTable();

  } catch (err) {
    console.error("Erro ao carregar saldo de estoque:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar estoque: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

function filterEstoqueTable() {
  const container = document.getElementById('estoque-container');
  const searchVal = document.getElementById('search-item').value.toLowerCase().trim();
  const catVal = document.getElementById('filter-categoria').value;
  const apenasCriticos = document.getElementById('chk-apenas-criticos').checked;

  let filtered = allStockItems.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchVal);
    const matchesCat = (catVal === 'todas') || (item.categoria === catVal);
    const matchesCritico = !apenasCriticos || item.alerta_minimo;
    return matchesSearch && matchesCat && matchesCritico;
  });

  document.getElementById('total-itens-badge').textContent = `Exibindo: ${filtered.length} de ${allStockItems.length} insumos`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">search_off</span>
        <p>Nenhum insumo localizado com os filtros selecionados.</p>
      </div>
    `;
    return;
  }

  const isGestor = ['almoxarife', 'admin'].includes(currentUserProfile.perfil);

  let html = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Categoria</th>
            <th>Insumo / Descrição</th>
            <th>Unidade</th>
            <th style="text-align: right;">Saldo Atual</th>
            <th style="text-align: right;">Estoque Mínimo</th>
            <th>Indicador de Estoque</th>
            ${isGestor ? '<th style="text-align: right;">Ações</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  filtered.forEach(item => {
    const isCritical = item.alerta_minimo;
    const alertHtml = isCritical
      ? `<span class="stock-critical"><span class="stock-critical-dot"></span>Estoque Mínimo (≤ ${item.estoque_minimo})</span>`
      : `<span class="badge-status badge-entregue">Estoque Normal</span>`;

    const saldoStyle = isCritical ? 'color: var(--status-rejected); font-weight: 800;' : 'font-weight: 600;';

    let acoesHtml = '';
    if (isGestor) {
      acoesHtml = `
        <td style="text-align: right;">
          <button onclick="openModalEditItem(${item.id})" class="btn btn-sm btn-secondary" title="Editar Item">
            <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            <span>Editar</span>
          </button>
        </td>
      `;
    }

    html += `
      <tr>
        <td class="font-num">#${item.id}</td>
        <td><span class="badge-status badge-aprovada" style="background-color: var(--color-surface-subtle); color: var(--color-primary);">${item.categoria}</span></td>
        <td><strong>${item.nome}</strong></td>
        <td>${item.unidade}</td>
        <td class="font-num text-right" style="${saldoStyle}">${item.saldo}</td>
        <td class="font-num text-right">${item.estoque_minimo}</td>
        <td>${alertHtml}</td>
        ${acoesHtml}
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function openModalNovoItem() {
  document.getElementById('modal-item-title').textContent = 'Cadastrar Novo Insumo';
  document.getElementById('item-id').value = '';
  document.getElementById('item-nome').value = '';
  document.getElementById('item-categoria').value = 'Papel';
  document.getElementById('item-unidade').value = 'resma';
  document.getElementById('item-minimo').value = '5';
  document.getElementById('group-ativo').style.display = 'none';
  document.getElementById('modal-item-alert').style.display = 'none';

  document.getElementById('modal-item').classList.add('active');
}

function openModalEditItem(itemId) {
  const item = allStockItems.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('modal-item-title').textContent = 'Editar Insumo #' + itemId;
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-nome').value = item.nome;
  document.getElementById('item-categoria').value = item.categoria;
  document.getElementById('item-unidade').value = item.unidade;
  document.getElementById('item-minimo').value = item.estoque_minimo;
  document.getElementById('group-ativo').style.display = 'block';
  document.getElementById('item-ativo').checked = true; // Na view vw_estoque só temos ativos
  document.getElementById('modal-item-alert').style.display = 'none';

  document.getElementById('modal-item').classList.add('active');
}

function closeModalItem() {
  document.getElementById('modal-item').classList.remove('active');
}

async function handleSaveItem(event) {
  event.preventDefault();

  const alertBox = document.getElementById('modal-item-alert');
  const btnSave = document.getElementById('btn-save-item');

  alertBox.style.display = 'none';

  const itemId = document.getElementById('item-id').value;
  const nome = document.getElementById('item-nome').value.trim();
  const categoria = document.getElementById('item-categoria').value;
  const unidade = document.getElementById('item-unidade').value.trim();
  const estoqueMinimo = parseInt(document.getElementById('item-minimo').value, 10);
  const ativo = document.getElementById('item-ativo').checked;

  if (!nome || !unidade) {
    alertBox.textContent = "Preencha todos os campos obrigatórios.";
    alertBox.style.display = 'flex';
    return;
  }

  btnSave.disabled = true;

  try {
    if (itemId) {
      // Edição
      const { error } = await window.supabaseClient
        .from('itens')
        .update({
          nome: nome,
          categoria: categoria,
          unidade: unidade,
          estoque_minimo: estoqueMinimo,
          ativo: ativo
        })
        .eq('id', itemId);

      if (error) throw error;
      alert("Insumo atualizado com sucesso!");
    } else {
      // Cadastro Novo
      const { error } = await window.supabaseClient
        .from('itens')
        .insert([{
          nome: nome,
          categoria: categoria,
          unidade: unidade,
          estoque_minimo: estoqueMinimo,
          ativo: true
        }]);

      if (error) throw error;
      alert("Insumo cadastrado com sucesso!");
    }

    closeModalItem();
    loadEstoqueData();

  } catch (err) {
    console.error("Erro ao salvar insumo:", err);
    alertBox.textContent = err.message || "Erro ao salvar insumo no catálogo.";
    alertBox.style.display = 'flex';
  } finally {
    btnSave.disabled = false;
  }
}
