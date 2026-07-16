// 请求拦截器
const request=axios.create({
  baseURL: '/tex',
  timeout: 500000,
})

request.interceptors.request.use(
  config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['token'] = token;
      }
    console.log('✅ 请求发出：', config.url); // 关键调试
      return config;
  },
  error => {
    console.error('❌ 请求错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response;
    console.log('✅ 请求成功：', response.config.url, res.data);

    // 成功直接返回
    if ([200, 0, 1].includes(res.data.code)) {
      return res;
    }

    console.warn('⚠️ 业务错误：', res);
    return Promise.reject(res);
  },
  error => {
    console.error('❌ 响应异常：', error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      alert('登录已过期，请重新登录');
      location.href = '/index.html';
    }

    return Promise.reject(error);
  }
);


//解析url路径参数
function getUrlParams() {
    const params = {};
    const search = window.location.search.slice(1); // 获取?后的部分
    if (search) {
        search.split('&').forEach(item => {
            const [key, value] = item.split('=');
            params[key] = decodeURIComponent(value || '');
        });
    }
    return params;
}

export {request,getUrlParams};