/**
 * 个人主页
 * 展示当前登录用户的基本信息
 */
import { renderTopBar } from '../../components/topBar.js';
import { getOrCreateAvatar } from '../../utils/AvatarUtil.js';
import { UserApi } from '../../api/UserApi.js';

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
    const container = document.getElementById('profile-content');
    if (!container) return;

    try {
        const res = await UserApi.getProfile();
        const user = res.data?.data;
        if (!user) {
            container.innerHTML = '<div class="error-tip">未获取到用户信息</div>';
            return;
        }

        //使用与顶栏相同的头像
        const avatarUrl = getOrCreateAvatar(user.name || 'User');

        container.innerHTML = `
            <div class="profile-avatar">
                <img class="avatar-circle-img" src="${avatarUrl}" alt="${escapeHtml(user.name || '')}" />
                <div class="avatar-info">
                    <div class="display-name">${escapeHtml(user.name || '未设置姓名')}</div>
                    <div class="username">@${escapeHtml(user.userName || '')}</div>
                </div>
            </div>
            <ul class="info-list">
                <li class="info-row">
                    <span class="info-label">用户ID</span>
                    <span class="info-value" style="font-family:monospace;font-size:13px;">${user.uuid ?? '-'}</span>
                </li>
                <li class="info-row">
                    <span class="info-label">用户名</span>
                    <span class="info-value">${escapeHtml(user.userName || '-')}</span>
                </li>
                <li class="info-row">
                    <span class="info-label">姓名</span>
                    <span class="info-value">${escapeHtml(user.name || '-')}</span>
                </li>
                <li class="info-row">
                    <span class="info-label">性别</span>
                    <span class="info-value ${user.gender ? '' : 'empty'}">${escapeHtml(user.gender || '未设置')}</span>
                </li>
                <li class="info-row">
                    <span class="info-label">手机</span>
                    <span class="info-value ${user.phone ? '' : 'empty'}">${escapeHtml(user.phone || '未设置')}</span>
                </li>
                <li class="info-row">
                    <span class="info-label">邮箱</span>
                    <span class="info-value ${user.email ? '' : 'empty'}">${escapeHtml(user.email || '未设置')}</span>
                </li>
            </ul>
        `;
    } catch (e) {
        console.error('获取用户信息失败：', e);
        container.innerHTML = '<div class="error-tip">加载失败：' + (e.response?.data?.msg || e.message) + '</div>';
    }
})();

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}
