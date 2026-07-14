import { typeList } from "../config/TypeConfig.js";

//preview中展示参数列表，hideIsNecessary 为 true 时隐藏「是否必须」列
function createParamList(params, hideIsNecessary){
    const paramsList=document.createElement('ul');
    paramsList.className = "params-list-display";

    params.forEach(param=>{
        const paramItem=document.createElement('li');

        const nameSpan=document.createElement('span');
        nameSpan.textContent = param.name;
        nameSpan.className = "param-name-display";
        const typeSpan=document.createElement('span');
        typeSpan.textContent = `${param.type || typeList.string}`;
        typeSpan.className = "param-type-display";
        const explanationSpan=document.createElement('span');
        explanationSpan.textContent = ` ${param.explanation||''}`;
        explanationSpan.className = "param-explanation";

        paramItem.appendChild(nameSpan);
        paramItem.appendChild(typeSpan);
        paramItem.appendChild(explanationSpan);

        if (!hideIsNecessary) {
            const isNecessarySpan=document.createElement('span');
            isNecessarySpan.textContent = param.isNecessary ? '必需' : '可选';
            isNecessarySpan.className = param.isNecessary ? "param-is-necessary-display" : "param-is-not-necessary-display";
            paramItem.appendChild(isNecessarySpan);
        }
        paramsList.appendChild(paramItem);
    });
    
    return paramsList;
}

export { createParamList };