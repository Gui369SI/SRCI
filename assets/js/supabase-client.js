/* ==========================================================================
   SRCI — Supabase Client Initialization
   ========================================================================== */

(function () {
  if (!window.SRCI_CONFIG || !window.SRCI_CONFIG.SUPABASE_URL || !window.SRCI_CONFIG.SUPABASE_ANON_KEY) {
    console.error("Configuração do Supabase não encontrada em window.SRCI_CONFIG.");
    return;
  }

  if (typeof supabase === 'undefined') {
    console.error("SDK do Supabase não carregado via CDN.");
    return;
  }

  // Inicializa a instância global do Supabase Client
  window.supabaseClient = supabase.createClient(
    window.SRCI_CONFIG.SUPABASE_URL,
    window.SRCI_CONFIG.SUPABASE_ANON_KEY
  );
})();
