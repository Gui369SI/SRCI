/* ==========================================================================
   SRCI — Minhas Requisições Logic
   ========================================================================== */

let currentUserProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth();
  if (!currentUserProfile) return;

  loadMinhasRequisicoes();
});

async function loadMinhasRequisicoes() {
  const container = document.getElementById('minhas-reqs-container');
  const filterStatus = document.getElementById('filter-status').value;

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Carregando histórico...</p>
    </div>
  `;

  try {
    let query = window.supabaseClient
      .from('requisicoes')
      .select('*, itens(nome, categoria, unidade)')
      .eq('solicitante_id', currentUserProfile.id)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'todos') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">inbox</span>
          <p>Nenhuma requisição encontrada com os filtros selecionados.</p>
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
              <th>Data</th>
              <th>Item / Insumo</th>
              <th>Qtd</th>
              <th>Setor Destino</th>
              <th>Justificativa</th>
              <th>Status</th>
              <th>Observação / Rejeição</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(r => {
      const itemNome = r.itens ? `${r.itens.nome} (${r.itens.unidade})` : 'Item #' + r.item_id;
      const dataFmt = new Date(r.created_at).toLocaleString('pt-BR');
      const badgeClass = `badge-${r.status}`;
      const motivo = r.motivo_rejeicao ? `<span style="color: var(--status-rejected); font-size: 0.75rem;">${r.motivo_rejeicao}</span>` : '-';

      let acao = '-';
      if (r.status === 'pendente') {
        acao = `
          <button onclick="handleCancelarRequisicao(${r.id})" class="btn btn-sm btn-danger" title="Cancelar Pedido">
            <span class="material-symbols-outlined" style="font-size: 16px;">cancel</span>
            <span>Cancelar</span>
          </button>
        `;
      }

      html += `
        <tr>
          <td class="font-num">#${r.id}</td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td><strong>${itemNome}</strong></td>
          <td class="font-num text-center">${r.quantidade}</td>
          <td>${r.setor_destino}</td>
          <td style="max-width: 200px; font-size: 0.8125rem;" title="${r.justificativa}">${r.justificativa}</td>
          <td><span class="badge-status ${badgeClass}">${r.status}</span></td>
          <td>${motivo}</td>
          <td style="text-align: right;">${acao}</td>
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
    console.error("Erro ao carregar minhas requisições:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar requisições: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

async function handleCancelarRequisicao(reqId) {
  if (!confirm("Tem certeza que deseja cancelar esta requisição de insumo?")) {
    return;
  }

  try {
    // Chamada obrigatória via RPC cancelar_requisicao
    const { error } = await window.supabaseClient.rpc('cancelar_requisicao', {
      p_requisicao_id: reqId
    });

    if (error) throw error;

    alert("Requisição #" + reqId + " cancelada com sucesso!");
    loadMinhasRequisicoes();

  } catch (err) {
    console.error("Erro ao cancelar requisição:", err);
    alert(err.message || "Erro ao cancelar requisição.");
  }
}
