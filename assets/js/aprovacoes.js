/* ==========================================================================
   SRCI — Fila de Aprovação Logic
   ========================================================================== */

let currentUserProfile = null;
let selectedReqIdForRejection = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth(['aprovador', 'almoxarife', 'admin']);
  if (!currentUserProfile) return;

  document.getElementById('setor-badge').textContent = `Setor: ${currentUserProfile.setor} (${currentUserProfile.perfil.toUpperCase()})`;

  loadAprovacoesQueue();
});

async function loadAprovacoesQueue() {
  const container = document.getElementById('aprovacoes-container');

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Buscando requisições pendentes de aprovação...</p>
    </div>
  `;

  try {
    let query = window.supabaseClient
      .from('requisicoes')
      .select('*, itens(nome, categoria, unidade), perfis:solicitante_id(nome, email)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true });

    // Aprovador só vê requisições do seu próprio setor
    if (currentUserProfile.perfil === 'aprovador') {
      query = query.eq('setor_destino', currentUserProfile.setor);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">check_circle</span>
          <p>Nenhuma requisição pendente na fila para este setor no momento.</p>
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
              <th>Solicitante</th>
              <th>Item / Insumo</th>
              <th>Qtd</th>
              <th>Setor Destino</th>
              <th>Justificativa</th>
              <th style="text-align: right;">Ações de Gestão</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(r => {
      const solicitanteNome = r.perfis ? r.perfis.nome : 'Solicitante #' + r.solicitante_id;
      const itemNome = r.itens ? `${r.itens.nome} (${r.itens.unidade})` : 'Item #' + r.item_id;
      const dataFmt = new Date(r.created_at).toLocaleString('pt-BR');

      html += `
        <tr>
          <td class="font-num">#${r.id}</td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td><strong>${solicitanteNome}</strong></td>
          <td>${itemNome}</td>
          <td class="font-num text-center">${r.quantidade}</td>
          <td>${r.setor_destino}</td>
          <td style="max-width: 220px; font-size: 0.8125rem;" title="${r.justificativa}">${r.justificativa}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button onclick="handleAprovar(${r.id})" class="btn btn-sm btn-primary" style="background-color: var(--status-delivered); border-color: var(--status-delivered);" title="Aprovar Pedido">
              <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
              <span>Aprovar</span>
            </button>
            <button onclick="openModalRejeitar(${r.id})" class="btn btn-sm btn-danger" title="Rejeitar Pedido">
              <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
              <span>Rejeitar</span>
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
    console.error("Erro ao carregar fila de aprovação:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar fila de aprovação: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

async function handleAprovar(reqId) {
  if (!confirm(`Confirma a APROVAÇÃO da requisição #${reqId}?`)) {
    return;
  }

  try {
    // Chamada obrigatória via RPC avaliar_requisicao
    const { error } = await window.supabaseClient.rpc('avaliar_requisicao', {
      p_requisicao_id: reqId,
      p_aprovar: true,
      p_motivo: null
    });

    if (error) throw error;

    alert(`Requisição #${reqId} APROVADA com sucesso! O pedido foi liberado para o Almoxarifado.`);
    loadAprovacoesQueue();

  } catch (err) {
    console.error("Erro ao aprovar requisição:", err);
    alert(err.message || "Erro ao aprovar requisição.");
  }
}

function openModalRejeitar(reqId) {
  selectedReqIdForRejection = reqId;
  document.getElementById('modal-req-id').textContent = `#${reqId}`;
  document.getElementById('motivo-rejeicao').value = '';
  document.getElementById('modal-alert').style.display = 'none';

  const modal = document.getElementById('modal-rejeitar');
  modal.classList.add('active');
}

function closeModalRejeitar() {
  selectedReqIdForRejection = null;
  const modal = document.getElementById('modal-rejeitar');
  modal.classList.remove('active');
}

async function confirmarRejeicao() {
  const motivo = document.getElementById('motivo-rejeicao').value.trim();
  const alertBox = document.getElementById('modal-alert');
  const btnConfirm = document.getElementById('btn-confirm-rejeitar');

  alertBox.style.display = 'none';

  if (!motivo) {
    alertBox.textContent = "O motivo da rejeição é obrigatório conforme regras de governança.";
    alertBox.style.display = 'flex';
    return;
  }

  btnConfirm.disabled = true;

  try {
    // Chamada obrigatória via RPC avaliar_requisicao
    const { error } = await window.supabaseClient.rpc('avaliar_requisicao', {
      p_requisicao_id: selectedReqIdForRejection,
      p_aprovar: false,
      p_motivo: motivo
    });

    if (error) throw error;

    closeModalRejeitar();
    alert(`Requisição #${selectedReqIdForRejection} REJEITADA com sucesso.`);
    loadAprovacoesQueue();

  } catch (err) {
    console.error("Erro ao rejeitar requisição:", err);
    alertBox.textContent = err.message || "Erro ao rejeitar requisição.";
    alertBox.style.display = 'flex';
  } finally {
    btnConfirm.disabled = false;
  }
}
