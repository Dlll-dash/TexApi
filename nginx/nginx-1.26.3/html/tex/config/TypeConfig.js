//请求参数类型
const requestDataType = {
    'Query': 'query',
    'None': null,
    'FormData': 'formData',
    'Json': 'json',
    'Urlencoded': 'urlencoded',
    'Header': 'header'
};

//参数值类型
const typeList = {
    'object' :'Object',
    'string':'String',
    'integer':'Integer',
    'boolean':'Boolean',
    'array':'Array',
    'null':'Null'
}

//类型示例值
const typeExampleValue = {
    'string':'string',
    'integer':1,
    'boolean':false,
    'array':[],
    'null':null
}



export {typeList,typeExampleValue,requestDataType};