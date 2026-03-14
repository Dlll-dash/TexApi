console.log('脚本已加载');

// 添加 axios 响应拦截器来处理 401 错误（token 过期）
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token 过期，清除存储并跳转到登录页
            localStorage.removeItem('token');
            localStorage.removeItem('id');
            alert('登录已过期，请重新登录');
            window.location.href = '/index.html';
        }
        return Promise.reject(error);
    }
);

// 替换为更稳定的DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', async function () {
    // 获取并校验ID
    const id = localStorage.getItem('id');
    if (!id) {
        // 美化登录提示
        const container = document.getElementById('container');
        container.innerHTML = `
            <h2>我的项目</h2>
            <div class="error-tip">未获取到用户ID，请先登录！</div>
        `;
        return;
    }
    console.log('获取到的id：', id);

    // 渲染界面函数（关联CSS类名）
    function renderHtmlWithCreateElement(apiData) {
        const container = document.getElementById('container');
        if (!container) return;
        container.innerHTML = ""; // 清空原有内容

        // 创建标题节点
        const title = document.createElement('h2');
        title.textContent = "我的项目";
        container.appendChild(title);

        // 处理非列表或无数据情况（使用美化的空提示类）
        if (!Array.isArray(apiData) || apiData.length === 0) {
            const emptyTip = document.createElement('div');
            emptyTip.className = "empty-tip"; // 关联CSS类
            emptyTip.textContent = "暂无项目数据";
            container.appendChild(emptyTip);
            return;
        }

        // 创建列表节点
        const ul = document.createElement('ul');
        container.appendChild(ul);

        // 遍历数据，创建列表项
        apiData.forEach(item => {
            const li = document.createElement('li');

            // 创建名称span（关联CSS类）
            const nameSpan = document.createElement('span');
            nameSpan.className = "project-name"; // 关联CSS类
            nameSpan.textContent = item.name || "未命名项目"; // 兜底
            li.appendChild(nameSpan);

            // 点击项目，跳转项目空间
            li.addEventListener('click', () => {
                // 拼接参数（编码特殊字符）
                const targetUrl = `/detail/detail.html?id=${item.id}&name=${encodeURIComponent(item.name || "未命名项目")}`;
                window.open(targetUrl, '_blank');
            });

            // 把列表项添加到ul中
            ul.appendChild(li);
        });
    }

    try {
        // 请求接口（路径参数）
        const res = await axios.get(`http://localhost/tex/project/list/${id}`, {
            headers: {
            'token': localStorage.getItem('token') 
            }
        });
        console.log("Response:", res.data.data);
        renderHtmlWithCreateElement(res.data.data);
    } catch (err) {
        console.error('失败详情：', err);
        const errMsg = err.response?.data?.msg || err.message || '网络错误/后端接口未响应';
        
        // 美化错误提示
        const container = document.getElementById('container');
        container.innerHTML = `
            <h2>我的项目</h2>
            <div class="error-tip">项目获取失败：${errMsg}</div>
        `;
    }
});