// =============================================
// MIS PEDIDOS - SWAY
// =============================================

console.log('Cargando mis-pedidos.js...');

class MisPedidos {
    constructor() {
        this.usuario = null;
        this.pedidos = [];
        this.init();
    }

    async init() {
        try {
            // Verificar inmediatamente si hay logout manual
            const manualLogout = localStorage.getItem('manual-logout');
            if (manualLogout === 'true') {
                // Limpiar cualquier dato de sesión residual
                localStorage.removeItem('usuario-sway');
                localStorage.removeItem('carrito-sway');
                sessionStorage.removeItem('usuario-sway');
                sessionStorage.removeItem('carrito-sway');
                this.usuario = null;
            }
            
            // Verificar si el usuario está logueado mediante el servidor
            await this.verificarUsuario();
            
            if (!this.usuario) {
                // Mostrar mensaje de error y ocultar secciones principales
                this.mostrarSeccionError();
                this.mostrarError('Debes iniciar sesión para ver tus pedidos');
                setTimeout(() => {
                    window.location.href = '/tienda';
                }, 3000);
                return;
            }

            // Inicializar eventos
            this.initEventListeners();
            
            // Cargar información del usuario
            this.cargarInfoUsuario();
            
            // Cargar pedidos
            await this.cargarPedidos();
            
        } catch (error) {
            console.error('Error inicializando página de pedidos:', error);
            this.mostrarError('Error al cargar la página. Por favor, recarga la página.');
        }
    }

    async verificarUsuario() {
        try {
            // Verificar si el usuario cerró sesión manualmente
            const manualLogout = localStorage.getItem('manual-logout');
            if (manualLogout === 'true') {
                // No verificar el servidor, mantener sesión cerrada
                this.usuario = null;
                this.updateUserDropdown(false);
                return;
            }
            
            const response = await fetch('/api/user/status');
            const data = await response.json();
            
            // Verificar nuevamente el flag de logout manual antes de establecer el usuario
            // (por si se estableció mientras se hacía la consulta al servidor)
            const manualLogoutCheck = localStorage.getItem('manual-logout');
            if (manualLogoutCheck === 'true') {
                this.usuario = null;
                this.updateUserDropdown(false);
                return;
            }
            
            if (data.success && data.user) {
                this.usuario = data.user;
                this.updateUserDropdown(true);
            } else {
                this.usuario = null;
                this.updateUserDropdown(false);
            }
        } catch (error) {
            console.error('Error al verificar estado del usuario:', error);
            this.usuario = null;
        }
    }

    initEventListeners() {
        // Eventos para el menú de usuario
        const btnUser = document.getElementById('btn-user');
        const userDropdown = document.getElementById('user-dropdown');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnLogout = document.getElementById('btn-logout');
        const btnMyOrders = document.getElementById('btn-my-orders');

        if (btnUser) {
            btnUser.addEventListener('click', () => {
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            });
        }

        if (btnLogin) {
            btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/tienda';
            });
        }

        if (btnRegister) {
            btnRegister.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/tienda';
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        if (btnMyOrders) {
            btnMyOrders.addEventListener('click', (e) => {
                e.preventDefault();
                // Ya estamos en la página de pedidos
            });
        }

        // Cerrar dropdown si se hace clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
        });
    }

    cargarInfoUsuario() {
        const userDetails = document.getElementById('user-details');
        const userName = document.getElementById('user-name');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnMyOrders = document.getElementById('btn-my-orders');
        const btnLogout = document.getElementById('btn-logout');

        if (this.usuario) {
            // Mostrar información del usuario
            userDetails.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nombre:</strong> ${this.usuario.nombre}</p>
                        <p><strong>Email:</strong> ${this.usuario.email}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Teléfono:</strong> ${this.usuario.telefono || 'No registrado'}</p>
                        <p><strong>Miembro desde:</strong> ${this.formatearFechaSolo(this.usuario.fecha_registro)}</p>
                    </div>
                </div>
            `;

            // Actualizar interfaz de usuario
            userName.textContent = this.usuario.nombre;
            btnLogin.style.display = 'none';
            btnRegister.style.display = 'none';
            btnMyOrders.style.display = 'block';
            btnLogout.style.display = 'block';
        }
    }

    async cargarPedidos() {
        const ordersLoading = document.getElementById('orders-loading');
        const ordersContainer = document.getElementById('orders-container');
        const noOrders = document.getElementById('no-orders');

        try {
            // Usar el endpoint más seguro que obtiene los pedidos del usuario autenticado
            const response = await fetch('/api/pedidos/mis-pedidos');
            const data = await response.json();

            ordersLoading.style.display = 'none';

            if (data.pedidos && data.pedidos.length > 0) {
                this.pedidos = data.pedidos;
                this.mostrarPedidos();
                ordersContainer.style.display = 'block';
            } else {
                noOrders.style.display = 'block';
            }

        } catch (error) {
            console.error('Error cargando pedidos:', error);
            ordersLoading.style.display = 'none';
            this.mostrarError('Error al cargar los pedidos');
        }
    }

    mostrarPedidos() {
        const ordersContainer = document.getElementById('orders-container');
        
        let pedidosHTML = '';
        
        this.pedidos.forEach(pedido => {
            const fecha = this.formatearFecha(pedido.fecha_pedido);
            const estatusClass = this.getEstatusClass(pedido.estatus);
            
            pedidosHTML += `
                <div class="order-card mb-3">
                    <div class="order-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5>Pedido #${pedido.id}</h5>
                            <p class="mb-0 text-muted">${fecha}</p>
                        </div>
                        <div class="text-end">
                            <span class="badge ${estatusClass}">${pedido.estatus}</span>
                            <div class="order-total">
                                <strong>$${pedido.total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="order-actions mt-3">
                        <button class="btn btn-outline-primary btn-sm" onclick="misPedidos.verDetallesPedido(${pedido.id})">
                            <i class="bi bi-eye"></i> Ver Detalles
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="misPedidos.reordenar(${pedido.id})">
                            <i class="bi bi-arrow-repeat"></i> Reordenar
                        </button>
                    </div>
                </div>
            `;
        });

        ordersContainer.innerHTML = pedidosHTML;
    }

    async verDetallesPedido(pedidoId) {
        try {
            const response = await fetch(`/api/pedidos/detalle/${pedidoId}`);
            const data = await response.json();

            if (data.pedido) {
                this.mostrarModalDetalles(data.pedido);
            } else {
                this.mostrarError('No se pudieron cargar los detalles del pedido');
            }
        } catch (error) {
            console.error('Error cargando detalles del pedido:', error);
            this.mostrarError('Error al cargar los detalles del pedido');
        }
    }

    mostrarModalDetalles(pedido) {
        // Crear modal personalizado completamente sin Bootstrap
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay-custom';
        modalOverlay.id = 'modal-overlay-custom';
        
        modalOverlay.innerHTML = `
            <div class="modal-custom">
                <div class="modal-header-custom">
                    <h2>Detalles del Pedido #${pedido.id}</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-overlay-custom').remove()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="modal-body-custom">
                    <div class="info-cards-row">
                        <div class="info-card-custom">
                            <div class="info-label-custom">Fecha</div>
                            <div class="info-value-custom">${this.formatearFecha(pedido.fecha_pedido)}</div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Estatus</div>
                            <div class="info-value-custom">
                                <span class="status-badge ${this.getEstatusClass(pedido.estatus)}">${pedido.estatus}</span>
                            </div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Total</div>
                            <div class="info-value-custom">
                                <span class="total-amount-custom">$${pedido.total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Teléfono</div>
                            <div class="info-value-custom">${pedido.telefono_contacto || 'No especificado'}</div>
                        </div>
                    </div>
                    
                    <div class="content-row">
                        <div class="products-section-custom">
                            <h3>Productos del Pedido</h3>
                            <div class="products-table-custom">
                                <div class="table-header-custom">
                                    <div class="th-custom">Producto</div>
                                    <div class="th-custom">Cantidad</div>
                                    <div class="th-custom">Precio Unit.</div>
                                    <div class="th-custom">Subtotal</div>
                                </div>
                                <div class="table-body-custom">
                                    ${pedido.detalles ? pedido.detalles.map(detalle => `
                                        <div class="table-row-custom">
                                            <div class="td-custom product-name">${detalle.producto_nombre}</div>
                                            <div class="td-custom">
                                                <span class="quantity-badge">${detalle.cantidad}</span>
                                            </div>
                                            <div class="td-custom">$${detalle.precio_unitario.toFixed(2)}</div>
                                            <div class="td-custom subtotal-cell">$${detalle.subtotal.toFixed(2)}</div>
                                        </div>
                                    `).join('') : '<div class="no-products">No se encontraron productos</div>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="sidebar-custom">
                            ${pedido.direccion ? `
                                <div class="address-section-custom">
                                    <h3>Dirección de Entrega</h3>
                                    <div class="address-card-custom">
                                        <i class="bi bi-geo-alt-fill"></i>
                                        <span>${pedido.direccion}</span>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="actions-section-custom">
                                <h3>Acciones</h3>
                                <div class="action-buttons-custom">
                                    <button class="btn-custom btn-primary-custom" onclick="misPedidos.reordenar(${pedido.id})">
                                        <i class="bi bi-arrow-repeat"></i>
                                        Reordenar
                                    </button>
                                    <button class="btn-custom btn-secondary-custom" onclick="window.print()">
                                        <i class="bi bi-printer"></i>
                                        Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Cerrar modal al hacer clic en el overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('modal-overlay-custom')) {
                document.getElementById('modal-overlay-custom').remove();
            }
        });
    }

    async reordenar(pedidoId) {
        try {
            const response = await fetch(`/api/pedidos/reordenar/${pedidoId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                this.mostrarNotificacion('Productos agregados al carrito', 'success');
                // Redirigir a la tienda
                setTimeout(() => {
                    window.location.href = '/tienda';
                }, 1500);
            } else {
                this.mostrarError(data.error || 'Error al reordenar');
            }
        } catch (error) {
            console.error('Error al reordenar:', error);
            this.mostrarError('Error al reordenar el pedido');
        }
    }

    async logout() {
        try {
            // Cerrar sesión en el servidor
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            // Limpiar almacenamiento local
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Marcar logout manual para evitar auto-login
            localStorage.setItem('manual-logout', 'true');
            localStorage.setItem('logout-flag', Date.now().toString());
            
            // Disparar evento personalizado para notificar a otras páginas
            window.dispatchEvent(new CustomEvent('sway-logout', {
                detail: { timestamp: Date.now() }
            }));
            
            this.mostrarNotificacion('Sesión cerrada exitosamente', 'success');
            
            // Redirigir a la tienda sin parámetros
            setTimeout(() => {
                window.location.href = '/tienda';
            }, 1000);
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Aunque haya error, limpiar el almacenamiento local
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Marcar logout manual
            localStorage.setItem('manual-logout', 'true');
            localStorage.setItem('logout-flag', Date.now().toString());
            
            // Disparar evento personalizado para notificar a otras páginas
            window.dispatchEvent(new CustomEvent('sway-logout', {
                detail: { timestamp: Date.now() }
            }));
            
            this.mostrarNotificacion('Sesión cerrada', 'info');
            setTimeout(() => {
                window.location.href = '/tienda';
            }, 1000);
        }
    }

    formatearFechaSolo(fechaString) {
        if (!fechaString) return 'Fecha no disponible';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatearFecha(fechaString) {
        if (!fechaString) return 'Fecha no disponible';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getEstatusClass(estatus) {
        const estatusMap = {
            'Pendiente': 'bg-warning',
            'Procesando': 'bg-info',
            'Pagado': 'bg-success',
            'Preparando': 'bg-primary',
            'Enviado': 'bg-secondary',
            'Entregado': 'bg-success',
            'Cancelado': 'bg-danger',
            'Reembolsado': 'bg-dark'
        };
        return estatusMap[estatus] || 'bg-secondary';
    }

    mostrarError(mensaje) {
        this.mostrarNotificacion(mensaje, 'error');
    }

    mostrarSeccionError() {
        const userInfoCard = document.getElementById('user-info-card');
        const ordersSection = document.getElementById('orders-section');
        const errorMessage = document.getElementById('error-message');
        
        if (userInfoCard) userInfoCard.style.display = 'none';
        if (ordersSection) ordersSection.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'block';
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        let icono = 'bi-info-circle-fill';
        if (tipo === 'error') icono = 'bi-exclamation-circle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        if (tipo === 'warning') icono = 'bi-exclamation-triangle-fill';
        
        toast.innerHTML = `
            <div class="toast-content ${tipo}">
                <i class="bi ${icono}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    updateUserDropdown(isLoggedIn) {
        const userName = document.getElementById('user-name');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnMyOrders = document.getElementById('btn-my-orders');
        const btnLogout = document.getElementById('btn-logout');
        
        if (isLoggedIn && this.usuario) {
            // Usuario logueado - mostrar nombre y opciones de usuario logueado
            if (userName) userName.textContent = this.usuario.nombre;
            if (btnLogin) {
                btnLogin.style.display = 'none';
                btnLogin.hidden = true;
            }
            if (btnRegister) {
                btnRegister.style.display = 'none';
                btnRegister.hidden = true;
            }
            if (btnMyOrders) {
                btnMyOrders.style.display = 'block';
                btnMyOrders.hidden = false;
            }
            if (btnLogout) {
                btnLogout.style.display = 'block';
                btnLogout.hidden = false;
            }
        } else {
            // Usuario no logueado - mostrar opciones de login/registro
            if (userName) userName.textContent = 'Iniciar Sesión';
            if (btnLogin) {
                btnLogin.style.display = 'block';
                btnLogin.hidden = false;
            }
            if (btnRegister) {
                btnRegister.style.display = 'block';
                btnRegister.hidden = false;
            }
            if (btnMyOrders) {
                btnMyOrders.style.display = 'none';
                btnMyOrders.hidden = true;
            }
            if (btnLogout) {
                btnLogout.style.display = 'none';
                btnLogout.hidden = true;
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.misPedidos = new MisPedidos();
});

// Listener para evento personalizado de logout desde otras páginas
window.addEventListener('sway-logout', function(e) {
    if (window.misPedidos) {
        window.misPedidos.usuario = null;
        window.misPedidos.updateUserDropdown(false);
        window.misPedidos.mostrarNotificacion('Sesión cerrada en otra pestaña', 'info');
        
        // Redirigir a la tienda después de un momento
        setTimeout(() => {
            window.location.href = '/tienda';
        }, 2000);
    }
});

// Listener para cambios en localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'manual-logout' && e.newValue === 'true') {
        if (window.misPedidos) {
            window.misPedidos.usuario = null;
            window.misPedidos.updateUserDropdown(false);
        }
    }
});
