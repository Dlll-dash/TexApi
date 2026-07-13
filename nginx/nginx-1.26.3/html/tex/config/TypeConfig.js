//请求参数类型
const requestDataType = {
    'Query': 'query',
    'None': 'null',
    'FormData': 'formData',
    'Json': 'json',
    'Urlencoded': 'urlencoded',
    'Header': 'header'
};

const httpMimeTypes = {
    'json': 'application/json',
    'xml': 'application/xml',
    'formData': 'multipart/form-data',
    'urlencoded': 'application/x-www-form-urlencoded'
};

const responseContentType = {
    'JSON': 'application/json',
    'XML': 'application/xml',
    'HTML': 'text/html',
    'Raw': 'text/plain',
    'No-Content': ''
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
    'String':'string',
    'Integer':1,
    'Boolean':false,
    'Array':[],
    'Null':null
}

const queryTypeList = ['string','integer','boolean','array'];


export {typeList,typeExampleValue,requestDataType,httpMimeTypes,queryTypeList,responseContentType};