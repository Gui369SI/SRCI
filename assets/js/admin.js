/* ==========================================================================
   SRCI — Admin Gestão de Usuários Logic
   ========================================================================== */

let currentUserProfile = null;
let allUsersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUserProfile = await SRCI_AUTH.checkAuth(['admin']);
  if (!currentUserProfile) return;

  loadUsersList();
});

async function loadUsersList() {
  const container = document.getElementById('users-container');

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
      <p>Carregando lista de contas de usuários...</p>
    </div>
  `;

  try {
    const { data, error } = await window.supabaseClient
      .from('perfis')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;

    allUsersList = data || [];
    document.getElementById('users-count-badge').textContent = `${allUsersList.length} Usuários`;

    if (allUsersList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">group_off</span>
          <p>Nenhum perfil de usuário localizado na tabela perfis.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>E-mail Corporativo</th>
              <th>Setor</th>
              <th>Perfil de Acesso</th>
              <th>Cadastrado Em</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
    `;

    allUsersList.forEach(u => {
      const dataFmt = new Date(u.created_at).toLocaleDateString('pt-BR');

      let badgePerfil = `<span class="badge-status badge-pendente">Solicitante</span>`;
      if (u.perfil === 'aprovador') badgePerfil = `<span class="badge-status badge-aprovada">Aprovador</span>`;
      if (u.perfil === 'almoxarife') badgePerfil = `<span class="badge-status badge-entregue">Almoxarife</span>`;
      if (u.perfil === 'admin') badgePerfil = `<span class="badge-status" style="background-color: var(--color-primary); color: #ffffff;">Admin TI</span>`;

      html += `
        <tr>
          <td><strong>${u.nome}</strong></td>
          <td>${u.email}</td>
          <td>${u.setor}</td>
          <td>${badgePerfil}</td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${dataFmt}</td>
          <td style="text-align: right;">
            <button onclick="openModalEditUser('${u.id}')" class="btn btn-sm btn-secondary" title="Editar Perfil">
              <span class="material-symbols-outlined" style="font-size: 16px;">manage_accounts</span>
              <span>Editar</span>
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
    console.error("Erro ao carregar lista de usuários:", err);
    container.innerHTML = `
      <div class="alert-box alert-danger">
        <span>Erro ao carregar perfis de usuários: ${err.message || 'Falha de comunicação'}</span>
      </div>
    `;
  }
}

function openModalEditUser(userId) {
  const user = allUsersList.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-email').value = user.email;
  document.getElementById('edit-user-nome').value = user.nome;
  document.getElementById('edit-user-setor').value = user.setor;
  document.getElementById('edit-user-perfil').value = user.perfil;
  document.getElementById('modal-user-alert').style.display = 'none';

  document.getElementById('modal-user').classList.add('active');
}

function closeModalUser() {
  document.getElementById('modal-user').classList.remove('active');
}

async function handleSaveUser(event) {
  event.preventDefault();

  const alertBox = document.getElementById('modal-user-alert');
  const btnSave = document.getElementById('btn-save-user');

  alertBox.style.display = 'none';

  const userId = document.getElementById('edit-user-id').value;
  const nome = document.getElementById('edit-user-nome').value.trim();
  const setor = document.getElementById('edit-user-setor').value.trim();
  const perfil = document.getElementById('edit-user-perfil').value;

  if (!nome || !setor) {
    alertBox.textContent = "Preencha o nome e o setor.";
    alertBox.style.display = 'flex';
    return;
  }

  btnSave.disabled = true;

  try {
    const { error } = await window.supabaseClient
      .from('perfis')
      .update({
        nome: nome,
        setor: setor,
        perfil: perfil
      })
      .eq('id', userId);

    if (error) throw error;

    alert("Perfil de usuário atualizado com sucesso!");
    closeModalUser();
    loadUsersList();

  } catch (err) {
    console.error("Erro ao atualizar perfil do usuário:", err);
    alertBox.textContent = err.message || "Erro ao atualizar dados do usuário.";
    alertBox.style.display = 'flex';
  } finally {
    btnSave.disabled = false;
  }
}
