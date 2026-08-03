/**
 * 团队管理页面逻辑
 * 支持编辑团队信息、管理成员（邀请/移除/改角色）、删除团队
 */
import { renderTopBar } from '../../components/topBar.js';
import { showToast } from '../../components/toast.js';
import { TeamApi } from '../../api/TeamApi.js';

renderTopBar();

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

    //弹窗元素
    const inviteBackdrop = document.getElementById('invite-backdrop');
    const inviteUserId = document.getElementById('invite-user-id');
    const inviteRole = document.getElementById('invite-role');
    const inviteCancel = document.getElementById('invite-cancel');
    const inviteConfirm = document.getElementById('invite-confirm');
    const deleteBackdrop = document.getElementById('delete-backdrop');
    const deleteCancel = document.getElementById('delete-cancel');
    const deleteConfirm = document.getElementById('delete-confirm');

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
    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteConfirm.addEventListener('click', submitDelete);
    deleteBackdrop.addEventListener('click', (e) => {
        if (e.target === deleteBackdrop) closeDeleteModal();
    });

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
            document.getElementById('btn-delete-team')?.addEventListener('click', openDeleteModal);
        }

        //成员行事件
        bindMemberEvents();
    }

    function renderMemberRow(member) {
        const roleLabel = getRoleLabel(member.role);
        const roleClass = getRoleClass(member.role);
        const isMe = String(member.userId) === String(userId);
        const canModify = myRole >= 3 && !isMe && member.role !== 4; // ADMIN+可改非自己的非owner
        const canRemove = myRole >= 3 && !isMe && member.role !== 4;  // ADMIN+可移除非自己的非owner
        const canChangeRole = myRole === 4 && !isMe;                   // OWNER可改任何非自己的角色

        return `
            <li class="member-row" data-user-id="${member.userId}">
                <span class="member-name">${escapeHtml(member.userName || '用户' + member.userId)}${isMe ? ' (我)' : ''}</span>
                ${canChangeRole ? `
                    <select class="role-select member-role-select" data-user-id="${member.userId}">
                        <option value="1" ${member.role === 1 ? 'selected' : ''}>viewer</option>
                        <option value="2" ${member.role === 2 ? 'selected' : ''}>editor</option>
                        <option value="3" ${member.role === 3 ? 'selected' : ''}>admin</option>
                        <option value="4" ${member.role === 4 ? 'selected' : ''}>owner</option>
                    </select>
                ` : `
                    <span class="role-badge ${roleClass}">${roleLabel}</span>
                `}
                ${canRemove ? `
                    <button class="btn-remove member-remove-btn" data-user-id="${member.userId}">移除</button>
                ` : ''}
            </li>
        `;
    }

    function bindMemberEvents() {
        //角色变更
        document.querySelectorAll('.member-role-select').forEach(select => {
            select.addEventListener('change', async function () {
                const targetUserId = this.getAttribute('data-user-id');
                const newRole = parseInt(this.value);
                try {
                    await TeamApi.updateMemberRole(teamId, targetUserId, {
                        teamId: Number(teamId),
                        userId: Number(targetUserId),
                        role: newRole
                    });
                    showToast('角色已更新', 'success');
                } catch (e) {
                    console.error('更新角色失败：', e);
                    //showToast('更新失败：' + (e.response?.data?.msg || e.message), 'error');
                    await reload();
                }
            });
        });

        //移除成员
        document.querySelectorAll('.member-remove-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const targetUserId = this.getAttribute('data-user-id');
                if (!confirm('确认移除该成员吗？')) return;
                try {
                    await TeamApi.removeMember(teamId, targetUserId);
                    await reload();
                } catch (e) {
                    console.error('移除成员失败：', e);
                    //showToast('移除失败：' + (e.response?.data?.msg || e.message), 'error');
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
        inviteUserId.value = '';
        inviteRole.value = '2';
        inviteBackdrop.classList.add('is-open');
        inviteBackdrop.setAttribute('aria-hidden', 'false');
        setTimeout(() => inviteUserId.focus(), 0);
    }

    function closeInviteModal() {
        inviteBackdrop.classList.remove('is-open');
        inviteBackdrop.setAttribute('aria-hidden', 'true');
    }

    async function submitInvite() {
        const uid = inviteUserId.value.trim();
        const role = parseInt(inviteRole.value);
        if (!uid) {
            showToast('请输入用户ID', 'error');
            inviteUserId.focus();
            return;
        }
        try {
            await TeamApi.invite(teamId, {
                teamId: Number(teamId),
                userId: Number(uid),
                role
            });
            closeInviteModal();
            await reload();
        } catch (e) {
            console.error('邀请失败：', e);
            //showToast('邀请失败：' + (e.response?.data?.msg || e.message), 'error');
        }
    }

    function openDeleteModal() {
        deleteBackdrop.classList.add('is-open');
        deleteBackdrop.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteModal() {
        deleteBackdrop.classList.remove('is-open');
        deleteBackdrop.setAttribute('aria-hidden', 'true');
    }

    async function submitDelete() {
        try {
            await TeamApi.delete(teamId);
            closeDeleteModal();
            showToast('团队已删除', 'success');
            window.location.href = '../home/home.html';
        } catch (e) {
            console.error('删除团队失败：', e);
            //showToast('删除失败：' + (e.response?.data?.msg || e.message), 'error');
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
