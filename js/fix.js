// Script minimalista para arreglar navegación sin romper otras funcionalidades
(function() {
    // Esperar a que todo esté cargado
    window.addEventListener('load', function() {
        // Reemplazar sólo la función openTab
        window.originalOpenTab = window.openTab;
        window.openTab = function(tabId) {
            console.log('Navegando a tab:', tabId);
            
            // Ocultar todas las pestañas
            document.querySelectorAll('.tab-content').forEach(function(tab) {
                tab.classList.remove('active');
            });
            
            // Desactivar todos los botones
            document.querySelectorAll('.tab-button').forEach(function(button) {
                button.classList.remove('active');
            });
            
            // Mostrar la pestaña seleccionada
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                tabElement.classList.add('active');
                
                // Activar el botón correspondiente
                document.querySelectorAll('.tab-button').forEach(function(button) {
                    const onclick = button.getAttribute('onclick');
                    if (onclick && onclick.includes(tabId)) {
                        button.classList.add('active');
                    }
                });
                
                // Cargar historial específicamente cuando se abre esa pestaña
                if (tabId === 'tab-historial' && typeof cargarHistorialDirecto === 'function') {
                    setTimeout(cargarHistorialDirecto, 100);
                }
                
                // Disparar evento cambio de pestaña tal como lo espera el sistema
                const event = new CustomEvent('tabChanged', { detail: { tabId: tabId } });
                document.dispatchEvent(event);
            }
            
            return false;
        };
        
        // Aplicar interceptor de clics a todos los botones de pestaña
        document.querySelectorAll('.tab-button').forEach(function(button) {
            button.addEventListener('click', function(e) {
                // Extraer el ID de pestaña del atributo onclick original
                const match = this.getAttribute('onclick')?.match(/'([^']+)'/);
                if (match && match[1]) {
                    // Llamar a nuestra nueva versión de openTab
                    window.openTab(match[1]);
                    // Prevenir comportamiento por defecto
                    e.preventDefault();
                    return false;
                }
            });
        });
        
        console.log('Sistema de navegación arreglado sin alterar funcionalidades existentes');
    });
})();
