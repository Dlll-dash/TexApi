const codeColorMap = {
    '2xx': '#4acf88', // 绿色
    '3xx': '#3182ce', // 蓝色
    '4xx': '#dd6b20', // 橙色
    '5xx': '#e53e3e'  // 红色
};

function getCodeColor(statusCode) {
    const codeCategory = `${Math.floor(statusCode / 100)}xx`;
    return codeColorMap[codeCategory] || '#000'; // 默认黑色
}

export { codeColorMap, getCodeColor };