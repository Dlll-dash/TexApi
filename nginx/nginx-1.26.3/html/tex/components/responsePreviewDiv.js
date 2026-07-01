import { httpMimeTypes,typeList } from "../config/TypeConfig.js";

export function createResponsePreviewDiv(response,responsePreviewDiv) {
    //console.log('创建响应预览组件，响应数据：', response);
    
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

            function buildConnectorText(depth, ancestors, isLast) {
                if (depth === 0) {
                    return '';
                }

                // Add blank prefixes according to the number of ancestors
                // Each ancestor contributes two spaces so the connector aligns by depth
                const blanks = '       '.repeat(Math.max(0, ancestors.length-1));
                return `${blanks}${isLast ? '└─' : '├─'}`;
            }

            function renderResponseBody(responseBody, depth = 0, ancestors = []) {
                if (!responseBody || typeof responseBody !== 'object') {
                    return;
                }

                const entries = Object.entries(responseBody).filter(([, value]) => value && typeof value === 'object');

                entries.forEach(([key, value], index) => {
                    if (!key ||!value || typeof value !== 'object') {
                        return;
                    }
                    //console.log('正在渲染响应体字段：', key, value);
                    const li = document.createElement('tr');
                    const isLast = index === entries.length - 1;

                    const connectorCell = document.createElement('td');
                    connectorCell.className = 'connector-cell';
                    connectorCell.textContent = buildConnectorText(depth, ancestors, isLast);
                    

                    const keyCell = document.createElement('td');
                    keyCell.className = 'param-name-display';
                    keyCell.textContent = key || '(空键)';


                    const typeCell = document.createElement('td');
                    typeCell.textContent = value.type || '';
                    typeCell.className = 'param-type-display';

                    const explanationCell = document.createElement('td');
                    explanationCell.textContent = value.explanation || '';
                    explanationCell.className = 'param-explanation';

                    const isNecessaryCell = document.createElement('td');
                    isNecessaryCell.textContent = value.isNecessary ? '必需' : '可选';
                    isNecessaryCell.className = value.isNecessary ? "response-is-necessary-display" : "response-is-not-necessary-display";

                    if(depth>0){
                        li.appendChild(connectorCell);
                    }
                    li.appendChild(keyCell);
                    li.appendChild(typeCell);
                    li.appendChild(explanationCell);
                    li.appendChild(isNecessaryCell);
                    tableBody.appendChild(li);

                    if (value.type === typeList.object && value.value && typeof value.value === 'object') {
                        renderResponseBody(value.value, depth + 1, [...ancestors, !isLast]);
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
    }else{
        const noResponseLi = document.createElement('li');
        noResponseLi.textContent = "该接口没有响应体";
        noResponseLi.className = 'response-no-label';
        responseUl.appendChild(noResponseLi);
    }
    
    if (!renderedAsTable) {
        responsePreviewDiv.appendChild(responseUl);
    }

}

