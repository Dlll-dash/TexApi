
import { request,getUrlParams } from "../config/AxiosConfig/AxiosConfig.js";
import { methodlist,methodColors,methodBackroundColors } from "../config/MethodConfig.js";
import { requestDataType,typeList,httpMimeTypes} from "../config/TypeConfig.js";
import { debugFormConfig,designFormConfig } from "../config/FormConfig.js";
import { statusText,statusColors } from "../config/StatusConfig.js";
import { TreeNode } from "../module/BodyTree.js";
import { NodeMapManager } from "../module/NodeMapManager.js";
import { codeColorMap,getCodeColor } from "../config/ResponseConfig.js";
import { urlDisplay } from "../components/urlSpan.js";
import { createApiStatusSpan } from "../components/apiStatusSpan.js";
import { formatDateToChinese, formatRelativeTime } from "../utils/DateUtil.js";
import { createParamList } from "../components/paramList.js";
import { createResponseApi } from "../api/ResponseApi.js";
import { createResponsePreviewDiv } from "../components/responsePreviewDiv.js";
import { createResponseJsonExampleDiv } from "../components/responseJsonExampleDiv.js";

const nodeMap=NodeMapManager.getInstance();


/**
 * 渲染接口列表
 * @param {传入api列表} apiData 
 * @returns 
 */
function renderApiList(apiData){
    //console.log("渲染界面..");
    const container=document.getElementById('apiList');
    if(!container){
        //console.log("container为空");
        return;
    }
    container.innerHTML= "";

    //创建标题
    const title=document.createElement('h2');
    title.className = "api-list-title";
    title.textContent="项目接口";
    container.appendChild(title);

    // 处理非列表或无数据情况（使用美化的空提示类）
    if (!Array.isArray(apiData) || apiData.length === 0) {
        const emptyTip = document.createElement('div');
        emptyTip.className = "empty-tip"; // 关联CSS类
        emptyTip.textContent = "暂无接口数据";
        container.appendChild(emptyTip);
        return;
    }

    //创建列表节点
    const ul=document.createElement('ul');
    ul.className = "api-list-ul"; // 新增统一类名，方便样式控制
    container.appendChild(ul);

    apiData.forEach(item=>{
        //console.log("表单项：",item);
        const li = document.createElement('li');
        li.className = "api-list-li"; // 新增统一类名

        const methodSpan=document.createElement('span');
        const nameSpan=document.createElement('span');

        methodSpan.textContent=item.requestMethod;
        methodSpan.className='method';
        

        nameSpan.textContent=item.apiName;
        nameSpan.className='name';
        
        // 按请求方法设置不同颜色，保持原有逻辑
        methodSpan.style.color = methodColors[item.requestMethod] || methodColors['DEFAULT'];
        //methodSpan.style.backgroundColor = methodBackroundColors[item.requestMethod] || methodBackroundColors['DEFAULT'];

        li.appendChild(methodSpan);
        li.appendChild(nameSpan);
        //创建点击事件
        li.onclick=function(){
            // 移除其他项的active类
            ul.querySelectorAll('li').forEach(sibling => sibling.classList.remove('active'));
            li.classList.add('active'); // 添加点击效果
            renderTestWindow(item);
        };
        ul.appendChild(li);
    });
    //默认打开第一个接口
    ul.firstChild.classList.add('active'); 
    renderTestWindow(apiData[0]);
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
    const debugSpan=document.getElementById('debugTab');
    //点击事件
    debugSpan.onclick=function(){
        // 切换标签样式
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        debugSpan.classList.add('active');
        renderDebug(apiData,debugFormConfig);
        renderResponse(container);

    };

    const designSpan=document.getElementById('designTab');
    designSpan.textContent='设计';
    designSpan.className = "test-tab";
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

    const previewSpan=document.getElementById('previewTab');
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

    //默认打开debug区
    debugSpan.click();

}

/**
 * Api相关的请求发送函数
 * @param {接口数据} apiData 
 * @param {请求方法} method 
 */
async function sendApiRequest(apiData,method){
    
    let requestData = {};
    if(method === 'POST' || method === 'PUT') {
        // 构造请求体数据，具体结构根据后端接口要求调整
        requestData = apiData; // 这里直接使用apiData作为请求体，后面也可以根据需要构造更具体的数据结构
    }
    let url = `http://localhost/tex/api`;
    if(method ==='POST'){
        url += `/add`;
    }else if(method === 'PUT') {
        url += `/update`; // 假设更新需要接口id
    }else if(method === 'DELETE') {
        url += `/delete/${apiData.id}`; // 假设删除需要接口id
    }

    try{
        const requestConfig = {
            url: url,
            method: method,
            headers: {
                'token': localStorage.getItem('token') 
            }
        };
        if(method !== 'GET'&& method !== 'DELETE') {
            requestConfig.data = requestData; // 非GET、DELETE请求才有请求体
        }

        const res= await request(requestConfig);
        return res; // 根据后端返回结构调整
    }catch(err){
        throw new Error(`请求失败：${err.response?.data?.message || err.message}`);
    }
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
            sendApiRequest(apiData, 'PUT');

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
        sendApiRequest(apiData,'PUT') // 发送更新接口的请求，保持数据同步
        //alert('接口URL已更新'); 
    });

    submitButton.textContent='发送'; 
    submitButton.className = "submit-btn";
    submitButton.addEventListener('click', function() {
        
        console.log(`接口${apiData.id}发送${apiData.requestMethod}请求到：${urlInput.value}`);
        
        const responseContent = document.querySelector('.response-content');
        if (responseContent) {
            responseContent.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div><span>加载中...</span></div>`;
            responseContent.style.color = "";
        }

        const startTime = Date.now();
        const minLoadingTime = 300;

        //发送请求，告诉后端apiId为xxx的接口要发送请求了，在后端向指定接口发送请求
        request.post(`http://localhost/tex/api/send`,{
            
            apiId: apiData.id,
            contentType: localStorage.getItem('contentType') || requestDataType.None // 发送当前选择的请求体格式，后端根据这个参数来区分请求体数据结构
        
        }).then(res => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadingTime - elapsed);
            
            setTimeout(() => {
                // 更新响应区域
                const responseContent = document.querySelector('.response-content');
                if (responseContent) {
                    responseContent.textContent = JSON.stringify(res.data, null, 2);
                    responseContent.style.color = "#000"; // 正常颜色
                    responseContent.style.fontFamily = "Consolas, monospace"; // 等宽字体
                }
            }, remaining);
        }).catch(err => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadingTime - elapsed);
            
            setTimeout(() => {
                // 更新响应区域显示错误
                const responseContent = document.querySelector('.response-content');
                if (responseContent) {
                    responseContent.textContent = `错误: ${err.response?.data?.message || err.message || '未知错误'}`;
                    responseContent.style.color = "#e53e3e"; // 错误颜色
                }
            }, remaining);
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
    // 响应结果标题
    const responseTitle = document.createElement('span');
    responseTitle.className = "response-title";
    responseTitle.textContent = "响应结果：";
    responseDiv.appendChild(responseTitle);
    
    // 新增响应结果区域，美化调试窗口
    const responseArea = document.createElement('div');
    responseArea.className = "response-area";
    const responseContent = document.createElement('pre');
    responseContent.className = "response-content";
    responseContent.textContent = "点击发送按钮后显示响应结果";
    responseContent.style.color = "#adabab";// 默认提示文字颜色

    responseArea.appendChild(responseContent);
    responseDiv.appendChild(responseArea);

    container.appendChild(responseDiv);
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
        localStorage.setItem('contentType',requestDataType.None ); // 存储当前选择的请求体格式，后续发送请求时可以用到
        contentDiv.innerHTML = "<div class='empty-tip'>该请求没有Body</div>";
    };

    formDataSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        formDataSpan.classList.add('active');
        localStorage.setItem('contentType',requestDataType.FormData ); // 存储当前选择的请求体格式，后续发送请求时可以用到

        contentDiv.dataset.type = requestDataType.FormData; // 标记数据类型，方便发送请求时区分
        renderform(contentDiv,config);
    };

    jsonSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        jsonSpan.classList.add('active');
        localStorage.setItem('contentType',requestDataType.Json ); // 存储当前选择的请求体格式，后续发送请求时可以用到
        contentDiv.dataset.type = requestDataType.Json; // 标记数据类型，方便发送请求时区分
        contentDiv.innerHTML = "<textarea placeholder='输入JSON格式的请求体' class='json-input'></textarea>";
         const apiId= document.getElementById('requestArea').dataset.apiId; // 获取当前接口id

        //获取已有的Json数据并预填充
        sendRequest(null, apiId, requestDataType.Json, 'GET')
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
                    'jsonBody',
                    jsonString,
                    requestDataType.Json,
                    '',
                    apiId
                ];

                //只有一个Json
                if(!contentDiv.dataset.id) {
                    sendRequest(param,null,requestDataType.Json, 'POST')
                    .then(res => {
                        alert('Json保存成功');
                        if(res.data && res.data.data && res.data.data.id) {
                            contentDiv.dataset.id = res.data.data.id;
                        }
                    })
                }else{
                    alert('Json更新成功');
                    sendRequest(param, contentDiv.dataset.id, requestDataType.Json, 'PUT');
                }
            }
        });
        
    };

    urlencodedSpan.onclick = function(){
        formatContainer.querySelectorAll('.body-format-tab').forEach(tab => tab.classList.remove('active'));
        urlencodedSpan.classList.add('active');
        localStorage.setItem('contentType',requestDataType.Urlencoded ); // 存储当前选择的请求体格式，后续发送请求时可以用到
        contentDiv.dataset.type = requestDataType.Urlencoded; // 标记数据类型，方便发送请求时区分
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
    const contentType=localStorage.getItem('contentType') || requestDataType.None; // 从本地存储获取之前选择的请求体格式，默认为none
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


/**
 * 参数表单通用发送接口请求函数
 *  @param {请求体数组} param 
 *  @param {(GET)接口 id/(其他)参数 id} id
 *  @param {数据类型,Params,Headers,Body..} dataType
 *  @param {请求方法} method
 **/
async function sendRequest(param, id, dataType, method) {
        // 这里可以根据dataType来区分是Params、Headers还是Body的参数，构造不同的请求数据结构

        let requestData = {}; 
        if(param){
            requestData = {
                name: param[0],
                value: param[1],
                type: param[2],
                explanation: param[3],
                apiId: param[4],
                formatType: dataType
            };
        }
        let url = `http://localhost/tex/request/param`;
        if(method==='GET'){
            url += `/list`;
        }
        else if(method === 'DELETE') {
            url += `/delete`;
        }
        if (id) {
            url += `/${id}`; // 拼接id，如 /api/params/123
        }

        try{
            const requestConfig = {
                url: url,
                method: method,
                headers: {
                    'token': localStorage.getItem('token') 
                }
            };
            if(method !== 'GET'&& method !== 'DELETE') {
                requestConfig.data = requestData; // 非GET、DELETE请求才有请求体
            }
            else if(method === 'GET'){
                requestConfig.params = {
                    formatType: dataType, // 传递数据类型，后端根据这个参数来区分返回哪个接口的参数列表
                };
            }

            const res= await request(requestConfig);
            return res; // 根据后端返回结构调整
        }catch(err){
            throw new Error(`请求失败：${err.response?.data?.message || err.message}`);
        }
    }


//统一创建表单函数
function renderform(container,config){
    container.innerHTML = "";
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    // 创建formData列表（保留原id以兼容现有CSS）
    const ul = document.createElement('ul');
    ul.id = 'formDataList';

    // header 行（第一行为表头）
    const headerLi = document.createElement('li');
    headerLi.className = 'param-header-row';

    // 使用 config 来生成表头列，保持顺序一致
    config.forEach(item => {
        const span = document.createElement('span');
        span.className = 'param-label';
        span.textContent = item.label || '';
        if(item.marginLeft) span.style.marginLeft = item.marginLeft;
        headerLi.appendChild(span);
    });

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

        const keyInput = document.createElement('input');
        const valueInput = document.createElement('input');
        const typeInput = document.createElement('input');
        const explainInput = document.createElement('input');
        const removeButton = document.createElement('button');

        keyInput.placeholder = '添加参数';
        keyInput.className = 'param-name-input';
        valueInput.className = 'param-value-input';
        typeInput.className = 'type-input';
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
        }

        // 插入输入项，按照 config 的字段顺序
        config.forEach(item => {
            if(item.key === 'name') row.appendChild(keyInput);
            else if(item.key === 'value') row.appendChild(valueInput);
            else if(item.key === 'type') row.appendChild(typeInput);
            else if(item.key === 'explanation') row.appendChild(explainInput);
        });
        row.appendChild(removeButton);

        // 失焦处理：和原逻辑保持一致（新增/更新）
        row.addEventListener('focusout', function(e){
            if(e.target.tagName.toLowerCase() !== 'input') return;

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

                const apiId = document.getElementById('requestArea').dataset.apiId;
                const param = [keyInput.value.trim(), valueInput.value.trim(), typeInput.value.trim(), explainInput.value.trim(), apiId];
                const dataType = container.dataset.type;
                const method = row.dataset.id ? 'PUT' : 'POST';

                sendRequest(param, row.dataset.id, dataType, method)
                .then(res => {
                    if(res.data && res.data.data && res.data.data.id){
                        row.dataset.id = res.data.data.id;
                    }
                }).catch(err => {
                    console.error('保存参数失败：', err);
                });
            }
            updateRemoveButtons();
        });

        // 删除按钮行为：两步确认
        removeButton.dataset.confirmed = 'false';
        removeButton.onclick = function(e){
            e.stopPropagation();
            if(removeButton.dataset.confirmed === 'true'){
                if(row.dataset.id){
                    const dataType = container.dataset.type;
                    sendRequest(null, row.dataset.id, dataType, 'DELETE');
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
        removeButton.addEventListener('mouseout', function(){
            this.classList.remove('active');
            this.dataset.confirmed = false;
            setTimeout(()=>{ this.innerHTML = '<i class="bi bi-dash-lg"></i>'; }, 200);
        });

        ul.appendChild(row);
        updateRemoveButtons();
    }

    try{
        const requestDataType = container.dataset.type;
        const apiId = document.getElementById('requestArea').dataset.apiId;
        sendRequest(null, apiId, requestDataType, 'GET')
        .then(res => {
            const paramsList = res.data.data || [];
            if(paramsList.length > 0){
                paramsList.forEach(param => {
                    const paramData = { name: param.name, value: param.value, type: param.type, explanation: param.explanation, id: param.id };
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
        const reponseApi = createResponseApi();
        responseApi.updateInfo(requestBodyData);
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

    //初始化响应区域的接口实例
    const responseApi= createResponseApi(apiData.id);

    // 复用调试窗口的接口基本信息展示部分（url，请求参数），保持设计窗口和调试窗口风格一致
    renderDebug(apiData,config); 
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
                "id": container.dataset.apiId,
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
    const responseContentType=document.createElement('input');

    responseContentTypeSpan.className='response-content-type-span';
    responseContentTypeLabel.className='response-content-type-label';
    responseContentType.className='response-content-type-input';

    responseContentTypeLabel.textContent='内容格式: ';
    responseContentType.value='JSON';

    responseContentTypeSpan.appendChild(responseContentTypeLabel);
    responseContentTypeSpan.appendChild(responseContentType);
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

        const responseContentTypeValue = responseContentType.value.trim();
        if(responseContentTypeValue) {
            responseContentType.style.borderColor = '';
        }else{
            responseContentType.style.borderColor = '#e53e3e';
        }

        const requestBodyData = {
                "id": container.dataset.responseId,
                "apiId": apiData.id,
                "responseCode": responseCodeValue,
                "name": responseNameValue,
                "contentType": responseContentTypeValue,
            };

        updateApiInfoArea(requestBodyData);
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
                if(responseContentType) responseContentType.value = responseData.contentType || '';

                //在异步内执行，避免还没拿到数据就渲染表格
                renderBodyNodeForm(responseBodyContainer);
            }
        }else{
            //如果没有创建过根节点，就初始化
            const root=new TreeNode({
                key: '根节点',
                type: typeList.object,
                value: null,
                explanation: null
            });
            console.log('初始化根节点：', root);

            //如果是根节点，初始化发送创建请求
            
            //获取表格转Json数据
            const responseCodeInput = responseCode;
            const responseNameInput = responseName;
            const responseContentTypeInput = responseContentType;

            const jsonStr=treeToJsonString(root);
            console.log('转换为JSON字符串：', jsonStr);

            //构建请求体
            const requestBodyData = {
                apiId: apiData.id,
                responseCode: responseCodeInput ? responseCodeInput.value.trim() : '',
                name: responseNameInput ? responseNameInput.value.trim() : '',
                contentType: responseContentTypeInput ? responseContentTypeInput.value.trim() : '',
                body: JSON.stringify(jsonStr)
            };

            //发送新建请求
            responseApi.add(requestBodyData)
            .then(res => {
                console.log('根节点创建成功：', res,'responseId:', res.data.data.id);
                //将返回的responseId存储在容器dataset中，方便后续更新
                container.dataset.responseId = res.data.data.id;
                responseBodyContainer.dataset.responseId=res.data.data.id; 
                responseBodyContainer.dataset.rootId=root.id;
                //在异步内执行，避免还没拿到数据就渲染表格
                renderBodyNodeForm(responseBodyContainer);
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

    
    console.log('渲染节点树表格...');
    const apiId=container.dataset.apiId;
    const responseId=container.dataset.responseId;
    const rootId=container.dataset.rootId;

    const responseApi= createResponseApi(apiId);


    container.innerHTML = "";

    container.dataset.apiId=apiId; // 确保接口id在dataset中，后续发送请求时可以用到
    container.dataset.responseId=responseId; // 确保响应id在dataset中，后续发送请求时可以用到
    container.dataset.rootId=rootId; // 确保根节点id在dataset中，后续发送请求时可以用到
    console.log('apiId:', container.dataset.apiId, 'responseId:', container.dataset.responseId,'rootId:', container.dataset.rootId);

    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    //创建Body节点表
    const ul=document.createElement('ul');
    ul.id='BodyNodeForm';


    //添加节点项
    function addFormDataItem(Data){
        //如果是根节点初始化（Data.parentId为null）
        //修改keyInput的value为"根节点",禁用该输入框
        //修改类型为Object
        //删除按钮隐藏

        Data = Data ?? {};
        //没有父节点就是根节点
        const is_root=(!Data.parentId);
        const apiId=container.dataset.apiId;

        const formDataLi=document.createElement('li');
        const keyInput=document.createElement('input');
        const valueInput=document.createElement('input');
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

        if(is_root){
            //根节点类型默认Object
            typeInput.value=typeList.object;
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
        formDataLi.appendChild(valueInput);
        formDataLi.appendChild(explainInput);
        formDataLi.appendChild(addButton);
        formDataLi.appendChild(removeButton);
        
        //Data除了包含输入框的内容，还要有父节点的id
        if(!is_root){
            //非根节点

            //填充数据
            keyInput.value=Data.key||'';
            valueInput.value=Data.value||'';
            typeInput.value=Data.type||'';
            explainInput.value=Data.explanation||'';

            
            //获取父节点，在父节点的左内边距上再加一段边距，绑定父节点（绑定父节点id，因为父节点只会有一个，子节点可能有无数个）
            const parent=document.getElementById(Data.parentId);
            
            const input=parent?.firstElementChild;
            
            //console.log("父节点,id,is_root",parent,Data.parentId);
            
            
            let margin=input?.style.marginLeft || 0;
            //添加左内边距同时，拉回，保证整体排版不变
            margin=`${parseFloat(margin)+2}rem`;

            keyInput.style.marginLeft=margin;
            formDataLi.dataset.parentId=Data.parentId;

        }

        function updatateResponseBody(){
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
        formDataLi.addEventListener('focusout', function(e) {
            // 只有当离开的元素是输入框时才进行验证，避免过早验证
            if(e.target.tagName.toLowerCase() != 'input') {
                return;
            }
        
            if(typeInput.value.trim()===typeList.object){
                //如果类型是Object,并且禁用value输入框，因为Object类型不需要value值
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
                    node.set({
                        key: keyInput.value.trim(),
                        value: valueInput.value.trim(),
                        type: typeInput.value.trim(),
                        explanation: explainInput.value.trim()
                    });
                    console.log('更新节点数据：', node);
                }else{
                    console.error('节点未找到，无法更新数据');
                    return;
                }

                
                if(!nodeMap.get(container.dataset.rootId)){
                    console.error('根节点未找到，无法发送请求');
                    return;
                }

                updatateResponseBody();
            }
        });
        
        //在父项下面添加新列表项，形成树结构
        if(Data.neigborId){
            //如果有邻居节点id，说明新节点添加为兄弟节点，插入到邻居节点后面
            const neighbor=document.getElementById(Data.neigborId);
            if(neighbor && neighbor.parentNode === ul) {
                ul.insertBefore(formDataLi, neighbor.nextSibling);
            }else{
                ul.appendChild(formDataLi);
            }
        }else{
            //如果没有邻居节点id，说明新节点添加为子节点，直接添加到父节点下面
            ul.appendChild(formDataLi);
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
                updatateResponseBody();
                 

                 ul.removeChild(formDataLi);
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

        //添加按钮点击事件
        addButton.onclick = function(e){
            e.stopPropagation();

            const data={
                parentId: formDataLi.id,
                neigborId: formDataLi.id, //暂时不需要邻居节点id，因为新节点默认添加为最后一个子节点
            }
            //检查类型
            if(typeInput.value==typeList.object){
                //如果是Object就添加子节点，自己作为其父节点
            }else{
                //如果不是，就添加相邻节点，自己的父节点作为其父节点
                data.parentId=formDataLi.dataset.parentId;
            }

            //在树结构中找到父节点，添加当前节点为父节点的子节点
            const parentNode=nodeMap.get(data.parentId);
            if(parentNode) {
                const newNode = new TreeNode({
                    key: '',
                    type: '',
                    value: '',
                    explanation: ''
                });
                parentNode.addChild(newNode);

                data.id=newNode.id; // 将生成的节点id赋值给data，方便后续操作
            } else {
                console.error('父节点未找到，无法添加子节点，父节点id：', Data.parentId);
            }

            addFormDataItem(data); // 添加新节点表单项
            updatateResponseBody(); // 添加节点后更新树结构到后端

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
            //拆解json，获得参数列表，每一条要包含key,type,value,explanation
            const root=TreeNode.convertFromJson(JSON.parse(jsonStr));
            container.dataset.rootId=root.id;
            //递归函数
            function buildForm(parent,root){
                if(!root) return;
                const data=root.toPlainObject();
                data.id=root.id;
                //console.log('parent:', parent, 'root:', root);
                if(parent){
                    data.parentId=parent.id;
                }

                addFormDataItem(data);
                root.children.forEach(child=>{
                    buildForm(root,child);
                })

            }
            buildForm(null,root);
        })
    }catch(err){

        console.error('获取参数列表失败详情：', err);
        const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';

        alert('获取参数列表失败：' + errMsg);
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
            apiData.status = this.dataset.statusValue; // 更新接口数据中的状态字段，后续发送请求时可以用到
            const requestBodyData = {
                "id": container.dataset.apiId,
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
    apiInfoDiv.appendChild(createInfoItem('修改者', apiData.updateUser || apiData.modifiedBy || '未设置'));
    apiInfoDiv.appendChild(createInfoItem('创建者', apiData.createUser || apiData.createdBy || '未设置'));
    apiInfoDiv.appendChild(createInfoItem('责任人', apiData.inChargeUser || '未设置'));

    container.appendChild(apiInfoDiv);

    

    const paramsTitle=document.createElement('h3');
    paramsTitle.textContent = "请求参数";
    paramsTitle.className = "preview-params-title";
    // paramsTitle.style.marginTop = "1.5rem";
    container.appendChild(paramsTitle);

    const paramsDiv=document.createElement('div');
    paramsDiv.className = "preview-params-div";

    const bodyInfoSpan=document.createElement('span');
    bodyInfoSpan.className = 'preview-body-info';

    const bodyTitle=document.createElement('span');
    bodyTitle.textContent = "Body 参数";
    bodyTitle.className = "body-title";

    const bodyType=document.createElement('span');
    bodyType.textContent = `${httpMimeTypes[localStorage.getItem('contentType')] || '未设置'}`;
    bodyType.className = "preview-type-label";

    bodyInfoSpan.appendChild(bodyTitle);
    bodyInfoSpan.appendChild(bodyType);

    paramsDiv.appendChild(bodyInfoSpan);
    container.appendChild(paramsDiv);
    if(localStorage.getItem('contentType')!=typeList.None) {

        request.get(`/request/param/list/${apiData.id}`,{
            params: {
                formatType:localStorage.getItem('contentType') || ''
            }
        }).then(res => {
            const data = res.data.data || [];
            if(data.length > 0) {
                const paramsList = createParamList(data);
                paramsDiv.appendChild(paramsList);
                
            }
        })
    }else{
        const noParamsSpan=document.createElement('span');
        noParamsSpan.textContent = "无";
        noParamsSpan.className = "no-params-span";
        paramsDiv.appendChild(noParamsSpan);

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
    contentTypeSpan.textContent = `${httpMimeTypes['json']}`;
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
                createResponsePreviewDiv(data.responseBody, responsePreviewDiv);
                createResponseJsonExampleDiv(data.responseBody, responseJsonExampleDiv);
                
            })
        }
    });

    
}
window.onload = async function () {
    const params=getUrlParams();
    //console.log("创建标题：",params.name);
    document.title='项目空间：'+(params.name || '未命名项目');
    
    //获取项目id
    const id=params.id;

    //发送请求，获取接口列表 id：项目id
    try{
    console.log("准备发送请求..");
    const res= await request.get(`http://localhost/tex/api/list/${id}`,{
        headers: {
                'token': localStorage.getItem('token') 
            }
        });  
    const data=res.data.data;
    renderApiList(data);
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
};