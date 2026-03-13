// 等待 DOM 完全加载（避免获取不到元素）
document.addEventListener('DOMContentLoaded', () => {
    // 1. 获取表单（ID 改为 loginForm，和 HTML 一致）
    const loginForm = document.getElementById("loginForm");
    
    // 调试：确认表单是否获取到
    if (!loginForm) {
        console.error('未找到 ID 为 loginForm 的表单！');
        alert('页面加载异常，请刷新重试');
        return;
    }

    // 2. 监听表单提交事件
    loginForm.addEventListener('submit', async function (e) {
        // 阻止表单默认提交（核心）
        e.preventDefault();
        
        // 3. 获取输入框值（修复后能正确获取）
        const loginData = {
            userName: document.getElementById('userName').value.trim(),
            password: document.getElementById('password').value.trim()
        };

        // 4. 完善表单验证（用户名+密码都校验）
        if (!loginData.userName) {
            alert('用户名不能为空');
            return;
        }
        if (!loginData.password) {
            alert('密码不能为空');
            return;
        }

        
            // 5. 发送 POST 请求（确保后端接口是 POST）
            axios.post('http://localhost/tex/user/login', loginData, {
                // 跨域时携带 Cookie（后端需配置 CORS）
                withCredentials: true
            })
            .then((res)=>{
                const data=res.data.data;
                //alert(`登录成功！id: ${data.id}`);
                //console.log("Response:",data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('id',data.id);
                window.location.href = '/home/home.html';
            })


           .catch ((err)=>{
            // 调试：打印完整错误信息
            console.error('登录失败详情：', err);
            const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';
            alert('登录失败：' + errMsg);
            });
        })     
});