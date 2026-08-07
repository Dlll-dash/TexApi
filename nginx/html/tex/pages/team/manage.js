/**
 * 团队管理页面逻辑
 * 支持编辑团队信息、管理成员（邀请/移除/改角色）、删除团队
 */
import { renderTopBar } from '../../components/topBar.js';
import { showToast } from '../../components/toast.js';
import { createConfirmModal } from '../../components/modal.js';
import { TeamApi } from '../../api/TeamApi.js';

renderTopBar({
    dropdownItems: [
        {
            label: '个人主页',
            onClick: () => { window.location.href = '../user/profile.html'; }
        },
        {
            label: '退出登录',
            onClick: () => {
                localStorage.clear();
                window.location.href = '/index.html';
            }
        }
    ]
});

(async function main() {
    //解析URL参数
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('teamId');
    if (!teamId) {
        document.getElementById('manage-content').innerHTML =
            '<div class="error-tip">缺少团队ID参数</div>';
        return;
    }

    const userId = localStorage.getItem('id');
    let myRole = 0;
    let teamData = null;

    //弹窗
    const inviteBackdrop = document.getElementById('invite-backdrop');
    const inviteUserSearch = document.getElementById('invite-user-search');
    const inviteUserResults = document.getElementById('invite-user-results');
    const inviteUserUuid = document.getElementById('invite-user-uuid');
    const inviteRole = document.getElementById('invite-role');
    const inviteCancel = document.getElementById('invite-cancel');
    const inviteConfirm = document.getElementById('invite-confirm');

    //通用确认弹窗
    const confirmDelete = createConfirmModal('confirm-delete-modal');
    const confirmTransfer = createConfirmModal('confirm-transfer-modal');

    //加载数据
    await loadData();

    //渲染
    render();

    //弹窗事件
    inviteCancel.addEventListener('click', closeInviteModal);
    inviteConfirm.addEventListener('click', submitInvite);
    inviteBackdrop.addEventListener('click', (e) => {
        if (e.target === inviteBackdrop) closeInviteModal();
    });
    //（确认弹窗的事件由 createConfirmModal 内部处理）

    // ==== 数据加载 ====

    async function loadData() {
        try {
            //并行获取团队列表和成员列表
            const [teamListRes, membersRes] = await Promise.all([
                TeamApi.list(),
                TeamApi.listMembers(teamId)
            ]);

            //从团队列表中找到当前团队
            const teams = teamListRes.data?.data || [];
            teamData = teams.find(t => String(t.id) === String(teamId));
            if (!teamData) {
                document.getElementById('manage-content').innerHTML =
                    '<div class="error-tip">团队不存在或无权访问</div>';
                return;
            }

            //找到当前用户的角色
            const members = membersRes.data?.data || [];
            const me = members.find(m => String(m.userId) === String(userId));
            myRole = me ? me.role : 0;

            //存储成员列表
            window._teamMembers = members;
        } catch (e) {
            console.error('加载团队数据失败：', e);
            document.getElementById('manage-content').innerHTML =
                '<div class="error-tip">加载失败：' + (e.response?.data?.msg || e.message) + '</div>';
        }
    }

    // ==== 渲染 ====

    function render() {
        if (!teamData) return;

        const container = document.getElementById('manage-content');
        const canEdit = myRole >= 3;  // ADMIN or OWNER
        const canDelete = myRole === 4; // OWNER only
        const members = window._teamMembers || [];

        container.innerHTML = `
            <div class="manage-layout">
                <div class="manage-info">
                    <div class="section-title">团队信息</div>
                    <div class="form-group">
                        <label for="team-name">名称</label>
                        <input id="team-name" type="text" maxlength="60"
                               value="${escapeHtml(teamData.name || '')}"
                               ${canEdit ? '' : 'disabled'} />
                    </div>
                    <div class="form-group">
                        <label for="team-desc">描述</label>
                        <textarea id="team-desc" maxlength="500"
                                  ${canEdit ? '' : 'disabled'}>${escapeHtml(teamData.description || '')}</textarea>
                    </div>
                    ${canEdit ? '<button id="btn-save-info" class="btn-save">保存</button>' : ''}

                    ${canDelete ? `
                    <div class="danger-zone">
                        <div class="section-title">危险区域</div>
                        <p>删除团队后，团队下所有项目不再归属任何团队。</p>
                        <button id="btn-delete-team" class="btn-delete">删除团队</button>
                    </div>
                    ` : ''}
                </div>

                <div class="manage-members">
                    <div class="section-title">成员 (${members.length})</div>
                    <ul class="member-list" id="member-list">
                        ${members.map(m => renderMemberRow(m)).join('')}
                    </ul>
                    ${canEdit ? '<button id="btn-invite" class="btn-invite">+ 邀请成员</button>' : ''}
                </div>
            </div>
        `;

        //绑定事件
        if (canEdit) {
            document.getElementById('btn-save-info')?.addEventListener('click', saveTeamInfo);
            document.getElementById('btn-invite')?.addEventListener('click', openInviteModal);
        }
        if (canDelete) {
            document.getElementById('btn-delete-team')?.addEventListener('click', submitDelete);
        }

        //成员行事件
        bindMemberEvents();
    }

    function renderMemberRow(member) {
        const roleLabel = getRoleLabel(member.role);
        const roleClass = getRoleClass(member.role);
        const isMe = String(member.userId) === String(userId);

        // owner 可改任何非自己成员的角色（含所有权转让）
        const canChangeRole = myRole === 4 && !isMe;
        // admin 只能改 viewer/editor 的角色
        const canChangeRoleLimited = myRole === 3 && !isMe && member.role <= 2;
        // 是否有角色编辑权限
        const canEditRole = canChangeRole || canChangeRoleLimited;
        // 可移除（admin+可移除非自己的非owner）
        const canRemove = myRole >= 3 && !isMe && member.role !== 4;

        return `
            <li class="member-row" data-user-uuid="${member.userUuid || ''}">
                <span class="member-name">${escapeHtml(member.userName || '用户' + member.userId)}${isMe ? ' (我)' : ''}</span>
                ${canEditRole ? renderRoleSelect(member, canChangeRole) : `
                    <span class="role-badge ${roleClass}">${roleLabel}</span>
                `}
                ${canRemove ? `
                    <button class="btn-remove member-remove-btn" data-user-uuid="${member.userUuid || ''}">移除</button>
                ` : ''}
            </li>
        `;
    }

    function renderRoleSelect(member, isOwner) {
        var options = isOwner
            ? [{ v: 1, l: 'viewer' }, { v: 2, l: 'editor' }, { v: 3, l: 'admin' }, { v: 4, l: 'owner' }]
            : [{ v: 1, l: 'viewer' }, { v: 2, l: 'editor' }];
        return '<select class="role-select member-role-select" data-user-uuid="' + (member.userUuid || '') + '">'
            + options.map(function (o) {
                return '<option value="' + o.v + '"' + (member.role === o.v ? ' selected' : '') + '>' + o.l + '</option>';
            }).join('')
            + '</select>';
    }

    function bindMemberEvents() {
        //角色变更
        document.querySelectorAll('.member-role-select').forEach(select => {
            select.addEventListener('change', async function () {
                const targetUserUuid = this.getAttribute('data-user-uuid');
                const newRole = parseInt(this.value);

                //所有权转让确认
                if (newRole === 4) {
                    const ok = await confirmTransfer.open(
                        '确认将团队所有权转让给该成员？转让后你的角色将降级为 admin。',
                        '转让团队所有权',
                        '确认转让'
                    );
                    if (!ok) { await reload(); return; }
                }

                try {
                    await TeamApi.updateMemberRole(teamId, targetUserUuid, {
                        teamId: Number(teamId),
                        userUuid: targetUserUuid,
                        role: newRole
                    });
                    showToast(newRole === 4 ? '所有权已转让，你已降级为 admin' : '角色已更新', 'success');
                } catch (e) {
                    console.error('更新角色失败：', e);
                    await reload();
                }
            });
        });

        //移除成员
        document.querySelectorAll('.member-remove-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const targetUserUuid = this.getAttribute('data-user-uuid');
                if (!confirm('确认移除该成员吗？')) return;
                try {
                    await TeamApi.removeMember(teamId, targetUserUuid);
                    await reload();
                } catch (e) {
                    console.error('移除成员失败：', e);
                }
            });
        });
    }

    // ==== 操作 ====

    async function saveTeamInfo() {
        const name = document.getElementById('team-name')?.value.trim();
        const description = document.getElementById('team-desc')?.value.trim();
        if (!name) {
            showToast('团队名称不能为空', 'error');
            return;
        }
        const btn = document.getElementById('btn-save-info');
        if (btn) btn.disabled = true;
        try {
            await TeamApi.update({
                id: Number(teamId),
                name,
                description
            });
            showToast('保存成功', 'success');
            teamData.name = name;
            teamData.description = description;
        } catch (e) {
            console.error('保存失败：', e);
            //showToast('保存失败：' + (e.response?.data?.msg || e.message), 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function openInviteModal() {
        inviteUserSearch.value = '';
        inviteUserUuid.value = '';
        inviteUserResults.style.display = 'none';
        inviteRole.value = '2';
        inviteBackdrop.classList.add('is-open');
        inviteBackdrop.setAttribute('aria-hidden', 'false');
        setTimeout(() => inviteUserSearch.focus(), 0);
    }

    function closeInviteModal() {
        inviteBackdrop.classList.remove('is-open');
        inviteBackdrop.setAttribute('aria-hidden', 'true');
        inviteUserResults.style.display = 'none';
    }

    //搜索用户（带300ms防抖）
    let searchTimer = null;
    inviteUserSearch.addEventListener('input', function () {
        clearTimeout(searchTimer);
        const keyword = this.value.trim();
        if (keyword.length < 2) {
            inviteUserResults.style.display = 'none';
            return;
        }
        searchTimer = setTimeout(async () => {
            try {
                const res = await axios.get('/tex/user/search', {
                    params: { keyword },
                    headers: { token: localStorage.getItem('token') }
                });
                const users = res.data?.data || [];
                renderSearchResults(users);
            } catch (e) {
                console.error('搜索失败:', e);
            }
        }, 300);
    });

    function renderSearchResults(users) {
        inviteUserResults.innerHTML = '';
        if (users.length === 0) {
            inviteUserResults.style.display = 'none';
            return;
        }
        users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="su-name">${escapeHtml(u.userName)}</span>
                             <span class="su-email">${escapeHtml(u.email || '')}</span>`;
            li.addEventListener('click', () => {
                inviteUserSearch.value = u.userName;
                inviteUserUuid.value = u.uuid;
                inviteUserResults.style.display = 'none';
            });
            inviteUserResults.appendChild(li);
        });
        inviteUserResults.style.display = 'block';
    }

    async function submitInvite() {
        const userUuid = inviteUserUuid.value.trim();
        const role = parseInt(inviteRole.value);
        if (!userUuid) {
            showToast('请搜索并选择要邀请的用户', 'error');
            inviteUserSearch.focus();
            return;
        }
        try {
            await TeamApi.invite(teamId, {
                teamId: Number(teamId),
                userUuid: userUuid,
                role
            });
            closeInviteModal();
            await reload();
        } catch (e) {
            console.error('邀请失败：', e);
        }
    }

    async function submitDelete() {
        const ok = await confirmDelete.open(
            '确认删除该团队吗？此操作不可恢复，团队下所有项目将不再归属任何团队。',
            '删除团队',
            '确认删除'
        );
        if (!ok) return;
        try {
            await TeamApi.delete(teamId);
            showToast('团队已删除', 'success');
            window.location.href = '../home/home.html';
        } catch (e) {
            console.error('删除团队失败：', e);
        }
    }

    async function reload() {
        window._teamMembers = [];
        await loadData();
        render();
    }

    // ==== 工具函数 ====

    function getRoleLabel(role) {
        const map = { 1: 'viewer', 2: 'editor', 3: 'admin', 4: 'owner' };
        return map[role] || '未知';
    }

    function getRoleClass(role) {
        const map = { 1: 'viewer', 2: 'editor', 3: 'admin', 4: 'owner' };
        return map[role] || '';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
