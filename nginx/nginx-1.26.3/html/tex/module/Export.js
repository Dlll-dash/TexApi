import { request } from "../config/AxiosConfig/AxiosConfig.js";
import { CategoryApi } from "../api/CategoryApi.js";
import { methodColors } from "../config/MethodConfig.js";
import { statusColors } from "../config/StatusConfig.js";
import { getCodeColor } from "../config/ResponseConfig.js";
import { responseContentType } from "../config/TypeConfig.js";
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
export async function exportSingleApi(apiData) {
    const toast = showToast('正在收集接口数据...', '#4299e1');
    try {
        const apiId=apiData.id;
        const apiName=apiData.apiName || '未命名接口';
        const batchData = await fetchBatchData([{ id: apiData.id }]);
        const merged = mergeData([apiData], batchData);
        if (merged.length === 0) { updateToast(toast, '未获取到接口数据', '#e53e3e'); return; }
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

function buildExportPayload(apis) {
    return apis.map(api => ({ apiId: api.id, formatType: localStorage.getItem(getContentTypeKey(api.id)) || 'null' }));
}

async function fetchBatchData(apis) {
    const payload = buildExportPayload(apis);
    const res = await request.post('/api/export', payload);
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
        explanation: p.explanation || '',
        isNecessary: p.necessary === true || p.isNecessary === true
    };
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
    apiInfoDiv.appendChild(createInfoItem('修改者', api.updateUser || api.modifiedBy));
    apiInfoDiv.appendChild(createInfoItem('创建者', api.createUser || api.createdBy));
    apiInfoDiv.appendChild(createInfoItem('责任人', api.inChargeUser));
    container.appendChild(apiInfoDiv);

    const hasQuery = params.query && params.query.length > 0;
    const hasHeader = params.header && params.header.length > 0;
    const hasBody = params.body && params.body.length > 0;
    if (hasQuery || hasHeader || hasBody) {
        const paramsTitle = document.createElement('h3');
        paramsTitle.className = 'preview-params-title';
        paramsTitle.textContent = '请求参数';
        container.appendChild(paramsTitle);
    }
    if (hasQuery) container.appendChild(buildParamBlock('preview-query-info', 'query-title', 'Query 参数', params.query));
    if (hasHeader) container.appendChild(buildParamBlock('preview-headers-info', 'headers-title', 'Headers 参数', params.header));
    if (hasBody) container.appendChild(buildParamBlock('preview-body-info', 'body-title', 'Body 参数', params.body));

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

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(categoryName || '接口文档')} - 批量导出</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
<style>
*:not(pre):not(pre *){margin:0;padding:0;box-sizing:border-box;font-family:"Microsoft YaHei","PingFang SC",sans-serif;}
body{background:#f5f7fa;display:flex;height:100vh;overflow:hidden;}

#sidebar{width:300px;min-width:260px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin:1rem;padding:1.2rem;display:flex;flex-direction:column;overflow:hidden;}
#sidebar h3{color:#2d3748;font-size:1.1rem;font-weight:600;margin-bottom:0.8rem;padding-bottom:0.5rem;border-bottom:1px solid #e8e8e8;text-align:center;display:flex;align-items:center;gap:0.4rem;justify-content:center;}
#apiTreeContainer{flex:1;overflow-y:auto;}
#apiTreeContainer ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.1rem;}

.tree-category-row{display:flex;align-items:center;gap:0.35rem;padding:0.45rem 0.5rem;border-radius:6px;cursor:pointer;transition:background 0.2s;user-select:none;}
.tree-category-row:hover{background:#edf0f2;}
.tree-arrow{width:1rem;display:inline-flex;align-items:center;justify-content:center;color:#718096;font-size:0.7rem;flex-shrink:0;}
.tree-folder{width:1rem;display:inline-flex;align-items:center;justify-content:center;color:#718096;font-size:0.9rem;flex-shrink:0;}
.tree-category-name{flex:1;font-weight:500;color:#777;font-size:0.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.children-ul{margin-left:1.2rem;max-height:3000px;overflow:hidden;transition:max-height 0.25s ease,opacity 0.2s ease;opacity:1;}
.children-ul.collapsed{max-height:0;opacity:0;}

.api-row{display:flex;align-items:center;gap:0.4rem;padding:0.45rem 0.5rem;border-radius:6px;cursor:pointer;transition:background 0.2s;}
.api-row:hover{background:#edf0f2;}
.api-row.active{background:#e8f0fe;}
.api-row .api-method{font-weight:600;font-size:0.82rem;min-width:48px;text-align:center;flex-shrink:0;}
.api-row .api-name{flex:1;font-weight:300;color:#718096;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.api-row .status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-left:4px;}

#main{flex:1;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin:1rem 1rem 1rem 0;padding:1.5rem;overflow-y:auto;}
#main .empty-hint{display:flex;align-items:center;justify-content:center;height:100%;color:#a0aec0;font-size:1.1rem;}

/* ===== 复用 detail.html 预览区样式 ===== */
.preview-container{display:flex;flex-direction:column;gap:1.5rem;}
.preview-title{color:#2d3748;padding-bottom:0.5rem;text-align:left;border-bottom:transparent;margin:0.5rem 0;font-size:1.4rem;font-weight:600;}

.url-status-div{display:flex;align-items:center;flex-wrap:wrap;padding:1rem 0;gap:0.5rem;margin-top:-3rem;}
.url-span-display{display:inline-block;max-width:100%;padding:0.3rem 0.45rem;border-radius:12px;border:1px solid transparent;background:#f5f7fa!important;width:fit-content;overflow:hidden;}
.method-span-display{display:inline-block;padding:0.3rem 0.45rem;border-radius:6px;border:1px solid transparent;color:#fff;font-weight:600;}
.url-text-display{display:inline-block;max-width:100%;padding:0.3rem 0.45rem;border-radius:6px;border:1px solid transparent;background:transparent;color:#2d3748;}

.status-span{position:relative;display:inline-flex;align-items:center;gap:0.35rem;font-size:0.95rem;padding:0.3rem 0.45rem;border:1px solid transparent;border-radius:6px;background:transparent;}
.status-dot{width:6px;height:6px;border-radius:50%;}
.status-option-list{display:none!important;}

.api-info-div{display:flex;flex-wrap:wrap;align-items:center;gap:0.6rem 1.5rem;border:none;margin-bottom:1rem;}
.api-info-item{display:inline-flex;align-items:center;gap:0.35rem;white-space:nowrap;}
.api-info-label{color:#8f96a3;}
.api-info-value{color:#000;}

.preview-params-title{font-size:1rem;font-weight:600;color:#2d3748;margin-bottom:-0.5rem;margin-top:1.5rem;}
.preview-params-div{border:1px solid #e8e8e8;border-radius:8px;padding:0.75rem;background:#fff;display:block;margin-bottom:0.5rem;}
.preview-query-info,.preview-headers-info,.preview-body-info{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;border-bottom:1px solid #e8e8e8;padding-bottom:0.5rem;}
.query-title,.headers-title,.body-title{font-size:0.9rem;font-weight:600;color:#2d3748;}

.params-list-display{list-style:none;padding:0.25rem 0;margin:0;}
.params-list-display li{position:relative;display:flex;gap:0.75rem;align-items:center;padding:0.35rem 0;border:none;}
.params-table-display{width:100%;border-collapse:collapse;margin-top:0.25rem;}
.params-table-display tr{position:relative;display:flex;gap:0.75rem;align-items:center;padding:0.35rem 0;border:none;}
.connector-cell{width:auto;color:#cbd5e0;white-space:pre;}

.param-name-display{color:#62a3e9;background:rgba(66,153,225,0.08);padding:0.25rem 0.5rem;border-radius:6px;font-weight:550;font-size:0.8rem;width:fit-content;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;text-align:center;}
.param-type-display,.param-explanation{color:#9aa3ad;font-size:0.9rem;}
.param-is-necessary-display{position:absolute;color:#e57b3e;font-size:0.9rem;right:16rem;}
.param-is-not-necessary-display{position:absolute;color:#9aa3ad;font-size:0.9rem;right:16rem;}
.response-is-necessary-display{position:absolute;color:#e57b3e;font-size:0.9rem;right:1rem;}
.response-is-not-necessary-display{position:absolute;color:#9aa3ad;font-size:0.9rem;right:1rem;}

.response-label-container{display:flex;font-weight:600;}
.response-label{display:flex;flex-direction:row;align-items:center;padding:0.5rem 0.7rem;border-top-left-radius:6px;border-top-right-radius:6px;border:1px solid #e8e8e8;border-bottom:transparent;color:#4a5568;font-size:0.92rem;}
.response-fill-label{display:flex;border-bottom:1px solid #e8e8e8;flex:1;}
.code-label,.name-label{padding:0.1rem;border:transparent;color:#4a5568;font-size:0.92rem;}

.preview-response-container{display:flex;flex-direction:row;border:1px solid #e8e8e8;border-radius:0 6px 6px 6px;padding:0rem 0.75rem;margin-top:-1.5rem;background:#fff;border-top:transparent;}
.response-preview-div{min-width:30rem;margin-top:0.75rem;margin-bottom:0.5rem;}
.preview-response-info-label{margin-bottom:1rem;display:block;}
.preview-type-label{display:inline-flex;align-items:center;justify-content:center;padding:0.25rem 0.6rem;border-radius:999px;background:#edf0f2;color:#4a5568;font-size:0.7rem;font-weight:550;white-space:nowrap;}
.preview-type-without-bg{display:inline-flex;align-items:center;justify-content:center;padding:0.25rem 0.6rem;border-radius:999px;background:transparent;color:#9aa3ad;font-size:0.7rem;white-space:nowrap;}
.response-json-example-div{flex:1;border-left:1px solid #e8e8e8;padding:0.75rem;background:#fff;}
.response-json-pre{margin-top:0.75rem;font-family:Consolas,Monaco,'Courier New',monospace!important;font-size:1rem;}
.response-no-label{color:#9aa3ad;font-size:0.9rem;}
.response-error-label{color:#e53e3e;font-size:0.9rem;}

/* JSON/XML 语法高亮 */
.json-punct{color:#d4d4d4;}.json-key{color:#569cd6;}.json-string{color:#9cdcfe;}.json-number,.json-boolean,.json-null{color:#9cdcfe;}
.xml-decl{color:#9cdcfe;}.xml-tag{color:#4ec96f;}.xml-punct{color:#d4d4d4;}.xml-text{color:#6a9955;}
.response-xml-pre{margin-top:0.75rem;font-family:Consolas,Monaco,'Courier New',monospace!important;font-size:1rem;}

::-webkit-scrollbar{width:6px;}
::-webkit-scrollbar-thumb{background:#cbd5e0;border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:#a0aec0;}

@media(max-width:768px){body{flex-direction:column;}#sidebar{width:100%;min-width:unset;max-height:40vh;}#main{margin:0 1rem 1rem;}}
</style>
</head>
<body>

<div id="sidebar">
    <h3><i class="bi bi-folder2-open"></i> ${esc(categoryName || '接口列表')}</h3>
    <div id="apiTreeContainer"></div>
</div>

<div id="main">
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

