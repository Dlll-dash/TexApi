import { httpMimeTypes,typeList } from "../config/TypeConfig.js";

export function createResponsePreviewDiv(response) {
    console.log('创建响应预览组件，响应数据：', response);
    const responsePreviewDiv = document.createElement('div');
    responsePreviewDiv.className = 'response-preview-div';

    
    const responseUl= document.createElement('ul');
    responseUl.className = 'params-list-display';
    let renderedAsTable = false;

    // 处理响应体Json数据，展示在预览窗口
    if(response) {
        //console.log('正在处理响应体数据：', response);
        try {
            const responseBody = typeof response === 'string' ? JSON.parse(response) : response;

            const responseTable = document.createElement('table');
            responseTable.className = 'params-table-display';
            responseTable.style.width = '100%';
            responseTable.style.borderCollapse = 'collapse';

            

            const tableBody = document.createElement('tbody');

            function renderResponseBody(responseBody, depth = 0) {
                if (!responseBody || typeof responseBody !== 'object') {
                    return;
                }

                Object.entries(responseBody).forEach(([key, value]) => {
                    if (!key ||!value || typeof value !== 'object') {
                        return;
                    }
                    console.log('正在渲染响应体字段：', key, value);
                    const li = document.createElement('tr');


                    const keyCell = document.createElement('td');
                    keyCell.className = 'param-name-display';
                    keyCell.textContent = key || '(空键)';
                    keyCell.style.marginLeft = `${0.75 + depth * 1.25}rem`;


                    const typeCell = document.createElement('td');
                    typeCell.textContent = value.type || '';
                    typeCell.className = 'param-type-display';

                    const explanationCell = document.createElement('td');
                    explanationCell.textContent = value.explanation || '';
                    explanationCell.className = 'param-explanation';

                    li.appendChild(keyCell);
                    li.appendChild(typeCell);
                    li.appendChild(explanationCell);
                    tableBody.appendChild(li);

                    if (value.type === typeList.object && value.value && typeof value.value === 'object') {
                        renderResponseBody(value.value, depth + 1);
                    }
                });
            }
            
            renderResponseBody(responseBody);
            console.log('完成响应体渲染，表格内容：', tableBody.innerHTML);
            responseTable.appendChild(tableBody);
            responsePreviewDiv.appendChild(responseTable);
            renderedAsTable = true;
        } catch (e) {
            const errorLi = document.createElement('li');
            errorLi.textContent = "响应体非JSON格式，无法解析展示";
            errorLi.className = 'response-error-label';
            responseUl.appendChild(errorLi);
        }
    }
    if (!renderedAsTable) {
        responsePreviewDiv.appendChild(responseUl);
    }

    return responsePreviewDiv;
}

