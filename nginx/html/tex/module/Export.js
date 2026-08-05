import { requestDataType, httpMimeTypes, responseContentType } from "../config/TypeConfig.js";
import { CategoryApi } from "../api/CategoryApi.js";
import { ApiApi } from "../api/ApiApi.js";
import { RequestParamsApi } from "../api/RequestParamsApi.js";
import { methodColors } from "../config/MethodConfig.js";
import { statusColors } from "../config/StatusConfig.js";
import { getCodeColor } from "../config/ResponseConfig.js";
import { urlDisplay } from "../components/urlSpan.js";
import { createApiStatusSpan } from "../components/apiStatusSpan.js";
import { createParamList } from "../components/paramList.js";
import { createResponsePreviewDiv } from "../components/responsePreviewDiv.js";
import { createResponseJsonExampleDiv } from "../components/responseJsonExampleDiv.js";
import { createResponseXmlExampleDiv } from "../components/responseXmlExampleDiv.js";
import { formatDateToChinese, formatRelativeTime } from "../utils/DateUtil.js";

function getContentTypeKey(apiId) {
    return 'contentType_' + (apiId || 'default');
}

// ========== 公开入口 ==========

/** 导出项目根分类所有接口 */
export async function exportProjectBatch(projectId, projectName) {
    const toast = showToast('正在获取项目分类...', '#4299e1');
    try {
        const catRes = await CategoryApi.getCategories(projectId);
        const rootNode = catRes?.data?.data;
        if (!rootNode) { updateToast(toast, '该项目没有分类', '#e53e3e'); return; }
        toast.remove();
        await exportCategoryBatch(rootNode.id, projectName, projectId);
    } catch (err) {
        updateToast(toast, '导出失败：' + (err.message || '未知错误'), '#e53e3e');
    }
}

/** 导出单个 API 为独立 HTML */
export async function exportSingleApi(apiData, useDraft) {
    const toast = showToast('正在收集接口数据...', '#4299e1');
    try {
        const apiId=apiData.id;
        const apiName=apiData.apiName || '未命名接口';
        const batchData = await fetchBatchData([{ id: apiData.id }], useDraft);
        const merged = mergeData([apiData], batchData);
        if (merged.length === 0) { updateToast(toast, '未获取到接口数据', '#e53e3e'); return; }
        await enrichBodyValues(merged);
        updateToast(toast, '正在生成文档...', '#4299e1');

        const container = document.createElement('div');
        container.innerHTML = prerenderApiPreview(merged[0]);
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        exportContainer.appendChild(container.firstChild.cloneNode(true));
        const fragment = exportContainer.outerHTML;
        const css = document.getElementById('export-style')?.innerHTML;
        const htmlContent = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + esc(apiName || '未命名接口') + '</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"><style>' + css + '</style></head><body>' + fragment + '</body></html>';
        downloadHtml(htmlContent, apiName || '未命名接口');
        updateToast(toast, '导出成功！', '#48bb78');
        setTimeout(() => toast.remove(), 2000);
    } catch (err) {
        updateToast(toast, '导出失败：' + (err.message || '未知错误'), '#e53e3e');
        setTimeout(() => toast.remove(), 2000);
    }
}

export async function exportCategoryBatch(categoryId, categoryName, projectId) {
    const toast = showToast('正在收集接口数据...', '#4299e1');

    try {
        const { apis, categoryTree } = await fetchAllApisInCategory(categoryId, projectId);
        if (!apis || apis.length === 0) {
            updateToast(toast, '该分类及其子分类下没有接口', '#e53e3e');
            return;
        }

        updateToast(toast, '正在获取参数和响应数据...', '#4299e1');
        const batchData = await fetchBatchData(apis);
        const merged = mergeData(apis, batchData);

        updateToast(toast, '正在获取 Body 内容...', '#4299e1');
        await enrichBodyValues(merged);

        updateToast(toast, '正在生成文档...', '#4299e1');
        const rendered = merged.map(api => prerenderApiPreview(api));

        // 构建分类+接口嵌套树，用于左侧目录
        const tree = buildSidebarTree(categoryTree, merged);

        const html = buildExportHtml(categoryName, rendered, tree);
        downloadHtml(html, categoryName || '接口文档');

        updateToast(toast, '导出成功！', '#48bb78');
        setTimeout(() => toast.remove(), 2000);
    } catch (err) {
        updateToast(toast, '导出失败：' + (err.message || '未知错误'), '#e53e3e');
        setTimeout(() => toast.remove(), 3000);
        console.error('批量导出失败：', err);
    }
}

// ========== 递归收集分类及子分类下所有 API ==========
async function fetchAllApisInCategory(categoryId, projectId) {
    const catRes = await CategoryApi.getCategories(projectId);
    const rootNode = catRes?.data?.data;
    if (!rootNode) return { apis: [], categoryTree: null };

    const categoryIds = [];
    function collectIds(node) {
        if (!node) return false;
        if (String(node.id) === String(categoryId)) {
            function addAll(n) { if (!n) return; categoryIds.push(n.id); if (n.children) n.children.forEach(addAll); }
            addAll(node);
            return true;
        }
        if (node.children) { for (const child of node.children) { if (collectIds(child)) return true; } }
        return false;
    }
    collectIds(rootNode);
    if (categoryIds.length === 0) categoryIds.push(categoryId);

    // 提取目标分类子树
    let targetTree = null;
    function findTree(node) {
        if (!node) return null;
        if (String(node.id) === String(categoryId)) return node;
        if (node.children) for (const child of node.children) { const f = findTree(child); if (f) return f; }
        return null;
    }
    targetTree = findTree(rootNode);

    const results = await Promise.all(
        categoryIds.map(id => CategoryApi.getApisByCategoryId(id).then(r => r.data?.data || []).catch(() => []))
    );
    const seen = new Set();
    const all = [];
    for (const apis of results) for (const api of apis) { if (!seen.has(api.id)) { seen.add(api.id); all.push(api); } }
    return { apis: all, categoryTree: targetTree };
}

function buildExportPayload(apis, useDraft) {
    return apis.map(api => {
        const fmt = localStorage.getItem(getContentTypeKey(api.id));
        return { apiId: api.id, formatType: fmt || '', useDraft: useDraft };
    });
}

async function fetchBatchData(apis, useDraft) {
    const payload = buildExportPayload(apis, useDraft);
    const res = await ApiApi.exportBatch(payload);
    return res.data?.data || [];
}

function mergeData(apis, batchData) {
    const batchMap = new Map();
    batchData.forEach(item => batchMap.set(String(item.apiId), item));
    return apis.map(api => {
        const extra = batchMap.get(String(api.id)) || {};
        const p = extra.params || {};
        // 后端字段名与前端组件期望不一致，统一映射
        return {
            ...api,
            params: {
                query: (p.query || []).map(normalizeParam),
                header: (p.headers || []).map(normalizeParam),
                body: (p.body || []).map(normalizeParam)
            },
            responses: extra.response ? [extra.response] : []
        };
    });
}

function normalizeParam(p) {
    return {
        name: p.name || '',
        type: p.type || '',
        value: p.value || '',
        explanation: p.explanation || '',
        isNecessary: p.necessary === true || p.isNecessary === true
    };
}

// 补齐 JSON/XML Body 的 value 字段（/api/export 不返回 value，需单独请求）
async function enrichBodyValues(mergedApis) {
    const fetches = mergedApis.map(async (api) => {
        const bodyParams = api.params && api.params.body;
        if (!bodyParams || bodyParams.length !== 1) return;
        const p = bodyParams[0];
        if (p.value) return; // 已有值则跳过
        const isJsonOrXml = p.type === 'json' || p.type === 'xml' || p.type === requestDataType.Json || p.type === requestDataType.Xml;
        if (!isJsonOrXml) return;
        const fmt = localStorage.getItem(getContentTypeKey(api.id)) || requestDataType.None;
        if (fmt === requestDataType.None) return;
        try {
            const res = await RequestParamsApi.list(api.id, fmt);
            const data = res.data?.data || [];
            if (data.length > 0) p.value = data[0].value || '';
        } catch (e) { /* 静默忽略，value 留空 */ }
    });
    await Promise.all(fetches);
}
// ========== 构建侧边栏嵌套树 ==========
function buildSidebarTree(categoryNode, apis) {
    const apisByCategory = new Map();
    const uncategorized = [];
    apis.forEach((api, i) => {
        api._previewIndex = i;
        if (api.categoryId) {
            const list = apisByCategory.get(String(api.categoryId)) || [];
            list.push(api);
            apisByCategory.set(String(api.categoryId), list);
        } else {
            uncategorized.push(api);
        }
    });

    function convert(node) {
        if (!node) return [];
        const items = [];
        const catApis = apisByCategory.get(String(node.id)) || [];
        catApis.forEach(api => items.push({
            type: 'api', id: api.id, name: api.apiName || '未命名接口',
            method: api.requestMethod || 'GET', status: api.status, index: api._previewIndex
        }));
        if (node.children) {
            node.children.forEach(child => {
                const childItems = convert(child);
                if (childItems.length > 0 || (apisByCategory.get(String(child.id)) || []).length > 0) {
                    items.push({ type: 'category', id: child.id, name: child.name || '未命名分类', children: childItems });
                }
            });
        }
        return items;
    }

    const tree = categoryNode ? convert(categoryNode) : [];
    uncategorized.forEach(api => tree.push({
        type: 'api', id: api.id, name: api.apiName || '未命名接口',
        method: api.requestMethod || 'GET', status: api.status, index: api._previewIndex
    }));
    return tree;
}
// ========== 预渲染单个 API 预览（用现有组件，确保效果一致） ==========
function prerenderApiPreview(api) {
    const params = api.params || {};
    const resp = (api.responses && api.responses.length > 0) ? api.responses[0] : null;

    const container = document.createElement('div');
    container.className = 'preview-container';

    const previewTitle = document.createElement('h2');
    previewTitle.className = 'preview-title';
    previewTitle.textContent = api.apiName || '未命名接口';
    container.appendChild(previewTitle);

    const urlStatusDiv = document.createElement('div');
    urlStatusDiv.className = 'url-status-div';
    urlStatusDiv.appendChild(urlDisplay(api.requestMethod, api.requestUrl));
    const statusSpan = createApiStatusSpan(api.status);
    const statusList = statusSpan.querySelector('.status-option-list');
    if (statusList) statusList.style.display = 'none';
    urlStatusDiv.appendChild(statusSpan);
    container.appendChild(urlStatusDiv);

    const apiInfoDiv = document.createElement('div');
    apiInfoDiv.className = 'api-info-div';
    apiInfoDiv.appendChild(createInfoItem('创建时间', formatDateToChinese(api.createTime)));
    apiInfoDiv.appendChild(createInfoItem('修改时间', formatRelativeTime(api.updateTime)));
    apiInfoDiv.appendChild(createInfoItem('修改者', api.updateUserName || api.modifiedBy));
    apiInfoDiv.appendChild(createInfoItem('创建者', api.createUserName || api.createdBy));
    apiInfoDiv.appendChild(createInfoItem('责任人', api.inChargeUser));
    container.appendChild(apiInfoDiv);

    const explanationTitle=document.createElement('h3');
    explanationTitle.textContent = "接口说明";
    explanationTitle.className = "preview-explanation-title";
    container.appendChild(explanationTitle);
    const explanationDiv=document.createElement('div');
    explanationDiv.className = "preview-explanation-div";
    explanationDiv.textContent = api.explanation;
    if(!api.explanation) {
        explanationTitle.style.display = 'none';
        explanationDiv.style.display = 'none';
    }
    container.appendChild(explanationDiv);

    const hasQuery = params.query && params.query.length > 0;
    const hasHeader = params.header && params.header.length > 0;
    const hasBody = params.body && params.body.length > 0;
    const paramsTitle = document.createElement('h3');
    paramsTitle.className = 'preview-params-title';
    paramsTitle.textContent = '请求参数';
    container.appendChild(paramsTitle);
    if (!hasQuery && !hasHeader && !hasBody) {
        const noParamsTip = document.createElement('div');
        noParamsTip.className = 'no-params-message';
        noParamsTip.textContent = '暂无请求参数';
        container.appendChild(noParamsTip);
    }
    if (hasQuery) container.appendChild(buildParamBlock('preview-query-info', 'query-title', 'Query 参数', params.query));
    if (hasHeader) container.appendChild(buildParamBlock('preview-headers-info', 'headers-title', 'Headers 参数', params.header));
    if (hasBody) {
        const bodyParams = params.body;
        const isBodyJson = bodyParams.length === 1 && (bodyParams[0].type === 'json' || bodyParams[0].type === requestDataType.Json);
        const isBodyXml = bodyParams.length === 1 && (bodyParams[0].type === 'xml' || bodyParams[0].type === requestDataType.Xml);
        if (isBodyJson || isBodyXml) {
            container.appendChild(buildBodyExampleBlock(bodyParams, isBodyXml));
        } else {
            container.appendChild(buildParamBlock('preview-body-info', 'body-title', 'Body 参数', bodyParams));
        }
    }

    console.log('resp:', resp);
    if (resp) {
        const responseTitle = document.createElement('h3');
        responseTitle.className = 'preview-params-title';
        responseTitle.textContent = '返回响应';
        container.appendChild(responseTitle);

        const responseLabelContainer = document.createElement('div');
        responseLabelContainer.className = 'response-label-container';
        const responseLabel = document.createElement('span');
        responseLabel.className = 'response-label';
        const codeLabel = document.createElement('span');
        codeLabel.className = 'code-label';
        codeLabel.textContent = resp.responseCode || '';
        codeLabel.style.color = getCodeColor(resp.responseCode);
        const nameLabel = document.createElement('span');
        nameLabel.className = 'name-label';
        nameLabel.textContent = resp.name || '';
        responseLabel.appendChild(codeLabel);
        responseLabel.appendChild(nameLabel);
        const responseFillLabel = document.createElement('span');
        responseFillLabel.className = 'response-fill-label';
        responseLabelContainer.appendChild(responseLabel);
        responseLabelContainer.appendChild(responseFillLabel);
        container.appendChild(responseLabelContainer);

        const responseContainer = document.createElement('div');
        responseContainer.className = 'preview-response-container';

        const responsePreviewDiv = document.createElement('div');
        responsePreviewDiv.className = 'response-preview-div';

        const responseInfoSpan = document.createElement('span');
        responseInfoSpan.className = 'preview-response-info-label';
        const statusCodeSpan = document.createElement('span');
        statusCodeSpan.className = 'preview-type-label';
        statusCodeSpan.textContent = 'HTTP 状态码: ' + (resp.responseCode || '');
        const contentTypeSpan = document.createElement('span');
        contentTypeSpan.className = 'preview-type-without-bg';
        contentTypeSpan.textContent = responseContentType[resp.contentType] || '';
        responseInfoSpan.appendChild(statusCodeSpan);
        responseInfoSpan.appendChild(contentTypeSpan);
        responsePreviewDiv.appendChild(responseInfoSpan);
        responseContainer.appendChild(responsePreviewDiv);

        const responseJsonExampleDiv = document.createElement('div');
        responseJsonExampleDiv.className = 'response-json-example-div';
        const jsonTitle = document.createElement('span');
        jsonTitle.className = 'body-title';
        jsonTitle.textContent = '示例';
        responseJsonExampleDiv.appendChild(jsonTitle);
        responseContainer.appendChild(responseJsonExampleDiv);

        
            if (resp.contentType === 'HTML' || resp.contentType === 'Raw' || resp.contentType === 'No-Content') {
                const noLabel = document.createElement('span');
                noLabel.className = 'response-no-label';
                noLabel.textContent = resp.contentType === 'No-Content' ? '该响应无响应体'
                    : '响应体为 ' + resp.contentType + ' 格式，不支持树形预览';
                responsePreviewDiv.appendChild(noLabel);
            } else {
                createResponsePreviewDiv(resp.responseBody, responsePreviewDiv);
                if (resp.contentType === 'XML') {
                    createResponseXmlExampleDiv(resp.responseBody, responseJsonExampleDiv);
                } else {
                    createResponseJsonExampleDiv(resp.responseBody, responseJsonExampleDiv);
                }
            }
        
        container.appendChild(responseContainer);
    }

    return container.outerHTML;
}

function buildParamBlock(infoClass, titleClass, titleText, paramList) {
    const div = document.createElement('div');
    div.className = 'preview-params-div';
    div.style.display = 'block';
    const infoSpan = document.createElement('span');
    infoSpan.className = infoClass;
    const t = document.createElement('span');
    t.className = titleClass;
    t.textContent = titleText;
    infoSpan.appendChild(t);
    div.appendChild(infoSpan);
    div.appendChild(createParamList(paramList));
    return div;
}

function buildBodyExampleBlock(bodyParams, isXml) {
    const div = document.createElement('div');
    div.className = 'preview-params-div';
    div.style.display = 'block';

    const infoSpan = document.createElement('span');
    infoSpan.className = 'preview-body-info';
    const title = document.createElement('span');
    title.className = 'body-title';
    title.textContent = 'Body 参数';
    const bodyType = document.createElement('span');
    bodyType.className = 'preview-type-label';
    bodyType.textContent = isXml ? (httpMimeTypes.xml || 'application/xml') : (httpMimeTypes.json || 'application/json');
    infoSpan.appendChild(title);
    infoSpan.appendChild(bodyType);
    div.appendChild(infoSpan);

    const flex = document.createElement('div');
    flex.className = 'preview-response-container';
    flex.style.border='none';
    flex.style.marginTop = '0';
    flex.style.borderRadius = '6px';

    const left = document.createElement('div');
    left.className = 'response-preview-div';
    left.style.minWidth = 'unset';
    left.style.flex = '1';
    left.appendChild(createParamList(bodyParams, true));

    const exampleDiv = document.createElement('div');
    exampleDiv.className = 'response-json-example-div';
    const exampleTitle = document.createElement('span');
    exampleTitle.className = 'body-title';
    exampleTitle.textContent = '示例';
    exampleDiv.appendChild(exampleTitle);

    const rawValue = bodyParams[0].value || '';
    if (rawValue) {
        if (isXml) {
            createResponseXmlExampleDiv(rawValue, exampleDiv);
        } else {
            createResponseJsonExampleDiv(rawValue, exampleDiv);
        }
    }

    flex.appendChild(left);
    flex.appendChild(exampleDiv);
    div.appendChild(flex);
    return div;
}

function createInfoItem(label, value) {
    const item = document.createElement('span');
    item.className = 'api-info-item';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'api-info-label'; labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.className = 'api-info-value'; valueSpan.textContent = value || '未设置';
    item.appendChild(labelSpan); item.appendChild(valueSpan);
    return item;
}

// ========== 构建导出 HTML ==========
function buildExportHtml(categoryName, renderedHtmls, tree) {
    const previewBlocks = renderedHtmls.map((html, i) =>
        `<div class="api-preview" id="preview-${i}" style="display:none">${html}</div>`
    ).join('\n');
    const css = document.getElementById('export-style')?.innerHTML || '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(categoryName || '接口文档')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
<style>
${css}
</style>
</head>
<body>

<div id="sidebar">
    <h3><i class="bi bi-folder2-open"></i> ${esc(categoryName || '接口列表')}</h3>
    <div id="apiTreeContainer"></div>
</div>

<div id="main" class="export-container">
    <div class="empty-hint" id="emptyHint">← 点击左侧接口查看文档</div>
${previewBlocks}
</div>

<script>
var TREE = ${JSON.stringify(tree)};
var METHOD_COLORS = ${JSON.stringify(methodColors)};
var STATUS_COLORS = ${JSON.stringify(statusColors)};
var firstApiIndex = -1;

function renderTree(items, parentUl, depth) {
    depth = depth || 0;
    items.forEach(function(item) {
        if (item.type === 'category') {
            var catLi = document.createElement('li');
            catLi.className = 'tree-category-row';
            catLi.style.paddingLeft = (depth * 1.2) + 'rem';

            var arrow = document.createElement('span');
            arrow.className = 'tree-arrow';
            arrow.innerHTML = '<i class="bi bi-caret-down-fill"></i>';

            var folder = document.createElement('span');
            folder.className = 'tree-folder';
            folder.innerHTML = '<i class="bi bi-folder2-open"></i>';

            var nameSpan = document.createElement('span');
            nameSpan.className = 'tree-category-name';
            nameSpan.textContent = item.name;

            catLi.appendChild(arrow); catLi.appendChild(folder); catLi.appendChild(nameSpan);
            parentUl.appendChild(catLi);

            var childrenUl = document.createElement('ul');
            childrenUl.className = 'children-ul';
            parentUl.appendChild(childrenUl);
            renderTree(item.children, childrenUl, depth + 1);

            arrow.addEventListener('click', function(e) {
                e.stopPropagation();
                var c = childrenUl.classList.toggle('collapsed');
                folder.innerHTML = c ? '<i class="bi bi-folder"></i>' : '<i class="bi bi-folder2-open"></i>';
                arrow.innerHTML = c ? '<i class="bi bi-caret-right-fill"></i>' : '<i class="bi bi-caret-down-fill"></i>';
            });
        } else {
            var apiLi = document.createElement('li');
            apiLi.className = 'api-row';
            apiLi.style.paddingLeft = (depth * 1.2 + 1.5) + 'rem';
            apiLi.onclick = (function(idx) { return function() { selectApi(idx); }; })(item.index);
            if (firstApiIndex === -1) firstApiIndex = item.index;

            var m = document.createElement('span');
            m.className = 'api-method';
            m.textContent = item.method;
            m.style.color = METHOD_COLORS[item.method] || '#718096';

            var n = document.createElement('span');
            n.className = 'api-name';
            n.textContent = item.name; n.title = item.name;

            var d = document.createElement('span');
            d.className = 'status-dot';
            d.style.backgroundColor = STATUS_COLORS[item.status] || '#a0aec0';

            apiLi.appendChild(m); apiLi.appendChild(n); apiLi.appendChild(d);
            parentUl.appendChild(apiLi);
        }
    });
}

function selectApi(i) {
    document.querySelectorAll('.api-row').forEach(function(r,j) {j===i?r.classList.add('active') : r.classList.remove('active'); });
    document.querySelectorAll('.api-preview').forEach(function(p, j) { p.style.display = j === i ? '' : 'none'; });
    var hint = document.getElementById('emptyHint');
    if (hint) hint.style.display = 'none';
}

renderTree(TREE, document.getElementById('apiTreeContainer'));
if (firstApiIndex >= 0) selectApi(firstApiIndex);
<\/script>
</body>
</html>`;
}

// ========== 工具 ==========
function esc(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function downloadHtml(html, filename) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (filename || '接口文档') + '.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showToast(message, bgColor) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + bgColor + ';color:#fff;padding:0.8rem 1.5rem;border-radius:8px;z-index:99999;font-size:0.95rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    toast.textContent = message;
    document.body.appendChild(toast);
    return toast;
}

function updateToast(toast, message, bgColor) { toast.textContent = message; toast.style.background = bgColor; }

