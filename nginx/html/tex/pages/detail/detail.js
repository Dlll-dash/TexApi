import { getUrlParams } from "../../config/AxiosConfig/AxiosConfig.js";
import { ApiApi } from "../../api/ApiApi.js";
import { RequestParamsApi } from "../../api/RequestParamsApi.js";
import { showToast } from "../../components/toast.js";
import { createConfirmModal } from "../../components/tip.js";
import { methodlist,methodColors,methodBackroundColors } from "../../config/MethodConfig.js";
import { requestDataType,typeList,httpMimeTypes,queryTypeList,responseContentType as responseContentTypeMap, responseContentType} from "../../config/TypeConfig.js";
import { debugFormConfig,designFormConfig } from "../../config/FormConfig.js";
import { statusText,statusColors } from "../../config/StatusConfig.js";
import { TreeNode } from "../../module/BodyTree.js";
import { NodeMapManager } from "../../module/NodeMapManager.js";
import { codeColorMap,codeMessageMap,getCodeColor } from "../../config/ResponseConfig.js";
import { urlDisplay } from "../../components/urlSpan.js";
import { createApiStatusSpan } from "../../components/apiStatusSpan.js";
import { formatDateToChinese, formatRelativeTime } from "../../utils/DateUtil.js";
import { createParamList } from "../../components/paramList.js";
import { createResponseApi } from "../../api/ResponseApi.js";
import { createResponsePreviewDiv } from "../../components/responsePreviewDiv.js";
import { createResponseJsonExampleDiv } from "../../components/responseJsonExampleDiv.js";
import { createResponseXmlExampleDiv } from "../../components/responseXmlExampleDiv.js";
import {createTypeDropdown,closeActiveTypeDropdown,setupTypeDropdownClose} from "../../components/typeDropdown.js";
import {getIsNecessaryButton} from "../../components/isNecessaryButton.js";
import {getCheckButton,toCheckSquare,toDashSquare,toSquare,dashSquareIcon,squareIcon,checkSquareIcon} from "../../components/checkButton.js";
import { createTreeTable } from "../../components/treeTable.js";
import { createPromptModal } from "../../components/modal.js";
import { renderTopBar } from "../../components/topBar.js";
import { createJsonEditor } from "../../components/jsonEditor.js";
import { exportCategoryBatch, exportSingleApi } from "../../module/Export.js";

const nodeMap=NodeMapManager.getInstance();
let treeTableRef = null;
let detailMenuOutsideCloseBound = false;

/** 生成每个接口独立的 contentType 存储 key */
function getContentTypeKey(apiId) {
    return 'contentType_' + (apiId || 'default');
}

function createDetailMenuButton(label, svgPath, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    if (className) {
        button.className = className;
    }

    const icon = document.createElement('span');
    icon.className = 'menu-icon';
    icon.innerHTML = svgPath;

    const text = document.createElement('span');
    text.textContent = label;

    button.appendChild(icon);
    button.appendChild(text);
    return button;
}

const confirmModal = createConfirmModal('detail-confirm-modal', '确认操作');

function closeAllDetailMenus() {
    document.querySelectorAll('.more-menu-container.is-open').forEach(menu => {
        menu.classList.remove('is-open');
    });
}

function initTreeTable() {
    if (treeTableRef) return;

    const container = document.getElementById('apiList');
    if (!container) return;

    const params = getUrlParams();
    if (!params.id) return;

    const apiRenameModal = createPromptModal('api-rename-modal', '重命名接口');

    if (!detailMenuOutsideCloseBound) {
        document.addEventListener('click', closeAllDetailMenus);
        detailMenuOutsideCloseBound = true;
    }

    treeTableRef = createTreeTable(container, {
        projectId: params.id,

        onApiSelect: (apiData) => {
            closeAllDetailMenus();
            renderTestWindow(apiData);
            localStorage.setItem('selectedApiId', apiData.id);
            document.getElementById('responseArea')?.remove();
            renderResponse(document.getElementById('testWindow'));
        },

        onApiRename: async (apiData) => {
            const newName = await apiRenameModal.open(apiData.apiName, '重命名接口');
            if (newName) {
                await ApiApi.updateInfo({ id: apiData.id, apiName: newName });
                if (treeTableRef) treeTableRef.refresh();
            }
        },

        onApiDelete: async (apiData) => {
            await ApiApi.delete(apiData.id);
            if (treeTableRef) treeTableRef.refresh();
        },

        onApiAdd: async (categoryId) => {
            const payload = {
                apiName: '未命名接口',
                requestMethod: 'GET',
                projectId: params.id,
                status: 1
            };
            if (categoryId) payload.categoryId = categoryId;
            const res = await ApiApi.add(payload);
            localStorage.setItem('selectedApiId', res?.data?.data?.id || '');
            return res?.data?.data || null;
        },

        onApiMove: async (apiData, targetCategoryId) => {
            await ApiApi.update({ id: apiData.id, categoryId: targetCategoryId
            });
        },

        onApiExport: (apiData) => {
            exportSingleApi(apiData);
        },

        onCategoryExport: (categoryId, categoryName) => {
            const params = getUrlParams();
            exportCategoryBatch(categoryId, categoryName, params.id);
        }
    });
}

async function fetchApiListAndRender() {
    const params = getUrlParams();
    if (!params.id) return [];

    if (!treeTableRef) {
        initTreeTable();
    } else {
        await treeTableRef.refresh();
    }
    if(document.querySelectorAll('.tree-api-row').length==0){
        
        const emptyDiv=document.createElement('div');
        emptyDiv.className = "empty-api-tip";
        emptyDiv.innerHTML=`<div class="empty-api-icon"><i class="bi bi-folder-plus"></i></div>
                            <div class="empty-api-title">暂无接口</div>
                            <div class="empty-api-desc">请先在左侧选择一个分类，再点击 + 创建第一个接口</div>
                            `;
        const subWindow=document.getElementById('subWindow');
        console.log("subWindow容器为空");
        subWindow.appendChild(emptyDiv);
    
    }
    return [];
}

/*
 * 渲染接口测试窗口框架
 * @param {单个api的数据} apiData 
 */
function renderTestWindow(apiData){
    const container=document.getElementById('testWindow');
    if(!container) {
        //console.log("testWindow容器为空");
        return;
    }

    // 顶部标签容器，统一样式
    const tabContainer = document.getElementById('tabContainer');
        if(!tabContainer) {
            //console.log("tabContainer容器为空");
            return;
        }
        

    //右边的块区顶部，三个span区
    let debugSpan = document.getElementById('debugTab');
    //console.log("debugSpan:",debugSpan);
    if(!debugSpan) {
        debugSpan = document.createElement('span');
        debugSpan.id = 'debugTab';
        debugSpan.textContent = '调试';
        debugSpan.className = "test-tab"; // 默认激活
    }

    //点击事件
    debugSpan.onclick=function(){
        // 切换标签样式
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        debugSpan.classList.add('active');
        renderDebug(apiData,debugFormConfig);
        renderResponse(container);

    };

    let designSpan = document.getElementById('designTab');
    if(!designSpan) {
        designSpan = document.createElement('span');
        designSpan.id = 'designTab';
        designSpan.textContent='设计';
        designSpan.className = "test-tab";
    }

    //点击事件
    designSpan.onclick=function(){
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        designSpan.classList.add('active');

        // 切换到非调试区时移除响应区域，保持界面简洁
        if(document.getElementById('responseArea')) {
            container.removeChild(document.getElementById('responseArea'));
        }

        renderDesign(apiData,designFormConfig);
    };

    let previewSpan = document.getElementById('previewTab');
    if(!previewSpan) {
        previewSpan = document.createElement('span');
        previewSpan.id = 'previewTab';
        previewSpan.textContent = '预览';
        previewSpan.className = "test-tab";
    }

    //点击事件
    previewSpan.onclick=function(){
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        previewSpan.classList.add('active');

        // 切换到非调试区时移除响应区域，保持界面简洁
        if(document.getElementById('responseArea')) {
            container.removeChild(document.getElementById('responseArea'));
        }

        renderPreview(apiData);
    };

    
    tabContainer.appendChild(debugSpan);
    tabContainer.appendChild(designSpan);
    tabContainer.appendChild(previewSpan);
    //默认打开debug区，先点一下design保证初始化
    designSpan.click();
    debugSpan.click();

}


/**
 * 渲染调试窗口
 * @param {传入单个api} apiData 
 * @param {传入配置对象} config 
 */
function renderDebug(apiData,config){
    console.log("配置：",config);

    const container=document.getElementById('subWindow');
    if(!container) {
        //console.log("subWindow容器为空");
        return;
    }
    container.innerHTML="";//清空原有内容
    container.className = "debug-container"; // 新增容器类名

    // 创建请求行容器
    const requestLine = document.createElement('div');
    requestLine.id = "requestLine";
    requestLine.className = "request-line";

    const methodSpan=document.createElement('span');
    const urlInput=document.createElement('input');
    const submitButton=document.createElement('button');

    methodSpan.textContent=apiData.requestMethod;
    methodSpan.className='methodValue';
    

    // 复用请求方法颜色逻辑
    methodSpan.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];
    methodSpan.style.backgroundColor = methodBackroundColors[apiData.requestMethod] || methodBackroundColors['DEFAULT'];

    const optionList=document.createElement('ul');
    optionList.className = "option-list";

    // 创建下拉选项列表
    methodlist.forEach(method => {

        const option=document.createElement('li');

        option.className = "option-item";

        option.textContent=method;
        option.style.color = methodColors[method] || methodColors['DEFAULT'];

        //下拉选项点击事件
        option.addEventListener('click', () => {

            // 更新接口数据中的请求方法
            apiData.requestMethod = option.textContent; 

            // 更新界面显示的请求方法
            methodSpan.textContent = apiData.requestMethod; 
            methodSpan.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];
            methodSpan.style.backgroundColor = methodBackroundColors[apiData.requestMethod] || methodBackroundColors['DEFAULT'];

            // 更新接口数据中的请求方法后，发送更新接口的请求，保持数据同步
            ApiApi.update({ id: apiData.id, apiName: apiData.apiName, requestMethod: apiData.requestMethod, requestUrl: apiData.requestUrl, status: apiData.status });

            optionList.style.display = 'none'; // 隐藏选项列表

        });

        optionList.appendChild(option);

    });
    

    // 请求方法点击事件
    methodSpan.addEventListener('click', function(e){

        e.stopPropagation(); // 阻止事件冒泡，避免触发li的点击事件
        optionList.style.display = optionList.style.display === 'block' ? 'none' : 'block';

    });

    // 点击页面其他地方关闭下拉框
    document.addEventListener('click', () => {
        optionList.style.display = 'none';
    });



    urlInput.value=apiData.requestUrl || '';
    urlInput.className='url';
    urlInput.placeholder = "接口请求地址";
    urlInput.addEventListener('blur',function(){
        apiData.requestUrl= urlInput.value.trim(); // 更新接口数据中的url字段，后续发送请求时可以用到
        ApiApi.update({ id: apiData.id, apiName: apiData.apiName, requestMethod: apiData.requestMethod, requestUrl: apiData.requestUrl, status: apiData.status }); // 发送更新接口的请求，保持数据同步
        //alert('接口URL已更新'); 
    });

    submitButton.textContent='发送';
    submitButton.className = "submit-btn";
    submitButton.addEventListener('click', function() {
        const btn=this;
        btn.disabled = true; // 发送请求后禁用按钮，避免重复点击

        const responseContent = document.querySelector('.response-content');
        const responseCode = document.querySelector('.response-area-code');
        const responseTimeTitle = document.querySelector('.response-time-title');
        const responseTime= document.querySelector('.response-area-time');
        responseTime.textContent = '';
        const minLoadingTime = 30;
        const maxLoadingTime = 10000;
        const loadingHtml = `<div class="loading-container"><div class="loading-spinner"></div><span>加载中...</span></div>`;
        const startTime = Date.now();
        let settled = false;
        let maxLoadingTimer = null;

        

        function clearMaxLoadingTimer() {
            if (maxLoadingTimer) {
                clearTimeout(maxLoadingTimer);
                maxLoadingTimer = null;
            }
        }

        function finishWithDelay(renderFn) {
            if (settled) {
                return;
            }
            settled = true;
            clearMaxLoadingTimer();

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadingTime - elapsed);
            if (responseTime) {
                const timeText = elapsed >= 1000
                    ? `${(elapsed / 1000).toFixed(2)} s`
                    : `${elapsed} ms`;
                responseTime.textContent = timeText;
                if (responseTimeTitle) {
                    responseTimeTitle.style.display = 'inline-block';
                }
            }
            setTimeout(renderFn, remaining);
        }

        if (responseContent) {
            responseContent.innerHTML = loadingHtml;
            responseContent.style.color = "";
            responseContent.style.fontFamily = "inherit";
        }

        if (responseCode) {
            responseCode.textContent = '';
            responseCode.style.color = '';
        }

        maxLoadingTimer = setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            if (responseContent) {
                responseContent.textContent = '请求超时，已停止等待响应';
                responseContent.style.color = '#e53e3e';
                responseContent.style.fontFamily = 'inherit';
            }
            if (responseCode) {
                responseCode.textContent = '';
                responseCode.style.color = '';
            }
            if(responseTime) {
                const timeoutText = maxLoadingTime >= 1000
                    ? `>${(maxLoadingTime / 1000).toFixed(2)} s`
                    : `>${maxLoadingTime} ms`;
                responseTime.textContent = timeoutText;
                if (responseTimeTitle) {
                    responseTimeTitle.style.display = 'inline-block';
                }
            }
        }, maxLoadingTime);

        console.log(`接口${apiData.id}发送${apiData.requestMethod}请求到：${urlInput.value}`);

        //发送请求，告诉后端apiId为xxx的接口要发送请求了，在后端向指定接口发送请求
        ApiApi.send({
            apiId: apiData.id,
            contentType: localStorage.getItem(getContentTypeKey(apiData.id)) || requestDataType.None
        }).then(res => {
            finishWithDelay(() => {
                if (!responseContent) {
                    return;
                }

                const responseData = res?.data?.data;
                const rawBody = responseData?.body;

                if (rawBody !== undefined && rawBody !== null) {
                    let formattedData = rawBody;
                    if (typeof rawBody === 'string') {
                        try {
                            formattedData = JSON.parse(rawBody);
                        } catch (parseErr) {
                            formattedData = rawBody;
                        }
                    }

                    responseContent.textContent = typeof formattedData === 'string'
                        ? formattedData
                        : JSON.stringify(formattedData, null, 2);
                    responseContent.style.color = '#000';
                    responseContent.style.fontFamily = 'Consolas, monospace';
                } else {
                    responseContent.textContent = codeMessageMap[responseData?.code] || '请求成功但无响应体';
                    if(res.data.code === 0) {
                        responseContent.textContent = codeMessageMap[0]+"（"+(res.data.msg || '未知错误')+"）";
                    }
                    responseContent.style.color = '#e53e3e';
                    responseContent.style.fontFamily = 'inherit';
                }

                if (responseCode) {
                    const statusCode = responseData?.code || 0;
                    responseCode.textContent = statusCode;
                    responseCode.style.color = getCodeColor(statusCode);
                }
            });
        }).catch(err => {
            finishWithDelay(() => {
                if (!responseContent) {
                    return;
                }

                responseContent.textContent = `错误: ${err.response?.data?.message || err.message || '未知错误'}`;
                responseContent.style.color = '#e53e3e';
                responseContent.style.fontFamily = 'inherit';

                if (responseCode) {
                    responseCode.textContent = '';
                    responseCode.style.color = '';
                }
            });
        })
         .finally(() => {
            btn.disabled = false; // 请求完成后重新启用按钮
         });
    })

    requestLine.appendChild(methodSpan);
    requestLine.appendChild(urlInput);
    requestLine.appendChild(submitButton);
    requestLine.appendChild(optionList); // 将选项列表添加到请求行容器中

    container.appendChild(requestLine);
    
    // 请求信息标签区
    const requestInfo = document.createElement('div');
    requestInfo.className = "request-info";
    requestInfo.id = "requestInfo";

    const Params= document.createElement('span');
    Params.className = "test-tab active"; // 默认激活
    const Body=document.createElement('span');
    Body.className = "test-tab";
    const Headers=document.createElement('span');
    Headers.className = "test-tab";

    Params.textContent='Params';
    Body.textContent='Body';
    Headers.textContent='Headers';

    requestInfo.appendChild(Params);
    requestInfo.appendChild(Body);
    requestInfo.appendChild(Headers);

    container.appendChild(requestInfo);
    
    
    const requestArea = document.createElement('div');
    requestArea.id = "requestArea";
    requestArea.className = "request-area";
    requestArea.dataset.apiId= apiData.id; // 存储当前接口id，后续发送请求时可以用到
    container.appendChild(requestArea);
    

    //Params点击事件
    Params.onclick=function(){
        // 切换激活状态
        requestInfo.querySelectorAll('.test-tab').forEach(tab => tab.classList.remove('active'));
        Params.classList.add('active');
        //console.log("配置：",config);
        renderParams(requestArea,config);
    }
    //Body点击事件
    Body.onclick=function(){
        requestInfo.querySelectorAll('.test-tab').forEach(tab => tab.classList.remove('active'));
        Body.classList.add('active');
        renderBody(requestArea,config);
    }
    //Headers点击事件
    Headers.onclick=function(){
        requestInfo.querySelectorAll('.test-tab').forEach(tab => tab.classList.remove('active'));
        Headers.classList.add('active');
        renderHeaders(requestArea,config);
    }

    renderParams(requestArea,config); // 默认打开Params区
    //renderResponse(requestArea); 
}

function renderResponse(container){

    if(document.getElementById('responseArea')) {
        return; // 已经渲染过了就不重复渲染
    }

    const responseDiv=document.createElement('div');
    responseDiv.className = "response-container";
    responseDiv.id="responseArea";
    const responseTitleSpan = document.createElement('span');
    // 响应结果标题
    const responseTitle = document.createElement('span');
    responseTitle.className = "response-title";
    responseTitle.textContent = "响应结果：";
    responseTitleSpan.appendChild(responseTitle);

    const statusSpan = document.createElement('span');
    statusSpan.className = "response-area-code";
    responseTitleSpan.appendChild(statusSpan);

    responseDiv.appendChild(responseTitleSpan);
    
    //响应时间标题
    const responseTimeTitle = document.createElement('span');
    const responseTimeSpan = document.createElement('span');
    responseTimeTitle.textContent = "响应时间：";
    responseTimeTitle.className = "response-time-title";
    responseTimeSpan.className = "response-area-time";
    responseTimeTitle.appendChild(responseTimeSpan);
    responseDiv.appendChild(responseTimeTitle);

    // 拖拽手柄，用于调整响应区域高度
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = '拖动调整高度';

    // 新增响应结果区域，美化调试窗口
    const responseArea = document.createElement('div');
    responseArea.className = "response-area";
    const responseContent = document.createElement('pre');
    responseContent.className = "response-content";
    responseContent.innerHTML = `<i class="bi bi-rocket-takeoff"></i> 点击发送按钮后显示响应结果`;
    responseContent.style.color = "#adabab";// 默认提示文字颜色

    responseArea.appendChild(responseContent);
    responseDiv.appendChild(resizeHandle);
    responseDiv.appendChild(responseArea);

    // 将手柄移动到容器最顶部（作为上边界）
    responseDiv.insertBefore(resizeHandle, responseDiv.firstChild);

    container.appendChild(responseDiv);

    // === 拖拽调整响应区域高度 ===
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = responseArea.offsetHeight;

        document.body.style.userSelect = 'none';
        document.body.classList.add('resize-active');

        function onMouseMove(e) {
            const delta = startY - e.clientY; // 向上拖 = delta 为正 = 高度增大
            const newHeight = Math.min(600, Math.max(80, startHeight + delta));
            responseArea.style.height = newHeight + 'px';
        }

        function onMouseUp() {
            document.body.style.userSelect = '';
            document.body.classList.remove('resize-active');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

//渲染Params参数列表
function renderParams(container,config){
    container.innerHTML = ""; // 清空
    //创建Params块
    const querySpan=document.createElement('span');
    querySpan.textContent="Query参数";
    querySpan.className = 'query-label';
    container.appendChild(querySpan);

    const queryArea=document.createElement('div');
    queryArea.dataset.type = requestDataType.Query; // 标记数据类型，方便发送请求时区分
    renderform(queryArea,config);// 复用formData的渲染函数
    container.appendChild(queryArea);
    
}

//渲染Body参数列表
function renderBody(container,config){
    container.innerHTML = ""; // 清空
    const apiId = document.getElementById('requestArea')?.dataset?.apiId; // 获取当前接口id
    // //创建Body块
    // const bodyTitle = document.createElement('span');
    // bodyTitle.textContent = "请求体格式";
    // bodyTitle.className = 'body-label';

    // container.appendChild(bodyTitle);

    // 格式选择区域
    const formatContainer = document.createElement('div');
    formatContainer.style.display = 'flex';
    formatContainer.style.gap = '0.5rem';
    formatContainer.style.marginBottom = '1rem';

    const noneSpan = document.createElement('span');
    noneSpan.textContent = 'none';
    noneSpan.className = 'body-format-tab'; 

    const formDataSpan = document.createElement('span');
    formDataSpan.textContent = 'form-data';
    formDataSpan.className = 'body-format-tab';

    const jsonSpan = document.createElement('span');
    jsonSpan.textContent = 'json';
    jsonSpan.className = 'body-format-tab';

    const urlencodedSpan = document.createElement('span');
    urlencodedSpan.textContent = 'x-www-form-urlencoded';
    urlencodedSpan.className = 'body-format-tab';

    // 点击事件
    noneSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        noneSpan.classList.add('active');
        localStorage.setItem(getContentTypeKey(apiId),requestDataType.None );
        ApiApi.setBodyType(apiId, 'none').catch(() => {});
        contentDiv.innerHTML = "<div class='empty-tip'>该请求没有Body</div>";
    };

    formDataSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        formDataSpan.classList.add('active');
        localStorage.setItem(getContentTypeKey(apiId),requestDataType.FormData );
        ApiApi.setBodyType(apiId, 'formData').catch(() => {});

        contentDiv.dataset.type = requestDataType.FormData;
        renderform(contentDiv,config);
    };

    jsonSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        jsonSpan.classList.add('active');
        localStorage.setItem(getContentTypeKey(apiId),requestDataType.Json );
        ApiApi.setBodyType(apiId, 'json').catch(() => {});
        contentDiv.dataset.type = requestDataType.Json;
        contentDiv.innerHTML = '';
        contentDiv.appendChild(createJsonEditor({ placeholder: '输入JSON格式的请求体' }));

        //获取已有的Json数据并预填充
        RequestParamsApi.list(apiId, requestDataType.Json)
        .then(res => {
            if(res.data) {
                const jsonString=res.data.data[0].value;
                console.log('获取已有Json数据成功：', jsonString);
                console.log('结果类型：', typeof(jsonString));
                contentDiv.querySelector('.json-input').value = jsonString; 
                contentDiv.dataset.id= res.data.data[0].id; // 存储json数据的id，方便后续更新
            }
        });

        
        
        //设置监听
        contentDiv.querySelector('.json-input').addEventListener('blur', function() {
            const jsonString = this.value.trim();
           
            if(jsonString) {
                const param=[
                    'Json',
                    jsonString,
                    requestDataType.Json,
                    '',
                    apiId
                ];

                //只有一个Json
                if(!contentDiv.dataset.id) {
                    RequestParamsApi.add({ name: param[0], value: param[1], type: param[2], explanation: param[3], apiId: param[4], isNecessary: param[5], isChecked: param[6], formatType: requestDataType.Json })
                    .then(res => {
                        //alert('Json保存成功');
                        if(res.data && res.data.data && res.data.data.id) {
                            contentDiv.dataset.id = res.data.data.id;
                        }
                    })
                }else{
                    //alert('Json更新成功');
                    RequestParamsApi.update(contentDiv.dataset.id, { name: param[0], value: param[1], type: param[2], explanation: param[3], apiId: param[4], formatType: requestDataType.Json });
                }
            }
        });
        
    };

    urlencodedSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        urlencodedSpan.classList.add('active');
        localStorage.setItem(getContentTypeKey(apiId),requestDataType.Urlencoded );
        ApiApi.setBodyType(apiId, 'urlencoded').catch(() => {});
        contentDiv.dataset.type = requestDataType.Urlencoded;
        renderform(contentDiv,config);
    };


    formatContainer.appendChild(noneSpan);
    formatContainer.appendChild(formDataSpan);
    formatContainer.appendChild(jsonSpan);
    formatContainer.appendChild(urlencodedSpan);

    container.appendChild(formatContainer);

    // 内容区域
    const contentDiv = document.createElement('div');
    contentDiv.className = 'body-content';
    const contentType=localStorage.getItem(getContentTypeKey(apiId)) || requestDataType.None; // 从本地存储获取之前选择的请求体格式，默认为none
    console.log("当前请求体格式：", contentType);

    // 根据之前选择的请求体格式，默认展示对应的内容
    if(contentType === requestDataType.FormData) {
        formDataSpan.click(); 
    } else if(contentType === requestDataType.Json) {
        jsonSpan.click();
    } else if(contentType === requestDataType.Urlencoded) {
        urlencodedSpan.click();
    } else {
        noneSpan.click();
    }
    container.appendChild(contentDiv);

    
}

//渲染Headers列表
function renderHeaders(container,config){
    container.innerHTML = ""; // 清空
    //创建Headers块
    const headerArea=document.createElement('div');
    headerArea.dataset.type = requestDataType.Header; // 标记数据类型，方便发送请求时区分
    renderform(headerArea,config); // 复用formData的渲染函数
    container.appendChild(headerArea);
}




//统一创建表单函数
function renderform(container,config){
    container.innerHTML = "";
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    setupTypeDropdownClose();

    // 创建formData列表（保留原id以兼容现有CSS）
    const ul = document.createElement('ul');
    ul.id = 'formDataList';

    // header 行（第一行为表头）
    const headerLi = document.createElement('li');
    headerLi.className = 'param-header-row';

    const checkAllButton = getCheckButton(); // 获取是否必须按钮
    checkAllButton.style.visibility = 'hidden'; // 隐藏全选按钮
    if(config===debugFormConfig){
        headerLi.appendChild(checkAllButton);
    }
    checkAllButton.addEventListener('click', function(e) {
        e.stopPropagation();
        let total = 0;
        let selected = 0;
        //计数是为了决定全选还是全不选
        ul.querySelectorAll('.check-button').forEach(btn => {
            if(btn !== checkAllButton && btn.style.visibility !== 'hidden'){
                total++;
                if(btn.classList.contains('active')){
                    selected++;
                }
            }
        });

        function selectAll() {
            ul.querySelectorAll('.check-button').forEach(btn => {
                if(btn !== checkAllButton && btn.style.visibility !== 'hidden'){
                    btn.classList.add('active');
                    toCheckSquare(btn);
                }
            });
        }
        function deselectAll() {
            ul.querySelectorAll('.check-button.active').forEach(btn => {
                if(btn !== checkAllButton && btn.style.visibility !== 'hidden'){
                    toSquare(btn);
                    btn.classList.remove('active');
                }
            });
        }
        if(total > 0){
            if(selected === total){
                toSquare(checkAllButton);
                checkAllButton.classList.remove('active');
                deselectAll();
            }else if(selected > 0 && selected < total){
                toCheckSquare(checkAllButton);
                if(!checkAllButton.classList.contains('active')){
                    checkAllButton.classList.add('active');
                }
                selectAll();
            }else if(selected === 0){
                toCheckSquare(checkAllButton);
                checkAllButton.classList.add('active');
                selectAll();
            }
        }
    });
    
    // 使用 config 来生成表头列，保持顺序一致
    config.forEach(item => {
        const span = document.createElement('span');
        span.className = `param-label param-label-${item.key}`;
        span.textContent = item.label || '';
        headerLi.appendChild(span);
    });

    // 追加与数据行等宽的隐藏占位元素，保证表头列与输入框对齐
    const removeSpacer = document.createElement('span');
    removeSpacer.style.visibility = 'hidden';
    removeSpacer.style.padding = '0.3rem 0.5rem';
    removeSpacer.style.border = '1px solid transparent';
    removeSpacer.innerHTML = '<i class="bi bi-dash-lg"></i>';
    headerLi.appendChild(removeSpacer);

    ul.appendChild(headerLi);

    // 更新删除按钮状态（仅显示有值行的删除按钮）
    function updateRemoveButtons() {
        const rows = ul.querySelectorAll('li:not(:first-child)');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.remove-btn');
            if(!removeBtn) return;
            let visible = false;
            row.querySelectorAll('input').forEach(input => {
                if(input.value && input.value.trim() !== '') visible = true;
            });
            removeBtn.style.visibility = visible ? 'visible' : 'hidden';
        });
    }

    // 添加数据行（保持原有输入类名，方便样式复用）
    function addFormDataItem(Data){
        
        const row = document.createElement('li');
        row.className = 'param-data-row';
        row.style.position = 'relative';

        const checkButton = getCheckButton();
        
        const keyInput = document.createElement('input');
        const valueInput = document.createElement('input');
        const typeInput = document.createElement('input');
        const isNecessaryButton = getIsNecessaryButton(); 
        const explainInput = document.createElement('input');
        const removeButton = document.createElement('button');

        keyInput.placeholder = '添加参数';
        keyInput.className = 'param-name-input';
        valueInput.className = 'param-value-input';
        typeInput.className = 'type-input';
        typeInput.readOnly = true; // 类型输入框只读，点击时显示下拉列表

        explainInput.className = 'explain-input';
        removeButton.innerHTML = '<i class="bi bi-dash-lg"></i>';
        removeButton.className = 'remove-btn';
        removeButton.style.visibility = 'hidden';

        if(Data){
            keyInput.value = Data.name || '';
            if(!keyInput.value.trim()) keyInput.placeholder = '参数名';
            valueInput.value = Data.value || '';
            typeInput.value = Data.type || '';
            explainInput.value = Data.explanation || '';
            row.dataset.id = Data.id;
            if(Data.isNecessary){
                isNecessaryButton.classList.add('active');
                isNecessaryButton.querySelector('.is-necessary-tip').textContent = '必须';
            }
            //console.log("Data.isChecked:",Data.isChecked);
            if(!Data.isChecked){
                checkButton.classList.remove('active');
                toSquare(checkButton);
            }else{
                checkButton.classList.add('active');
                toCheckSquare(checkButton);
            }
            
            
        }else{
            isNecessaryButton.style.visibility = 'hidden'; // 新增空行时隐藏是否必须按钮
            checkButton.style.visibility = 'hidden'; // 新增空行时隐藏是否选中按钮
            checkButton.classList.remove('active'); // 空行不计入选中统计
            toSquare(checkButton);
        }
        
        // 创建类型下拉列表容器
        const typeDropdownDiv = createTypeDropdown(queryTypeList, typeInput, row);

        if(config===debugFormConfig){
            //只有是调试表格才有勾选
            row.appendChild(checkButton);
            updateCheckAllButtonState(); // 初始化全选按钮状态; 
        }
        // 插入输入项，按照 config 的字段顺序
        config.forEach(item => {
            if(item.key === 'name') row.appendChild(keyInput);
            else if(item.key === 'value') row.appendChild(valueInput);
            else if(item.key === 'type') row.appendChild(typeInput);
            else if(item.key === 'isNecessary') row.appendChild(isNecessaryButton);
            else if(item.key === 'explanation') row.appendChild(explainInput);
        });
        row.appendChild(removeButton);
        checkAllButton.addEventListener('click', function(e){
            e.stopPropagation();
            ul.querySelectorAll('li').forEach(row => {
                // 更新每行的状态
                row.dispatchEvent(new Event('focusout')); // 触发失焦事件，保存数据
            })
        });
        // 失焦处理：和原逻辑保持一致（新增/更新）
        row.addEventListener('focusout',updateLi); 
        for(const option of typeDropdownDiv.children){
            option.addEventListener('click',updateLi);
        }
        function updateLi(e){
            setTimeout(() => {
            const isNecessaryButton = row.querySelector('.is-necessary-btn');
            const checkButton = row.querySelector('.check-button');

            if(e.target.tagName.toLowerCase() !== 'input'&& !isNecessaryButton&&!checkButton) return;
            if(keyInput.value.trim()&&!typeInput.value.trim()){
                typeInput.value = queryTypeList[0]; // 默认选择第一个类型
            }
            if(keyInput.value.trim() || valueInput.value.trim() || typeInput.value.trim() || explainInput.value.trim()){
                if(!keyInput.value.trim() && (valueInput.value.trim() || typeInput.value.trim() || explainInput.value.trim())){
                    keyInput.style.outline = '1px solid #e53e3e';
                    keyInput.style.outlineOffset = '0';
                    keyInput.placeholder = '参数名';
                } else {
                    keyInput.style.outline = '';
                    keyInput.placeholder = '添加参数';
                }
                
                if(!row.dataset.id){
                    // 新条目：先保持本地添加一空行
                    addFormDataItem(null);
                }
                isNecessaryButton.style.visibility = 'visible'; // 新增行后显示是否必须按钮
                let isChecked = null;
                if(config===debugFormConfig){
                    checkButton.style.visibility = 'visible'; // 新增行后显示是否选中按钮
                    updateCheckAllButtonState(); // 新增行后显示全选按钮
                    isChecked = checkButton.classList.contains('active') ? true : false;
                }
                
                const apiId = document.getElementById('requestArea').dataset.apiId;
                const isNecessary = isNecessaryButton.classList.contains('active') ? true : false;
                
                //console.log('isNecessary:', isNecessary);
                const paramData = { name: keyInput.value.trim(), value: valueInput.value.trim(), type: typeInput.value.trim(), explanation: explainInput.value.trim(), apiId: apiId, isNecessary: isNecessary, isChecked: isChecked, formatType: container.dataset.type };

                const req = row.dataset.id ? RequestParamsApi.update(row.dataset.id, paramData) : RequestParamsApi.add(paramData);
                req.then(res => {
                    if(res.data && res.data.data && res.data.data.id){
                        row.dataset.id = res.data.data.id;
                    }
                }).catch(err => {
                    console.error('保存参数失败：', err);
                });
            }
            updateRemoveButtons();
            },300);
        };
        
        isNecessaryButton.addEventListener('click', updateLi); // 点击是否必须按钮时也触发更新逻辑
       
        checkButton.addEventListener('click', function(e){
            updateCheckAllButtonState();
        });
        //更新事件要放在最后
        checkButton.addEventListener('click', updateLi); // 点击是否选中按钮时也触发更新逻辑

        function updateCheckAllButtonState() {
            let total = 0;
            let selected = 0;
            ul.querySelectorAll('.check-button').forEach(btn => {
                if(btn !== checkAllButton && btn.style.visibility !== 'hidden'){
                    total++;
                    if(btn.classList.contains('active')){
                        selected++;
                    }
                }
            });
            //console.log("更新全选按钮状态：selected:",selected,"total:",total);

            if(selected === total && total > 0){
                toCheckSquare(checkAllButton);
                if(!checkAllButton.classList.contains('active')){
                    checkAllButton.classList.add('active');
                }
            } else if(selected === 0 && total > 0){
                toSquare(checkAllButton);
                if(checkAllButton.classList.contains('active')){
                    checkAllButton.classList.remove('active');
                }
            }else if(selected > 0 && selected < total){
                toDashSquare(checkAllButton);
                if(!checkAllButton.classList.contains('active')){
                    checkAllButton.classList.add('active');
                }
            }
            if(total === 0){
                checkAllButton.style.visibility = 'hidden';
            }else{
                checkAllButton.style.visibility = 'visible';
            }
        }

        // 删除按钮行为：两步确认
        removeButton.dataset.confirmed = 'false';
        removeButton.onclick = function(e){
            e.stopPropagation();
            if(removeButton.dataset.confirmed === 'true'){
                if(row.dataset.id){
                    RequestParamsApi.delete(row.dataset.id);
                }
                const others = ul.querySelectorAll('li:not(:first-child)');
                if(others.length > 1){
                    ul.removeChild(row);
                } else {
                    row.querySelectorAll('input').forEach(i => i.value = '');
                    removeButton.dataset.confirmed = 'false';
                }
                updateRemoveButtons();
            } else {
                removeButton.classList.add('active');
                setTimeout(()=>{ removeButton.innerHTML = '<i class="bi bi-x-lg"></i>'; }, 200);
                removeButton.dataset.confirmed = 'true';
            }
        };
        removeButton.addEventListener('click', function(e){
            e.stopPropagation();
            updateCheckAllButtonState();
        });
        removeButton.addEventListener('mouseout', function(){
            this.classList.remove('active');
            this.dataset.confirmed = false;
            setTimeout(()=>{ this.innerHTML = '<i class="bi bi-dash-lg"></i>'; }, 200);
        });

        ul.appendChild(row);
        updateRemoveButtons();
        updateCheckAllButtonState(); // 新增行后更新全选按钮状态
    }

    try{
        const requestDataType = container.dataset.type;
        const apiId = document.getElementById('requestArea').dataset.apiId;
        RequestParamsApi.list(apiId, requestDataType)
        .then(res => {
            const paramsList = res.data.data || [];
            if(paramsList.length > 0){
                paramsList.forEach(param => {
                    const paramData = { name: param.name, value: param.value, type: param.type, explanation: param.explanation, id: param.id, isNecessary: param.isNecessary,isChecked: param.isChecked };
                    addFormDataItem(paramData);
                });
            }
            addFormDataItem(null); // 保持至少一个空行
            container.appendChild(ul);
            setTimeout(() => { container.style.opacity = 1; }, 0);
            
        }).catch(err => {
            console.error('获取参数列表失败：', err);
            container.appendChild(ul);
            setTimeout(() => { container.style.opacity = 1; }, 0);
        });
    }catch(err){
        console.error('获取参数列表失败详情：', err);
        container.appendChild(ul);
        setTimeout(() => { container.style.opacity = 1; }, 0);
    }
}


//更新接口信息的请求函数
function updateApiInfoArea(requestBodyData={id,apiName, explanation, status, inChargeUser}) {
        ApiApi.updateInfo(requestBodyData)
        // fetchApiListAndRender();
    }

/**
 * 渲染设计窗口（美化补全）
 * @param {传入单个api} apiData 
 * @param {传入配置对象} config 
 */
function renderDesign(apiData,config){
    
    


    const container=document.getElementById('subWindow');
    container.innerHTML = "";
    container.className = "design-container";
    container.dataset.apiId=apiData.id;
    console.log("设计窗口接口数据：", apiData);
    //初始化响应区域的接口实例
    const responseApi= createResponseApi(apiData.id);

    // 复用调试窗口的接口基本信息展示部分（url，请求参数），保持设计窗口和调试窗口风格一致
    renderDebug(apiData,config);

    //草稿发布按钮（设计界面url后面，样式同发送按钮）
    if (apiData.isDraft) {
        const requestLine = document.getElementById('requestLine');
        if (requestLine) {
            const publishBtn = document.createElement('button');
            publishBtn.textContent = '发布';
            publishBtn.className = 'submit-btn';
            publishBtn.addEventListener('click', () => handlePublish(apiData));
            requestLine.appendChild(publishBtn);
        }
    }

    const requestInfo = document.getElementById('requestInfo');

    const apiInfoArea = document.createElement('div');
    apiInfoArea.className = "api-info-area";

    const apiTitleDiv = document.createElement('div');
    apiTitleDiv.className = "api-title-div";    

    const apiName = document.createElement('input');
    apiName.value = apiData.apiName || '未命名接口';
    apiName.className = "api-name-input";
    
    const statusSpan = createApiStatusSpan(apiData.status);

    const statusUl = statusSpan.querySelector('.status-option-list');

    //手动补充额外的下拉选项的点击事件逻辑，更新接口状态并发送更新请求
    statusUl.querySelectorAll('.status-option-item').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            apiData.status = this.dataset.statusValue; // 更新接口数据中的状态字段，后续发送请求时可以用到
            const requestBodyData = {
                "id": apiData.id,
                "apiName": apiName.value.trim(),
                "explanation": apiExplanation.value.trim(),
                "status": statusSpan.dataset.status,
                "inChargeUser": apiInChargeUser.value.trim(),
            };
            updateApiInfoArea(requestBodyData); //发送更新接口的请求，保持数据同步
        });
    });

    
    apiTitleDiv.appendChild(apiName);
    apiTitleDiv.appendChild(statusSpan);

    //草稿标记 + 放弃按钮 + 主表预览（仅草稿显示）
    if (apiData.isDraft) {
        const draftBadge = document.createElement('span');
        draftBadge.textContent = '草稿';
        draftBadge.style.cssText = 'padding:2px 8px;border-radius:4px;background:#fef3c7;color:#d97706;font-size:0.8rem;font-weight:600;';
        apiTitleDiv.appendChild(draftBadge);

        const discardBtn = document.createElement('button');
        discardBtn.textContent = '放弃修改';
        discardBtn.className = 'btn-secondary';
        discardBtn.style.cssText = 'padding:4px 12px;font-size:0.85rem;';
        discardBtn.addEventListener('click', () => handleDiscard(apiData));
        apiTitleDiv.appendChild(discardBtn);

        //主表预览（如果有base_id）
        if (apiData.baseId) {
            const masterBtn = document.createElement('button');
            masterBtn.textContent = '查看正式版';
            masterBtn.className = 'btn-secondary';
            masterBtn.style.cssText = 'padding:4px 12px;font-size:0.85rem;';
            masterBtn.addEventListener('click', async () => {
                try {
                    const res = await ApiApi.getMaster(apiData.baseId);
                    const master = res.data?.data;
                    if (master) {
                        renderPreview(master);
                        document.querySelectorAll('.test-tab').forEach(t => t.classList.remove('active'));
                        document.getElementById('tab_preview')?.classList.add('active');
                    }
                } catch (e) {
                    showToast('获取正式版本失败', 'error');
                }
            });
            apiTitleDiv.appendChild(masterBtn);
        }
    }
    const apiExplanationDiv = document.createElement('div');
    apiExplanationDiv.className = "api-explanation-div";

    const apiExplanation =document.createElement('textarea');
    apiExplanation.className = "api-explanation-input";
    apiExplanation.placeholder = "说明";
    apiExplanation.value = apiData.explanation || '';
    apiExplanationDiv.appendChild(apiExplanation);

    const apiInChargeUserDiv = document.createElement('div');
    apiInChargeUserDiv.className = "api-incharge-user-div";

    const apiInChargeUserLabel = document.createElement('span');
    apiInChargeUserLabel.textContent = "责任人";
    apiInChargeUserLabel.className = "api-incharge-user-label";

    const apiInChargeUser= document.createElement('input');
    apiInChargeUser.value= apiData.inChargeUser || '';
    apiInChargeUser.className = "api-incharge-user-input";


    apiInfoArea.addEventListener('focusout', function(e) {
        // 只有当离开的元素是输入框时才进行验证，避免过早验证
        if(e.target.tagName.toLowerCase() != 'input' && e.target.tagName.toLowerCase() != 'textarea') {
            return;
        }
        if(!apiName.value.trim()) {
            //接口名称不能为空，提示用户并且不发送更新请求
            apiName.style.borderColor = '#e53e3e';
            apiName.focus(); // 聚焦到接口名称输入框
            return;
        }else{
            apiName.style.borderColor = '';
        }
        
        apiData.apiName = apiName.value.trim();
        apiData.explanation = apiExplanation.value.trim();
        apiData.inChargeUser = apiInChargeUser.value.trim();

        const requestBodyData = {
                "id": container.dataset.apiId,
                "apiName": apiName.value.trim(),
                "explanation": apiExplanation.value.trim(),
                "status": statusSpan.dataset.status,
                "inChargeUser": apiInChargeUser.value.trim(),
            };

        updateApiInfoArea(requestBodyData);
    });

    

    




    apiInChargeUserDiv.appendChild(apiInChargeUserLabel);
    apiInChargeUserDiv.appendChild(apiInChargeUser);

    apiInfoArea.appendChild(apiTitleDiv);
    apiInfoArea.appendChild(apiExplanationDiv);
    apiInfoArea.appendChild(apiInChargeUserDiv);

    const submitButton = document.querySelectorAll('.submit-btn')[0];
    // 设计窗口不需要发送请求按钮
    submitButton.style.display = 'none'; 

    container.insertBefore(apiInfoArea, requestInfo); // 将接口信息区域插入到请求行上方

    // 请求参数标签
    const requestParamsTitle = document.createElement('span');
    requestParamsTitle.textContent = "请求参数";
    requestParamsTitle.className = 'params-title';
    //手动拉回一点距离
    requestParamsTitle.style.marginBottom = '-1.5rem';
    container.insertBefore(requestParamsTitle, requestInfo);
   

    // 响应格式设计区域
    const responseDesign = document.createElement('div');
    responseDesign.className = "response-design";
    const responseTitle = document.createElement('div');
    responseTitle.textContent = "返回响应";
    responseTitle.className = "params-title";
    responseDesign.appendChild(responseTitle);

    const responseLabelContainer=document.createElement('div');
    responseLabelContainer.className='response-label-container';
    const responseLabel=document.createElement('span');
    responseLabel.className='response-label';
    const codeLabel=document.createElement('span');
    const nameLabel=document.createElement('span');
    codeLabel.className='code-label';
    nameLabel.className='name-label';

    responseLabel.appendChild(codeLabel);
    responseLabel.appendChild(nameLabel);

    const responseFillLabel=document.createElement('span');
    responseFillLabel.className='response-fill-label';
    
    
    responseLabelContainer.appendChild(responseLabel);
    responseLabelContainer.appendChild(responseFillLabel);
    responseDesign.appendChild(responseLabelContainer);

    

    //响应信息栏
    const responseInfoSpan=document.createElement('span');
    responseInfoSpan.className='response-info-span';

    //HTTP 状态码
    const responseCodeSpan=document.createElement('span');
    const responseCodeLabel=document.createElement('span');
    const responseCode=document.createElement('input');

    responseCodeSpan.className='response-code-span';
    responseCodeLabel.className='response-code-label';
    responseCode.className='response-code-input';

    responseCodeLabel.textContent='HTTP状态码: '
    responseCode.value='200';
    
    responseCodeSpan.appendChild(responseCodeLabel);
    responseCodeSpan.appendChild(responseCode);
    responseInfoSpan.appendChild(responseCodeSpan);

    //返回状态名称
    const responseNameSpan=document.createElement('span');
    const responseNameLabel=document.createElement('span');
    const responseName=document.createElement('input');

    responseNameSpan.className='response-name-span';
    responseNameLabel.className='response-name-label';
    responseName.className='response-name-input';

    responseNameLabel.textContent='名称: ';
    responseName.value='成功';

    responseNameSpan.appendChild(responseNameLabel);
    responseNameSpan.appendChild(responseName);
    responseInfoSpan.appendChild(responseNameSpan);

    //内容格式
    const responseContentTypeSpan=document.createElement('span');
    const responseContentTypeLabel=document.createElement('span');
    const responseContentType=document.createElement('span'); // 可点击下拉触发区（仿输入框）
    const responseContentTypeText=document.createElement('span'); // 触发区内文本
    const responseContentTypeIcon=document.createElement('i'); // 下拉箭头图标
    const responseContentTypeMimeSpan=document.createElement('span'); // MIME类型展示

    responseContentTypeSpan.className='response-content-type-span';
    responseContentTypeLabel.className='response-content-type-label';
    responseContentType.className='content-type-trigger';
    responseContentTypeText.className='content-type-trigger-text';
    responseContentTypeIcon.className='bi bi-chevron-down content-type-chevron';
    responseContentTypeMimeSpan.className='content-type-mime';
    responseContentTypeLabel.textContent='内容格式: ';
    responseContentTypeText.textContent='JSON';
    responseContentTypeMimeSpan.textContent=responseContentTypeMap['JSON'] || '';
    responseContentType.appendChild(responseContentTypeText);
    responseContentType.appendChild(responseContentTypeIcon);

    // 下拉选项列表
    const contentTypeDropdown = document.createElement('ul');
    contentTypeDropdown.className = 'content-type-dropdown';
    Object.keys(responseContentTypeMap).forEach(key => {
        const option = document.createElement('li');
        option.className = 'content-type-option';
        option.textContent = key;
        option.addEventListener('click', function(e){
            e.stopPropagation();
            responseContentTypeText.textContent = key;
            responseContentTypeMimeSpan.textContent = responseContentTypeMap[key] || '';
            contentTypeDropdown.style.display = 'none';
            if(container.dataset.responseId) {
                responseApi.updateInfo({
                    "id": container.dataset.responseId,
                    "apiId": apiData.id,
                    "responseCode": responseCode.value.trim(),
                    "name": responseName.value.trim(),
                    "contentType": key,
                });
            }
            updateBodyContainerVisibility(key); // 根据选择的内容格式更新响应Body容器的显示状态

        });
        contentTypeDropdown.appendChild(option);
    });
    function updateBodyContainerVisibility(type) {
        const responseBodyContainerEl = document.querySelector('.response-body-container');
        const bodyArea = responseBodyContainerEl?.parentElement;
        const bodyTitle = bodyArea?.querySelector('.response-body-title');
        let bodyEmptyTip = bodyArea?.querySelector('.content-type-empty-tip');

        const isTreeType = (type === 'JSON' || type === 'XML');

        if (isTreeType) {
            // JSON/XML: show tree, hide empty tip
            if (responseBodyContainerEl) responseBodyContainerEl.style.display = '';
            if (bodyTitle) bodyTitle.style.display = '';
            if (bodyEmptyTip) bodyEmptyTip.style.display = 'none';
        } else {
            // HTML/Raw/No-Content: hide tree, show message
            if (responseBodyContainerEl) responseBodyContainerEl.style.display = 'none';
            if (bodyTitle) bodyTitle.style.display = type === 'No-Content' ? '' : 'none';
            if (!bodyEmptyTip && bodyArea) {
                bodyEmptyTip = document.createElement('div');
                bodyEmptyTip.className = 'content-type-empty-tip empty-tip';
                bodyArea.appendChild(bodyEmptyTip);
            }
            if (bodyEmptyTip) {
                bodyEmptyTip.style.display = 'block';
                bodyEmptyTip.textContent = type === 'No-Content'
                    ? '该响应无响应体'
                    : `响应体为 ${type} 格式，不支持树形预览`;
            }
        }
    }


    // 点击触发区切换下拉框
    responseContentType.addEventListener('click', function(e){
        e.stopPropagation();
        contentTypeDropdown.style.display = contentTypeDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // 点击外部关闭
    document.addEventListener('click', function(){
        contentTypeDropdown.style.display = 'none';
    });

    responseContentTypeSpan.appendChild(responseContentTypeLabel);
    responseContentTypeSpan.appendChild(responseContentType);
    responseContentTypeSpan.appendChild(contentTypeDropdown);
    responseContentTypeSpan.appendChild(responseContentTypeMimeSpan);
    responseInfoSpan.appendChild(responseContentTypeSpan);

    responseDesign.appendChild(responseInfoSpan);

    //监听鼠标离开事件
    responseInfoSpan.addEventListener('focusout', function(e) {
        // 只有当离开的元素是输入框时才进行验证，避免过早验证
        if(e.target.tagName.toLowerCase() != 'input') {
            return;
        }
        if(!container.dataset.responseId) {
            return;
        }



        const responseCodeValue = responseCode.value.trim();
        if(responseCodeValue) {
            responseCode.style.borderColor = '';
            //同步更新标签显示
            codeLabel.textContent = responseCodeValue;
            codeLabel.style.color = getCodeColor(responseCodeValue);
        }else{
            responseCode.style.borderColor = '#e53e3e';
        }

        const responseNameValue = responseName.value.trim();
        if(responseNameValue) {
            responseName.style.borderColor = '';
            nameLabel.textContent = responseNameValue;
        }else{
            responseName.style.borderColor = '#e53e3e';
        }

        const responseContentTypeValue = responseContentTypeText.textContent.trim();
        
        const requestBodyData = {
                "id": container.dataset.responseId,
                "apiId": apiData.id,
                "responseCode": responseCodeValue,
                "name": responseNameValue,
                "contentType": responseContentTypeValue,
            };

        responseApi.updateInfo(requestBodyData);
    });

    //响应Body
    
    //响应Body容器
    const responseBodyArea=document.createElement('div');
    responseBodyArea.className='response-body-area';

    const responseBodyTitle=document.createElement('span');
    responseBodyTitle.className='response-body-title';
    responseBodyTitle.textContent='Body';

    responseBodyArea.appendChild(responseBodyTitle);

    //Body节点树表格
    const responseBodyContainer=document.createElement('div');
    //设置容器的接口id，方便渲染表格时发送请求
    responseBodyContainer.dataset.apiId=apiData.id;
    //console.log('Respons容器接口id：', responseBodyContainer.dataset.apiId);
    responseBodyContainer.className='response-body-container';
    
    

     //发送GET请求，获取到响应数据
    responseApi.list()
    .then(response => {

        if(response.data && response.data.data && response.data.data.length > 0) {
            const responseData = response.data.data[0];
            //console.log('获取响应数据成功：', responseData);
            //将responseId存储在responseBodyContainer的dataset中，方便后续更新
            const responseBodyContainer = document.querySelector('.response-body-container');
            if(responseBodyContainer) {
                responseBodyContainer.dataset.responseId = responseData.id;
                // 同步存储在设计窗口容器dataset中，方便其他地方使用
                container.dataset.responseId = responseData.id; 
                //console.log('预填充响应信息：', responseData);
                //预填充响应信息
                if(codeLabel){
                    codeLabel.textContent = responseData.responseCode || '';
                    codeLabel.style.color = getCodeColor(responseData.responseCode); // 根据状态码设置颜色，默认为黑色
                } 
                if(nameLabel) nameLabel.textContent = responseData.name || '';
                if(responseCode) responseCode.value = responseData.responseCode || '';
                if(responseName) responseName.value = responseData.name || '';
                if(responseContentTypeText) {
                    responseContentTypeText.textContent = responseData.contentType || 'JSON';
                    responseContentTypeMimeSpan.textContent = responseContentTypeMap[responseData.contentType] || '';
                }

                //在异步内执行，避免还没拿到数据就渲染表格
                renderBodyNodeForm(responseBodyContainer);
                updateBodyContainerVisibility(responseData.contentType);
            }
        }else{
            //如果没有创建过根节点，就初始化
            const root=new TreeNode({
                key: '根节点',
                type: typeList.object,
                value: null,
                explanation: null
            });
            //console.log('初始化根节点：', root);

            //如果是根节点，初始化发送创建请求
            
            //获取表格转Json数据
            const responseCodeInput = responseCode;
            const responseNameInput = responseName;

            const jsonStr=treeToJsonString(root);
            //console.log('转换为JSON字符串：', jsonStr);

            //构建请求体
            const requestBodyData = {
                apiId: apiData.id,
                responseCode: responseCodeInput ? responseCodeInput.value.trim() : '',
                name: responseNameInput ? responseNameInput.value.trim() : '',
                contentType: responseContentTypeText ? responseContentTypeText.textContent.trim() : '',
                body: JSON.stringify(jsonStr)
            };

            //发送新建请求
            responseApi.add(requestBodyData)
            .then(res => {
                //console.log('根节点创建成功：', res,'responseId:', res.data.data.id);
                //将返回的responseId存储在容器dataset中，方便后续更新
                container.dataset.responseId = res.data.data.id;
                responseBodyContainer.dataset.responseId=res.data.data.id; 
                responseBodyContainer.dataset.rootId=root.id;
                //在异步内执行，避免还没拿到数据就渲染表格
                renderBodyNodeForm(responseBodyContainer);
                updateBodyContainerVisibility(responseData.contentType);
            })
        }

        
                
    })
    //console.log('存储responseId到dataset:',responseBodyContainer.dataset.responseId);
    
    
    responseBodyArea.appendChild(responseBodyContainer);

    responseDesign.appendChild(responseBodyArea);
    container.appendChild(responseDesign);
    
}


//渲染Body节点树表格
function renderBodyNodeForm(container){

    
    //console.log('渲染节点树表格...');
    const apiId=container.dataset.apiId;
    const responseId=container.dataset.responseId;
    const rootId=container.dataset.rootId;

    const responseApi= createResponseApi(apiId);


    container.innerHTML = "";

    container.dataset.apiId=apiId; // 确保接口id在dataset中，后续发送请求时可以用到
    container.dataset.responseId=responseId; // 确保响应id在dataset中，后续发送请求时可以用到
    container.dataset.rootId=rootId; // 确保根节点id在dataset中，后续发送请求时可以用到
    //console.log('apiId:', container.dataset.apiId, 'responseId:', container.dataset.responseId,'rootId:', container.dataset.rootId);

    document.addEventListener('click', closeActiveTypeDropdown); // 点击表格时关闭其他类型下拉列表

    // 全局点击关闭node-add下拉菜单（只绑定一次）
    if(!renderBodyNodeForm._dropdownCloseBound){
        renderBodyNodeForm._dropdownCloseBound = true;
        document.addEventListener('click', function(e){
            if(!e.target.closest('.node-add-dropdown') && !e.target.closest('.node-add-wrapper .add-btn')){
                document.querySelectorAll('.node-add-dropdown.open').forEach(d => d.classList.remove('open'));
            }
        });
    }

    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    //创建Body节点表
    const ul=document.createElement('ul');
    ul.id='BodyNodeForm';


    //添加节点项
    function addFormDataItem(Data, targetUl){
        targetUl = targetUl || ul;

        //如果是根节点初始化（Data.parentId为null）
        //修改keyInput的value为"根节点",禁用该输入框
        //修改类型为Object
        //删除按钮隐藏

        Data = Data ?? {};
        //没有父节点就是根节点
        const is_root=(!Data.parentId);
        const apiId=container.dataset.apiId;
        const isObjectType = (Data.type === typeList.object) || is_root;

        const formDataLi=document.createElement('li');
        const keyInput=document.createElement('input');
        const valueInput=document.createElement('input');
        const isNecessaryButton=getIsNecessaryButton();
        const typeInput=document.createElement('input');
        const explainInput=document.createElement('input');

        const addButton=document.createElement('button');
        const removeButton=document.createElement('button');

        
        formDataLi.id=Data.id;
        //console.log('渲染节点项，Data:', Data);
        keyInput.placeholder="字段名";
        keyInput.className = 'param-name-input';
        if(is_root){
            keyInput.value=Data.key;
            keyInput.className='param-root';
            //根节点字段名设置只读
            keyInput.readOnly=true;
        }

        valueInput.placeholder='示例值';
        valueInput.className = 'param-value-input';
        if(is_root){
            //根节点禁用value输入框，因为Object类型不需要value值
            valueInput.readOnly=true;
        }

        typeInput.placeholder='类型';
        typeInput.className = 'type-input';
        typeInput.readOnly = true; // 类型输入框只读，点击时显示下拉列表
        
        

        if(is_root){
            //根节点类型默认Object
            typeInput.value=typeList.object;
        }

        if(is_root){
             // 根节点不需要是否必须按钮
            isNecessaryButton.style.visibility = 'hidden';
        }

        explainInput.placeholder='说明';
        explainInput.className = 'explain-input';
        
        addButton.innerHTML='<i class="bi bi-plus-circle"></i>';
        addButton.className='add-btn';

        removeButton.innerHTML = '<i class="bi bi-dash-lg"></i>';
        removeButton.className = 'remove-btn';
    
        if(is_root){
            //只有根节点的删除按钮是隐藏的
            removeButton.style.visibility = 'hidden'; 
        }


        formDataLi.appendChild(keyInput);
        formDataLi.appendChild(typeInput);
        formDataLi.appendChild(isNecessaryButton);
        formDataLi.appendChild(valueInput);
        formDataLi.appendChild(explainInput);

        // Object类型（非根节点）：包裹添加按钮以下拉选项
        if(isObjectType && !is_root){
            const addWrapper = document.createElement('span');
            addWrapper.className = 'node-add-wrapper';
            addWrapper.appendChild(addButton);

            const dropdown = document.createElement('ul');
            dropdown.className = 'node-add-dropdown';

            const childOption = document.createElement('li');
            childOption.className = 'node-add-option';
            childOption.textContent = '添加子节点';

            const siblingOption = document.createElement('li');
            siblingOption.className = 'node-add-option';
            siblingOption.textContent = '添加相邻节点';

            dropdown.appendChild(childOption);
            dropdown.appendChild(siblingOption);
            // 追加到 body，避免父 li hover transform 导致频闪
            document.body.appendChild(dropdown);

            addButton._childOption = childOption;
            addButton._siblingOption = siblingOption;
            addButton._dropdown = dropdown;

            formDataLi.appendChild(addWrapper);
        }else{
            formDataLi.appendChild(addButton);
        }

        formDataLi.appendChild(removeButton);

        // 折叠箭头（Object类型节点或根节点）
        if(isObjectType){
            const arrowSpan = document.createElement('span');
            arrowSpan.className = 'node-arrow';
            const isCollapsed = Data.collapsed === true;
            arrowSpan.innerHTML = isCollapsed
                ? '<i class="bi bi-caret-right-fill"></i>'
                : '<i class="bi bi-caret-down-fill"></i>';
            formDataLi.insertBefore(arrowSpan, formDataLi.firstChild);

            // 箭头点击：折叠/展开
            arrowSpan.addEventListener('click', function(e){
                e.stopPropagation();
                const node = nodeMap.get(formDataLi.id);
                if(!node) return;
                node.collapsed = !node.collapsed;

                // 查找兄弟wrapper li，取其内部child UL
                const wrapperLi = formDataLi.nextElementSibling;
                const childUl = wrapperLi && wrapperLi.classList.contains('node-children-wrapper')
                    ? wrapperLi.querySelector('.node-children-ul') : null;
                if(childUl){
                    if(node.collapsed){
                        childUl.classList.add('collapsed');
                        arrowSpan.innerHTML = '<i class="bi bi-caret-right-fill"></i>';
                    }else{
                        childUl.classList.remove('collapsed');
                        arrowSpan.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
                    }
                }
            });
        }

        if(!is_root){
            //下拉列表的类型选项
            const typeArray=Object.values(typeList);
            const typeDropdownDiv = createTypeDropdown(typeArray, typeInput, formDataLi);
            for(const option of typeDropdownDiv.children){
                option.addEventListener('click',updateLi);
            }   
        }
        //Data除了包含输入框的内容，还要有父节点的id
        if(!is_root){
            //非根节点

            //填充数据
            keyInput.value=Data.key||'';
            valueInput.value=Data.value||'';
            typeInput.value=Data.type||'';
            explainInput.value=Data.explanation||'';
            isNecessaryButton.style.visibility = 'visible';
            isNecessaryButton.classList.toggle('active', Data.isNecessary);
            isNecessaryButton.querySelector('.is-necessary-tip').textContent = Data.isNecessary ? '必需' : '是否必须';

            formDataLi.dataset.parentId=Data.parentId;

        }

        function updateResponseBody(){
            const data= treeToJsonString(nodeMap.get(container.dataset.rootId));

            const requestBodyData = {
                "id": responseId, 
                "apiId": apiId,
                "responseBody": data
            };
            responseApi.updateBody(requestBodyData)
            .then(res => {
                console.log('参数更新成功：', res);
            });
        }

        //监听鼠标离开事件
        formDataLi.addEventListener('focusout', updateLi);
        //点击是否必须按钮时也触发更新逻辑
        isNecessaryButton.addEventListener('click', updateLi); 

        function updateLi(e) {
            setTimeout(() => {
            // 只有当离开的元素是输入框时才进行验证，避免过早验证
            if(e.target.tagName.toLowerCase() != 'input'&& e.target !== isNecessaryButton) {
                return;
            }
        
            if(typeInput.value.trim()===typeList.object){
                //如果类型是Object,禁用value输入框，因为Object类型不需要value值
                valueInput.readOnly=true;
            }else{
                valueInput.readOnly=false;
            }

            if(keyInput.value.trim()&&!typeInput.value.trim()){
                typeInput.value=typeList.string; // 如果参数名有输入但类型没有输入，默认类型为string
            }

            if(keyInput.value.trim()||valueInput.value.trim()||typeInput.value.trim()||explainInput.value.trim()) {
                //有一个输入不为空，即输入了任一输入框

                if (!keyInput.value.trim()&&(valueInput.value.trim()||typeInput.value.trim()||explainInput.value.trim())) {
                    //参数名输入框为空:
                    //console.log('参数名不能为空');
                    keyInput.style.outline = "1px solid #e53e3e";
                    keyInput.style.outlineOffset = "0";
                    keyInput.placeholder= "参数名";
                }else{
                    //参数名不为空:
                    //恢复默认
                    keyInput.style.outline = '';
                    keyInput.placeholder= "添加参数";
                }

                //在树结构中找到当前节点，更新节点数据
                
                const node=nodeMap.get(formDataLi.id);
                
                if(node) {
                    const wasObject = (node.type === typeList.object);
                    node.set({
                        key: keyInput.value.trim(),
                        value: valueInput.value.trim(),
                        type: typeInput.value.trim(),
                        explanation: explainInput.value.trim(),
                        isNecessary: isNecessaryButton.classList.contains('active') ? true : false
                    });
                    const isNowObject = (node.type === typeList.object);
                    
                    // DOM: 类型切换处理
                    if(!wasObject && isNowObject){
                        // 非Object→Object：添加箭头、创建空child UL（wrapper li 包裹）
                        if(!formDataLi.querySelector('.node-arrow')){
                            const arrowSpan = document.createElement('span');
                            arrowSpan.className = 'node-arrow';
                            arrowSpan.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
                            formDataLi.insertBefore(arrowSpan, formDataLi.firstChild);
                            arrowSpan.addEventListener('click', function(e){
                                e.stopPropagation();
                                const n = nodeMap.get(formDataLi.id);
                                if(!n) return;
                                n.collapsed = !n.collapsed;
                                const wLi = formDataLi.nextElementSibling;
                                const cUl = wLi && wLi.classList.contains('node-children-wrapper')
                                    ? wLi.querySelector('.node-children-ul') : null;
                                if(cUl){
                                    if(n.collapsed){
                                        cUl.classList.add('collapsed');
                                        arrowSpan.innerHTML = '<i class="bi bi-caret-right-fill"></i>';
                                    }else{
                                        cUl.classList.remove('collapsed');
                                        arrowSpan.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
                                    }
                                }
                            });
                        }
                        const existingWrapper = formDataLi.nextElementSibling;
                        if(!existingWrapper || !existingWrapper.classList.contains('node-children-wrapper')){
                            const wrapperLi = document.createElement('li');
                            wrapperLi.className = 'node-children-wrapper';
                            const childUl = document.createElement('ul');
                            childUl.className = 'node-children-ul';
                            wrapperLi.appendChild(childUl);
                            formDataLi.parentNode.insertBefore(wrapperLi, formDataLi.nextSibling);
                        }
                    }else if(wasObject && !isNowObject && !is_root){
                        // Object→非Object：移除箭头和wrapper li
                        const arrow = formDataLi.querySelector('.node-arrow');
                        if(arrow) arrow.remove();
                        const wrapperLi = formDataLi.nextElementSibling;
                        if(wrapperLi && wrapperLi.classList.contains('node-children-wrapper')){
                            wrapperLi.parentNode.removeChild(wrapperLi);
                        }
                    }
                    
                    console.log('更新节点数据：', node);
                }else{
                    console.error('节点未找到，无法更新数据');
                    return;
                }

                
                if(!nodeMap.get(container.dataset.rootId)){
                    console.error('根节点未找到，无法发送请求');
                    return;
                }

                updateResponseBody();
            }
        },300);
        }
        
        //在父项下面添加新列表项，形成树结构
        if(Data.neigborId){
            //如果有邻居节点id，说明新节点添加为兄弟节点，插入到邻居节点后面
            const neighbor=document.getElementById(Data.neigborId);
            if(neighbor && neighbor.parentNode === targetUl) {
                targetUl.insertBefore(formDataLi, neighbor.nextSibling);
            }else{
                targetUl.appendChild(formDataLi);
            }
        }else{
            //如果没有邻居节点id，说明新节点添加为子节点，直接添加到父节点下面
            targetUl.appendChild(formDataLi);
        }

        //updateRemoveButtons(); // 添加新项后更新删除按钮显示
        
        removeButton.dataset.confirmed = 'false'; // 初始化删除确认状态
        // 删除按钮点击事件
        removeButton.onclick = function(e){
            e.stopPropagation(); // 阻止事件冒泡，避免触发li的点击事件
            console.log('点击删除按钮，当前确认状态：', removeButton.dataset.confirmed);
            if(removeButton.dataset.confirmed === 'true') {
                console.log('删除参数项，id：', formDataLi.id);
                

                //如果是有子节点，递归删除所有子节点
                const node=nodeMap.get(formDataLi.id);

                //从父结点的子节点中删除当前节点
                const parentNode=nodeMap.get(formDataLi.dataset.parentId);
                
                if(node) {
                    node.deleteAllChildren();
                }
                
                if(parentNode) {
                    parentNode.deleteChild(node.id);
                }


                console.log('删除节点后树结构：', nodeMap.get(container.dataset.rootId));
                //发送修改请求，修改树结构为删除当前节点后的结构
                updateResponseBody();
                 
                // 同时删除兄弟wrapper li（如果有）
                const siblingWrapper = formDataLi.nextElementSibling;
                if(siblingWrapper && siblingWrapper.classList.contains('node-children-wrapper')){
                    siblingWrapper.parentNode.removeChild(siblingWrapper);
                }
                formDataLi.parentNode.removeChild(formDataLi);
            }else{
                //第一次点击，进入确认状态
                removeButton.classList.add('active');
                setTimeout(() => {
                removeButton.innerHTML = '<i class="bi bi-x-lg"></i>';
                }, 200);
                removeButton.dataset.confirmed = 'true';

            }
        };
        removeButton.addEventListener('mouseout', function() {
            //如果点击一次后移开鼠标，则取消删除确认状态，避免误操作
            this.classList.remove('active');
            this.dataset.confirmed = false;
            setTimeout(() => {
            this.innerHTML = '<i class="bi bi-dash-lg"></i>';
            }, 200);
        });

        // 通用添加节点逻辑
        function doAddNode(targetParentId){
            const data={
                parentId: targetParentId,
            };

            const parentNode=nodeMap.get(data.parentId);
            if(parentNode) {
                const newNode = new TreeNode({
                    key: '',
                    type: '',
                    value: '',
                    explanation: ''
                });
                parentNode.addChild(newNode);
                data.id=newNode.id;
            } else {
                console.error('父节点未找到，无法添加子节点，父节点id：', data.parentId);
                return;
            }

            const parentLi = document.getElementById(data.parentId);
            let childUl = null;
            if(parentLi){
                let wrapperLi = parentLi.nextElementSibling;
                if(wrapperLi && wrapperLi.classList.contains('node-children-wrapper')){
                    childUl = wrapperLi.querySelector('.node-children-ul');
                }else{
                    wrapperLi = document.createElement('li');
                    wrapperLi.className = 'node-children-wrapper';
                    childUl = document.createElement('ul');
                    childUl.className = 'node-children-ul';
                    wrapperLi.appendChild(childUl);
                    parentLi.parentNode.insertBefore(wrapperLi, parentLi.nextSibling);
                }
            }

            if(parentNode && parentNode.collapsed){
                parentNode.collapsed = false;
                if(childUl) childUl.classList.remove('collapsed');
                const parentArrow = parentLi && parentLi.querySelector('.node-arrow');
                if(parentArrow){
                    parentArrow.innerHTML = '<i class="bi bi-caret-down-fill"></i>';
                }
            }

            addFormDataItem(data, childUl || ul);
            updateResponseBody();
        }

        // Object类型节点：点击按钮切换下拉菜单（position:fixed + body挂载，避免 overflow 裁剪和父 li hover 频闪）
        if(isObjectType && !is_root && addButton._childOption && addButton._siblingOption){
            const dropdownEl = addButton._dropdown;

            addButton.addEventListener('click', function(e){
                e.stopPropagation();
                const isOpen = dropdownEl.classList.contains('open');
                // 关闭所有其他下拉
                document.querySelectorAll('.node-add-dropdown.open').forEach(d => d.classList.remove('open'));
                if(isOpen){
                    dropdownEl.classList.remove('open');
                }else{
                    const btnRect = addButton.getBoundingClientRect();
                    dropdownEl.style.top = (btnRect.bottom + 2) + 'px';
                    dropdownEl.style.left = btnRect.left + 'px';
                    dropdownEl.classList.add('open');
                }
            });

            addButton._childOption.addEventListener('click', function(e){
                e.stopPropagation();
                dropdownEl.classList.remove('open');
                doAddNode(formDataLi.id);
            });
            addButton._siblingOption.addEventListener('click', function(e){
                e.stopPropagation();
                dropdownEl.classList.remove('open');
                doAddNode(formDataLi.dataset.parentId);
            });
        }else{
            // 非Object节点或根节点：点击直接添加
            addButton.onclick = function(e){
                e.stopPropagation();
                let targetParentId;
                if(typeInput.value==typeList.object || is_root){
                    targetParentId = formDataLi.id;
                }else{
                    targetParentId = formDataLi.dataset.parentId;
                }
                doAddNode(targetParentId);
            };
        }

    }

    

    
    try{
        //根据参数类型和接口id获取已有参数列表

        const apiId= document.getElementById('subWindow').dataset.apiId;// 获取当前接口id
        
        
        responseApi.getResponse(container.dataset.responseId)
        .then(res => {
            console.log('获取参数列表成功：', res);
            const data = res.data.data || {};

            const jsonStr=data.responseBody;
            console.log('获取到的json：', JSON.parse(jsonStr));
            //拆解json，获得参数列表，每一条要包含key,type,value,explanation,isNecessary
            const root=TreeNode.convertFromJson(JSON.parse(jsonStr));
            container.dataset.rootId=root.id;
            //递归函数
            function buildForm(parent,root,targetUl){
                if(!root) return;
                const data=root.toPlainObject();
                //console.log('buildForm data:', data);
                data.id=root.id;
                //console.log('parent:', parent, 'root:', root);
                if(parent){
                    data.parentId=parent.id;
                }

                addFormDataItem(data,targetUl);
                
                if(root.children.length > 0){
                    const wrapperLi = document.createElement('li');
                    wrapperLi.className = 'node-children-wrapper';

                    const childUl = document.createElement('ul');
                    childUl.className = 'node-children-ul';
                    if(root.collapsed) childUl.classList.add('collapsed');
                    wrapperLi.appendChild(childUl);
                    
                    const li = document.getElementById(root.id);
                    if(li && li.parentNode === targetUl){
                        targetUl.insertBefore(wrapperLi, li.nextSibling);
                    }else{
                        targetUl.appendChild(wrapperLi);
                    }
                    
                    root.children.forEach(child=>{
                        buildForm(root,child,childUl);
                    });
                }

            }
            buildForm(null,root,ul);
        })
    }catch(err){

        console.error('获取参数列表失败详情：', err);
        const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';

        //alert('获取参数列表失败：' + errMsg);
    };

    

    container.appendChild(ul);
    setTimeout(() => {
        container.style.opacity=1;
    },0); // 先隐藏容器，等内容渲染完成后再显示，避免闪烁
}





//把树转为JsonString
function treeToJsonString(root){
    return JSON.stringify(TreeNode.toFullAttrJson(root));
}



/**
 * 渲染文档预览窗口（美化补全）
 * @param {传入单个api} apiData 
 */
function renderPreview(apiData){
    const container=document.getElementById('subWindow');
    if(!container) {
        console.log("subWindow容器为空");
        return;
    }
    container.innerHTML="";//清空原有内容
    container.className = "preview-container"; // 新增容器类名
    const responseApi = createResponseApi(apiData.id); // 初始化接口实例，后续获取响应数据时可以用到
    // 文档预览标题
    const previewTitle = document.createElement('h2');
    
    previewTitle.textContent = `${apiData.apiName || '未命名接口'}`;
    previewTitle.className = "preview-title";
    container.appendChild(previewTitle);

    //url和api状态容器
    const url_statusDiv=document.createElement('div');
    url_statusDiv.className = "url-status-div";

    // 显示接口URL和请求方法
    url_statusDiv.appendChild(urlDisplay(apiData.requestMethod, apiData.requestUrl)); 

    const statusSpan = createApiStatusSpan(apiData.status);

    const statusUl = statusSpan.querySelector('.status-option-list');

    //手动补充status下拉框下拉选项的额外点击事件逻辑，更新接口状态并发送更新请求
    statusUl.querySelectorAll('.status-option-item').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            //console.log('apiData before update:', apiData);
            apiData.status = this.dataset.statusValue; // 更新接口数据中的状态字段，后续发送请求时可以用到
            const requestBodyData = {
                "id": apiData.id,
                "apiName": apiData.apiName, 
                "explanation": apiData.explanation || '',
                "status": statusSpan.dataset.status,
                "inChargeUser": apiData.inChargeUser || '',
            };
            updateApiInfoArea(requestBodyData); //发送更新接口的请求，保持数据同步
        });
    });

    url_statusDiv.appendChild(statusSpan);
    container.appendChild(url_statusDiv);

    //导出按钮
    const exportButton = document.createElement('button');
    exportButton.innerHTML='<i class="bi bi-box-arrow-up-right"></i>';
    exportButton.className = 'export-btn';

    const exportButtonTip= document.createElement('span');
    exportButtonTip.className = 'export-btn-tip';
    exportButtonTip.textContent = '导出接口文档';
    exportButton.appendChild(exportButtonTip);

    exportButton.addEventListener('mouseover', function() {
        exportButtonTip.style.display = 'block';
    });
    exportButton.addEventListener('mouseout', function() {
        exportButtonTip.style.display = 'none';
    });

    exportButton.addEventListener('click', function() {
        exportSingleApi(apiData, !!apiData.isDraft);
    });
    url_statusDiv.appendChild(exportButton);

    const apiInfoDiv=document.createElement('div');
    apiInfoDiv.className = "api-info-div";

    //生成信息项
    function createInfoItem(labelText, valueText) {
        const item = document.createElement('span');
        item.className = 'api-info-item';

        const label = document.createElement('span');
        label.className = 'api-info-label';
        label.textContent = labelText;

        const value = document.createElement('span');
        value.className = 'api-info-value';
        value.textContent = valueText || '未设置';

        item.appendChild(label);
        item.appendChild(value);
        return item;
    }

    

    apiInfoDiv.appendChild(createInfoItem('创建时间', formatDateToChinese(apiData.createTime)));
    apiInfoDiv.appendChild(createInfoItem('修改时间', formatRelativeTime(apiData.updateTime)));
    apiInfoDiv.appendChild(createInfoItem('修改者', apiData.updateUserName || apiData.modifiedBy || '未设置'));
    apiInfoDiv.appendChild(createInfoItem('创建者', apiData.createUserName || apiData.createdBy || '未设置'));
    apiInfoDiv.appendChild(createInfoItem('责任人', apiData.inChargeUser || '未设置'));

    container.appendChild(apiInfoDiv);

    const explanationTitle=document.createElement('h3');
    explanationTitle.textContent = "接口说明";
    explanationTitle.className = "preview-explanation-title";
    container.appendChild(explanationTitle);
    const explanationDiv=document.createElement('div');
    explanationDiv.className = "preview-explanation-div";
    explanationDiv.textContent = apiData.explanation;
    if(!apiData.explanation) {
        explanationTitle.style.display = 'none';
        explanationDiv.style.display = 'none';
    }
    container.appendChild(explanationDiv);

    const paramsTitle=document.createElement('h3');
    paramsTitle.textContent = "请求参数";
    paramsTitle.className = "preview-params-title";
    // paramsTitle.style.marginTop = "1.5rem";
    container.appendChild(paramsTitle);

    const noParamsTip = document.createElement('div');
    noParamsTip.className = 'no-params-message';
    noParamsTip.textContent = '暂无请求参数';
    container.appendChild(noParamsTip);

    const queryParamsDiv=document.createElement('div');
    queryParamsDiv.className = "preview-params-div";

    const queryInfoSpan=document.createElement('span');
    queryInfoSpan.className = 'preview-query-info';

    const queryTitle=document.createElement('span');
    queryTitle.textContent = "Query 参数";
    queryTitle.className = "query-title";

    queryInfoSpan.appendChild(queryTitle);
    queryParamsDiv.appendChild(queryInfoSpan);
    

    RequestParamsApi.list(apiData.id, requestDataType.Query).then(res => {
            const data = res.data.data || [];
            if(data.length > 0) {
                const paramsList = createParamList(data);
                queryParamsDiv.appendChild(paramsList);
                queryParamsDiv.style.display = 'block'; // 显示Query参数区域
                noParamsTip.style.display = 'none'; // 隐藏暂无参数提示
            }
        })
    container.appendChild(queryParamsDiv);
    
    const headersParamsDiv=document.createElement('div');
    headersParamsDiv.className = "preview-params-div";

    const headersInfoSpan=document.createElement('span');
    headersInfoSpan.className = 'preview-headers-info';

    const headersTitle=document.createElement('span');
    headersTitle.textContent = "Headers 参数";
    headersTitle.className = "headers-title";

    headersInfoSpan.appendChild(headersTitle);
    headersParamsDiv.appendChild(headersInfoSpan);

    RequestParamsApi.list(apiData.id, requestDataType.Header).then(res => {
            const data = res.data.data || [];
            if(data.length > 0) {
                const paramsList = createParamList(data);
                headersParamsDiv.appendChild(paramsList);
                headersParamsDiv.style.display = 'block'; // 显示Headers参数区域
                noParamsTip.style.display = 'none'; // 隐藏暂无参数提示
            }
        })

    container.appendChild(headersParamsDiv);



    const bodyFormat = apiData.bodyType || localStorage.getItem(getContentTypeKey(apiData.id)) || requestDataType.None;
    const isBodyJsonOrXml = (bodyFormat === requestDataType.Json || bodyFormat === requestDataType.Xml);

    const bodyParamsDiv=document.createElement('div');
    bodyParamsDiv.className = "preview-params-div";


    const bodyInfoSpan=document.createElement('span');
    bodyInfoSpan.className = 'preview-body-info';

    const bodyTitle=document.createElement('span');
    bodyTitle.textContent = "Body 参数";
    bodyTitle.className = "body-title";

    const bodyType=document.createElement('span');
    bodyType.textContent = `${httpMimeTypes[bodyFormat] || '未设置'}`;
    bodyType.className = "preview-type-label";

    bodyInfoSpan.appendChild(bodyTitle);
    bodyInfoSpan.appendChild(bodyType);

    // JSON/XML 格式：去掉外层 bodyParamsDiv，直接用 flex 容器（避免双层边框）
    if (isBodyJsonOrXml) {
        const bodyFlex = document.createElement('div');
        bodyFlex.className = 'preview-response-container';
        bodyFlex.style.marginTop = '0';
        bodyFlex.style.borderTop = '1px solid #e8e8e8';
        bodyFlex.style.borderRadius = '6px';

        const bodyLeft = document.createElement('div');
        bodyLeft.className = 'response-preview-div';
        bodyLeft.style.minWidth = 'unset';
        bodyLeft.style.flex = '1';
        bodyLeft.appendChild(bodyInfoSpan);

        const bodyExampleDiv = document.createElement('div');
        bodyExampleDiv.className = 'response-json-example-div';
        const exampleTitle = document.createElement('span');
        exampleTitle.className = 'body-title';
        exampleTitle.textContent = '示例';
        bodyExampleDiv.appendChild(exampleTitle);

        bodyFlex.appendChild(bodyLeft);
        bodyFlex.appendChild(bodyExampleDiv);
        container.appendChild(bodyFlex);

        if (bodyFormat !== requestDataType.None) {
            RequestParamsApi.list(apiData.id, bodyFormat || '').then(res => {
                const data = res.data.data || [];
                
                if (data && data.length > 0) {
                    const paramsList = createParamList(data, true);
                    bodyLeft.appendChild(paramsList);

                    const rawValue = data[0].value || '';
                    if (rawValue) {
                        if (bodyFormat === requestDataType.Xml) {
                            createResponseXmlExampleDiv(rawValue, bodyExampleDiv);
                        } else {
                            createResponseJsonExampleDiv(rawValue, bodyExampleDiv);
                        }
                    }
                    noParamsTip.style.display = 'none'; // 隐藏暂无参数提示
                }else{
                    bodyFlex.style.display = 'none'; // 没有参数时隐藏整个 Body 区域
                }
            })
        }
    } else {
        bodyParamsDiv.appendChild(bodyInfoSpan);
        container.appendChild(bodyParamsDiv);

        if (bodyFormat !== requestDataType.None) {
            RequestParamsApi.list(apiData.id, bodyFormat || '').then(res => {
                const data = res.data.data || [];
                if (data.length > 0) {
                    const paramsList = createParamList(data);
                    bodyParamsDiv.appendChild(paramsList);
                    bodyParamsDiv.style.display = 'block';
                    noParamsTip.style.display = 'none'; // 隐藏暂无参数提示
                }
            })
        }
    }
    
    //把响应信息也展示在预览窗口
    const responseTitle=document.createElement('h3');
    responseTitle.textContent = "返回响应";
    responseTitle.className = "preview-params-title";
    container.appendChild(responseTitle);

    const responseLabelContainer=document.createElement('div');
    responseLabelContainer.className='response-label-container';
    container.appendChild(responseLabelContainer);

    const responseContainer=document.createElement('div');
    responseContainer.className='preview-response-container';

    //响应信息表格预览区域（左）
    let responsePreviewDiv=document.createElement('div');
    responsePreviewDiv.className='response-preview-div';
    
    const responseInfoSpan= document.createElement('span');
    responseInfoSpan.className = 'preview-response-info-label';

    const statusCodeSpan = document.createElement('span');
    statusCodeSpan.className = 'preview-type-label';

    const contentTypeSpan = document.createElement('span');
    contentTypeSpan.className = 'preview-type-without-bg';

    responseInfoSpan.appendChild(statusCodeSpan);
    responseInfoSpan.appendChild(contentTypeSpan);
    responsePreviewDiv.appendChild(responseInfoSpan);
    responseContainer.appendChild(responsePreviewDiv);
    container.appendChild(responseContainer);

    //响应信息JSON示例区域（右）
    let responseJsonExampleDiv=document.createElement('div');
    responseJsonExampleDiv.className='response-json-example-div';

    responseContainer.appendChild(responseJsonExampleDiv);
    
    const responseJsonExampleTitle=document.createElement('span');
    responseJsonExampleTitle.textContent = "示例";
    responseJsonExampleTitle.className = "body-title";
    responseJsonExampleDiv.appendChild(responseJsonExampleTitle);

    //获取响应信息数据，展示在预览窗口
    responseApi.list()
    .then(response => {
        if(response.data && response.data.data && response.data.data.length > 0) {
            //默认第一个响应数据作为预览展示
            const responseData = response.data.data[0];
            //console.log('!!!获取响应信息成功：', responseData);
            const responseLabel=document.createElement('span');
            responseLabel.className='response-label';
            const codeLabel=document.createElement('span');
            const nameLabel=document.createElement('span');
            codeLabel.className='code-label';
            nameLabel.className='name-label';

            statusCodeSpan.textContent = `HTTP 状态码: ${responseData.responseCode}` || "未知状态码";
            codeLabel.textContent = responseData.responseCode || '';
            codeLabel.style.color = getCodeColor(responseData.responseCode);
            nameLabel.textContent = responseData.name || '';
            contentTypeSpan.textContent = `${responseContentType[responseData.contentType] || ''}`;
            responseLabel.appendChild(codeLabel);
            responseLabel.appendChild(nameLabel);

            const responseFillLabel=document.createElement('span');
            responseFillLabel.className='response-fill-label';
            
            
            responseLabelContainer.appendChild(responseLabel);
            responseLabelContainer.appendChild(responseFillLabel);
            
            responseApi.getResponse(responseData.id)
            .then(res => {
                const data = res.data.data || {};
                //异步返回替换原节点
                console.log('!!获取响应信息成功：', data);
                if(responseData.contentType==='HTML'||responseData.contentType==='Raw'||responseData.contentType==='No-Content'|| data.responseBody === '{}') {
                    data.responseBody=null;
                }
                createResponsePreviewDiv(data.responseBody, responsePreviewDiv);

                if (responseData.contentType === 'XML') {
                    createResponseXmlExampleDiv(data.responseBody, responseJsonExampleDiv);
                } else {
                    createResponseJsonExampleDiv(data.responseBody, responseJsonExampleDiv);
                }
                
            })
        }
    });

    
}
window.onload = async function () {
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
    const params=getUrlParams();
    //console.log("创建标题：",params.name);
    document.title='项目空间：'+(params.name || '未命名项目');

    try{
    console.log("准备发送请求..");
    await fetchApiListAndRender();
    }catch(err){
        console.error('失败详情：', err);
        const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';
        
        // 美化错误提示
        const container = document.getElementById('container');
        if(container) { // 增加判空，避免报错
            container.innerHTML = `
                <h2>我的项目</h2>
                <div class="error-tip">项目获取失败：${errMsg}</div>
            `;
        }
    }
}

// ========== 发布/放弃草稿 ==========

/**
 * 发布草稿
 */
async function handlePublish(apiData) {
    try {
        await ApiApi.publish(apiData.id, apiData.masterUpdateTime);
        showToast('发布成功', 'success');
        if (treeTableRef) treeTableRef.refresh();
    } catch (err) {
        const msg = err.response?.data?.msg || err.message || '';
        if (msg.includes('已被他人更新')) {
            const force = await confirmModal.open(msg + '\n是否强制覆盖？', '发布冲突', '强制覆盖');
            if (force) {
                try {
                    await ApiApi.publish(apiData.id, null);
                    showToast('已强制覆盖', 'success');
                    if (treeTableRef) treeTableRef.refresh();
                } catch (e) {
                    showToast('发布失败：' + (e.response?.data?.msg || e.message), 'error');
                }
            }
        } else {
            showToast('发布失败：' + msg, 'error');
        }
    }
}

/**
 * 放弃草稿
 */
async function handleDiscard(apiData) {
    const ok = await confirmModal.open('确定放弃当前草稿？所有未发布的修改将丢失。', '放弃草稿', '放弃');
    if (!ok) return;
    try {
        await ApiApi.discardDraft(apiData.id);
        showToast('草稿已放弃', 'success');
        if (treeTableRef) treeTableRef.refresh();
    } catch (err) {
        showToast('操作失败：' + (err.response?.data?.msg || err.message), 'error');
    }
}
