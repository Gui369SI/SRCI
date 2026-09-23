/* ==========================================================================
   SRCI — Dashboard Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await SRCI_AUTH.checkAuth();
  if (!profile) return;

  // Atualiza mensagem de saudação
  document.getElementById('user-greeting').textContent = `Olá, ${profile.nome}!`;
  document.getElementById('user-subtext').textContent = `Setor: ${profile.setor} | Perfil: ${profile.perfil.toUpperCase()}`;

  // Se o perfil for aprovador, admin ou almoxarife, exibe o KPI da fila de aprovação
  if (['aprovador', 'admin', 'almoxarife'].includes(profile.perfil)) {
    document.getElementById('kpi-box-aprovacao').style.display = 'flex';
  }

  loadDashboardData(profile);
});

async function loadDashboardData(profile) {
  try {
    // 1. Minhas requisições pendentes
    const { count: pendentesCount, error: errPendentes } = await window.supabaseClient
      .from('requisicoes')
      .select('*', { count: 'exact', head: true })
      .eq('solicitante_id', profile.id)
      .eq('status', 'pendente');

    if (!errPendentes && pendentesCount !== null) {
      document.getElementById('kpi-minhas-pendentes').textContent = pendentesCount;
    }

    // 2. Fila de aprovação do setor (se aprovador/admin/almoxarife)
    if (['aprovador', 'admin', 'almoxarife'].includes(profile.perfil)) {
      let queryFila = window.supabaseClient
        .from('requisicoes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (profile.perfil === 'aprovador') {
        queryFila = queryFila.eq('setor_destino', profile.setor);
      }

      const { count: filaCount, error: errFila } = await queryFila;
      if (!errFila && filaCount !== null) {
        document.getElementById('kpi-fila-setor').textContent = filaCount;
      }
    }

    // 3. Itens em alerta crítico de estoque (vw_estoque)
    const { data: estoqueData, error: errEstoque } = await window.supabaseClient
      .from('vw_estoque')
      .select('*');

    if (!errEstoque && estoqueData) {
      document.getElementById('kpi-total-itens').textContent = estoqueData.length;

      const criticos = estoqueData.filter(i => i.alerta_minimo);
      document.getElementById('kpi-estoque-critico').textContent = criticos.length;

      renderCriticalStockWidget(criticos);
    }

    // 4. Carregar últimas requisições do usuário
    const { data: ultimasReqs, error: errReqs } = await window.supabaseClient
      .from('requisicoes')
      .select('*, itens(nome, unidade)')
      .eq('solicitante_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!errReqs) {
      renderRecentRequisitionsWidget(ultimasReqs);
    }

  } catch (err) {
    console.error("Erro ao carregar dados do dashboard:", err);
  }
}

function renderRecentRequisitionsWidget(reqs) {
  const container = document.getElementById('recent-requisitions-container');
  if (!reqs || reqs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">inbox</span>
        <p>Você ainda não realizou nenhuma requisição.</p>
        <a href="requisitar.html" class="btn btn-primary btn-sm mt-2">Criar primeira requisição</a>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qtd</th>
            <th>Data</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  reqs.forEach(r => {
    const itemNome = r.itens ? r.itens.nome : 'Item #' + r.item_id;
    const dataFmt = new Date(r.created_at).toLocaleDateString('pt-BR');
    const badgeClass = `badge-${r.status}`;

    html += `
      <tr>
        <td><strong>${itemNome}</strong></td>
        <td class="font-num">${r.quantidade}</td>
        <td>${dataFmt}</td>
        <td><span class="badge-status ${badgeClass}">${r.status}</span></td>
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

function renderCriticalStockWidget(criticos) {
  const container = document.getElementById('critical-stock-container');
  if (!criticos || criticos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">check_circle</span>
        <p>Todos os insumos estão com saldo acima do estoque mínimo.</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Saldo Atual</th>
            <th>Estoque Mínimo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  criticos.forEach(c => {
    html += `
      <tr>
        <td><strong>${c.nome}</strong> (${c.categoria})</td>
        <td class="font-num text-right" style="color: var(--status-rejected); font-weight: 700;">${c.saldo} ${c.unidade}</td>
        <td class="font-num text-right">${c.estoque_minimo} ${c.unidade}</td>
        <td>
          <span class="stock-critical">
            <span class="stock-critical-dot"></span>
            Crítico
          </span>
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
}
