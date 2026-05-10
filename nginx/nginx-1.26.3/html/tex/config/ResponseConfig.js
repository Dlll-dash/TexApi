const codeColorMap = {
    '2xx': '#71eaaa', // 绿色
    '3xx': '#3182ce', // 蓝色
    '4xx': '#dd6b20', // 橙色
    '5xx': '#e53e3e'  // 红色
};

function getCodeColor(statusCode) {
    const codeCategory = `${Math.floor(statusCode / 100)}xx`;
    return codeColorMap[codeCategory] || '#000'; // 默认黑色
}

const codeMessageMap = {
    200: '请求成功',
    201: '资源创建成功',
    204: '无内容',
    301: '永久重定向',
    302: '临时重定向',
    304: '未修改',
    400: '错误请求',
    401: '未授权',
    403: '禁止访问',
    404: '未找到',
    500: '服务器错误',
    502: '错误网关',
    503: '服务不可用'
};

export { codeColorMap, getCodeColor, codeMessageMap };