/**
 * Custom confirmation modal — returns a Promise that resolves with true/false.
 * @param {string} id - unique DOM id for the backdrop element
 * @param {string} defaultTitle - default heading text
 * @returns {{ open: (message: string, title?: string, confirmText?: string) => Promise<boolean> }}
 */
function createConfirmModal(id, defaultTitle = '确认操作') {
    let existing = document.getElementById(id);
    if (existing) return existing._modalApi;

    const backdrop = document.createElement('div');
    backdrop.id = id;
    backdrop.className = 'rename-modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML = `
        <div class="rename-modal" role="dialog" aria-modal="true">
            <h3></h3>
            <p class="confirm-message"></p>
            <div class="modal-actions">
                <button class="btn-secondary cancel-btn" type="button">取消</button>
                <button class="btn-primary confirm-btn" type="button">确定</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    let resolvePromise = null;
    const titleEl = backdrop.querySelector('h3');
    const messageEl = backdrop.querySelector('.confirm-message');
    const confirmBtn = backdrop.querySelector('.confirm-btn');
    const cancelBtn = backdrop.querySelector('.cancel-btn');

    function close(result) {
        backdrop.classList.remove('is-open');
        backdrop.setAttribute('aria-hidden', 'true');
        if (resolvePromise) {
            resolvePromise(result);
            resolvePromise = null;
        }
    }

    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close(false);
    });

    const api = {
        open(message = '', title = defaultTitle, confirmText = '确定') {
            return new Promise((resolve) => {
                resolvePromise = resolve;
                titleEl.textContent = title;
                messageEl.textContent = message;
                confirmBtn.textContent = confirmText;
                confirmBtn.classList.toggle('btn-danger', confirmText === '删除');
                backdrop.classList.add('is-open');
                backdrop.setAttribute('aria-hidden', 'false');
            });
        }
    };

    backdrop._modalApi = api;
    return api;
}

export { createConfirmModal };
