/**
 * 团队侧栏组件
 * 渲染团队列表、自动选中文个人团队、支持切换团队和创建新团队
 */
import { showToast } from './toast.js';
import { TeamApi } from '../api/TeamApi.js';

/**
 * 渲染团队侧栏
 * @param {object} options
 * @param {string} options.containerId - 挂载容器元素的ID
 * @param {Function} options.onTeamChange(teamId, teamName) - 切换团队时的回调
 * @returns {HTMLElement} 侧栏DOM元素
 */
function renderTeamSidebar(options = {}) {
    const { containerId, onTeamChange } = options;
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('teamSidebar: 容器元素未找到:', containerId);
        return null;
    }

    //防止重复渲染
    const existing = document.querySelector('.team-sidebar');
    if (existing) {
        return existing;
    }

    //注入样式（仅一次）
    injectStyles();

    //当前选中团队ID
    let activeTeamId = null;

    // ==== 创建DOM ====
    const sidebar = document.createElement('div');
    sidebar.className = 'team-sidebar';

    //头部标题
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.textContent = '团队';
    sidebar.appendChild(header);

    //团队列表容器
    const teamList = document.createElement('div');
    teamList.className = 'team-list';
    sidebar.appendChild(teamList);

    //创建团队按钮
    const createBtn = document.createElement('button');
    createBtn.className = 'create-team-btn';
    createBtn.textContent = '+ 创建团队';
    createBtn.addEventListener('click', openCreateModal);
    sidebar.appendChild(createBtn);

    //创建团队弹窗（内联）
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'team-modal-backdrop';
    modalBackdrop.setAttribute('aria-hidden', 'true');
    modalBackdrop.innerHTML = `
        <div class="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
            <h3 id="team-modal-title">创建新团队</h3>
            <label for="team-modal-input">团队名称</label>
            <input id="team-modal-input" type="text" maxlength="60" autocomplete="off" />
            <div class="team-modal-actions">
                <button class="btn-cancel" type="button">取消</button>
                <button class="btn-confirm" type="button">创建</button>
            </div>
        </div>
    `;
    sidebar.appendChild(modalBackdrop);

    //弹窗事件绑定
    const modalInput = modalBackdrop.querySelector('#team-modal-input');
    const btnCancel = modalBackdrop.querySelector('.btn-cancel');
    const btnConfirm = modalBackdrop.querySelector('.btn-confirm');

    btnCancel.addEventListener('click', closeCreateModal);
    btnConfirm.addEventListener('click', submitCreateTeam);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeCreateModal();
    });

    function openCreateModal() {
        modalInput.value = '';
        modalBackdrop.classList.add('is-open');
        modalBackdrop.setAttribute('aria-hidden', 'false');
        setTimeout(() => modalInput.focus(), 0);
    }

    function closeCreateModal() {
        modalBackdrop.classList.remove('is-open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        modalInput.value = '';
    }

    async function submitCreateTeam() {
        const name = modalInput.value.trim();
        if (!name) {
            showToast('团队名称不能为空', 'error');
            modalInput.focus();
            return;
        }
        try {
            const res = await TeamApi.create({ name });
            closeCreateModal();
            //刷新列表并自动切换到新团队
            await refreshTeamList();
            const newTeamId = res.data?.data?.id;
            if (newTeamId) {
                switchToTeam(newTeamId);
            }
        } catch (e) {
            console.error('创建团队失败：', e);
            //showToast('创建失败：' + (e.response?.data?.msg || e.message), 'error');
        }
    }

    //挂载到容器
    container.appendChild(sidebar);

    // ==== 数据加载 ====
    refreshTeamList();

    // ==== 核心函数 ====

    /**
     * 刷新团队列表
     */
    async function refreshTeamList() {
        try {
            const res = await TeamApi.list();
            const teams = res.data?.data || [];
            renderTeamItems(teams);
        } catch (e) {
            console.error('获取团队列表失败：', e);
            teamList.innerHTML = '<div class="team-error">加载失败</div>';
        }
    }

    /**
     * 渲染团队项
     */
    function renderTeamItems(teams) {
        teamList.innerHTML = '';
        const userId = localStorage.getItem('id');

        if (!Array.isArray(teams) || teams.length === 0) {
            teamList.innerHTML = '<div class="team-empty">暂无团队</div>';
            return;
        }

        //找到个人团队（createUser等于当前用户的第一支团队，即注册时创建的）
        const personalTeam = teams.find(team => String(team.createUser) === String(userId));

        teams.forEach(team => {
            const isPersonal = team === personalTeam;
            const teamItem = createTeamItem(team, isPersonal);
            teamList.appendChild(teamItem);
        });

        //自动选中个人团队
        if (personalTeam && !activeTeamId) {
            const personalItem = teamList.querySelector('[data-team-id="' + personalTeam.id + '"]');
            if (personalItem) {
                triggerTeamClick(personalItem);
            }
        }
        //如果已经选中了一个团队，保持选中状态
        else if (activeTeamId) {
            const activeItem = teamList.querySelector('[data-team-id="' + activeTeamId + '"]');
            if (activeItem) {
                activeItem.classList.add('active');
            } else if (personalTeam) {
                //之前选中的团队不在列表中（可能被删除），回退到个人团队
                const fallbackItem = teamList.querySelector('[data-team-id="' + personalTeam.id + '"]');
                if (fallbackItem) triggerTeamClick(fallbackItem);
            }
        }
    }

    /**
     * 创建单个团队项
     */
    function createTeamItem(team, isPersonal) {
        const item = document.createElement('div');
        item.className = 'team-item';
        item.setAttribute('data-team-id', team.id);

        //圆形指示器
        const indicator = document.createElement('span');
        indicator.className = 'team-indicator';
        item.appendChild(indicator);

        //团队名
        const nameSpan = document.createElement('span');
        nameSpan.className = 'team-name';
        nameSpan.textContent = isPersonal ? '我的空间' : (team.name || '未命名团队');
        item.appendChild(nameSpan);

        //设置齿轮图标
        const gearBtn = document.createElement('button');
        gearBtn.className = 'team-gear-btn';
        gearBtn.title = '管理团队';
        gearBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 width="14" height="14">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        `;
        gearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `../team/manage.html?teamId=${team.id}`;
        });
        item.appendChild(gearBtn);

        //点击切换团队
        item.addEventListener('click', () => {
            triggerTeamClick(item);
        });

        return item;
    }

    /**
     * 触发团队选中
     */
    function triggerTeamClick(item) {
        const teamId = item.getAttribute('data-team-id');
        if (!teamId || teamId === activeTeamId) return;

        //切换类名
        const allItems = teamList.querySelectorAll('.team-item');
        allItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        //记录并回调
        activeTeamId = teamId;
        const teamName = item.querySelector('.team-name')?.textContent || '';
        if (onTeamChange) {
            onTeamChange(teamId, teamName);
        }
    }

    /**
     * 编程式切换到指定团队
     */
    function switchToTeam(teamId) {
        const item = teamList.querySelector('[data-team-id="' + teamId + '"]');
        if (item) {
            triggerTeamClick(item);
        }
    }

    return sidebar;
}

// ==== 样式注入（仅执行一次） ====
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'team-sidebar-styles';
    style.textContent = `
        .team-sidebar {
            width: 220px;
            min-height: calc(100vh - 64px - var(--topbar-height, 46px));
            background: #ffffff;
            border-right: 1px solid #e5e7eb;
            padding: 16px 4px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            font-size: 14px;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 0 16px 8px;
        }
        .team-list {
            flex: 1;
        }
        .team-item {
            display: flex;
            align-items: center;
            border-radius: 6px;
            gap: 8px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            color: #6b7280;
            transition: background 0.15s ease;
            position: relative;
        }
        .team-item:hover {
            background: #f8f9fa;
        }
        .team-item.active {
            background: #ebf4ff;
            color: #111827;
            font-weight: 600;
        }
        .team-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            flex-shrink: 0;
        }
        .team-item.active .team-indicator {
            border-color: #4299e1;
            background: #4299e1;
        }
        .team-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .team-gear-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: #9ca3af;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            padding: 0;
            transition: color 0.15s ease, background 0.15s ease;
        }
        .team-item:hover .team-gear-btn {
            display: flex;
        }
        .team-gear-btn:hover {
            color: #6b7280;
            background: #e5e7eb;
        }
        .create-team-btn {
            margin: 12px 16px 0;
            padding: 8px 0;
            width: calc(100% - 32px);
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: transparent;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            transition: background 0.15s ease;
        }
        .create-team-btn:hover {
            background: #f8f9fa;
        }
        .team-empty,
        .team-error {
            padding: 16px;
            font-size: 14px;
            color: #9ca3af;
            text-align: center;
        }
        .team-error {
            color: #e53e3e;
        }

        /* 创建团队弹窗 */
        .team-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 16px;
        }
        .team-modal-backdrop.is-open {
            display: flex;
        }
        .team-modal {
            width: min(92vw, 400px);
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
            padding: 24px;
        }
        .team-modal h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }
        .team-modal label {
            display: block;
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .team-modal input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        }
        .team-modal input:focus {
            border-color: #4299e1;
            outline: 2px solid rgba(66, 153, 225, 0.2);
        }
        .team-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 16px;
        }
        .team-modal-actions .btn-cancel {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 16px;
            background: #ffffff;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
        }
        .team-modal-actions .btn-cancel:hover {
            background: #f8f9fa;
        }
        .team-modal-actions .btn-confirm {
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            background: #4299e1;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
        }
        .team-modal-actions .btn-confirm:hover {
            background: #3182ce;
        }
    `;
    document.head.appendChild(style);
}

export { renderTeamSidebar };
