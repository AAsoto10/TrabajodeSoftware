// Helper para mostrar modales en lugar de alerts
window.showModal = function(options) {
  const {
    title = 'Notificación',
    message = '',
    type = 'info', // info, success, warning, error
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    showCancel = false,
    onConfirm = null,
    onCancel = null
  } = options;

  // Crear modal si no existe
  let modal = document.getElementById('globalModal');
  if (!modal) {
    const modalHTML = `
      <div class="modal fade" id="globalModal" tabindex="-1" aria-labelledby="globalModalLabel">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title d-flex align-items-center gap-2" id="globalModalLabel">
                <i class="modal-icon"></i>
                <span class="modal-title-text"></span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-2">
              <p class="modal-message mb-0"></p>
            </div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-secondary modal-cancel-btn" data-bs-dismiss="modal"></button>
              <button type="button" class="btn modal-confirm-btn"></button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('globalModal');
    
    // Agregar listener para remover aria-hidden cuando el modal se muestre
    modal.addEventListener('shown.bs.modal', function () {
      this.removeAttribute('aria-hidden');
    });
    
    // Agregar observer para remover aria-hidden si Bootstrap lo agrega dinámicamente
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const modal = mutation.target;
          if (modal.classList.contains('show')) {
            modal.removeAttribute('aria-hidden');
          }
        }
      });
    });
    observer.observe(modal, { attributes: true });
  }

  // Configurar colores e iconos según tipo
  const configs = {
    info: { icon: 'bi-info-circle-fill', color: 'info', headerBg: 'bg-info-subtle' },
    success: { icon: 'bi-check-circle-fill', color: 'success', headerBg: 'bg-success-subtle' },
    warning: { icon: 'bi-exclamation-triangle-fill', color: 'warning', headerBg: 'bg-warning-subtle' },
    error: { icon: 'bi-x-circle-fill', color: 'danger', headerBg: 'bg-danger-subtle' }
  };

  const config = configs[type] || configs.info;

  // Actualizar contenido
  const modalHeader = modal.querySelector('.modal-header');
  const modalIcon = modal.querySelector('.modal-icon');
  const modalTitleText = modal.querySelector('.modal-title-text');
  const modalMessage = modal.querySelector('.modal-message');
  const modalCancelBtn = modal.querySelector('.modal-cancel-btn');
  const modalConfirmBtn = modal.querySelector('.modal-confirm-btn');

  modalHeader.className = `modal-header border-0 pb-0 ${config.headerBg}`;
  modalIcon.className = `modal-icon bi ${config.icon} text-${config.color}`;
  modalTitleText.textContent = title;
  modalMessage.innerHTML = message;
  
  modalConfirmBtn.textContent = confirmText;
  modalConfirmBtn.className = `btn btn-${config.color} modal-confirm-btn`;
  
  if (showCancel) {
    modalCancelBtn.textContent = cancelText;
    modalCancelBtn.style.display = 'inline-block';
  } else {
    modalCancelBtn.style.display = 'none';
  }

  // Configurar eventos
  modalConfirmBtn.onclick = () => {
    const bsModalInstance = bootstrap.Modal.getInstance(modal);
    if (onConfirm) onConfirm();
    if (bsModalInstance) {
      bsModalInstance.hide();
    }
  };

  modalCancelBtn.onclick = () => {
    const bsModalInstance = bootstrap.Modal.getInstance(modal);
    if (onCancel) onCancel();
    if (bsModalInstance) {
      bsModalInstance.hide();
    }
  };

  // Limpiar instancia anterior si existe
  const existingInstance = bootstrap.Modal.getInstance(modal);
  if (existingInstance) {
    existingInstance.dispose();
  }

  // Mostrar modal
  const bsModal = new bootstrap.Modal(modal, {
    backdrop: true,
    keyboard: true,
    focus: true
  });
  bsModal.show();

  return bsModal;
};

// Atajo para confirmación
window.showConfirm = function(message, onConfirm, title = '¿Estás seguro?') {
  return window.showModal({
    title,
    message,
    type: 'warning',
    confirmText: 'Sí, continuar',
    cancelText: 'Cancelar',
    showCancel: true,
    onConfirm
  });
};

// Atajo para éxito
window.showSuccess = function(message, title = '¡Éxito!') {
  return window.showModal({
    title,
    message,
    type: 'success'
  });
};

// Atajo para error
window.showError = function(message, title = 'Error') {
  return window.showModal({
    title,
    message,
    type: 'error'
  });
};

// Atajo para info
window.showInfo = function(message, title = 'Información') {
  return window.showModal({
    title,
    message,
    type: 'info'
  });
};

// Agregar listener global para todos los modales de Bootstrap
document.addEventListener('DOMContentLoaded', function() {
  // Observer para detectar cuando Bootstrap agrega modales al DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
          setupModalAriaFix(node);
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Configurar modales existentes
  document.querySelectorAll('.modal').forEach(setupModalAriaFix);
});

function setupModalAriaFix(modal) {
  // Evitar agregar múltiples listeners
  if (modal.dataset.ariaFixed) return;
  modal.dataset.ariaFixed = 'true';
  
  // Remover aria-hidden cuando el modal se muestra
  modal.addEventListener('shown.bs.modal', function() {
    this.removeAttribute('aria-hidden');
  });
  
  // Observer para remover aria-hidden si Bootstrap lo agrega dinámicamente
  const modalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
        if (modal.classList.contains('show')) {
          modal.removeAttribute('aria-hidden');
        }
      }
    });
  });
  
  modalObserver.observe(modal, { attributes: true });
}
