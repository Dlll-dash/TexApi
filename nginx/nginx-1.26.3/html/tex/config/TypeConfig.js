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
    'object' :'object',
    'string':'string',
    'integer':'integer',
    'boolean':'boolean',
    'array':'array',
    'null':'null'
}

//类型示例值
const typeExampleValue = {
    'string':'string',
    'integer':1,
    'boolean':false,
    'array':[],
    'null':null
}

const queryTypeList = ['string','integer','boolean','array'];


export {typeList,typeExampleValue,requestDataType,httpMimeTypes,queryTypeList,responseContentType};