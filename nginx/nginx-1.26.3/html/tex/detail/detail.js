
import { request,getUrlParams } from "../config/AxiosConfig/AxiosConfig.js";
import { methodlist,methodColors,methodBackroundColors } from "../config/MethodConfig.js";
import { requestDataType,typeList} from "../config/TypeConfig.js";
import { debugFormConfig,designFormConfig } from "../config/FormConfig.js";
import { statusText,statusColors } from "../config/statusConfig.js";
import { TreeNode } from "../module/BodyTree.js";
import { getRandomId } from "../utils/RandomUtil.js";

/**
 * 渲染接口列表
 * @param {传入api列表} apiData 
 * @returns 
 */
function renderApiList(apiData){
    console.log("渲染界面..");
    const container=document.getElementById('apiList');
    if(!container){
        console.log("container为空");
        return;
    }
    container.innerHTML= "";

    //创建标题
    const title=document.createElement('h2');
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
        console.log("表单项：",item);
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
        console.log("testWindow容器为空");
        return;
    }

    // 顶部标签容器，统一样式
    const tabContainer = document.getElementById('tabContainer');
        if(!tabContainer) {
            console.log("tabContainer容器为空");
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
        console.log("subWindow容器为空");
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
        //发送请求，告诉后端apiId为xxx的接口要发送请求了，在后端向指定接口发送请求
        request.post(`http://localhost/tex/api/send`,{
            
            apiId: apiData.id,
            contentType: localStorage.getItem('contentType') || requestDataType.None // 发送当前选择的请求体格式，后端根据这个参数来区分请求体数据结构
        
        }).then(res => {
            // 更新响应区域
            const responseContent = document.querySelector('.response-content');
            if (responseContent) {
                responseContent.textContent = JSON.stringify(res, null, 2);
                responseContent.style.color = "#000"; // 正常颜色
            }
        }).catch(err => {
            // 更新响应区域显示错误
            const responseContent = document.querySelector('.response-content');
            if (responseContent) {
                responseContent.textContent = `错误: ${err.response?.data?.message || err.message || '未知错误'}`;
                responseContent.style.color = "#ff0000"; // 错误颜色
            }
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

    //创建formData列表
    const ul=document.createElement('ul');
    ul.id='formDataList';

    const textli=document.createElement('li');
    const keySpan=document.createElement('span');
    // keySpan.textContent='参数名';
    keySpan.className = 'param-label';
    const valueSpan=document.createElement('span');
    // valueSpan.textContent='参数值';
    valueSpan.className = 'param-label';
    
    //调整与输入框左对齐
    const typeSpan=document.createElement('span');
    // typeSpan.textContent='类型';
    typeSpan.className = 'param-label';

    const explainSpan=document.createElement('span');
    // explainSpan.textContent='说明';
    explainSpan.className = 'param-label';

    config.forEach(item => {
        if(item.key === 'name') {
            keySpan.textContent = item.label;
            textli.appendChild(keySpan);
        }else if(item.key === 'value') {
            valueSpan.textContent = item.label;
            valueSpan.style.marginLeft=item.marginLeft;
            textli.appendChild(valueSpan);
        }else if(item.key === 'type') {
            typeSpan.textContent = item.label;
            typeSpan.style.marginLeft=item.marginLeft;
            textli.appendChild(typeSpan);
        }else if(item.key === 'explanation') {
            explainSpan.textContent = item.label;
            explainSpan.style.marginLeft=item.marginLeft;
            textli.appendChild(explainSpan);
        }
    });

    ul.appendChild(textli);

    //更新删除按钮状态函数(可选)
    function updateRemoveButtons() {
        const formDataItems = ul.querySelectorAll('li:not(:first-child)');

        //有值的参数项才显示删除按钮
        formDataItems.forEach((item) => {
            const removeBtn = item.querySelector('.remove-btn');
            item.querySelectorAll('input').forEach(input =>{
                if(input.value.trim()!='') {
                    removeBtn.style.visibility = 'visible';
                }
            });
        })
    }

    //添加formData项
    function addFormDataItem(Data){
        const formDataLi=document.createElement('li');
        const keyInput=document.createElement('input');
        const valueInput=document.createElement('input');
        const typeInput=document.createElement('input');
        const explainInput=document.createElement('input');
        const removeButton=document.createElement('button');

        keyInput.placeholder="添加参数";
        keyInput.className = 'param-name-input';
        valueInput.className = 'param-value-input';
        typeInput.className = 'type-input';
        explainInput.className = 'explain-input';
        removeButton.innerHTML = '<i class="bi bi-dash-lg"></i>';
        removeButton.className = 'remove-btn';
        removeButton.style.visibility = 'hidden'; // 默认隐藏，只有输入内容后才显示

        if(Data){
            // 如果传入了Data参数，说明是编辑已有参数，需要预填充输入框
            keyInput.value=Data.name || '';
            if(!keyInput.value.trim()) {
                keyInput.placeholder= "参数名";
                keyInput.style.outline = '1px solid #e53e3e';
            }
            valueInput.value=Data.value || '';
            typeInput.value=Data.type || '';
            explainInput.value=Data.explanation || '';
            formDataLi.dataset.id = Data.id;  //设置行dataset为id(返回的参数id)，方便后续修改
        }

        config.forEach(item => {
            if(item.key === 'name') {

                formDataLi.appendChild(keyInput);

            }else if(item.key === 'value') {

                formDataLi.appendChild(valueInput);

            }else if(item.key === 'type') {

                formDataLi.appendChild(typeInput);

            }else if(item.key === 'explanation') {

                formDataLi.appendChild(explainInput);

            }
        });
        formDataLi.appendChild(removeButton);

        //监听鼠标离开事件
        formDataLi.addEventListener('focusout', function(e) {
            // 只有当离开的元素是输入框时才进行验证，避免过早验证
            if(e.target.tagName.toLowerCase() != 'input') {
                return;
            }
        

            if(keyInput.value.trim()||valueInput.value.trim()||typeInput.value.trim()||explainInput.value.trim()) {
                //存在输入框不为空
                if (!keyInput.value.trim()&&(valueInput.value.trim()||typeInput.value.trim()||explainInput.value.trim())) {
                    //参数名输入框为空

                    //console.log('参数名不能为空');
                    keyInput.style.outline = "1px solid #e53e3e";
                    keyInput.style.outlineOffset = "0";
                    keyInput.placeholder= "参数名";
                }else{
                    //参数名不为空

                    //恢复默认
                    keyInput.style.outline = '';
                    keyInput.placeholder= "添加参数";
                }

                //新增一个参数项
                if(!formDataLi.dataset.id){
                    // 只有当前行没有id，说明是新输入的行，才添加新的空行。有id则不反复添加空行，保证始终只有一个空行
                    addFormDataItem(null); 
                }
                

                keyInput.style.borderColor = '';
                const paramName = keyInput.value.trim();
                const paramValue = valueInput.value.trim();
                const paramType = typeInput.value.trim();
                const paramExplain = explainInput.value.trim();

                // 获取当前接口id
                const apiId= document.getElementById('requestArea').dataset.apiId; 

                //console.log(`参数名：${paramName}，参数值：${paramValue}，类型：${paramType}，说明：${paramExplain}, 接口id：${apiId}`);
                const param=[paramName, paramValue, paramType, paramExplain, apiId];

                //发送请求函数：dataType = requestDataType.Query , ... 作为url的参数
                const dataType=container.dataset.type;

                // 有id是修改，无id是添加
                const method = formDataLi.dataset.id ? 'PUT' : 'POST'; 
                
                //如果id为空则代表是添加，如果不为空则代表是修改
                sendRequest(param,formDataLi.dataset.id,dataType,method) 
                .then(res => {
                    console.log('请求成功：', res);
                    // 设置行dataset为id(返回的参数id)，方便后续修改
                    if(res.data && res.data.data && res.data.data.id) {
                        // 根据后端返回结构调整
                        formDataLi.dataset.id = res.data.data.id; 
                    }
                    // 可以根据需要更新界面，比如显示一个成功提示
                    //alert('参数保存成功');
                })
                
            }
        });
        
        ul.appendChild(formDataLi);

        updateRemoveButtons(); // 添加新项后更新删除按钮显示
        
        removeButton.dataset.confirmed = 'false'; // 初始化删除确认状态
        // 删除按钮点击事件
        removeButton.onclick = function(e){
            e.stopPropagation(); // 阻止事件冒泡，避免触发li的点击事件
            console.log('点击删除按钮，当前确认状态：', removeButton.dataset.confirmed);
            if(removeButton.dataset.confirmed === 'true') {
                console.log('删除参数项，id：', formDataLi.dataset.id);
                // 如果该项有id，说明已经保存过，需要发送删除请求
                if(formDataLi.dataset.id) {
                    const dataType=container.dataset.type;
                    sendRequest(null, formDataLi.dataset.id, dataType, 'DELETE')
                }
                const formatList=ul.querySelectorAll('li:not(:first-child)');
                if(formatList.length > 1) {
                    ul.removeChild(formDataLi);
                }else{

                    // 只有一个参数项时，清空输入框内容但不删除
                    formDataLi.querySelectorAll('input').forEach(input => input.value = '');
                    removeButton.dataset.confirmed = 'false'; // 重置删除确认状态
                }
                // 删除后重新更新删除按钮显示
                updateRemoveButtons();
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
    }

    
    try{

        const requestDataType = container.dataset.type; // 从容器dataset获取数据类型，之前点击不同参数类型时已经设置好了
        const apiId= document.getElementById('requestArea').dataset.apiId;// 获取当前接口id

        sendRequest(null, apiId, requestDataType, 'GET') // 获取已有参数列表，传入null让函数构造一个空请求体
        .then(res => {
        
            console.log('获取参数列表成功：', res);
            const paramsList = res.data.data || {};

            if(paramsList.length > 0) {
                paramsList.forEach(param => {
                    //遍历每个参数项，渲染输入框，预填充数据
                    const paramData = {
                        name: param.name, 
                        value: param.value, 
                        type: param.type, 
                        explanation: param.explanation, 
                        id: param.id
                    }; //后端返回每个param参数的id，用来初始化

                    addFormDataItem(paramData); // 传入参数数据，预填充输入框
                    
                });

        }
        addFormDataItem(null); // 初始化一个参数项
        
        
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

    // 复用调试窗口的接口基本信息展示部分（url，请求参数），保持设计窗口和调试窗口风格一致
    renderDebug(apiData,config); 
    const requestLine = document.getElementById('requestInfo');

    const apiInfoArea = document.createElement('div');
    apiInfoArea.className = "api-info-area";

    const apiTitleDiv = document.createElement('div');
    apiTitleDiv.className = "api-title-div";    

    const apiName = document.createElement('input');
    apiName.value = apiData.apiName || '未命名接口';
    apiName.className = "api-name-input";
    
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status-span';
    const statusLight= document.createElement('span');
    statusLight.innerHTML = '&#9679;  '; // 圆形符号

    if(!apiData.status) {
        throw new Error('接口状态未定义');
    }

    // 根据状态设置颜色
    statusLight.style.color =statusColors[apiData.status]; 

    const statusTextSpan = document.createElement('span');
    statusTextSpan.textContent = statusText[apiData.status];

    statusSpan.appendChild(statusLight);
    statusSpan.appendChild(statusTextSpan);
    

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
    apiInChargeUser.className = "api-incharge-user-input";

    //TODO apiData返回数据中将责任人id转名字
    apiInChargeUser.value = apiData.inChargeUser || '';
    apiInChargeUserDiv.appendChild(apiInChargeUserLabel);
    apiInChargeUserDiv.appendChild(apiInChargeUser);

    apiInfoArea.appendChild(apiTitleDiv);
    apiInfoArea.appendChild(apiExplanationDiv);
    apiInfoArea.appendChild(apiInChargeUserDiv);

    container.insertBefore(apiInfoArea, requestLine); // 将接口信息区域插入到请求行上方

    //发送GET请求，获取到响应数据
    //如果value有数据就设置responseBodyContainer.dataset.responseId
    //如果响应数据不为空，就把Info部分重新赋值
    //如果为空就按默认的来

    // 响应格式设计区域
    const responseDesign = document.createElement('div');
    responseDesign.className = "response-design";
    const responseTitle = document.createElement('div');
    responseTitle.textContent = "返回响应";
    responseTitle.className = "params-title";
    responseDesign.appendChild(responseTitle);

    const responseLabel=document.createElement('span');
    responseLabel.className='response-label';
    //暂时先限定只有200状态码
    responseLabel.textContent='200 成功';
    
    responseDesign.appendChild(responseLabel);

    

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
    responseBodyContainer.className='response-body-container';

    renderBodyNodeForm(responseBodyContainer);
    
    responseBodyArea.appendChild(responseBodyContainer);

    responseDesign.appendChild(responseBodyArea);
    container.appendChild(responseDesign);
}

//渲染Body节点树表格
function renderBodyNodeForm(container){

    
    //console.log('渲染节点树表格...');
    container.innerHTML = "";
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    //创建Body节点表
    const ul=document.createElement('ul');
    ul.id='BodyNodeForm';


    //添加节点项
    function addFormDataItem(Data){
        //如果是根节点初始化（Data为null）
        //修改keyInput的value为"根节点",禁用该输入框
        //修改类型为Object
        //删除按钮隐藏
        const is_root=(Data===null);
        const apiId=container.dataset.apiId;

        const formDataLi=document.createElement('li');
        const keyInput=document.createElement('input');
        const valueInput=document.createElement('input');
        const typeInput=document.createElement('input');
        const explainInput=document.createElement('input');

        const addButton=document.createElement('button');
        const removeButton=document.createElement('button');

        //生成随机id
        formDataLi.id=getRandomId();

        keyInput.placeholder="字段名";
        keyInput.className = 'param-name-input';
        if(is_root){
            keyInput.value="根节点";
            keyInput.className='param-root';
            //根节点字段名设置只读
            keyInput.readOnly=true;
        }

        valueInput.placeholder='示例值';
        valueInput.className = 'param-value-input';

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
            keyInput.value=Data.name||'';
            valueInput.value=Data.value||'';
            typeInput.value=Data.type||'';
            explainInput.value=Data.explanation||'';

            
            //获取父节点，在父节点的左内边距上再加一段边距，绑定父节点（绑定父节点id，因为父节点只会有一个，子节点可能有无数个）
            const parent=document.getElementById(Data.parentId);
            const input=parent.firstElementChild;
            //console.log("父节点,id,is_root",parent,Data.parentId);
            
            
            let margin=input.style.marginLeft || 0;
            //添加左内边距同时，拉回，保证整体排版不变
            margin=`${parseFloat(margin)+2}rem`;

            keyInput.style.marginLeft=margin;
            formDataLi.dataset.parentId=Data.parentId;

        }else{
            //如果是根节点，初始化发送创建请求
            const url=request.baseURL+`/response/add/${apiId}`;
            //获取表格转Json数据

            //构建请求体

            //发送POST请求
        }

        

        //监听鼠标离开事件
        formDataLi.addEventListener('focusout', function(e) {
            // 只有当离开的元素是输入框时才进行验证，避免过早验证
            if(e.target.tagName.toLowerCase() != 'input') {
                return;
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
                

                //发送请求（只修改，在初始化根节点的时候发送创建请求）
                // 获取当前接口id
                const apiId= document.getElementById('requestArea').dataset.apiId; 

                //单条数据发生变化=>将整张表打包成Json字符串发送请求：

                //按照层级构建Json数据，遍历所有列表项，如果有parentId，就在对应父节点id的Json节点push子节点。

                //只发送修改请求
            }
        });
        
        ul.appendChild(formDataLi);

        //updateRemoveButtons(); // 添加新项后更新删除按钮显示
        
        removeButton.dataset.confirmed = 'false'; // 初始化删除确认状态
        // 删除按钮点击事件
        removeButton.onclick = function(e){
            e.stopPropagation(); // 阻止事件冒泡，避免触发li的点击事件
            console.log('点击删除按钮，当前确认状态：', removeButton.dataset.confirmed);
            if(removeButton.dataset.confirmed === 'true') {
                console.log('删除参数项，id：', formDataLi.dataset.id);
                // 如果该项有id，说明已经保存过，需要发送删除请求
                if(formDataLi.dataset.id) {
                    const dataType=container.dataset.type;
                    sendRequest(null, formDataLi.dataset.id, dataType, 'DELETE')
                }
                const formatList=ul.querySelectorAll('li:not(:first-child)');
                if(formatList.length > 0) {

                    //如果是有子节点，递归删除所有子节点


                    ul.removeChild(formDataLi);
                }else{

                    // 只有一个参数项时，清空输入框内容但不删除
                    formDataLi.querySelectorAll('input').forEach(input => input.value = '');
                    removeButton.dataset.confirmed = 'false'; // 重置删除确认状态
                }
                // 删除后重新更新删除按钮显示
                //updateRemoveButtons();
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
            //检查类型
            if(typeInput.value==typeList.object){
                //console.log("object, parentId:",formDataLi.id);
                //如果是Object就添加子节点，自己作为其父节点
                addFormDataItem({parentId:formDataLi.id});
            }else{
                //如果不是，就添加相邻节点，父节点作为其父节点
                addFormDataItem({parentId:formDataLi.dataset.parentId});
            }
        }

    }

    if(!container.dataset.responseId){
        //如果没有创建过根节点，就初始化
        addFormDataItem(null);
    }

    
    try{
        //根据参数类型和接口id获取已有参数列表
        const requestDataType = container.dataset.type; // 从容器dataset获取参数类型，之前点击不同参数类型时已经设置好了
        const apiId= document.getElementById('subWindow').dataset.apiId;// 获取当前接口id

        sendRequest(null, apiId, requestDataType, 'GET') // 获取已有参数列表
        .then(res => {
            console.log('获取参数列表成功：', res);
            const param = res.data.data || {};

            container.dataset.responseId=param.id;
            const jsonStr=param.value;
            //拆解json，获得参数列表，每一条要包含key,type,value,explanation,parentId
            
            //遍历，循环建表
            addFormDataItem(paramData); // 传入参数数据，预填充输入框
                
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

/*
//将表格转为树
function tableToTree(ul){
    //存储键值对：id : 节点
    let map={};
    ul.querySelectorAll('li').forEach(li=>{

        const data={
            id:li.id,
            key:li.keyInput.value,
            type:li.typeInput.value,
            value:li.valueInput.value,
            explanation:li.explainInput,
        }
        let node=new TreeNode(data)
        map[li.id]=node;
        //从上往下，建立子节点的时候一定有父节点了（除根节点）
        if(li.parentId){
            let parent=map[li.parentId];
            parent.addChild(node);
        }
    })
    //返回id-节点映射
    return map;
}
*/

//把树转为JsonString
function treeToJsonString(root){
    return JSON.stringify(TreeNode.toJson(root));
}

//把jsonString转为树(映射)
function jsonStringToTree(jsonString){
    return TreeNode.convertFromJson(jsonString);
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

    // 文档预览标题
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = `接口文档：${apiData.apiName || '未命名接口'}`;
    previewTitle.className = "preview-title";
    container.appendChild(previewTitle);

    // 文档主体容器
    const docContent = document.createElement('div');
    docContent.className = "doc-content";

    // 接口描述
    const descSection = document.createElement('section');
    descSection.className = "doc-section";
    const descTitle = document.createElement('h4');
    descTitle.textContent = "接口描述";
    const descText = document.createElement('p');
    descText.textContent = apiData.apiDesc || "该接口暂无描述信息";
    descSection.appendChild(descTitle);
    descSection.appendChild(descText);
    docContent.appendChild(descSection);

    // 调用说明
    const callSection = document.createElement('section');
    callSection.className = "doc-section";
    const callTitle = document.createElement('h4');
    callTitle.textContent = "调用说明";
    const callList = document.createElement('ul');
    callList.className = "call-list";
    
    // 请求方法
    const methodLi = document.createElement('li');
    const methodLabelText = document.createTextNode('请求方法:');
    const methodValueSpan = document.createElement('span');
    methodValueSpan.style.marginLeft = '10px'; // 和标签留间距

    methodValueSpan.textContent = apiData.requestMethod || '未知';

    methodValueSpan.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];
    methodValueSpan.style.fontWeight = 'bold'; // 可选：加粗突出
    

    methodLi.appendChild(methodLabelText);
    methodLi.appendChild(methodValueSpan);
    // 请求地址
    const urlLi = document.createElement('li');
    urlLi.textContent = `请求地址：${apiData.requestUrl || '未配置'}`;
    // 权限说明（模拟字段）
    const authLi = document.createElement('li');
    authLi.textContent = `权限要求：${apiData.needAuth ? '需要登录' : '无需登录'}`;

    callList.appendChild(methodLi);


    callList.appendChild(urlLi);
    callList.appendChild(authLi);
    callSection.appendChild(callTitle);
    callSection.appendChild(callList);
    docContent.appendChild(callSection);

    // 响应示例
    const responseSection = document.createElement('section');
    responseSection.className = "doc-section";
    const responseTitle = document.createElement('h4');
    responseTitle.textContent = "响应示例";
    const responsePre = document.createElement('pre');
    responsePre.className = "doc-pre";
    const exampleData = apiData.responseExample || {
        code: 200,
        msg: "操作成功",
        data: null
    };
    responsePre.textContent = JSON.stringify(exampleData, null, 2);
    responseSection.appendChild(responseTitle);
    responseSection.appendChild(responsePre);
    docContent.appendChild(responseSection);

    container.appendChild(docContent);
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