import { request } from '../config/AxiosConfig/AxiosConfig.js';
import { CategoryApi } from '../api/CategoryApi.js';
import { methodColors, methodBackroundColors } from '../config/MethodConfig.js';
import { statusColors, statusText } from '../config/StatusConfig.js';
import { createPromptModal } from '../components/modal.js';
import { createConfirmModal } from '../components/tip.js';

// ========== Icon Constants ==========
const foldArrowIcon = '<i class="bi bi-caret-right-fill"></i>';
const unfoldArrowIcon = '<i class="bi bi-caret-down-fill"></i>';
const folderIcon = '<i class="bi bi-folder"></i>';
const openFolderIcon = '<i class="bi bi-folder2-open"></i>';
//首个api的默认选中状态
let isInit = false;

// ========== Tree Node ==========
class TreeTableNode {
    constructor(type, data, parentId = null) {
        this.type = type;       // 'category' | 'api'
        this.data = data;       // raw category or API object
        this.parentId = parentId;
        this.children = [];
        this.collapsed = false;
    }
}

// ========== Flat-to-tree converter ==========
// Handles both nested (with children[]) and flat (with parentId) category data
function flatToTree(flatList) {
    if (!Array.isArray(flatList) || flatList.length === 0) return [];

    // If already nested, return as-is
    const hasNested = flatList.some(item => item.children && item.children.length > 0);
    if (hasNested) return flatList;

    // Convert flat list to nested tree
    const idMap = new Map();
    const roots = [];

    // First pass: create nodes with empty children
    flatList.forEach(item => {
        idMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: link children to parents
    flatList.forEach(item => {
        const node = idMap.get(item.id);
        if (item.parentId && idMap.has(item.parentId)) {
            idMap.get(item.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

// ========== Build merged tree from categories + APIs ==========
function buildTree(categories, apis) {
    const root = new TreeTableNode('root', {}, null);

    // Normalize categories to nested tree structure
    const categoryTree = flatToTree(categories);

    function attachCategories(catList, parentNode) {
        if (!Array.isArray(catList)) return;
        catList.forEach(cat => {
            const catNode = new TreeTableNode('category', cat, parentNode.data?.id || null);
            parentNode.children.push(catNode);

            // Attach APIs belonging to this category
            const catApis = apis.filter(api => String(api.categoryId) === String(cat.id));
            catApis.forEach(api => {
                catNode.children.push(new TreeTableNode('api', api, cat.id));
            });

            // Recurse into sub-categories
            if (cat.children && cat.children.length > 0) {
                attachCategories(cat.children, catNode);
            }
        });
    }

    attachCategories(categoryTree, root);

    // Uncategorized APIs at root level
    const uncategorized = apis.filter(api => !api.categoryId);
    uncategorized.forEach(api => {
        root.children.push(new TreeTableNode('api', api, null));
    });

    return root;
}

// ========== Helper: create SVG-based menu button ==========
function createMenuButton(label, svgPath, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    if (className) button.className = className;

    const icon = document.createElement('span');
    icon.className = 'menu-icon';
    icon.innerHTML = svgPath;

    const text = document.createElement('span');
    text.textContent = label;

    button.appendChild(icon);
    button.appendChild(text);
    return button;
}

// ========== Main: createTreeTable ==========
function createTreeTable(container, options = {}) {
    const {
        projectId,                           // string or function returning string
        onApiSelect,                         // func (apiData) => void
        onApiRename,                         // func (apiData) => void
        onApiDelete,                         // func (apiData) => void
        onApiAdd,                            // func (categoryId | null) => Promise<createdApi>
        onApiMove,                           // func (apiData, targetCategoryId) => void
    } = options;

    let treeRoot = null;
    let rootCategoryId = null;
    let outsideCloseBound = false;

    const categoryRenameModal = createPromptModal('category-prompt-modal', '重命名分类');
    const confirmModal = createConfirmModal('tree-confirm-modal', '确认操作');

    // --- Close all open menus ---
    function closeAllMenus() {
        document.querySelectorAll('.tree-menu-container.is-open').forEach(m => {
            m.classList.remove('is-open');
        });
    }

    // --- Collect move-target categories (exclude self + descendants) ---
    function collectMoveTargets(excludeNode) {
        const targets = [];
        const excludeIds = new Set();

        // Collect self and all descendant IDs
        function markDescendants(node) {
            excludeIds.add(node.data.id);
            node.children.forEach(child => {
                if (child.type === 'category') markDescendants(child);
            });
        }
        markDescendants(excludeNode);

        // Flatten tree, exclude self + descendants
        function walk(node) {
            node.children.forEach(child => {
                if (child.type === 'category' && !excludeIds.has(child.data.id)) {
                    targets.push({ id: child.data.id, name: child.data.name || '未命名分类' });
                }
                if (child.type === 'category') walk(child);
            });
        }
        walk(treeRoot);

        return targets;
    }

    // --- Show move-target dropdown ---
    function showMoveDropdown(anchorEl, targets, onSelect) {
        // Remove any existing move dropdown
        document.querySelectorAll('.tree-move-dropdown').forEach(d => d.remove());

        const dropdown = document.createElement('div');
        dropdown.className = 'tree-option-list tree-move-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '0';
        dropdown.style.right = 'calc(100% + 4px)';
        dropdown.style.display = 'block';
        dropdown.style.minWidth = '140px';

        if (targets.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'tree-option-item';
            emptyItem.textContent = '无可用分类';
            emptyItem.style.color = '#9aa3ad';
            emptyItem.style.cursor = 'default';
            dropdown.appendChild(emptyItem);
        } else {
            targets.forEach(t => {
                const opt = document.createElement('button');
                opt.className = 'tree-option-item';
                opt.style.color ='#718096';
                opt.innerHTML = `<span>${folderIcon} ${t.name}</span>`;
                opt.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.remove();
                    onSelect(t.id);
                };
                dropdown.appendChild(opt);
            });
        }

        // Close on outside click
        function onOutsideClick(e) {
            if (!dropdown.contains(e.target) && e.target !== anchorEl) {
                dropdown.remove();
                document.removeEventListener('click', onOutsideClick);
            }
        }
        setTimeout(() => document.addEventListener('click', onOutsideClick), 0);

        anchorEl.parentElement.appendChild(dropdown);
    }

    // --- Render category more-menu ---
    function renderCategoryMenu(catNode, menuContainer) {
        const optionList = document.createElement('div');
        optionList.className = 'tree-option-list';
        const isRoot = (catNode.data.id === rootCategoryId);

        // Rename (hidden for root)
        if (!isRoot) {
            const renameOpt = createMenuButton('重命名', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            `, 'tree-option-item');
            renameOpt.onclick = async (e) => {
                e.stopPropagation();
                closeAllMenus();
                const newName = await categoryRenameModal.open(catNode.data.name || '', '重命名分类');
                if (newName) {
                    await CategoryApi.update(catNode.data.id, { name: newName });
                    refresh();
                }
            };
            optionList.appendChild(renameOpt);
        }

        // Move to (hidden for root)
        if (!isRoot) {
            const moveOpt = createMenuButton('移动到', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="5 9 2 12 5 15"></polyline>
                    <polyline points="9 5 12 2 15 5"></polyline>
                    <polyline points="15 19 12 22 9 19"></polyline>
                    <polyline points="19 9 22 12 19 15"></polyline>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                </svg>
            `, 'tree-option-item');
            moveOpt.onclick = async (e) => {
                e.stopPropagation();
                const targets = collectMoveTargets(catNode);
                showMoveDropdown(e.currentTarget, targets, async (targetId) => {
                    await CategoryApi.update(catNode.data.id, { parentId: targetId });
                    refresh();
                });
            };
            optionList.appendChild(moveOpt);
        }

        // Add sub-category
        const addSubOpt = createMenuButton('添加子分类', `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
        `, 'tree-option-item');
        addSubOpt.onclick = async (e) => {
            e.stopPropagation();
            closeAllMenus();
            const newName = await categoryRenameModal.open('', '新建子分类');
            if (newName) {
                const pId = typeof projectId === 'function' ? projectId() : projectId;
                await CategoryApi.add({ name: newName, projectId: pId, parentId: catNode.data.id });
                refresh();
            }
        };
        optionList.appendChild(addSubOpt);

        // Add API under this category
        const addApiOpt = createMenuButton('添加接口', `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `, 'tree-option-item');
        addApiOpt.onclick = async (e) => {
            e.stopPropagation();
            closeAllMenus();
            if (onApiAdd) {
                const created = await onApiAdd(catNode.data.id);
                if (created) refresh();
            }
        };
        optionList.appendChild(addApiOpt);

        // Delete (hidden for root)
        if (!isRoot) {
            const deleteOpt = createMenuButton('删除', `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `, 'tree-option-item danger');
            deleteOpt.onclick = async (e) => {
                e.stopPropagation();
                closeAllMenus();
                const confirmed = await confirmModal.open(
                    `确认删除分类「${catNode.data.name || ''}」及其下所有子分类和接口吗？`,
                    '删除分类',
                    '删除'
                );
                if (confirmed) {
                    await CategoryApi.delete(catNode.data.id);
                    refresh();
                }
            };
            optionList.appendChild(deleteOpt);
        }

        menuContainer.appendChild(optionList);
    }

    // --- Render API more-menu ---
    function renderApiMoreMenu(apiData, menuContainer) {
        const optionList = document.createElement('div');
        optionList.className = 'tree-option-list';

        // Rename
        const renameOpt = createMenuButton('重命名', `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
        `, 'tree-option-item');
        renameOpt.onclick = (e) => {
            e.stopPropagation();
            closeAllMenus();
            if (onApiRename) onApiRename(apiData);
        };
        optionList.appendChild(renameOpt);

        // Move to
        const moveOpt = createMenuButton('移动到', `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
        `, 'tree-option-item');
        moveOpt.onclick = (e) => {
            e.stopPropagation();
            // Collect all categories as targets (APIs can go anywhere)
            const targets = [];
            function walk(node) {
                node.children.forEach(child => {
                    if (child.type === 'category') {
                        targets.push({ id: child.data.id, name: child.data.name || '未命名分类' });
                        walk(child);
                    }
                });
            }
            walk(treeRoot);
            showMoveDropdown(e.currentTarget, targets, async (targetId) => {
                if (onApiMove) await onApiMove(apiData, targetId);
                refresh();
            });
        };
        optionList.appendChild(moveOpt);

        // Delete
        const deleteOpt = createMenuButton('删除', `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `, 'tree-option-item danger');
        deleteOpt.onclick = (e) => {
            e.stopPropagation();
            closeAllMenus();
            if (onApiDelete) onApiDelete(apiData);
        };
        optionList.appendChild(deleteOpt);

        menuContainer.appendChild(optionList);
    }

    // --- Create more-menu container ---
    function createMoreMenuContainer() {
        const container = document.createElement('div');
        container.className = 'tree-menu-container';
        container.addEventListener('click', (e) => e.stopPropagation());

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'more-menu-trigger';
        trigger.setAttribute('aria-label', '更多操作');
        trigger.innerHTML = '<i class="bi bi-three-dots"></i>';
        trigger.onclick = (e) => {
            e.stopPropagation();
            const isOpen = container.classList.contains('is-open');
            closeAllMenus();
            if (!isOpen) container.classList.add('is-open');
        };

        container.appendChild(trigger);
        return container;
    }

    // --- Render a category row ---
    function renderCategoryRow(catNode, depth, parentUl) {
        const li = document.createElement('li');
        li.className = 'tree-category-row';
        li.style.paddingLeft = `${depth * 1.5}rem`;

        // Arrow toggle
        const arrow = document.createElement('span');
        arrow.className = 'tree-arrow';
        arrow.innerHTML = catNode.collapsed ? foldArrowIcon : unfoldArrowIcon;

        // Folder icon
        const folder = document.createElement('span');
        folder.className = 'tree-folder';
        folder.innerHTML = catNode.collapsed ? folderIcon : openFolderIcon;

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tree-category-name';
        nameSpan.textContent = catNode.data.name || '未命名分类';

        // More menu
        const menuContainer = createMoreMenuContainer();
        renderCategoryMenu(catNode, menuContainer);

        li.appendChild(arrow);
        li.appendChild(folder);
        li.appendChild(nameSpan);
        li.appendChild(menuContainer);

        // Toggle collapse on arrow click or double-click on name
        function toggleCollapse() {
            catNode.collapsed = !catNode.collapsed;
            arrow.innerHTML = catNode.collapsed ? foldArrowIcon : unfoldArrowIcon;
            folder.innerHTML = catNode.collapsed ? folderIcon : openFolderIcon;

            // Toggle children ul
            const childrenUl = li.nextElementSibling;
            if (childrenUl && childrenUl.classList.contains('tree-children-ul')) {
                if (catNode.collapsed) {
                    childrenUl.classList.add('collapsed');
                } else {
                    childrenUl.classList.remove('collapsed');
                }
            }
        }

        arrow.addEventListener('click', (e) => { e.stopPropagation(); toggleCollapse(); });
        nameSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); closeAllMenus(); toggleCollapse(); });

        parentUl.appendChild(li);

        // Children ul
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'tree-children-ul';
        if (catNode.collapsed) childrenUl.classList.add('collapsed');
        parentUl.appendChild(childrenUl);

        // Render children recursively
        renderTree(catNode, depth + 1, childrenUl);
    }

    // --- Render an API row ---
    function renderApiRow(apiData, depth, parentUl) {
        const li = document.createElement('li');
        li.className = 'tree-api-row';
        li.style.paddingLeft = `${depth * 1.5}rem`;
        li.dataset.apiId = apiData.id ?? '';

        // Method badge
        const methodSpan = document.createElement('span');
        methodSpan.className = 'method';
        methodSpan.textContent = apiData.requestMethod;
        methodSpan.style.color = methodColors[apiData.requestMethod] || methodColors['DEFAULT'];

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = apiData.apiName;

        li.appendChild(methodSpan);
        li.appendChild(nameSpan);

        // Status dot
        if (apiData.status !== undefined && statusColors[apiData.status]) {
            const statusWrap = document.createElement('div');
            statusWrap.className = 'status-indicator';

            const statusDot = document.createElement('span');
            statusDot.className = 'status-dot';
            statusDot.style.backgroundColor = statusColors[apiData.status];

            const statusTooltip = document.createElement('span');
            statusTooltip.className = 'status-tooltip';
            statusTooltip.textContent = statusText[apiData.status] || '未知状态';

            statusWrap.appendChild(statusDot);
            statusWrap.appendChild(statusTooltip);
            li.appendChild(statusWrap);
        }

        // More menu
        const menuContainer = createMoreMenuContainer();
        renderApiMoreMenu(apiData, menuContainer);
        li.appendChild(menuContainer);

        // Click to select
        li.addEventListener('click', (e) => {
            closeAllMenus();
            // Update active state
            document.querySelectorAll('.tree-api-row.active').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            if (onApiSelect) onApiSelect(apiData);
        });

        parentUl.appendChild(li);
        //首次渲染默认选中第一个api
        if(isInit === false){
            li.click();
            isInit = true;
        }
    }

    // --- Recursively render tree ---
    function renderTree(node, depth, parentUl) {
        node.children.forEach(child => {
            if (child.type === 'category') {
                renderCategoryRow(child, depth, parentUl);
            } else {
                renderApiRow(child.data, depth, parentUl);
            }
        });
    }

    // --- Main refresh ---
    async function refresh() {
        const pId = typeof projectId === 'function' ? projectId() : projectId;
        if (!pId) return;

        let categories = [];
        let apis = [];
        let rootNode = null; // raw root node from API (single object, not array)

        // Step 1: Fetch category root node
        try {
            const catRes = await CategoryApi.getCategories(pId);
            rootNode = catRes?.data?.data || null;
            console.log('获取到的分类根节点：', rootNode);

            // Auto-create root "接口" category if none exists
            if (!rootNode) {
                try {
                    console.log('项目无分类，自动创建根分类「接口」...');
                    const createRes = await CategoryApi.add({ name: '接口', projectId: pId });
                    rootNode = createRes?.data?.data || null;
                    console.log('根分类创建结果：', rootNode);
                } catch (createErr) {
                    console.error('自动创建根分类失败：', createErr);
                }
            }
        } catch (err) {
            console.error('获取分类列表失败：', err);
        }

        // Normalize: wrap single root node as array for buildTree
        categories = rootNode ? [rootNode] : [];

        // Step 2: Fetch API list
        try {
            const apiRes = await request.get(`/api/list/${pId}`);
            apis = apiRes?.data?.data || [];
            console.log('获取到的接口数据：', apis);
        } catch (err) {
            console.error('获取接口列表失败：', err);
        }

        // Step 3: Build merged tree
        treeRoot = buildTree(categories, apis);
        //console.log('构建的树结构：', treeRoot);

        // Step 4: Determine root category ID
        rootCategoryId = rootNode?.id || null;
        //console.log('根分类ID：', rootCategoryId);

        // Step 5: Render
        container.innerHTML = '';

        const title = document.createElement('h2');
        title.className = 'api-list-title';
        title.textContent = '项目接口';
        container.appendChild(title);

        if (treeRoot.children.length === 0) {
            const emptyTip = document.createElement('div');
            emptyTip.className = 'empty-tip';
            emptyTip.textContent = '暂无接口数据';
            container.appendChild(emptyTip);
        }

        const rootUl = document.createElement('ul');
        rootUl.className = 'tree-table-ul';
        container.appendChild(rootUl);

        renderTree(treeRoot, 0, rootUl);

        if (!outsideCloseBound) {
            document.addEventListener('click', closeAllMenus);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAllMenus();
            });
            outsideCloseBound = true;
        }
    }

    refresh();
    //默认打开第一个api
    
    return { refresh };
}

export { createTreeTable };