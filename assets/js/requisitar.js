/* ==========================================================================
   SRCI — Requisitar Insumos Logic
   ========================================================================== */

let currentUserProfile = null;
let catalogItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth();
  if (!currentUserProfile) return;

  // Preenche o setor destino com o setor do usuário por padrão
  if (currentUserProfile.setor) {
    document.getElementById('input-setor').value = currentUserProfile.setor;
  }

  loadCatalogItems();
});

async function loadCatalogItems() {
  const select = document.getElementById('select-item');
  select.innerHTML = `<option value="">Carregando catálogo...</option>`;

  try {
    // Consulta itens ativos e junta com seus saldos usando vw_estoque
    const { data, error } = await window.supabaseClient
      .from('vw_estoque')
      .select('*')
      .order('nome');

    if (error) throw error;

    catalogItems = data || [];

    if (catalogItems.length === 0) {
      select.innerHTML = `<option value="">Nenhum item ativo disponível no catálogo</option>`;
      return;
    }

    let options = `<option value="">-- Selecione o insumo corporativo --</option>`;
    catalogItems.forEach(item => {
      options += `<option value="${item.id}">[${item.categoria}] ${item.nome} (Saldo: ${item.saldo} ${item.unidade})</option>`;
    });

    select.innerHTML = options;

  } catch (err) {
    console.error("Erro ao carregar catálogo:", err);
    select.innerHTML = `<option value="">Erro ao carregar catálogo de itens</option>`;
  }
}

async function onItemChange() {
  const itemId = document.getElementById('select-item').value;
  const infoEl = document.getElementById('item-saldo-info');
  const duplicityBox = document.getElementById('duplicity-warning');

  infoEl.textContent = '';
  duplicityBox.style.display = 'none';

  if (!itemId) return;

  const selected = catalogItems.find(i => String(i.id) === String(itemId));
  if (selected) {
    infoEl.textContent = `Disponível em estoque: ${selected.saldo} ${selected.unidade}`;
  }

  // Verificação de anti-duplicidade em tempo real no frontend (RF-11)
  try {
    const { data: ativas, error } = await window.supabaseClient
      .from('requisicoes')
      .select('id, status')
      .eq('solicitante_id', currentUserProfile.id)
      .eq('item_id', itemId)
      .in('status', ['pendente', 'aprovada']);

    if (!error && ativas && ativas.length > 0) {
      duplicityBox.style.display = 'flex';
    }
  } catch (err) {
    console.error("Erro ao verificar duplicidade:", err);
  }
}

async function handleRequisicaoSubmit(event) {
  event.preventDefault();

  const alertBox = document.getElementById('form-alert');
  const successBox = document.getElementById('form-success');
  const btnSubmit = document.getElementById('btn-submit-req');

  alertBox.style.display = 'none';
  successBox.style.display = 'none';

  const itemId = parseInt(document.getElementById('select-item').value, 10);
  const quantidade = parseInt(document.getElementById('input-quantidade').value, 10);
  const setorDestino = document.getElementById('input-setor').value.trim();
  const justificativa = document.getElementById('input-justificativa').value.trim();

  if (!itemId) {
    alertBox.textContent = "Por favor, selecione um item da lista.";
    alertBox.style.display = 'flex';
    return;
  }

  if (quantidade <= 0) {
    alertBox.textContent = "A quantidade deve ser maior que zero.";
    alertBox.style.display = 'flex';
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Processando...`;

  try {
    // Regra obrigatória: Criar requisição exclusivamente via RPC atômica criar_requisicao
    const { data, error } = await window.supabaseClient.rpc('criar_requisicao', {
      p_item_id: itemId,
      p_quantidade: quantidade,
      p_justificativa: justificativa,
      p_setor_destino: setorDestino
    });

    if (error) {
      throw error;
    }

    successBox.innerHTML = `<span>Requisição criada com sucesso! Código do pedido: <strong>#${data}</strong></span>`;
    successBox.style.display = 'flex';

    document.getElementById('form-requisicao').reset();
    document.getElementById('item-saldo-info').textContent = '';
    document.getElementById('duplicity-warning').style.display = 'none';

    setTimeout(() => {
      window.location.href = 'minhas-requisicoes.html';
    }, 1200);

  } catch (err) {
    console.error("Erro na RPC criar_requisicao:", err);
    alertBox.textContent = err.message || "Erro ao criar requisição de insumo.";
    alertBox.style.display = 'flex';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span class="material-symbols-outlined">send</span> <span>Enviar Requisição</span>`;
  }
}
