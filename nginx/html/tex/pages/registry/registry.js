import { request } from '../../config/AxiosConfig/AxiosConfig.js';

document.addEventListener('DOMContentLoaded', () => {
	const registerForm = document.getElementById('registerForm');
	const registerBtn = document.getElementById('registerBtn');

	if (!registerForm || !registerBtn) {
		console.error('注册页面初始化失败：未找到表单元素');
		alert('页面加载异常，请刷新重试');
		return;
	}

	const getValue = (id) => document.getElementById(id)?.value.trim() || '';

	async function submitRegister() {
		const payload = {
			name: getValue('name'),
			userName: getValue('userName'),
			password: getValue('password'),
			phone: getValue('phone'),
			email: getValue('email')
		};

		if (!payload.name) return alert('用户姓名不能为空');
		if (!payload.userName) return alert('用户名不能为空');
		if (!payload.password) return alert('密码不能为空');
		if (!payload.phone) return alert('手机号不能为空');
		if (!payload.email) return alert('邮箱不能为空');

		try {
			const res = await request.post('/user/register', payload);
            if(res.data.code ==0){
                throw new Error(res.data.msg || '注册失败');
            }
			alert('注册成功，请登录');
			window.location.href = '../../index.html';
		} catch (error) {
			console.error('注册失败：', error);
			const message = error.response?.data?.msg || error.message || '网络错误';
			alert('注册失败：' + message);
		}
	}

	registerBtn.addEventListener('click', submitRegister);

	registerForm.addEventListener('submit', (event) => {
		event.preventDefault();
		submitRegister();
	});
});
