const debugFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'value',label: '参数值',className: 'param-value-input', placeholder: '',marginLeft: '10.3rem'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '13.8rem'},
    {key: 'isNecessary',label: '',className: 'is-necessary-btn', placeholder: '',marginLeft: '0rem'},
    {key: 'explanation',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '3.3rem'}
];

const designFormConfig = [
    {key: 'name',label: '参数名',className: 'param-name-input', placeholder: '添加参数'},
    {key: 'type',label: '类型',className: 'type-input', placeholder: '',marginLeft: '12.7rem'},
    {key: 'isNecessary',label: '',className: 'is-necessary-btn', placeholder: '',marginLeft: '0rem'},
    {key: 'value',label: '示例值',className: 'param-value-input', placeholder: '',marginLeft: '3.5rem'},
    {key: 'explanation',label: '说明',className: 'explain-input', placeholder: '',marginLeft: '13.8rem'}
];

export {debugFormConfig,designFormConfig};