document.addEventListener('DOMContentLoaded', () => {
    // ========== 背景浮动几何装饰动画 ==========
    const ornaments = [
        { id: 'ornament1', size: 320, color: 'rgba(66,153,225,0.12)', x: '15%', y: '20%' },
        { id: 'ornament2', size: 260, color: 'rgba(99,179,237,0.10)', x: '78%', y: '65%' },
        { id: 'ornament3', size: 200, color: 'rgba(49,130,206,0.08)', x: '60%', y: '12%' },
        { id: 'ornament4', size: 280, color: 'rgba(66,153,225,0.09)', x: '25%', y: '75%' }
    ];

    ornaments.forEach(o => {
        const el = document.getElementById(o.id);
        if (!el) return;
        el.style.width = o.size + 'px';
        el.style.height = o.size + 'px';
        el.style.background = o.color;
        el.style.left = o.x;
        el.style.top = o.y;
    });

    anime({ targets: '#ornament1', translateX: [0, 40, -30, 20, 0], translateY: [0, -35, 25, -20, 0], duration: 18000, easing: 'easeInOutSine', loop: true, direction: 'alternate' });
    anime({ targets: '#ornament2', translateX: [0, -35, 25, -40, 0], translateY: [0, 30, -40, 20, 0], duration: 22000, easing: 'easeInOutSine', loop: true, direction: 'alternate' });
    anime({ targets: '#ornament3', translateX: [0, 30, -45, 15, 0], translateY: [0, -25, 35, -30, 0], duration: 20000, easing: 'easeInOutSine', loop: true, direction: 'alternate' });
    anime({ targets: '#ornament4', translateX: [0, -25, 35, -20, 0], translateY: [0, 40, -30, 15, 0], duration: 24000, easing: 'easeInOutSine', loop: true, direction: 'alternate' });

    // ========== 波动背景（DotWaveBackground 组件） ==========
    const waveBg = new DotWaveBackground();

    // ========== 鼠标跟随动效：光晕 + 装饰形变 + 背景加深 ==========
    const mouseGlow = document.getElementById('mouseGlow');
    const body = document.body;

    // 目标坐标 & 当前平滑坐标（lerp 插值用）
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    // 全局鼠标追踪
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        waveBg.setTarget(e.clientX, e.clientY);
    });

    // 触摸设备支持
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            targetX = e.touches[0].clientX;
            targetY = e.touches[0].clientY;
        }
    }, { passive: true });

    /**
     * 每帧更新：lerp 平滑跟随 + 装饰形变 + 背景颜色加深
     */
    function updateMouseEffects() {
        // lerp 平滑插值，系数越小越"粘滞"
        const lerpFactor = 0.08;
        currentX += (targetX - currentX) * lerpFactor;
        currentY += (targetY - currentY) * lerpFactor;

        // 1. 光晕跟随鼠标
        if (mouseGlow) {
            mouseGlow.style.left = currentX + 'px';
            mouseGlow.style.top = currentY + 'px';
        }

        // 2. 装饰元素向鼠标方向轻微偏移（凹陷/吸引感）
        ornaments.forEach((o, i) => {
            const el = document.getElementById(o.id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = currentX - cx;
            const dy = currentY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 600; // 超出此距离不再形变
            if (dist < maxDist) {
                const strength = (1 - dist / maxDist) * 0.04; // 最大偏移 4%
                const offsetX = dx * strength;
                const offsetY = dy * strength;
                el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            } else {
                el.style.transform = 'translate(0px, 0px)';
            }
        });

        // 3. 背景颜色随鼠标位置微调 — 通过 CSS 变量驱动覆盖层透明度
        //    鼠标越靠近边缘，加深感越弱；越靠近中心，加深感越强
        const nx = currentX / window.innerWidth;  // 0~1
        const ny = currentY / window.innerHeight; // 0~1
        // 中心亮度系数：鼠标在正中心时最深
        const centerDist = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2);
        const deepenAlpha = Math.max(0, 0.06 - centerDist * 0.08);
        body.style.setProperty('--bg-deepen', deepenAlpha.toString());

        requestAnimationFrame(updateMouseEffects);
    }
    requestAnimationFrame(updateMouseEffects);

    // ========== 登录表单入场动画 ==========
    anime({
        targets: '#loginForm',
        translateY: [50, 0],
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: anime.stagger(150),
        duration: 800,
        easing: 'easeOutBack',
    });

    // ========== 登录逻辑 ==========
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

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

    loginBtn.addEventListener('click', async function () {
        const loginData = {
            userName: document.getElementById('userName').value.trim(),
            password: document.getElementById('password').value.trim()
        };

        if (!loginData.userName) {
            alert('用户名不能为空');
            return;
        }
        if (!loginData.password) {
            alert('密码不能为空');
            return;
        }

        try {
            const res = await axios.post('http://localhost/tex/user/login', loginData, {
                withCredentials: true
            });
            const data = res.data.data;
            console.log('Response:', data);
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
