/**
 * Archivo de validaciones JavaScript reutilizable para todos los formularios del proyecto SWAY
 * Implementa validaciones en tiempo real para mejorar la UX
 */

class ValidacionesSway {
    constructor() {
        this.patrones = {
            soloTexto: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/,
            soloNumeros: /^\d+$/,
            numerosDecimales: /^\d+(\.\d{1,2})?$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefono: /^[\+]?[\d\s\-\(\)]+$/,
            // Patrones para tarjetas
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            // Fecha MM/YY
            fechaVencimiento: /^(0[1-9]|1[0-2])\/\d{2}$/,
            // CVV
            cvv: /^\d{3,4}$/
        };

        this.mensajes = {
            soloTexto: 'Este campo solo debe contener letras y espacios',
            soloNumeros: 'Este campo solo debe contener números',
            numerosDecimales: 'Ingrese un número válido (ej: 123.45)',
            email: 'Ingrese un email válido',
            telefono: 'Ingrese un teléfono válido',
            fechaVencimiento: 'Formato válido: MM/YY',
            cvv: 'CVV debe tener 3 o 4 dígitos',
            tarjeta: 'Número de tarjeta inválido',
            fechaFutura: 'La fecha debe ser futura',
            fechaPasada: 'La fecha debe ser pasada',
            requerido: 'Este campo es obligatorio',
            passwordCorta: 'La contraseña debe tener al menos 6 caracteres'
        };

        this.init();
    }

    init() {
        // Agregar estilos CSS para los mensajes de error
        this.agregarEstilosCSS();
    }

    agregarEstilosCSS() {
        const estilos = `
            <style>
                .campo-error {
                    border: 2px solid #dc3545 !important;
                    box-shadow: 0 0 5px rgba(220, 53, 69, 0.3) !important;
                }
                
                .campo-valido {
                    border: 2px solid #28a745 !important;
                    box-shadow: 0 0 5px rgba(40, 167, 69, 0.3) !important;
                }
                
                .mensaje-error {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }
                
                .mensaje-exito {
                    color: #28a745;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }
            </style>
        `;
        
        if (!document.querySelector('#validaciones-css')) {
            const head = document.head || document.getElementsByTagName('head')[0];
            const style = document.createElement('div');
            style.id = 'validaciones-css';
            style.innerHTML = estilos;
            head.appendChild(style);
        }
    }

    // Función principal para validar un campo
    validarCampo(campo, tipoValidacion, opciones = {}) {
        const valor = campo.value.trim();
        const esRequerido = campo.hasAttribute('required') || opciones.requerido;
        
        // Remover clases y mensajes anteriores
        this.limpiarValidacion(campo);
        
        // Si está vacío y es requerido
        if (esRequerido && !valor) {
            this.mostrarError(campo, this.mensajes.requerido);
            return false;
        }
        
        // Si está vacío y no es requerido, es válido
        if (!valor && !esRequerido) {
            return true;
        }
        
        // Aplicar validación específica
        let esValido = false;
        let mensajeError = '';
        
        switch (tipoValidacion) {
            case 'soloTexto':
                esValido = this.patrones.soloTexto.test(valor);
                mensajeError = this.mensajes.soloTexto;
                break;
                
            case 'soloNumeros':
                esValido = this.patrones.soloNumeros.test(valor);
                mensajeError = this.mensajes.soloNumeros;
                break;
                
            case 'numerosDecimales':
                esValido = this.patrones.numerosDecimales.test(valor);
                mensajeError = this.mensajes.numerosDecimales;
                break;
                
            case 'email':
                esValido = this.patrones.email.test(valor);
                mensajeError = this.mensajes.email;
                break;
                
            case 'telefono':
                esValido = this.patrones.telefono.test(valor) && valor.length >= 10;
                mensajeError = this.mensajes.telefono;
                break;
                
            case 'tarjeta':
                esValido = this.validarTarjeta(valor);
                mensajeError = this.mensajes.tarjeta;
                break;
                
            case 'fechaVencimiento':
                esValido = this.validarFechaVencimiento(valor);
                mensajeError = this.mensajes.fechaVencimiento;
                break;
                
            case 'cvv':
                esValido = this.patrones.cvv.test(valor);
                mensajeError = this.mensajes.cvv;
                break;
                
            case 'fechaFutura':
                esValido = this.validarFechaFutura(valor);
                mensajeError = this.mensajes.fechaFutura;
                break;
                
            case 'fechaPasada':
                esValido = this.validarFechaPasada(valor);
                mensajeError = this.mensajes.fechaPasada;
                break;
                
            case 'password':
                esValido = valor.length >= 6;
                mensajeError = this.mensajes.passwordCorta;
                break;
                
            case 'confirmPassword':
                const passwordField = opciones.passwordField;
                if (passwordField) {
                    const passwordValue = passwordField.value;
                    esValido = valor === passwordValue && valor.length >= 6;
                    mensajeError = valor !== passwordValue ? 'Las contraseñas no coinciden' : this.mensajes.passwordCorta;
                } else {
                    esValido = valor.length >= 6;
                    mensajeError = this.mensajes.passwordCorta;
                }
                break;
                
            default:
                esValido = true;
        }
        
        if (esValido) {
            this.mostrarExito(campo);
            return true;
        } else {
            this.mostrarError(campo, mensajeError);
            return false;
        }
    }

    // Validaciones específicas
    validarTarjeta(numero) {
        // Remover espacios y guiones
        const numeroLimpio = numero.replace(/[\s\-]/g, '');
        
        // Verificar longitud básica
        if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
            return false;
        }
        
        // Verificar que solo contenga números
        if (!/^\d+$/.test(numeroLimpio)) {
            return false;
        }
        
        // Algoritmo de Luhn para validar número de tarjeta
        let suma = 0;
        let alternar = false;
        
        for (let i = numeroLimpio.length - 1; i >= 0; i--) {
            let digito = parseInt(numeroLimpio.charAt(i), 10);
            
            if (alternar) {
                digito *= 2;
                if (digito > 9) {
                    digito = (digito % 10) + 1;
                }
            }
            
            suma += digito;
            alternar = !alternar;
        }
        
        return (suma % 10) === 0;
    }

    validarFechaVencimiento(fecha) {
        if (!this.patrones.fechaVencimiento.test(fecha)) {
            return false;
        }
        
        const [mes, año] = fecha.split('/');
        const fechaCompleta = new Date(2000 + parseInt(año), parseInt(mes) - 1);
        const fechaActual = new Date();
        
        return fechaCompleta > fechaActual;
    }

    validarFechaFutura(fecha) {
        const fechaSeleccionada = new Date(fecha);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        return fechaSeleccionada >= fechaActual;
    }

    validarFechaPasada(fecha) {
        const fechaSeleccionada = new Date(fecha);
        const fechaActual = new Date();
        
        return fechaSeleccionada <= fechaActual;
    }

    // Funciones de UI
    limpiarValidacion(campo) {
        campo.classList.remove('campo-error', 'campo-valido');
        
        // Remover mensaje anterior
        const mensajeAnterior = campo.parentNode.querySelector('.mensaje-error, .mensaje-exito');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }
    }

    mostrarError(campo, mensaje) {
        campo.classList.add('campo-error');
        campo.classList.remove('campo-valido');
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-error';
        mensajeDiv.textContent = mensaje;
        
        campo.parentNode.appendChild(mensajeDiv);
    }

    mostrarExito(campo) {
        campo.classList.add('campo-valido');
        campo.classList.remove('campo-error');
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-exito';
        mensajeDiv.innerHTML = '<i class="bi bi-check-circle"></i>';
        
        campo.parentNode.appendChild(mensajeDiv);
    }

    // Función para formatear número de tarjeta automáticamente
    formatearTarjeta(campo) {
        let valor = campo.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let valorFormateado = valor.match(/.{1,4}/g)?.join(' ') || valor;
        
        if (valorFormateado !== campo.value) {
            campo.value = valorFormateado;
        }
    }

    // Función para formatear fecha de vencimiento MM/YY
    formatearFechaVencimiento(campo) {
        let valor = campo.value.replace(/\D/g, '');
        
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
        }
        
        campo.value = valor;
    }

    // Configurar validaciones automáticas para un formulario
    configurarFormulario(formulario, configuracion) {
        Object.keys(configuracion).forEach(nombreCampo => {
            const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
            if (!campo) return;
            
            const config = configuracion[nombreCampo];
            
            // Eventos de validación en tiempo real
            campo.addEventListener('blur', () => {
                this.validarCampo(campo, config.tipo, config.opciones || {});
            });
            
            campo.addEventListener('input', () => {
                // Formateo automático para algunos tipos
                if (config.tipo === 'tarjeta') {
                    this.formatearTarjeta(campo);
                } else if (config.tipo === 'fechaVencimiento') {
                    this.formatearFechaVencimiento(campo);
                }
                
                // Validación en tiempo real para algunos campos
                if (['email', 'soloTexto', 'soloNumeros'].includes(config.tipo)) {
                    // Pequeño delay para no ser muy agresivo
                    clearTimeout(campo.validacionTimeout);
                    campo.validacionTimeout = setTimeout(() => {
                        this.validarCampo(campo, config.tipo, config.opciones || {});
                    }, 500);
                }
                
                // Para confirmación de contraseña, validar cuando cambie cualquiera de los dos campos
                if (config.tipo === 'confirmPassword' && config.opciones?.passwordField) {
                    clearTimeout(campo.validacionTimeout);
                    campo.validacionTimeout = setTimeout(() => {
                        this.validarCampo(campo, config.tipo, config.opciones || {});
                    }, 500);
                }
            });
        });
        
        // Para campos de confirmación de contraseña, también validar cuando cambie la contraseña original
        Object.keys(configuracion).forEach(nombreCampo => {
            const config = configuracion[nombreCampo];
            if (config.tipo === 'confirmPassword' && config.opciones?.passwordField) {
                const passwordField = config.opciones.passwordField;
                const confirmField = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
                
                if (passwordField && confirmField) {
                    passwordField.addEventListener('input', () => {
                        clearTimeout(confirmField.validacionTimeout);
                        confirmField.validacionTimeout = setTimeout(() => {
                            this.validarCampo(confirmField, 'confirmPassword', { passwordField });
                        }, 500);
                    });
                }
            }
        });
        
        // Validación al enviar el formulario
        formulario.addEventListener('submit', (e) => {
            let formularioValido = true;
            
            Object.keys(configuracion).forEach(nombreCampo => {
                const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
                if (!campo) return;
                
                const config = configuracion[nombreCampo];
                const esValido = this.validarCampo(campo, config.tipo, config.opciones || {});
                
                if (!esValido) {
                    formularioValido = false;
                }
            });
            
            if (!formularioValido) {
                e.preventDefault();
                
                // Mostrar mensaje general de error
                this.mostrarMensajeFormulario(formulario, 'Por favor, corrige los errores antes de continuar.', 'error');
                
                // Hacer scroll al primer campo con error
                const primerError = formulario.querySelector('.campo-error');
                if (primerError) {
                    primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    primerError.focus();
                }
            }
        });
    }

    // Mostrar mensaje general del formulario
    mostrarMensajeFormulario(formulario, mensaje, tipo = 'error') {
        // Remover mensaje anterior
        const mensajeAnterior = formulario.querySelector('.mensaje-formulario');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-formulario alert alert-${tipo === 'error' ? 'danger' : 'success'}`;
        mensajeDiv.textContent = mensaje;
        
        // Insertar al inicio del formulario
        formulario.insertBefore(mensajeDiv, formulario.firstChild);
        
        // Remover automáticamente después de 5 segundos
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 5000);
    }

    // Función para validar formulario completo manualmente
    validarFormularioCompleto(formulario, configuracion) {
        let formularioValido = true;
        
        Object.keys(configuracion).forEach(nombreCampo => {
            const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
            if (!campo) return;
            
            const config = configuracion[nombreCampo];
            const esValido = this.validarCampo(campo, config.tipo, config.opciones || {});
            
            if (!esValido) {
                formularioValido = false;
            }
        });
        
        return formularioValido;
    }
}

// Crear instancia global
const validacionesSway = new ValidacionesSway();

// Configuraciones predefinidas para diferentes formularios
const configFormularios = {
    eventos: {
        titulo: { tipo: 'soloTexto' },
        capacidad_maxima: { tipo: 'soloNumeros' },
        ubicacion: { tipo: 'soloTexto' },
        fecha_evento: { tipo: 'fechaFutura' },
        costo: { tipo: 'numerosDecimales' },
        contacto: { tipo: 'email' }
    },
    
    contacto: {
        name: { tipo: 'soloTexto' },
        email: { tipo: 'email' },
        subject: { tipo: 'soloTexto' }
    },
    
    login: {
        email: { tipo: 'email' },
        password: { tipo: 'password' }
    },
    
    registro: {
        nombre: { tipo: 'soloTexto' },
        email: { tipo: 'email' },
        password: { tipo: 'password' },
        password_confirm: { tipo: 'password' }
    },
    
    checkout: {
        'shipping-name': { tipo: 'soloTexto' },
        'shipping-phone': { tipo: 'telefono' },
        'card-number': { tipo: 'tarjeta' },
        'card-name': { tipo: 'soloTexto' },
        'card-expiry': { tipo: 'fechaVencimiento' },
        'card-cvv': { tipo: 'cvv' }
    },
    
    newsletter: {
        email: { tipo: 'email' }
    }
};

// Función de conveniencia para configurar rápidamente un formulario
function configurarValidaciones(nombreFormulario, selectorFormulario) {
    const formulario = document.querySelector(selectorFormulario);
    if (formulario && configFormularios[nombreFormulario]) {
        validacionesSway.configurarFormulario(formulario, configFormularios[nombreFormulario]);
        console.log(`Validaciones configuradas para: ${nombreFormulario}`);
    }
}

// Configurar automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Eventos
    configurarValidaciones('eventos', '#form-crear-evento');
    
    // Contacto
    configurarValidaciones('contacto', '#contact-form');
    
    // Login
    configurarValidaciones('login', '#loginForm');
    
    // Registro con validación especial para confirmar contraseña
    const registerForm = document.querySelector('#registerForm');
    if (registerForm) {
        const passwordField = registerForm.querySelector('[name="password"]');
        const confirmPasswordField = registerForm.querySelector('[name="password_confirm"]');
        
        if (passwordField && confirmPasswordField) {
            const registroConfig = {
                nombre: { tipo: 'soloTexto' },
                email: { tipo: 'email' },
                password: { tipo: 'password' },
                password_confirm: { 
                    tipo: 'confirmPassword', 
                    opciones: { passwordField: passwordField } 
                }
            };
            
            validacionesSway.configurarFormulario(registerForm, registroConfig);
            console.log('Validaciones configuradas para: registro');
        }
    }
    
    // Checkout
    configurarValidaciones('checkout', '#checkout-form');
    
    // Newsletter (buscar todos los campos de email del newsletter)
    document.querySelectorAll('input[name="email"]').forEach(campo => {
        if (campo.id === 'newsletter-email' || campo.closest('form') === null) {
            campo.addEventListener('blur', () => {
                validacionesSway.validarCampo(campo, 'email');
            });
        }
    });
});
