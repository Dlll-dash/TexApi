/**
 * Toast 通知组件
 * 固定在页面顶部居中，3秒后自动消失，多个 toast 自动堆叠
 */
let toastCount = 0;
const GAP = 8; // toast 之间的间距

/**
 * 显示通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型：'error' | 'success' | 'info'，默认 'info'
 * @param {number} duration - 显示时长(ms)，默认 3000
 */
function showToast(message, type = 'info', duration = 3000) {
    //颜色映射
    const colors = {
        error:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
        info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' }
    };
    const c = colors[type] || colors.info;

    //创建元素
    const toast = document.createElement('div');
    const top = 16 + toastCount * 48; // 堆叠偏移
    toast.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: 50%;
        transform: translateX(-50%);
        background: ${c.bg};
        border: 1px solid ${c.border};
        color: ${c.text};
        padding: 10px 24px;
        border-radius: 6px;
        z-index: 99999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        opacity: 0;
        transition: opacity 0.25s ease;
        pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    //显示动画
    requestAnimationFrame(() => { toast.style.opacity = '1'; });

    toastCount++;

    //自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            toastCount--;
        }, 250);
    }, duration);

    return toast;
}

export { showToast };
