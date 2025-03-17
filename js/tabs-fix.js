// Este script se encarga únicamente de la navegación entre pestañas
// Se ejecuta después de todo lo demás para asegurar que funcione correctamente

(function() {
    // Esperar a que el DOM esté completamente cargado y todos los otros scripts ejecutados
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initTabSystem, 500); // Esperar 500ms para asegurar que todo esté cargado
    });
    
    // También intentar inicializar después de que la ventana esté completamente cargada
    window.addEventListener('load', initTabSystem);
    
    // Inicializar nuevamente después de 2 segundos para estar absolutamente seguros
    setTimeout(initTabSystem, 2000);
    
    function initTabSystem() {
        console.log('⭐ Inicializando sistema de pestañas independiente ⭐');
        
        // Seleccionar todos los botones de pestañas
        const tabButtons = document.querySelectorAll('.tab-button');
        // Seleccionar todos los contenidos de pestañas
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Eliminar todos los onclick existentes
        tabButtons.forEach(button => {
            // Eliminar atributo onclick
            button.removeAttribute('onclick');
            
            // Clonar el botón para eliminar todos los event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Volver a seleccionar los botones clonados
        const newTabButtons = document.querySelectorAll('.tab-button');
        
        // Añadir nuevos event listeners a cada botón
        newTabButtons.forEach((button, index) => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Detener la propagación del evento
                
                console.log('🔥 Clic en pestaña:', index);
                
                // Desactivar todos los botones
                newTabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Ocultar todos los contenidos
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activar este botón
                button.classList.add('active');
                
                // Activar el contenido correspondiente
                if (tabContents[index]) {
                    tabContents[index].classList.add('active');
                    
                    // Disparar un evento de cambio de pestaña para otros módulos
                    const tabIdsMap = [
                        'tab-home', 'tab-nuevo', 'tab-ranking', 'tab-historial', 'tab-participantes'
                    ];
                    
                    const tabId = tabIdsMap[index];
                    if (tabId) {
                        console.log('🔔 Cambiando a pestaña:', tabId);
                        document.dispatchEvent(new CustomEvent('tabChanged', { 
                            detail: { tabId: tabId } 
                        }));
                        
                        // Cargar el historial si es la pestaña correspondiente
                        if (tabId === 'tab-historial' && typeof cargarHistorialDirecto === 'function') {
                            setTimeout(cargarHistorialDirecto, 100);
                        }
                    }
                }
                
                return false;
            });
        });
        
        // También configurar los enlaces del dashboard para que funcionen
        configurarEnlacesDashboard();
        
        console.log('✅ Sistema de pestañas inicializado con éxito');
    }
    
    function configurarEnlacesDashboard() {
        // Enlaces a historial
        document.querySelectorAll('a[onclick*="openTab(\'tab-historial\'"]').forEach(link => {
            link.removeAttribute('onclick');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                activarPestanaId('tab-historial');
                return false;
            });
        });
        
        // Enlaces a ranking
        document.querySelectorAll('a[onclick*="openTab(\'tab-ranking\'"]').forEach(link => {
            link.removeAttribute('onclick');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                activarPestanaId('tab-ranking');
                return false;
            });
        });
    }
    
    function activarPestanaId(tabId) {
        const tabIdsMap = {
            'tab-home': 0, 
            'tab-nuevo': 1, 
            'tab-ranking': 2, 
            'tab-historial': 3, 
            'tab-participantes': 4
        };
        
        const index = tabIdsMap[tabId];
        if (index !== undefined) {
            const tabButtons = document.querySelectorAll('.tab-button');
            if (tabButtons[index]) {
                // Simular un clic en el botón
                tabButtons[index].click();
            }
        }
    }
    
    // Exportar función global para compatibilidad con el código existente
    window.openTab = function(tabId) {
        console.log('⚠️ Llamada a openTab() redirigida a nuevo sistema:', tabId);
        activarPestanaId(tabId);
    };
})();
