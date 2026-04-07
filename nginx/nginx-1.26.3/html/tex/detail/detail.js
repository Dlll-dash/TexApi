

// 请求拦截器
axios.interceptors.request.use(
  config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['token'] = token;
      }
    console.log('✅ 请求发出：', config.url); // 关键调试
      return config;
  },
  error => {
    console.error('❌ 请求错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  response => {
    const res = response;
    console.log('✅ 请求成功：', response.config.url, res.data);

    // 成功直接返回
    if ([200, 0, 1].includes(res.data.code)) {
      return res;
    }

    console.warn('⚠️ 业务错误：', res);
    return Promise.reject(res);
  },
  error => {
    console.error('❌ 响应异常：', error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      alert('登录已过期，请重新登录');
      location.href = '/index.html';
    }

    return Promise.reject(error);
  }
);

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

const methodlist= ['GET', 'POST', 'PUT', 'DELETE'];

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

const requestDataType = {
    'Query': 'query',
    'None': null,
    'FormData': 'formData',
    'Json': 'json',
    'Urlencoded': 'urlencoded',
    'Header': 'header'
};

const debugFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'value',label: '参数值',className: 'param-value-input', placeholder: '',marginLeft: '11.25rem'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '13.75rem'},
    {key: 'explaination',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '3rem'}
];

const designFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '11rem'},
    {key: 'value',label: '参数值',className: 'param-value-input', placeholder: '',marginLeft: '2.75rem'},
    {key: 'explaination',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '13.5rem'}
];

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
        const axiosConfig = {
            url: url,
            method: method,
            headers: {
                'token': localStorage.getItem('token') 
            }
        };
        if(method !== 'GET'&& method !== 'DELETE') {
            axiosConfig.data = requestData; // 非GET、DELETE请求才有请求体
        }

        const res= await axios(axiosConfig);
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
        axios.post(`http://localhost/tex/api/send`,{
            
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
    container.appendChild(querySpan);

    const queryArea=document.createElement('div');
    queryArea.dataset.type = requestDataType.Query; // 标记数据类型，方便发送请求时区分
    renderform(queryArea,config);// 复用formData的渲染函数
    container.appendChild(queryArea);
    
}

//渲染Body参数列表
function renderBody(container,config){
    container.innerHTML = ""; // 清空
    //创建Body块
    const bodyTitle = document.createElement('span');
    bodyTitle.textContent = "请求体格式";
    bodyTitle.style.fontWeight = '600';
    bodyTitle.style.color = '#2d3748';
    bodyTitle.style.marginBottom = '1rem';
    bodyTitle.style.display = 'block';
    container.appendChild(bodyTitle);

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
                explaination: param[3],
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
            const axiosConfig = {
                url: url,
                method: method,
                headers: {
                    'token': localStorage.getItem('token') 
                }
            };
            if(method !== 'GET'&& method !== 'DELETE') {
                axiosConfig.data = requestData; // 非GET、DELETE请求才有请求体
            }
            else if(method === 'GET'){
                axiosConfig.params = {
                    formatType: dataType, // 传递数据类型，后端根据这个参数来区分返回哪个接口的参数列表
                };
            }

            const res= await axios(axiosConfig);
            return res; // 根据后端返回结构调整
        }catch(err){
            throw new Error(`请求失败：${err.response?.data?.message || err.message}`);
        }
    }


//统一创建表单函数
function renderform(container,config){
    container.innerHTML = "";
    // container.style.opacity = '0';
    // container.style.transition = 'opacity 0.3s ease';

    //创建formData列表
    const ul=document.createElement('ul');
    ul.id='formDataList';

    const textli=document.createElement('li');
    const keySpan=document.createElement('span');
    keySpan.textContent='参数名';
    keySpan.className = 'param-label';
    const valueSpan=document.createElement('span');
    valueSpan.textContent='参数值';
    valueSpan.className = 'param-label';
    
    //调整与输入框左对齐
    const typeSpan=document.createElement('span');
    typeSpan.textContent='类型';
    typeSpan.className = 'param-label';

    const explainSpan=document.createElement('span');
    explainSpan.textContent='说明';
    explainSpan.className = 'param-label';

    config.forEach(item => {
        if(item.key === 'name') {
            textli.appendChild(keySpan);
        }else if(item.key === 'value') {
            valueSpan.style.marginLeft=item.marginLeft;
            textli.appendChild(valueSpan);
        }else if(item.key === 'type') {
            typeSpan.style.marginLeft=item.marginLeft;
            textli.appendChild(typeSpan);
        }else if(item.key === 'explaination') {
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
            explainInput.value=Data.explaination || '';
            formDataLi.dataset.id = Data.id; // 设置行dataset为id(返回的参数id)，方便后续修改
        }

        config.forEach(item => {
            if(item.key === 'name') {

                formDataLi.appendChild(keyInput);

            }else if(item.key === 'value') {

                formDataLi.appendChild(valueInput);

            }else if(item.key === 'type') {

                formDataLi.appendChild(typeInput);

            }else if(item.key === 'explaination') {

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
                
                if (!keyInput.value.trim()&&(valueInput.value.trim()||typeInput.value.trim()||explainInput.value.trim())) {
                    //console.log('参数名不能为空');
                    keyInput.style.outline = "1px solid #e53e3e";
                    keyInput.style.outlineOffset = "0";
                    keyInput.placeholder= "参数名";
                }else{
                    //恢复默认
                    keyInput.style.outline = '';
                    keyInput.placeholder= "添加参数";
                }

                //新增一个参数项
                if(!formDataLi.dataset.id){
                    // 只有当前行没有id，说明是新添加的行，才添加新的空行
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
            const paramsList = res.data.data || [];

            if(paramsList.length > 0) {
                paramsList.forEach(param => {
                    //遍历每个参数项，渲染输入框，预填充数据
                    const paramData = {
                        name: param.name, 
                        value: param.value, 
                        type: param.type, 
                        explaination: param.explaination, 
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
    // setTimeout(() => {
    //     container.style.opacity=1;
    // },0); // 先隐藏容器，等内容渲染完成后再显示，避免闪烁
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
    // 复用调试窗口的接口基本信息展示部分，保持设计窗口和调试窗口风格一致
    renderDebug(apiData,config); 

    /*
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
    */
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