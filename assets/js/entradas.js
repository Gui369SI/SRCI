/* ==========================================================================
   SRCI — Entradas de Compras & Baixa do Almoxarifado Logic
   ========================================================================== */

let currentUserProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth(['almoxarife', 'admin']);
  if (!currentUserProfile) return;

  loadAprovadasForDeliveryQueue();
  loadItemsForEntradasSelect();
  loadRecentEntradasHistory();
});

// 1. Carrega requisições aprovadas prontas para entrega
async function loadAprovadasForDeliveryQueue() {
  const container = document.getElementById('entregas-container');

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Carregando solicitações aprovadas...</p>
    </div>
  `;

  try {
    const { data, error } = await window.supabaseClient
      .from('requisicoes')
      .select('*, itens(nome, categoria, unidade), perfis:solicitante_id(nome, email, setor)')
      .eq('status', 'aprovada')
      .order('aprovado_em', { ascending: true });

    if (error) throw error;

    document.getElementById('aprovadas-count-badge').textContent = `${data ? data.length : 0} Aprovadas`;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">verified</span>
          <p>Nenhuma requisição aprovada pendente de entrega física no momento.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Solicitante</th>
              <th>Setor Destino</th>
              <th>Item Solicitado</th>
              <th>Qtd</th>
              <th>Aprovado Em</th>
              <th style="text-align: right;">Ação do Almoxarife</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(r => {
      const solicitanteNome = r.perfis ? r.perfis.nome : 'ID #' + r.solicitante_id;
      const itemNome = r.itens ? `${r.itens.nome} (${r.itens.unidade})` : 'Item #' + r.item_id;
      const dataFmt = r.aprovado_em ? new Date(r.aprovado_em).toLocaleString('pt-BR') : '-';

      html += `
        <tr>
          <td class="font-num">#${r.id}</td>
          <td><strong>${solicitanteNome}</strong></td>
          <td>${r.setor_destino}</td>
          <td>${itemNome}</td>
          <td class="font-num text-center">${r.quantidade}</td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td style="text-align: right;">
            <button onclick="handleEntregar(${r.id})" class="btn btn-sm btn-primary" title="Registrar Entrega e Baixa no Saldo">
              <span class="material-symbols-outlined" style="font-size: 16px;">local_shipping</span>
              <span>Confirmar Entrega &amp; Baixa</span>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

  } catch (err) {
    console.error("Erro ao carregar requisições para entrega:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar entregas pendentes: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

// 2. Confirma a entrega física chamando a RPC atômica entregar_requisicao (RF-17)
async function handleEntregar(reqId) {
  if (!confirm(`Confirma a entrega física do material referente à requisição #${reqId}? Esta ação dará baixa atômica no estoque.`)) {
    return;
  }

  try {
    // Chamada obrigatória via RPC entregar_requisicao
    const { error } = await window.supabaseClient.rpc('entregar_requisicao', {
      p_requisicao_id: reqId
    });

    if (error) throw error;

    alert(`Entrega física da requisição #${reqId} registrada e baixa efetuada no saldo com sucesso!`);
    loadAprovadasForDeliveryQueue();

  } catch (err) {
    console.error("Erro ao entregar requisição:", err);
    alert(err.message || "Erro ao registrar entrega e baixa no estoque.");
  }
}

// 3. Preenche select de itens ativos para o formulário de entrada
async function loadItemsForEntradasSelect() {
  const select = document.getElementById('select-entrada-item');

  try {
    const { data, error } = await window.supabaseClient
      .from('itens')
      .select('id, nome, categoria, unidade')
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;

    if (!data || data.length === 0) {
      select.innerHTML = `<option value="">Nenhum item cadastrado no catálogo</option>`;
      return;
    }

    let options = `<option value="">-- Selecione o item recebido --</option>`;
    data.forEach(i => {
      options += `<option value="${i.id}">[${i.categoria}] ${i.nome} (${i.unidade})</option>`;
    });

    select.innerHTML = options;

  } catch (err) {
    console.error("Erro ao carregar itens para entrada:", err);
    select.innerHTML = `<option value="">Erro ao carregar catálogo</option>`;
  }
}

// 4. Submete nova entrada de compra na tabela entradas (trigger no banco ajusta saldo + auditoria)
async function handleRegistrarEntradaSubmit(event) {
  event.preventDefault();

  const alertBox = document.getElementById('entrada-alert');
  const successBox = document.getElementById('entrada-success');
  const btnSubmit = document.getElementById('btn-submit-entrada');

  alertBox.style.display = 'none';
  successBox.style.display = 'none';

  const itemId = parseInt(document.getElementById('select-entrada-item').value, 10);
  const quantidade = parseInt(document.getElementById('input-entrada-quantidade').value, 10);
  const observacao = document.getElementById('input-entrada-obs').value.trim();

  if (!itemId) {
    alertBox.textContent = "Selecione o insumo recebido.";
    alertBox.style.display = 'flex';
    return;
  }

  if (quantidade <= 0) {
    alertBox.textContent = "A quantidade de entrada deve ser maior que zero.";
    alertBox.style.display = 'flex';
    return;
  }

  btnSubmit.disabled = true;

  try {
    const { error } = await window.supabaseClient
      .from('entradas')
      .insert([{
        item_id: itemId,
        quantidade: quantidade,
        observacao: observacao,
        responsavel_id: currentUserProfile.id
      }]);

    if (error) throw error;

    successBox.textContent = "Entrada de compra registrada com sucesso! Saldo e histórico atualizados.";
    successBox.style.display = 'flex';

    document.getElementById('form-entrada').reset();
    loadRecentEntradasHistory();

  } catch (err) {
    console.error("Erro ao registrar entrada:", err);
    alertBox.textContent = err.message || "Erro ao registrar entrada de compras.";
    alertBox.style.display = 'flex';
  } finally {
    btnSubmit.disabled = false;
  }
}

// 5. Histórico das últimas entradas
async function loadRecentEntradasHistory() {
  const container = document.getElementById('historico-entradas-container');

  try {
    const { data, error } = await window.supabaseClient
      .from('entradas')
      .select('*, itens(nome, unidade), perfis:responsavel_id(nome)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">inventory</span>
          <p>Nenhuma entrada de compra registrada ainda.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Item</th>
              <th>Qtd</th>
              <th>Resp.</th>
              <th>Obs/NF</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(e => {
      const itemNome = e.itens ? `${e.itens.nome}` : 'Item #' + e.item_id;
      const respNome = e.perfis ? e.perfis.nome : 'User #' + e.responsavel_id;
      const dataFmt = new Date(e.created_at).toLocaleDateString('pt-BR');

      html += `
        <tr>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td><strong>${itemNome}</strong></td>
          <td class="font-num text-center" style="color: var(--status-delivered); font-weight: 700;">+${e.quantidade}</td>
          <td style="font-size: 0.75rem;">${respNome}</td>
          <td style="font-size: 0.75rem; max-width: 150px;" title="${e.observacao || ''}">${e.observacao || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

  } catch (err) {
    console.error("Erro ao carregar histórico de entradas:", err);
  }
}
