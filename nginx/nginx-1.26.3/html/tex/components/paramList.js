//preview中展示参数列表
function createParamList(params){
    const paramsList=document.createElement('ul');
    paramsList.className = "params-list-display";

    params.forEach(param=>{
        const paramItem=document.createElement('li');

        const nameSpan=document.createElement('span');
        nameSpan.textContent = param.name;
        nameSpan.className = "param-name-display";
        const typeSpan=document.createElement('span');
        typeSpan.textContent = `${param.type||'String' }`;
        typeSpan.className = "param-type-display";
        const explanationSpan=document.createElement('span');
        explanationSpan.textContent = ` ${param.explanation||''}`;
        explanationSpan.className = "param-explanation";

        const isNecessarySpan=document.createElement('span');
        isNecessarySpan.textContent = param.isNecessary ? '必填' : '可选';
        isNecessarySpan.className = param.isNecessary ? "param-is-necessary-display" : "param-is-not-necessary-display";

        paramItem.appendChild(nameSpan);
        paramItem.appendChild(typeSpan);
        paramItem.appendChild(explanationSpan);
        paramItem.appendChild(isNecessarySpan);
        paramsList.appendChild(paramItem);
    });
    
    return paramsList;
}

export { createParamList };