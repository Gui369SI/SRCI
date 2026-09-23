/* ==========================================================================
   SRCI — Relatórios & Auditoria Logic
   ========================================================================== */

let currentUserProfile = null;
let currentMovimentacoesData = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth(['almoxarife', 'admin']);
  if (!currentUserProfile) return;

  loadMovimentacoesAuditoria();
  loadConsumoPorColaborador();
});

// 1. Carrega extrato de movimentações (auditoria)
async function loadMovimentacoesAuditoria() {
  const container = document.getElementById('movimentacoes-container');
  const inicioVal = document.getElementById('filter-data-inicio').value;
  const fimVal = document.getElementById('filter-data-fim').value;
  const tipoVal = document.getElementById('filter-tipo-mov').value;

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Carregando extrato de auditoria...</p>
    </div>
  `;

  try {
    let query = window.supabaseClient
      .from('movimentacoes')
      .select('*, itens(nome, categoria, unidade), perfis:usuario_id(nome, setor)')
      .order('created_at', { ascending: false });

    if (tipoVal !== 'todos') {
      query = query.eq('tipo', tipoVal);
    }

    if (inicioVal) {
      query = query.gte('created_at', `${inicioVal}T00:00:00`);
    }

    if (fimVal) {
      query = query.lte('created_at', `${fimVal}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw error;

    currentMovimentacoesData = data || [];
    document.getElementById('movs-count-badge').textContent = `${currentMovimentacoesData.length} registros`;

    if (currentMovimentacoesData.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">description</span>
          <p>Nenhuma movimentação registrada no período selecionado.</p>
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
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Item / Insumo</th>
              <th>Quantidade</th>
              <th>Responsável / Operador</th>
              <th>Setor Operativo</th>
              <th>Req. Origem</th>
            </tr>
          </thead>
          <tbody>
    `;

    currentMovimentacoesData.forEach(m => {
      const dataFmt = new Date(m.created_at).toLocaleString('pt-BR');
      const itemNome = m.itens ? `${m.itens.nome} (${m.itens.unidade})` : 'Item #' + m.item_id;
      const userNome = m.perfis ? m.perfis.nome : 'User #' + m.usuario_id;
      const userSetor = m.perfis ? m.perfis.setor : '-';

      const isEntrada = m.tipo === 'entrada';
      const badgeTipo = isEntrada
        ? `<span class="badge-status badge-entregue">+ ENTRADA</span>`
        : `<span class="badge-status badge-rejeitada">- SAÍDA</span>`;

      const reqOrigem = m.requisicao_id ? `#${m.requisicao_id}` : 'N/A (Compra)';

      html += `
        <tr>
          <td class="font-num">#${m.id}</td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td>${badgeTipo}</td>
          <td><strong>${itemNome}</strong></td>
          <td class="font-num text-center" style="font-weight: 700;">${m.quantidade}</td>
          <td>${userNome}</td>
          <td>${userSetor}</td>
          <td class="font-num">${reqOrigem}</td>
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
    console.error("Erro ao carregar movimentações:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar auditoria: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

// 2. Relatório de consumo consolidado por colaborador / setor
async function loadConsumoPorColaborador() {
  const container = document.getElementById('consumo-container');

  try {
    const { data, error } = await window.supabaseClient
      .from('requisicoes')
      .select('*, itens(nome, unidade), perfis:solicitante_id(nome, setor)')
      .eq('status', 'entregue');

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">analytics</span>
          <p>Nenhum consumo entregue registrado até o momento.</p>
        </div>
      `;
      return;
    }

    // Agrupa saídas/entregas por colaborador
    const consolidado = {};

    data.forEach(r => {
      const colabNome = r.perfis ? r.perfis.nome : 'Usuário #' + r.solicitante_id;
      const setor = r.setor_destino || (r.perfis ? r.perfis.setor : 'Geral');
      const itemNome = r.itens ? `${r.itens.nome}` : 'Item #' + r.item_id;

      const key = `${colabNome}||${setor}||${itemNome}`;

      if (!consolidado[key]) {
        consolidado[key] = {
          colaborador: colabNome,
          setor: setor,
          item: itemNome,
          totalQuantidade: 0,
          pedidosContagem: 0
        };
      }

      consolidado[key].totalQuantidade += r.quantidade;
      consolidado[key].pedidosContagem += 1;
    });

    const listaConsumo = Object.values(consolidado).sort((a, b) => b.totalQuantidade - a.totalQuantidade);

    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Colaborador Solicitante</th>
              <th>Setor</th>
              <th>Item / Insumo Retirado</th>
              <th style="text-align: right;">Total Entregue</th>
              <th style="text-align: right;">Qtd de Pedidos</th>
            </tr>
          </thead>
          <tbody>
    `;

    listaConsumo.forEach(c => {
      html += `
        <tr>
          <td><strong>${c.colaborador}</strong></td>
          <td><span class="badge-status badge-aprovada" style="background-color: var(--color-surface-subtle); color: var(--color-primary);">${c.setor}</span></td>
          <td>${c.item}</td>
          <td class="font-num text-right" style="color: var(--color-primary); font-weight: 700;">${c.totalQuantidade}</td>
          <td class="font-num text-right">${c.pedidosContagem}</td>
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
    console.error("Erro ao gerar relatório de consumo:", err);
  }
}

// 3. Exportação em CSV
function exportMovimentacoesCSV() {
  if (!currentMovimentacoesData || currentMovimentacoesData.length === 0) {
    alert("Nenhum dado disponível para exportar.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ID;DataHora;Tipo;Item;Quantidade;Usuario;Setor;RequisicaoOrigem\n";

  currentMovimentacoesData.forEach(m => {
    const dataFmt = new Date(m.created_at).toLocaleString('pt-BR');
    const itemNome = m.itens ? m.itens.nome : 'Item #' + m.item_id;
    const userNome = m.perfis ? m.perfis.nome : 'User #' + m.usuario_id;
    const userSetor = m.perfis ? m.perfis.setor : '-';
    const reqOrigem = m.requisicao_id ? m.requisicao_id : 'N/A';

    csvContent += `"${m.id}";"${dataFmt}";"${m.tipo}";"${itemNome}";"${m.quantidade}";"${userNome}";"${userSetor}";"${reqOrigem}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `relatorio_movimentacoes_srci_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
