/**
 * Generic prompt modal — returns a Promise that resolves with the input value or null.
 * @param {string} id - unique DOM id for the backdrop element
 * @param {string} defaultTitle - default heading text
 * @returns {{ open: (value?: string, title?: string) => Promise<string|null> }}
 */
function createPromptModal(id, defaultTitle = '请输入') {
    let existing = document.getElementById(id);
    if (existing) return existing._modalApi;

    const backdrop = document.createElement('div');
    backdrop.id = id;
    backdrop.className = 'rename-modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML = `
        <div class="rename-modal" role="dialog" aria-modal="true">
            <h3></h3>
            <label>名称</label>
            <input type="text" maxlength="60" autocomplete="off" />
            <div class="modal-actions">
                <button class="btn-secondary" type="button">取消</button>
                <button class="btn-primary" type="button">确定</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    let resolvePromise = null;
    const titleEl = backdrop.querySelector('h3');
    const input = backdrop.querySelector('input');
    const cancelBtn = backdrop.querySelector('.btn-secondary');
    const confirmBtn = backdrop.querySelector('.btn-primary');

    function close(result) {
        backdrop.classList.remove('is-open');
        backdrop.setAttribute('aria-hidden', 'true');
        input.value = '';
        if (resolvePromise) {
            resolvePromise(result);
            resolvePromise = null;
        }
    }

    cancelBtn.addEventListener('click', () => close(null));
    confirmBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) {
            input.style.borderColor = '#e53e3e';
            input.focus();
            return;
        }
        close(val);
    });
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(null);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close(null);
    });

    const api = {
        open(value = '', title = defaultTitle) {
            return new Promise((resolve) => {
                resolvePromise = resolve;
                titleEl.textContent = title;
                input.value = value;
                input.style.borderColor = '';
                backdrop.classList.add('is-open');
                backdrop.setAttribute('aria-hidden', 'false');
                setTimeout(() => { input.focus(); input.select(); }, 0);
            });
        }
    };

    backdrop._modalApi = api;
    return api;
}

export { createPromptModal };
