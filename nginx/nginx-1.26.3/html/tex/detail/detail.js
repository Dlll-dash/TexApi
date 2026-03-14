//解析url参数
function getUrlParams() {
    const params = {};
    const search = window.location.search.slice(1); // 获取?后的部分
    if (search) {
        search.split('&').forEach(item => {
            const [key, value] = item.split('=');
            params[key] = decodeURIComponent(value || '');
        });
    }
    return params;
}

const methodColors = {
    'GET': '#09ff01',
    'POST': '#ff9901',
    'PUT': '#0ab9fe',
    'DELETE': '#ff0101',
    'DEFAULT': '#666'
};

const methodBackroundColors = {
    'GET': '#5cfe5638',
    'POST': '#f0b8633c',
    'PUT': '#5fd0fc61',
    'DELETE': '#f8656563',
    'DEFAULT': '#433e3e53'
};


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
            renderTestWindow(item);
        }
        ul.appendChild(li);
    });
    //默认打开第一个接口
    renderTestWindow(apiData[0]);
}

/**
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
        renderDebug(apiData);
    };

    const designSpan=document.getElementById('designTab');
    designSpan.textContent='设计';
    designSpan.className = "test-tab";
    //点击事件
    designSpan.onclick=function(){
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        designSpan.classList.add('active');
        renderDesign(apiData);
    };

    const previewSpan=document.getElementById('previewTab');
    //点击事件
    previewSpan.onclick=function(){
        tabContainer.querySelectorAll('span').forEach(tab => tab.classList.remove('active'));
        previewSpan.classList.add('active');
        renderPreview(apiData);
    };

    //默认打开debug区
    renderDebug(apiData);
}

/**
 * 渲染调试窗口
 * @param {传入单个api} apiData 
 */
function renderDebug(apiData){
    const container=document.getElementById('subWindow');
    if(!container) {
        console.log("subWindow容器为空");
        return;
    }
    container.innerHTML="";//清空原有内容
    container.className = "debug-container"; // 新增容器类名

    // 创建请求行容器
    const requestLine = document.createElement('div');
    requestLine.className = "request-line";

    const methodSpan=document.createElement('span');
    const urlInput=document.createElement('input');
    const submitButton=document.createElement('button');

    methodSpan.textContent=apiData.requestMethod;
    methodSpan.className='methodValue';

    // 复用请求方法颜色逻辑,但是url前的方法标签颜色有背景色加圆角，不想再单独去加一个样式了，就直接在这里加了，只有这里用
    methodSpan.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];
    methodSpan.style.backgroundColor = methodBackroundColors[apiData.requestMethod] || methodBackroundColors['DEFAULT'];
    methodSpan.style.padding = '0.6rem 1.3rem'; // 增加内边距
    methodSpan.style.borderRadius = '4px'; // 圆角

    urlInput.value=apiData.requestUrl || '';
    urlInput.className='url';
    urlInput.placeholder = "接口请求地址";

    submitButton.textContent='发送'; 
    submitButton.className = "submit-btn";
    

    requestLine.appendChild(methodSpan);
    requestLine.appendChild(urlInput);
    requestLine.appendChild(submitButton);
    container.appendChild(requestLine);

    const requestInfo = document.createElement('div');
    requestInfo.className = "request-info";

    const Params= document.createElement('span');
    Params.className = "test-tab"; // 复用标签样式
    const Body=document.createElement('span');
    Body.className = "test-tab"; // 复用标签样式
    const Headers=document.createElement('span');
    Headers.className = "test-tab"; // 复用标签样式

    Params.textContent='Params';
    Body.textContent='Body';
    Headers.textContent='Headers';

    requestInfo.appendChild(Params);
    requestInfo.appendChild(Body);
    requestInfo.appendChild(Headers);

    container.appendChild(requestInfo);
    

    //点击事件
    submitButton.onclick = function() {
        console.log(`发送${apiData.requestMethod}请求到：${urlInput.value}`);
        // 可后续补充请求逻辑
        
    };

    // 新增响应结果区域，美化调试窗口
    const responseArea = document.createElement('div');
    responseArea.className = "response-area";
    const responseTitle = document.createElement('div');
    responseTitle.textContent = "响应结果：";
    responseTitle.className = "response-title";
    const responseContent = document.createElement('pre');
    responseContent.className = "response-content";
    responseContent.textContent = "尚未发送请求";
    responseArea.appendChild(responseTitle);
    responseArea.appendChild(responseContent);
    container.appendChild(responseArea);
}

/**
 * 渲染设计窗口（美化补全）
 * @param {传入单个api} apiData 
 */
function renderDesign(apiData){
    const container=document.getElementById('subWindow');
    if(!container) {
        console.log("subWindow容器为空");
        return;
    }
    container.innerHTML="";//清空原有内容
    container.className = "design-container"; // 新增容器类名

    // 创建设计标题
    const designTitle = document.createElement('h3');
    designTitle.textContent = `接口设计：${apiData.apiName || '未命名接口'}`;
    designTitle.className = "design-title";
    container.appendChild(designTitle);

    // 接口基本信息
    const baseInfo = document.createElement('div');
    baseInfo.className = "base-info";
    
    // 请求方法
    const methodItem = document.createElement('div');
    methodItem.className = "info-item";
    const methodLabel = document.createElement('span');
    methodLabel.textContent = "请求方法：";
    methodLabel.className = "info-label";
    const methodValue = document.createElement('span');
    methodValue.textContent = apiData.requestMethod || '未知';
    methodValue.className = "info-value";
    // 复用请求方法颜色逻辑
    methodValue.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];
    methodValue.style.fontWeight = 'bold'; // 可选：加粗突出
    methodItem.appendChild(methodLabel);
    methodItem.appendChild(methodValue);
    
    // 请求路径
    const urlItem = document.createElement('div');
    urlItem.className = "info-item";
    const urlLabel = document.createElement('span');
    urlLabel.textContent = "请求路径：";
    urlLabel.className = "info-label";
    const urlValue = document.createElement('span');
    urlValue.textContent = apiData.requestUrl || '未配置';
    urlValue.className = "info-value";
    urlItem.appendChild(urlLabel);
    urlItem.appendChild(urlValue);

    baseInfo.appendChild(methodItem);
    baseInfo.appendChild(urlItem);
    container.appendChild(baseInfo);

    // 请求参数设计区域
    const paramsDesign = document.createElement('div');
    paramsDesign.className = "params-design";
    const paramsTitle = document.createElement('div');
    paramsTitle.textContent = "请求参数：";
    paramsTitle.className = "params-title";
    paramsDesign.appendChild(paramsTitle);

    // 处理参数为空的情况
    if (!apiData.requestParams || Object.keys(apiData.requestParams).length === 0) {
        const emptyTip = document.createElement('div');
        emptyTip.className = "empty-tip";
        emptyTip.textContent = "暂无请求参数配置";
        paramsDesign.appendChild(emptyTip);
    } else {
        // 生成参数表格（模拟）
        const paramsTable = document.createElement('table');
        paramsTable.className = "params-table";
        // 表头
        const thead = document.createElement('thead');
        const headerTr = document.createElement('tr');
        const headers = ['参数名', '类型', '是否必填', '说明'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerTr.appendChild(th);
        });
        thead.appendChild(headerTr);
        paramsTable.appendChild(thead);

        // 表体（模拟遍历参数，保持风格一致）
        const tbody = document.createElement('tbody');
        Object.entries(apiData.requestParams || {}).forEach(([key, param]) => {
            const tr = document.createElement('tr');
            // 参数名
            const nameTd = document.createElement('td');
            nameTd.textContent = key;
            // 类型
            const typeTd = document.createElement('td');
            typeTd.textContent = param.type || 'string';
            // 是否必填
            const requiredTd = document.createElement('td');
            requiredTd.textContent = param.required ? '是' : '否';
            // 说明
            const descTd = document.createElement('td');
            descTd.textContent = param.desc || '无';

            tr.appendChild(nameTd);
            tr.appendChild(typeTd);
            tr.appendChild(requiredTd);
            tr.appendChild(descTd);
            tbody.appendChild(tr);
        });
        paramsTable.appendChild(tbody);
        paramsDesign.appendChild(paramsTable);
    }
    container.appendChild(paramsDesign);

    // 响应格式设计区域
    const responseDesign = document.createElement('div');
    responseDesign.className = "response-design";
    const responseTitle = document.createElement('div');
    responseTitle.textContent = "响应格式：";
    responseTitle.className = "params-title";
    responseDesign.appendChild(responseTitle);

    const responseContent = document.createElement('pre');
    responseContent.className = "response-content";
    // 格式化响应示例（模拟）
    const responseExample = apiData.responseExample || {
        code: 200,
        msg: "请求成功",
        data: {}
    };
    responseContent.textContent = JSON.stringify(responseExample, null, 2);
    responseDesign.appendChild(responseContent);
    container.appendChild(responseDesign);
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
    const res= await axios.get(`http://localhost/tex/api/list/${id}`,{
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