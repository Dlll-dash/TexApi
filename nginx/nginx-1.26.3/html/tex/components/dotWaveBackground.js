/**
 * DotWaveBackground — Canvas 粒子波动背景组件
 *
 * 用法:
 *   const wave = new DotWaveBackground({ container: document.body });
 *   document.addEventListener('mousemove', e => wave.setTarget(e.clientX, e.clientY));
 *
 * 选项 (全部可选):
 *   container  : HTMLElement  挂载容器 (默认 document.body)
 *   spacing    : number       粒子网格间距 (默认 38)
 *   dotColor   : string       粒子填充色 (默认 'rgba(66,153,225,0.18)')
 *   dotRadius  : number       粒子半径 (默认 1.6)
 *   linkColor  : string       连线颜色前缀 (默认 'rgba(66,153,225,')
 *   linkDist   : number       连线最大距离 (默认 55)
 *   rippleColor: string       涟漪颜色前缀 (默认 'rgba(66,153,225,')
 *   rippleColorInner: string  内环涟漪颜色前缀 (默认 'rgba(99,179,237,')
 *   maxRipples : number       最大涟漪数 (默认 20)
 *   rippleLife : number       涟漪生命周期 ms (默认 2200)
 *   influenceR : number       鼠标影响半径 (默认 220)
 *   lerpFactor : number       平滑插值系数 (默认 0.08)
 *   zIndex     : number|string canvas z-index (默认 0)
 */
class DotWaveBackground {
    constructor(options = {}) {
        const {
            container = document.body,
            spacing = 38,
            dotColor = 'rgba(66,153,225,0.18)',
            dotRadius = 1.6,
            linkColor = 'rgba(66,153,225,',
            linkDist = 55,
            rippleColor = 'rgba(66,153,225,',
            rippleColorInner = 'rgba(99,179,237,',
            maxRipples = 20,
            rippleLife = 2200,
            influenceR = 220,
            lerpFactor = 0.08,
            zIndex = 0,
        } = options;

        this.dotColor = dotColor;
        this.dotRadius = dotRadius;
        this.linkColor = linkColor;
        this.linkDist = linkDist;
        this.rippleColor = rippleColor;
        this.rippleColorInner = rippleColorInner;
        this.maxRipples = maxRipples;
        this.rippleLife = rippleLife;
        this.influenceR = influenceR;
        this.lerpFactor = lerpFactor;
        this.spacing = spacing;

        // 鼠标坐标
        this._targetX = window.innerWidth / 2;
        this._targetY = window.innerHeight / 2;
        this._currentX = this._targetX;
        this._currentY = this._targetY;

        // 涟漪
        this._ripples = [];
        this._lastMouseX = this._targetX;
        this._lastMouseY = this._targetY;
        this._rippleCooldown = 0;

        // 粒子
        this._particles = [];

        // 创建 Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.id = 'dotWaveCanvas';
        this._canvas.style.cssText = `
            position: fixed; inset: 0; z-index: ${zIndex};
            pointer-events: none;
        `;
        container.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        // 初始化和启动
        this._resize();
        this._bindEvents();
        this._running = true;
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    // ---- 公开 API ----

    /** 设置鼠标目标位置（组件内部做 lerp 平滑） */
    setTarget(x, y) {
        this._targetX = x;
        this._targetY = y;

        // 鼠标移动涟漪生成
        const dx = x - this._lastMouseX;
        const dy = y - this._lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this._rippleCooldown += dist;
        if (this._rippleCooldown > 50) {
            this._addRipple(x, y, 120 + Math.random() * 100, true);
            this._rippleCooldown = 0;
            this._lastMouseX = x;
            this._lastMouseY = y;
        }
    }

    /** 销毁组件，移除 Canvas 并停止动画 */
    destroy() {
        this._running = false;
        cancelAnimationFrame(this._rafId);
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        window.removeEventListener('resize', this._onResize);
    }

    // ---- 内部方法 ----

    _bindEvents() {
        this._onResize = () => this._resize();
        window.addEventListener('resize', this._onResize);
    }

    _resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this._canvas.width = window.innerWidth * dpr;
        this._canvas.height = window.innerHeight * dpr;
        this._canvas.style.width = window.innerWidth + 'px';
        this._canvas.style.height = window.innerHeight + 'px';
        this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this._initParticles();
    }

    _initParticles() {
        this._particles = [];
        const cols = Math.floor(window.innerWidth / this.spacing);
        const rows = Math.floor(window.innerHeight / this.spacing);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this._particles.push({
                    bx: c * this.spacing + this.spacing / 2 + (Math.random() - 0.5) * 16,
                    by: r * this.spacing + this.spacing / 2 + (Math.random() - 0.5) * 16,
                    phase: Math.random() * Math.PI * 2,
                    amp: 1.5 + Math.random() * 3.5,
                    speed: 0.3 + Math.random() * 0.7,
                });
            }
        }
    }

    _addRipple(x, y, maxRadius, isMouse) {
        this._ripples.push({ x, y, born: performance.now(), maxRadius, isMouse });
        while (this._ripples.length > this.maxRipples) this._ripples.shift();
    }

    _loop() {
        if (!this._running) return;
        const ctx = this._ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const now = performance.now() / 1000;

        // lerp 平滑
        this._currentX += (this._targetX - this._currentX) * this.lerpFactor;
        this._currentY += (this._targetY - this._currentY) * this.lerpFactor;
        const cx = this._currentX;
        const cy = this._currentY;

        ctx.clearRect(0, 0, w, h);

        // --- 随机自发涟漪 ---
        if (Math.random() < 0.01) {
            this._addRipple(
                Math.random() * w,
                Math.random() * h,
                80 + Math.random() * 140,
                false,
            );
        }

        // --- 绘制涟漪 ---
        for (let i = this._ripples.length - 1; i >= 0; i--) {
            const rp = this._ripples[i];
            const age = performance.now() - rp.born;
            if (age > this.rippleLife) { this._ripples.splice(i, 1); continue; }
            const progress = age / this.rippleLife;
            const eased = 1 - Math.pow(1 - progress, 2);
            const radius = rp.maxRadius * eased;
            const baseAlpha = rp.isMouse ? 0.09 : 0.05;
            const fade = baseAlpha * (1 - progress);
            const lw = 2 * (1 - progress);

            ctx.beginPath();
            ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `${this.rippleColor}${fade.toFixed(3)})`;
            ctx.lineWidth = lw;
            ctx.stroke();

            const innerR = radius * 0.55;
            if (innerR > 0) {
                ctx.beginPath();
                ctx.arc(rp.x, rp.y, innerR, 0, Math.PI * 2);
                ctx.strokeStyle = `${this.rippleColorInner}${(fade * 0.6).toFixed(3)})`;
                ctx.lineWidth = lw * 0.6;
                ctx.stroke();
            }
        }

        // --- 绘制粒子 + 鼠标推开 ---
        const positions = []; // 缓存位置给连线用
        for (const p of this._particles) {
            let ox = Math.sin(now * p.speed + p.phase) * p.amp;
            let oy = Math.cos(now * p.speed * 0.7 + p.phase + 0.8) * p.amp;

            const dx = p.bx - cx;
            const dy = p.by - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.influenceR) {
                const inf = 1 - dist / this.influenceR;
                ox += (dx / (dist + 0.1)) * inf * 10;
                oy += (dy / (dist + 0.1)) * inf * 10;
            }

            const x = p.bx + ox;
            const y = p.by + oy;
            positions.push({ x, y, p });

            ctx.beginPath();
            ctx.arc(x, y, this.dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.dotColor;
            ctx.fill();
        }

        // --- 粒子间连线 ---
        for (let i = 0; i < positions.length; i++) {
            const a = positions[i];
            const end = Math.min(positions.length, i + 20);
            for (let j = i + 1; j < end; j++) {
                const b = positions[j];
                const ddx = a.x - b.x;
                const ddy = a.y - b.y;
                const d = Math.sqrt(ddx * ddx + ddy * ddy);
                if (d < this.linkDist) {
                    const alpha = (1 - d / this.linkDist) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `${this.linkColor}${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        this._rafId = requestAnimationFrame(() => this._loop());
    }
}
