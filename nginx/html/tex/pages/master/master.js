import { renderTopBar } from '../../components/topBar.js';
import { createTreeTable } from '../../components/treeTable.js';
import { getUrlParams } from '../../config/AxiosConfig/AxiosConfig.js';
import { request } from '../../config/AxiosConfig/AxiosConfig.js';
import { showToast } from '../../components/toast.js';
import { ApiApi } from '../../api/ApiApi.js';
import { methodColors } from '../../config/MethodConfig.js';
import { statusColors, statusText } from '../../config/StatusConfig.js';
import { formatDateToChinese } from '../../utils/DateUtil.js';
import { createResponseJsonExampleDiv } from '../../components/responseJsonExampleDiv.js';
import { createResponseXmlExampleDiv } from '../../components/responseXmlExampleDiv.js';
import { TreeNode } from '../../module/BodyTree.js';

// ========== Init TopBar ==========
renderTopBar({
    dropdownItems: [
        {
            label: '个人主页',
            onClick: () => {
                window.location.href = '../user/profile.html';
            }
        },
        {
            label: '退出登录',
            onClick: () => {
                localStorage.clear();
                window.location.href = '/index.html';
            }
        }
    ]
});

// ========== Parse URL params ==========
const params = getUrlParams();
const projectId = params.id;
const projectName = decodeURIComponent(params.name || '未命名项目');

if (!projectId) {
    const panel = document.getElementById('previewPanel');
    if (panel) {
        panel.innerHTML = '<div class="empty-state"><div class="empty-state-text">缺少项目ID参数</div></div>';
    }
    throw new Error('缺少项目ID参数');
}

// Empty state "编辑接口" button
document.getElementById('btn-empty-edit')?.addEventListener('click', () => {
    window.location.href = `../detail/detail.html?id=${projectId}&name=${encodeURIComponent(projectName)}`;
});

// ========== Right Panel: Preview Rendering ==========
const previewPanel = document.getElementById('previewPanel');

function renderEmptyState() {
    if (!previewPanel) return;
    previewPanel.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="bi bi-journal-text"></i>
            </div>
            <div class="empty-state-title">选择接口查看详情</div>
            <div class="empty-state-desc">点击左侧树中的接口，即可查看完整的接口文档</div>
        </div>
    `;
}

let currentApiId = null;

async function renderPreview(apiData) {
    if (!previewPanel) return;
    previewPanel.innerHTML = '';
    currentApiId = apiData.id;

    const method = apiData.requestMethod || 'GET';
    const url = apiData.requestUrl || '';
    const methodColor = methodColors[method] || methodColors['DEFAULT'] || '#6b7280';

    // Header: project name + edit button
    const header = document.createElement('div');
    header.className = 'master-header';
    header.innerHTML = `
        <span class="project-title">${escapeHtml(projectName)}</span>
        <div class="header-actions">
            <button class="btn-edit" id="btn-edit-project">
                <i class="bi bi-pencil-square"></i> 编辑
            </button>
        </div>
    `;
    previewPanel.appendChild(header);

    // API name
    const apiName = document.createElement('div');
    apiName.className = 'preview-api-name';
    apiName.textContent = apiData.apiName || '未命名接口';
    previewPanel.appendChild(apiName);

    // URL row
    const urlRow = document.createElement('div');
    urlRow.className = 'preview-url-row';
    urlRow.innerHTML = `
        <span class="method-badge" style="background-color:${methodColor};color:#fff;">${method}</span>
        <span class="api-url">${escapeHtml(url)}</span>
    `;
    previewPanel.appendChild(urlRow);

    // Info grid
    const infoGrid = document.createElement('div');
    infoGrid.className = 'preview-info-grid';

    if (apiData.status !== undefined) {
        const statusColor = statusColors[apiData.status] || '#6b7280';
        const statusLabel = statusText[apiData.status] || '未知';
        infoGrid.innerHTML += `
            <div class="preview-info-item">
                <div class="info-label">状态</div>
                <div class="info-value" style="color:${statusColor};font-weight:600;">${statusLabel}</div>
            </div>
        `;
    }

    if (apiData.inChargeUser) {
        infoGrid.innerHTML += `
            <div class="preview-info-item">
                <div class="info-label">负责人</div>
                <div class="info-value">${escapeHtml(apiData.inChargeUser)}</div>
            </div>
        `;
    }

    if (apiData.createTime) {
        infoGrid.innerHTML += `
            <div class="preview-info-item">
                <div class="info-label">创建时间</div>
                <div class="info-value">${formatDateToChinese(apiData.createTime)}</div>
            </div>
        `;
    }

    if (apiData.updateTime) {
        infoGrid.innerHTML += `
            <div class="preview-info-item">
                <div class="info-label">更新时间</div>
                <div class="info-value">${formatDateToChinese(apiData.updateTime)}</div>
            </div>
        `;
    }

    previewPanel.appendChild(infoGrid);

    // Explanation
    if (apiData.explanation) {
        const expSection = document.createElement('div');
        expSection.className = 'preview-section';
        expSection.innerHTML = `
            <h4>接口说明</h4>
            <div class="preview-explanation">${escapeHtml(apiData.explanation)}</div>
        `;
        previewPanel.appendChild(expSection);
    }

    // Fetch params and response from master
    try {
        // Request params: query, body, headers
        const types = ['query', 'json', 'formData', 'urlencoded', 'header'];
        const paramResults = await Promise.allSettled(
            types.map(type =>
                request.get(`/request/param/master/list/${apiData.id}`, { params: { formatType: type } })
            )
        );

        // Query params
        const queryParams = getParamData(paramResults[0]);
        if (queryParams && queryParams.length > 0) {
            renderParamSection('Query 参数', queryParams);
        }

        // Body params — 根据 bodyType 选择格式
        const bodyType = apiData.bodyType;
        const bodyParamsJson = getParamData(paramResults[1]);
        const bodyParamsForm = getParamData(paramResults[2]);
        const bodyParamsUrlEncoded = getParamData(paramResults[3]);

        if (bodyType === 'json' && bodyParamsJson && bodyParamsJson.length > 0) {
            renderJsonBodyTable(bodyParamsJson);
        } else if (bodyType === 'formData' && bodyParamsForm && bodyParamsForm.length > 0) {
            renderParamSection('Body 参数 (Form-Data)', bodyParamsForm);
        } else if (bodyType === 'urlencoded' && bodyParamsUrlEncoded && bodyParamsUrlEncoded.length > 0) {
            renderParamSection('Body 参数 (URL-Encoded)', bodyParamsUrlEncoded);
        }

        // Headers
        const headerParams = getParamData(paramResults[4]);
        if (headerParams && headerParams.length > 0) {
            renderParamSection('Headers', headerParams);
        }
    } catch (err) {
        console.error('获取参数失败：', err);
    }

    // Response — first get list, then get full body by id
    try {
        const listRes = await request.get(`/response/master/list/${apiData.id}`);
        const respList = listRes?.data?.data;
        if (respList && respList.length > 0) {
            const respId = respList[0].id;
            const detailRes = await request.get(`/response/getResponse/${respId}`);
            const respData = detailRes?.data?.data;
            if (respData && respData.responseBody && respData.responseBody !== '{}') {
                const respSection = document.createElement('div');
                respSection.className = 'preview-section';
                const statusCode = respData.responseCode || '200';
                const contentType = respData.contentType || 'application/json';
                respSection.innerHTML = `
                    <h4>响应示例</h4>
                    <div class="preview-response-code">HTTP ${escapeHtml(String(statusCode))} &nbsp;|&nbsp; ${escapeHtml(contentType)}</div>
                `;
                const ct = contentType.toUpperCase();
                if (ct === 'XML') {
                    createResponseXmlExampleDiv(respData.responseBody, respSection);
                } else if (ct.includes('JSON')) {
                    createResponseJsonExampleDiv(respData.responseBody, respSection);
                } else {
                    const hint = document.createElement('div');
                    hint.className = 'preview-hint';
                    hint.textContent = '该响应类型暂不支持预览';
                    respSection.appendChild(hint);
                }
                previewPanel.appendChild(respSection);
            }
        }
    } catch (err) {
        console.log('无响应数据');
    }

    // Edit button handler — passes selected API via localStorage
    const editBtn = document.getElementById('btn-edit-project');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentApiId) {
                localStorage.setItem('selectedApiId', currentApiId);
            }
            window.location.href = `../detail/detail.html?id=${projectId}&name=${encodeURIComponent(projectName)}`;
        });
    }
}

function getParamData(result) {
    if (result.status === 'fulfilled' && result.value?.data?.data) {
        return Array.isArray(result.value.data.data) ? result.value.data.data : null;
    }
    return null;
}

function renderParamSection(title, params) {
    if (!previewPanel || !params.length) return;

    const section = document.createElement('div');
    section.className = 'preview-section';

    let tableHtml = `<h4>${escapeHtml(title)}</h4>
        <table class="preview-param-table">
            <thead><tr>
                <th>参数名</th><th>类型</th><th>必填</th><th>说明</th>
            </tr></thead><tbody>`;

    params.forEach(p => {
        const isRequired = p.isNecessary || p.isNecessary === 1;
        tableHtml += `<tr>
            <td>${escapeHtml(p.name || '')}</td>
            <td>${escapeHtml(p.type || 'string')}</td>
            <td>${isRequired ? '<span class="param-required">是</span>' : '否'}</td>
            <td>${escapeHtml(p.explanation || '')}</td>
        </tr>`;
    });

    tableHtml += '</tbody></table>';
    section.innerHTML = tableHtml;
    previewPanel.appendChild(section);
}

// JSON body 展开/收起表格 — 复用 BodyTree 解析，风格与其他参数表格一致
function renderJsonBodyTable(params) {
    if (!previewPanel || !params.length) return;
    const section = document.createElement('div');
    section.className = 'preview-section';

    let tableHtml = '<h4>Body 参数 (JSON)</h4><table class="preview-param-table"><thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead><tbody>';

    try {
        const json = JSON.parse(params[0].value || '{}');
        const root = TreeNode.convertFromJson(json);
        const rows = [];
        buildJsonRows(root.children, rows, 0);
        tableHtml += rows.join('');
    } catch (e) {
        tableHtml += '<tr><td colspan="4" class="preview-hint">无法解析 JSON</td></tr>';
    }

    tableHtml += '</tbody></table>';
    section.innerHTML = tableHtml;
    previewPanel.appendChild(section);

    // 绑定展开/收起事件
    section.querySelectorAll('.json-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const depth = parseInt(this.dataset.depth);
            const arrow = this;
            // 切换后续同级子行
            let next = this.parentElement.nextElementSibling;
            while (next) {
                const nextDepth = parseInt(next.dataset.depth || 0);
                if (nextDepth <= depth) break;
                next.style.display = next.style.display === 'none' ? '' : 'none';
                next = next.nextElementSibling;
            }
            arrow.textContent = arrow.textContent === '▶' ? '▼' : '▶';
        });
    });
}

function buildJsonRows(nodes, rows, depth) {
    if (!nodes) return;
    nodes.forEach(node => {
        const hasChildren = node.type === 'object' && node.children && node.children.length > 0;
        const indent = depth * 20;
        const arrow = hasChildren
            ? `<span class="json-toggle" data-depth="${depth}" style="cursor:pointer;margin-right:4px;">▶</span>`
            : '<span style="display:inline-block;width:16px;margin-right:4px;"></span>';

        rows.push(`<tr data-depth="${depth}">
            <td style="padding-left:${indent + 8}px;">${arrow}${escapeHtml(node.key || '')}</td>
            <td>${escapeHtml(node.type || 'string')}</td>
            <td>${node.isNecessary ? '<span class="param-required">是</span>' : '否'}</td>
            <td>${escapeHtml(node.explanation || '')}</td>
        </tr>`);

        if (hasChildren) {
            buildJsonRows(node.children, rows, depth + 1);
        }
    });
}

// ========== Init TreeTable (read-only master mode) ==========
const apiListContainer = document.getElementById('apiList');

createTreeTable(apiListContainer, {
    projectId: projectId,
    readOnly: true,
    apiListFetcher: async (pId) => {
        return await ApiApi.listMasters(pId);
    },
    onApiSelect: async (apiData) => {
        await renderPreview(apiData);
    }
});

// ========== Helpers ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
