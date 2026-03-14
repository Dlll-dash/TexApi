document.addEventListener('DOMContentLoaded', () => {
    // 1. 获取表单和登录按钮（重点：新增按钮选择器）
    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn"); // 对应 HTML 里的登录按钮
    
    // 调试：确认元素是否获取到
    if (!loginForm) {
        console.error('未找到 ID 为 loginForm 的表单！');
        alert('页面加载异常，请刷新重试');
        return;
    }
    if (!loginBtn) {
        console.error('未找到 ID 为 loginBtn 的登录按钮！');
        alert('登录按钮未找到，请检查 HTML');
        return;
    }

    // 2. 监听按钮点击事件（替代表单 submit，彻底杜绝默认跳转）
    loginBtn.addEventListener('click', async function () {
        // 3. 获取输入框值
        const loginData = {
            userName: document.getElementById('userName').value.trim(),
            password: document.getElementById('password').value.trim()
        };

        // 4. 表单验证
        if (!loginData.userName) {
            alert('用户名不能为空');
            return;
        }
        if (!loginData.password) {
            alert('密码不能为空');
            return;
        }

        try {
            // 5. 发送登录请求
            const res = await axios.post('http://localhost/tex/user/login', loginData, {
                withCredentials: true
            });
            const data = res.data.data;
            //alert(`登录成功！id: ${data.id}`);
            console.log("Response:", data);
            localStorage.setItem('token', data.token);
            localStorage.setItem('id', data.id);
            window.location.href = '/home/home.html'; 
        } catch (err) {
            console.error('登录失败详情：', err);
            const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';
            alert('登录失败：' + errMsg);
        }
    });

});