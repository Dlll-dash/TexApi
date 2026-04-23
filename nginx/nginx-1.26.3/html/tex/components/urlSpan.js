import { methodBackroundColorsDeep } from "../config/MethodConfig.js";

/**
 * 创建一个仅供URL显示组件
 * @param {string} method - HTTP方法（如GET、POST等）。
 * @param {string} url - URL文本。
 * @returns {HTMLElement} 包含方法和URL的span元素。
 */
function urlDisplay(method,url) {
    const urlSpan = document.createElement('span');
    urlSpan.className = 'url-span-display';  
    const methodSpan = document.createElement('span');
    methodSpan.className = 'method-span-display'; 
    const urlTextSpan = document.createElement('span');
    urlTextSpan.className = 'url-text-display';
    urlTextSpan.textContent = url || "无URL信息";
    urlSpan.appendChild(methodSpan);
    urlSpan.appendChild(urlTextSpan);

    methodSpan.textContent = method || "UNKNOWN";
    methodSpan.style.backgroundColor = methodBackroundColorsDeep[method] || methodBackroundColorsDeep['DEFAULT'];



    return urlSpan;
}


export { urlDisplay };