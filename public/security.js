// ==========================================
// SISTEMA ANTI-CLONE & SEGURANÇA
// ==========================================

(function() {
    // 1. Verificação de Domínio Restrita
    // Só permite rodar em localhost (para desenvolvimento) ou no domínio oficial
    const allowedDomains = ['localhost', '127.0.0.1', 'www.clientetodsdia.site', 'clientetodsdia.site'];
    const currentDomain = window.location.hostname;
    
    if (!allowedDomains.includes(currentDomain)) {
        // Se for um clone noutro domínio:
        // Apaga todo o conteúdo da página imediatamente
        document.documentElement.innerHTML = '<body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>Acesso Negado - Site Clonado</h1></body>';
        // Redireciona para o site oficial
        window.location.href = 'https://www.clientetodsdia.site';
        return; // Pára a execução
    }

    // 2. Bloqueio de Teclas de Atalho (Curiosos e Copiadores)
    document.addEventListener('keydown', function(e) {
        // F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (Ver código-fonte) / Ctrl+S (Guardar) / Ctrl+P (Imprimir) / Ctrl+A (Selecionar tudo)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P' || e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Bloqueio de Clique Direito (Menu de Contexto)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // 4. Detetor Ativo de DevTools (Armadilha)
    // Cria um loop infinito que pausa a página se a consola estiver aberta
    setInterval(function() {
        const t0 = performance.now();
        debugger; // Esta linha pára a execução se a DevTools estiver aberta
        const t1 = performance.now();
        if (t1 - t0 > 100) {
            // Se demorou muito a passar pelo debugger, é porque a consola está aberta
            document.body.innerHTML = '';
            window.location.href = 'https://www.clientetodsdia.site';
        }
    }, 1000);

})();
