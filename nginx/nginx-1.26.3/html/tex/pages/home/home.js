
import { renderTopBar } from '../../components/topBar.js';
import { exportProjectBatch } from '../../module/Export.js';

renderTopBar();

function createMenuButton(label, svgPath, className = '') {
        const button = document.createElement('button');
        button.type = 'button';
        if (className) {
            button.className = className;
        }

        const icon = document.createElement('span');
        icon.className = 'menu-icon';
        icon.innerHTML = svgPath;

        const text = document.createElement('span');
        text.textContent = label;

        button.appendChild(icon);
        button.appendChild(text);
        return button;
    }

    // ========== 项目图标配置 ==========
    // 在 assets/svg/project/ 下新增 SVG 后，只需在此数组中追加文件名（不含扩展名）
    const PROJECT_ICONS = [
        '打印机',
        '电脑办公'
    ];

    /** 基于项目 ID 哈希选择一个固定图标，保证同一项目总是显示相同图标 */
    function getIconForProject(projectId) {
        if (!PROJECT_ICONS.length) return '';
        let hash = 0;
        const idStr = String(projectId || '');
        for (let i = 0; i < idStr.length; i++) {
            hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
            hash |= 0; // 转为32位整数
        }
        const idx = Math.abs(hash) % PROJECT_ICONS.length;
        return `../../assets/svg/project/${PROJECT_ICONS[idx]}.svg`;
    }
    // ========== 图标配置结束 ==========

(async function main() {
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

    const renameBackdrop = document.getElementById('rename-backdrop');
    const renameInput = document.getElementById('rename-input');
    const renameCancel = document.getElementById('rename-cancel');
    const renameConfirm = document.getElementById('rename-confirm');
    const deleteBackdrop = document.getElementById('delete-backdrop');
    const deleteDesc = document.getElementById('delete-desc');
    const deleteCancel = document.getElementById('delete-cancel');
    const deleteConfirm = document.getElementById('delete-confirm');
    const modalState = {
        projectId: null,
        projectName: ''
    };
    const deleteState = {
        projectId: null,
        projectName: ''
    };

    function openRenameModal(projectId, projectName) {
        modalState.projectId = projectId;
        modalState.projectName = projectName || '';
        if (!renameBackdrop || !renameInput) return;
        renameInput.value = modalState.projectName;
        renameBackdrop.classList.add('is-open');
        renameBackdrop.setAttribute('aria-hidden', 'false');
        setTimeout(() => renameInput.focus(), 0);
    }

    function closeRenameModal() {
        if (!renameBackdrop || !renameInput) return;
        renameBackdrop.classList.remove('is-open');
        renameBackdrop.setAttribute('aria-hidden', 'true');
        modalState.projectId = null;
        modalState.projectName = '';
        renameInput.value = '';
    }

    function openDeleteModal(projectId, projectName) {
        deleteState.projectId = projectId;
        deleteState.projectName = projectName || '未命名项目';
        if (!deleteBackdrop || !deleteDesc) return;
        deleteDesc.textContent = `确认删除项目“${deleteState.projectName}”吗？删除后不可恢复。`;
        deleteBackdrop.classList.add('is-open');
        deleteBackdrop.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteModal() {
        if (!deleteBackdrop) return;
        deleteBackdrop.classList.remove('is-open');
        deleteBackdrop.setAttribute('aria-hidden', 'true');
        deleteState.projectId = null;
        deleteState.projectName = '';
    }

    async function submitDelete() {
        if (!deleteState.projectId) return;
        try {
            await axios.delete(`http://localhost/tex/project/delete/${deleteState.projectId}`, {
                headers: { 'token': localStorage.getItem('token') }
            });
            closeDeleteModal();
            await fetchList();
        } catch (e) {
            console.error('删除失败：', e);
            alert('删除失败：' + (e.response?.data?.msg || e.message));
        }
    }

    async function submitRename() {
        if (!modalState.projectId || !renameInput) return;
        const nextName = renameInput.value.trim();
        if (!nextName) {
            alert('项目名称不能为空');
            renameInput.focus();
            return;
        }
        try {
            await axios.put('http://localhost/tex/project/update', {
                id: modalState.projectId,
                name: nextName
            }, {
                headers: { 
                    'token': localStorage.getItem('token') }
            });
            closeRenameModal();
            await fetchList();
        } catch (e) {
            console.error('重命名失败：', e);
            alert('修改名称失败：' + (e.response?.data?.msg || e.message));
        }
    }

    if (renameCancel) {
        renameCancel.addEventListener('click', closeRenameModal);
    }
    if (renameConfirm) {
        renameConfirm.addEventListener('click', submitRename);
    }
    if (renameBackdrop) {
        renameBackdrop.addEventListener('click', (event) => {
            if (event.target === renameBackdrop) {
                closeRenameModal();
            }
        });
    }
    if (deleteCancel) {
        deleteCancel.addEventListener('click', closeDeleteModal);
    }
    if (deleteConfirm) {
        deleteConfirm.addEventListener('click', submitDelete);
    }
    if (deleteBackdrop) {
        deleteBackdrop.addEventListener('click', (event) => {
            if (event.target === deleteBackdrop) {
                closeDeleteModal();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeRenameModal();
            closeAddModal();
            closeDeleteModal();
            hideItemMenu();
        }
    });

    // 渲染界面函数（关联CSS类名）
    function renderHtmlWithCreateElement(apiData) {
        const container = document.getElementById('container');
        if (!container) return;
        container.innerHTML = ""; // 清空原有内容
        container.style.position = 'relative';

        const pageHead = document.createElement('div');
        pageHead.className = 'page-head';

        const title = document.createElement('h2');
        title.textContent = '我的项目';
        pageHead.appendChild(title);

        const toolbarRow = document.createElement('div');
        toolbarRow.className = 'toolbar-row';

        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+ 添加项目';
        addBtn.addEventListener('click', onAddClicked);
        toolbarRow.appendChild(addBtn);

        pageHead.appendChild(toolbarRow);
        container.appendChild(pageHead);

        // 无项目时的空状态（高级简约风格）
        if (!Array.isArray(apiData) || apiData.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-project-tip';
            emptyDiv.innerHTML = `
                <div class="empty-project-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        <line x1="12" y1="11" x2="12" y2="17"></line>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                    </svg>
                </div>
                <div class="empty-project-title">还没有项目</div>
                <div class="empty-project-desc">点击上方「+ 添加项目」创建您的第一个项目</div>
            `;
            container.appendChild(emptyDiv);
            return;
        }

        // 创建列表节点
        const ul = document.createElement('ul');
        container.appendChild(ul);

        // 遍历数据，创建列表项
        apiData.forEach(item => {
            const li = document.createElement('li');

            const actionWrap = document.createElement('div');
            actionWrap.className = 'item-actions';

            const moreBtn = document.createElement('button');
            moreBtn.className = 'more-btn';
            moreBtn.type = 'button';
            moreBtn.setAttribute('aria-label', '更多操作');
            moreBtn.textContent = '···';

            const itemMenu = document.createElement('div');
            itemMenu.className = 'item-menu';

            const renameBtn = createMenuButton('修改名称', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            `);

            const deleteBtn = createMenuButton('删除项目', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `, 'danger');

            renameBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                hideItemMenu();
                openRenameModal(item.id, item.name || '未命名项目');
            });

            deleteBtn.addEventListener('click', async (event) => {
                event.stopPropagation();
                hideItemMenu();
                openDeleteModal(item.id, item.name || '未命名项目');
            });

            itemMenu.appendChild(renameBtn);

            const exportBtn = createMenuButton('导出文档', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            `);
            exportBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                hideItemMenu();
                exportProjectBatch(item.id, item.name || '未命名项目');
            });
            itemMenu.appendChild(exportBtn);

            itemMenu.appendChild(deleteBtn);

            moreBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleItemMenu(itemMenu, moreBtn);
            });

            actionWrap.appendChild(moreBtn);
            actionWrap.appendChild(itemMenu);
            li.appendChild(actionWrap);

            // 创建图标（基于项目ID固定随机）
            const iconUrl = getIconForProject(item.id);
            const iconWrap = document.createElement('div');
            iconWrap.className = 'project-icon';
            const iconImg = document.createElement('img');
            iconImg.src = iconUrl;
            iconImg.alt = '';
            iconImg.setAttribute('aria-hidden', 'true');
            iconWrap.appendChild(iconImg);
            li.appendChild(iconWrap);

            // 创建名称span（关联CSS类）
            const nameSpan = document.createElement('span');
            nameSpan.className = "project-name"; // 关联CSS类
            nameSpan.textContent = item.name || "未命名项目"; // 兜底
            li.appendChild(nameSpan);

            // 点击项目，跳转项目空间
            li.addEventListener('click', () => {
                if (itemMenu.classList.contains('is-open')) return;
                // 拼接参数（编码特殊字符）
                const targetUrl = `../detail/detail.html?id=${item.id}&name=${encodeURIComponent(item.name || "未命名项目")}`;
                window.open(targetUrl, '_blank');
            });

            li.addEventListener('mouseenter', () => {
                moreBtn.classList.add('is-open');
            });

            li.addEventListener('mouseleave', () => {
                if (!itemMenu.classList.contains('is-open')) {
                    moreBtn.classList.remove('is-open');
                }
            });

            // 把列表项添加到ul中
            ul.appendChild(li);
        });
    }

    let openMenu = null;
    let openMoreBtn = null;

    function hideItemMenu() {
        if (openMenu) {
            openMenu.classList.remove('is-open');
        }
        if (openMoreBtn) {
            openMoreBtn.classList.remove('is-open');
        }
        openMenu = null;
        openMoreBtn = null;
    }

    function toggleItemMenu(menuNode, moreBtn) {
        const isOpen = menuNode.classList.contains('is-open');
        hideItemMenu();
        if (!isOpen) {
            menuNode.classList.add('is-open');
            moreBtn.classList.add('is-open');
            openMenu = menuNode;
            openMoreBtn = moreBtn;
        }
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.item-actions')) {
            hideItemMenu();
        }
    });
    window.addEventListener('scroll', hideItemMenu);
    // 添加项目：使用模态框收集名称并 POST 到后端
    const addBackdrop = document.getElementById('add-backdrop');
    const addInput = document.getElementById('add-input');
    const addCancel = document.getElementById('add-cancel');
    const addConfirm = document.getElementById('add-confirm');

    function openAddModal() {
        if (!addBackdrop || !addInput) return;
        addInput.value = '';
        addBackdrop.classList.add('is-open');
        addBackdrop.setAttribute('aria-hidden', 'false');
        setTimeout(() => addInput.focus(), 0);
    }

    function closeAddModal() {
        if (!addBackdrop || !addInput) return;
        addBackdrop.classList.remove('is-open');
        addBackdrop.setAttribute('aria-hidden', 'true');
        addInput.value = '';
    }

    async function submitAdd() {
        if (!addInput) return;
        const name = addInput.value.trim();
        if (!name) {
            alert('项目名称不能为空');
            addInput.focus();
            return;
        }
        try {
            await axios.post('http://localhost/tex/project/create', { name }, {
                headers: { 'token': localStorage.getItem('token') }
            });
            closeAddModal();
            await fetchList();
        } catch (e) {
            console.error('创建失败：', e);
            alert('创建失败：' + (e.response?.data?.msg || e.message));
        }
    }

    if (addCancel) addCancel.addEventListener('click', closeAddModal);
    if (addConfirm) addConfirm.addEventListener('click', submitAdd);
    if (addBackdrop) {
        addBackdrop.addEventListener('click', (event) => {
            if (event.target === addBackdrop) closeAddModal();
        });
    }

    // 原来的 onAddClicked 现在打开模态
    async function onAddClicked() { openAddModal(); }

    // 获取并渲染列表的复用函数
    async function fetchList() {
        try {
            const res = await axios.get(`http://localhost/tex/project/list/${id}`, {
                headers: { 'token': localStorage.getItem('token') }
            });
            renderHtmlWithCreateElement(res.data.data);
        } catch (err) {
            console.error('列表刷新失败：', err);
            const container = document.getElementById('container');
            container.innerHTML = `\n                <h2>我的项目</h2>\n                <div class="error-tip">项目获取失败：${err.response?.data?.msg || err.message || '网络错误'}</div>\n            `;
        }
    }

    // 首次拉取并渲染
    await fetchList();
})();