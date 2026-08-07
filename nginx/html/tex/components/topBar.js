/**
 * 全局顶栏组件
 * 左侧 TexApi 图标，右侧 Canvas 首字母头像，插槽式架构方便扩展。
 */
import { getOrCreateAvatar } from '../utils/AvatarUtil.js';

/**
 * 构建顶栏 DOM
 */
function createTopBarElement(options = {}) {
    const {
        userName = localStorage.getItem('userName') || 'User',
        logoUrl = '../../assets/svg/TexApi/图标.svg',
        navItems = [],
        dropdownItems = [],
        teamName = localStorage.getItem('activeTeamName') || '',
        onAvatarClick = null,
    } = options;

    const topbar = document.createElement('div');
    topbar.className = 'global-topbar';

    // ── 左侧：Logo + 品牌名 ──
    const left = document.createElement('div');
    left.className = 'topbar-left';

    const logoImg = document.createElement('img');
    logoImg.src = logoUrl;
    logoImg.alt = 'TexApi';
    logoImg.className = 'topbar-logo';
    logoImg.onerror = () => { logoImg.style.display = 'none'; };

    const brand = document.createElement('span');
    brand.className = 'topbar-brand';
    brand.textContent = 'TexApi';

    left.appendChild(logoImg);
    left.appendChild(brand);

    //点击左上角跳转主页
    left.style.cursor = 'pointer';
    left.addEventListener('click', () => {
        window.location.href = '/pages/home/home.html';
    });

    // ── 中间：导航链接（预留） ──
    const center = document.createElement('div');
    center.className = 'topbar-center';
    navItems.forEach(item => {
        const a = document.createElement('a');
        a.href = item.href || '#';
        a.textContent = item.label;
        a.className = 'topbar-nav-link' + (item.active ? ' active' : '');
        center.appendChild(a);
    });

    // ── 右侧：头像 + 用户名 + 下拉占位 ──
    const right = document.createElement('div');
    right.className = 'topbar-right';

    //团队名标签（可点击，展开下拉）
    const teamId = localStorage.getItem('activeTeamId') || '';
    const teamNameSpan = document.createElement('span');
    teamNameSpan.className = 'topbar-team-name';
    teamNameSpan.textContent = teamName || '选择团队';
    teamNameSpan.style.cursor = 'pointer';
    teamNameSpan.title = '点击查看团队选项';

    const teamDropdown = document.createElement('div');
    teamDropdown.className = 'topbar-team-dropdown';
    const teamMenu = document.createElement('ul');
    teamMenu.className = 'topbar-dropdown-menu';
    teamMenu.innerHTML = `
        <li class="topbar-dropdown-item" data-action="master">
            <i class="bi bi-grid-3x3-gap-fill" style="font-size:13px;color:#9ca3af;"></i> 项目浏览
        </li>
        <li class="topbar-dropdown-item" data-action="settings">
            <i class="bi bi-gear-fill" style="font-size:13px;color:#9ca3af;"></i> 团队设置
        </li>
    `;
    teamDropdown.appendChild(teamMenu);

    if (teamId) {
        teamMenu.querySelector('[data-action="master"]').addEventListener('click', () => {
            window.location.href = '/pages/home/home.html';
        });
        teamMenu.querySelector('[data-action="settings"]').addEventListener('click', () => {
            window.location.href = `/pages/team/manage.html?teamId=${teamId}`;
        });
    }
    //统一关闭所有下拉（运行时查，避免创建顺序问题）
    function closeAllMenus() {
        teamMenu.style.display = 'none';
        const avMenu = avatarDropdown.querySelector('.topbar-dropdown-menu');
        if (avMenu) avMenu.style.display = 'none';
    }

    teamNameSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = teamMenu.style.display === 'block';
        closeAllMenus();
        if (!isOpen) teamMenu.style.display = 'block';
    });
    document.addEventListener('click', closeAllMenus);

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'topbar-avatar-wrap';

    const avatarImg = document.createElement('img');
    avatarImg.src = getOrCreateAvatar(userName);
    avatarImg.alt = userName;
    avatarImg.className = 'topbar-avatar';

    avatarWrap.appendChild(avatarImg);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'topbar-username';
    nameSpan.textContent = userName;

    // 下拉菜单占位容器
    //图标映射（按标签名匹配）
    const defaultIcons = {
        '个人主页': 'bi-person-circle',
        '退出登录': 'bi-box-arrow-right',
    };

    const avatarDropdown = document.createElement('div');
    avatarDropdown.className = 'topbar-dropdown';
    if (dropdownItems.length > 0) {
        const menu = document.createElement('ul');
        menu.className = 'topbar-dropdown-menu';
        dropdownItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'topbar-dropdown-item';
            const icon = defaultIcons[item.label] || '';
            li.innerHTML = (icon ? `<i class="bi ${icon}" style="font-size:13px;color:#9ca3af;"></i> ` : '') + item.label;
            if (item.onClick) li.addEventListener('click', item.onClick);
            menu.appendChild(li);
        });
        avatarDropdown.appendChild(menu);
    }

    //点击头像区域切换下拉菜单
    if (dropdownItems.length > 0) {
        avatarWrap.style.cursor = 'pointer';
        avatarWrap.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = avatarDropdown.querySelector('.topbar-dropdown-menu');
            const isOpen = menu && menu.style.display === 'block';
            closeAllMenus();
            if (menu && !isOpen) menu.style.display = 'block';
        });
    }

    if (onAvatarClick) {
        avatarWrap.style.cursor = 'pointer';
        avatarWrap.addEventListener('click', onAvatarClick);
    }

    right.appendChild(teamNameSpan);
    right.appendChild(teamDropdown);
    right.appendChild(avatarWrap);
    right.appendChild(nameSpan);
    right.appendChild(avatarDropdown);

    topbar.appendChild(left);
    topbar.appendChild(center);
    topbar.appendChild(right);

    return topbar;
}

// ── 样式注入（只执行一次） ──
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'topbar-styles';
    style.textContent = `
        .global-topbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 46px;
            background: #ffffff;
            
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            z-index: 1000;
            box-sizing: border-box;
        }
        .topbar-left {
            display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
        }
        .topbar-logo {
            width: 28px; height: 28px; object-fit: contain;
        }
        .topbar-brand {
            font-size: 1.05rem; font-weight: 600; color: #2d3748; letter-spacing: 0.5px;
        }
        .topbar-center {
            display: flex; align-items: center; gap: 1.5rem;
            flex: 1; justify-content: center;
        }
        .topbar-nav-link {
            text-decoration: none; color: #4a5568; font-size: 0.9rem;
            padding: 0.25rem 0.5rem; border-radius: 6px;
            transition: color 0.18s ease, background 0.18s ease;
        }
        .topbar-nav-link:hover,
        .topbar-nav-link.active {
            color: #4299e1; background: rgba(66, 153, 225, 0.08);
        }
        .topbar-right {
            display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;
        }
        .topbar-avatar-wrap {
            width: 30px; height: 30px; border-radius: 50%;
            overflow: hidden; flex-shrink: 0;
        }
        .topbar-avatar {
            width: 100%; height: 100%; display: block;
        }
        .topbar-team-name {
            font-size: 14px;
            font-weight: 600;
            color: #333333;
            margin-right: 4px;
            padding: 4px 8px 4px 12px;
            background: #f3f4f6;
            border-radius: 6px;
            cursor: pointer;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: background 0.15s ease;
            user-select: none;
        }
        .topbar-team-name::after {
            content: '';
            display: inline-block;
            width: 0; height: 0;
            margin-left: 6px;
            vertical-align: middle;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 5px solid #9ca3af;
            transition: border-top-color 0.15s ease;
        }
        .topbar-team-name:hover {
            background: #e5e7eb;
        }
        .topbar-team-name:hover::after {
            border-top-color: #6b7280;
        }

        /* ── 下拉菜单（头像 + 团队名共用） ── */
        .topbar-dropdown       { position: relative; }
        .topbar-team-dropdown  { position: relative; }
        .topbar-dropdown-menu {
            display: none;
            position: absolute; top: 100%; right: 0;
            margin-top: 4px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            list-style: none;
            padding: 0;
            min-width: 130px;
            z-index: 1001;
        }
        .topbar-dropdown-item {
            width: auto; height: auto;
            padding: 7px 14px;
            font-size: 14px; color: #374151;
            line-height: 1.4;
            cursor: pointer;
            transition: background 0.1s ease;
            white-space: nowrap;
            border-radius: 0;
            box-shadow: none;
            border: none;
            margin: 0;
            display: block;
            position: static;
        }
        .topbar-dropdown-item:first-child {
            border-radius: 3px 3px 0 0;
        }
        .topbar-dropdown-item:last-child {
            border-radius: 0 0 3px 3px;
        }
        .topbar-dropdown-item i {
            margin-right: 6px;
            vertical-align: middle;
        }
        .topbar-dropdown-item:hover {
            background: #f3f4f6;
            border-radius: 3px;
        }
        .topbar-username {
            font-size: 0.9rem; color: #4a5568;
            max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        /* ── 布局补偿：顶栏撑高了 body，同步缩减容器高度避免滚动条 ── */
        :root { --topbar-height: 46px; }
        #container { min-height: calc(100vh - 4rem - var(--topbar-height)); }
        #apiList   { max-height: calc(100vh - 4rem - var(--topbar-height)); }
    `;
    document.head.appendChild(style);
}

/**
 * 渲染顶栏（每页调用一次，自动防重复）
 * @param {object} [options]
 * @param {string} [options.userName]
 * @param {string} [options.logoUrl]
 * @param {{label:string, href?:string, active?:boolean}[]} [options.navItems]
 * @param {{label:string, onClick?:Function}[]} [options.dropdownItems]
 * @param {Function} [options.onAvatarClick]
 * @returns {HTMLElement}
 */
function renderTopBar(options = {}) {
    if (document.querySelector('.global-topbar')) {
        return document.querySelector('.global-topbar');
    }

    injectStyles();
    const topbar = createTopBarElement(options);
    document.body.insertBefore(topbar, document.body.firstChild);

    // body 已有的 padding-top 之上再加顶栏高度
    const currentPad = parseInt(getComputedStyle(document.body).paddingTop, 10) || 0;
    document.body.style.paddingTop = (currentPad + 46) + 'px';

    return topbar;
}

export { renderTopBar };
