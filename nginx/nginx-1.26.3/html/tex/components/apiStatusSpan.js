 import { statusColors, statusText } from "../config/statusConfig.js"; 
  
function createApiStatusSpan(status) {
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status-span';
    const statusLight= document.createElement('span');
    statusLight.innerHTML = '&#9679;  '; // 圆形符号

    if(status=== null || status === undefined) {
        throw new Error('接口状态未定义');
    }
    // 根据状态设置颜色
    statusLight.style.color =statusColors[status]; 

    const statusTextSpan = document.createElement('span');
    statusTextSpan.textContent = statusText[status];
    statusSpan.dataset.status = status; // 存储状态值，方便后续点击切换状态时使用

    //接口状态下拉框
    const statusUl = document.createElement('ul');
    statusUl.className = 'status-option-list';
    Object.keys(statusText).forEach(statusKey => {
        const optionLi = document.createElement('li');
        optionLi.className = 'status-option-item';

        const liStatusLight=document.createElement('span');
        liStatusLight.innerHTML = '&#9679;  '; // 圆形符号
        liStatusLight.style.color = statusColors[statusKey];

        const liStatusText=document.createElement('span');
        liStatusText.textContent = statusText[statusKey];

        optionLi.appendChild(liStatusLight);
        optionLi.appendChild(liStatusText);

        optionLi.dataset.statusValue = statusKey; // 存储状态值，方便点击时使用
        optionLi.addEventListener('click', function(e) {
            e.stopPropagation();
            const selectedStatus = this.dataset.statusValue;
            statusTextSpan.textContent = statusText[selectedStatus];
            statusSpan.dataset.status = selectedStatus;
            statusLight.style.color = statusColors[selectedStatus];
            statusUl.style.display = 'none';
            // 更新接口数据中的状态字段，后续发送请求时可以用到
            //apiData.status = selectedStatus;
            //updateApiInfoArea(); //发送更新接口的请求,需要在外部定义这个函数
        });

        statusUl.appendChild(optionLi);
    });
    
    
    statusSpan.addEventListener('click', function(e) {
        e.stopPropagation();
        statusUl.style.display = statusUl.style.display === 'block' ? 'none' : 'block';
    });

    // 点击页面其他地方关闭下拉框
    document.addEventListener('click', () => {
        statusUl.style.display = 'none';
    });

    statusSpan.appendChild(statusUl);
    statusSpan.appendChild(statusLight);
    statusSpan.appendChild(statusTextSpan);

    return statusSpan;
} 

export { createApiStatusSpan };