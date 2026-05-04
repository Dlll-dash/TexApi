const debugFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'value',label: '参数值',className: 'param-value-input', placeholder: '',marginLeft: '11.25rem'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '13.85rem'},
    {key: 'explanation',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '3rem'}
];

const designFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '11.25rem'},
    {key: 'value',label: '示例值',className: 'param-value-input', placeholder: '',marginLeft: '3rem'},
    {key: 'explanation',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '13.85rem'}
];

export {debugFormConfig,designFormConfig};