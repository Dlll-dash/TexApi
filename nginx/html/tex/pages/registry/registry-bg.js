/**
 * registry-bg.js — 注册页背景动效（非模块脚本，与 index.js 执行环境一致）
 */
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

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        waveBg.setTarget(e.clientX, e.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            targetX = e.touches[0].clientX;
            targetY = e.touches[0].clientY;
        }
    }, { passive: true });

    function updateMouseEffects() {
        const lerpFactor = 0.08;
        currentX += (targetX - currentX) * lerpFactor;
        currentY += (targetY - currentY) * lerpFactor;

        if (mouseGlow) {
            mouseGlow.style.left = currentX + 'px';
            mouseGlow.style.top = currentY + 'px';
        }

        ornaments.forEach((o) => {
            const el = document.getElementById(o.id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = currentX - cx;
            const dy = currentY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 600;
            if (dist < maxDist) {
                const strength = (1 - dist / maxDist) * 0.04;
                el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
            } else {
                el.style.transform = 'translate(0px, 0px)';
            }
        });

        const nx = currentX / window.innerWidth;
        const ny = currentY / window.innerHeight;
        const centerDist = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2);
        const deepenAlpha = Math.max(0, 0.06 - centerDist * 0.08);
        body.style.setProperty('--bg-deepen', deepenAlpha.toString());

        requestAnimationFrame(updateMouseEffects);
    }
    requestAnimationFrame(updateMouseEffects);
});
