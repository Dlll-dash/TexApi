// 请求拦截器
import { showToast } from '../../components/toast.js';

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

    // 业务成功（code=1）直接返回
    if (res.data.code === 1) {
      return res;
    }

    // 业务错误（code=0 或其他）弹出 toast 提示
    const errMsg = res.data?.msg || '请求失败';
    showToast(errMsg, 'error');
    console.warn('⚠️ 业务错误：', res);
    return Promise.reject(res);
  },
  error => {
    console.error('❌ 响应异常：', error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      showToast('登录已过期，请重新登录', 'error', 4000);
      setTimeout(() => { location.href = '/index.html'; }, 1500);
    } else {
      showToast('网络错误，请稍后重试', 'error');
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