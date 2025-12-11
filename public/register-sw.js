// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão disponível! Recarregue a página.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });
}

// Detectar quando o app está sendo instalado
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('App pode ser instalado');
  
  // Você pode mostrar um botão customizado de instalação aqui
  // Por exemplo: showInstallButton();
});

// Detectar quando o app foi instalado
window.addEventListener('appinstalled', () => {
  console.log('App instalado com sucesso!');
  deferredPrompt = null;
});
