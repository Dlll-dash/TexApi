/**
 * Canvas 头像生成工具
 * 根据用户名生成圆形首字母头像，支持 localStorage 缓存。
 */

const AVATAR_COLORS = [
    '#E53E3E', '#DD6B20', '#D69E2E', '#38A169',
    '#319795', '#3182CE', '#5A67D8', '#805AD5',
    '#D53F8C', '#2B6CB0', '#2C7A7B', '#9B2C2C'
];

/**
 * 对字符串做简单 hash，映射到色板索引
 * @param {string} name
 * @returns {number}
 */
function hashName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % AVATAR_COLORS.length;
}

/**
 * Canvas 生成圆形首字母头像
 * @param {string} name  - 用户名
 * @param {number} [size=30] - 头像尺寸（px）
 * @returns {string} base64 dataURL
 */
function generateAvatar(name, size = 30) {
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 背景圆
    ctx.fillStyle = AVATAR_COLORS[hashName(name)];
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 首字母
    const firstChar = name.charAt(0).toUpperCase();
    const fontSize = Math.round(size * 0.45);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstChar, size / 2, size / 2 + 1);

    return canvas.toDataURL('image/png');
}

/**
 * 获取或创建头像（localStorage 缓存，按用户名区分）
 * @param {string} userName
 * @returns {string} base64 dataURL
 */
function getOrCreateAvatar(userName) {
    if (!userName) return '';
    const cacheKey = 'topbar_avatar_' + userName;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    const dataUrl = generateAvatar(userName);
    try { localStorage.setItem(cacheKey, dataUrl); } catch (_) { /* quota exceeded */ }
    return dataUrl;
}

export { generateAvatar, getOrCreateAvatar };
