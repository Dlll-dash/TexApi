# Frontend Architecture

## 项目概览

Vanilla JS SPA（无框架），ES 模块通过 `<script type="module">` 直接加载。CDN 依赖：Axios、Bootstrap Icons。Nginx 静态服务。

## 目录结构

```
nginx/html/tex/
├── index.html                 # 登录页（入口）
├── index.js                   # 登录逻辑 + 动画背景
├── favicon .ico
├── api/                       # 后端 API 封装层（每个模块一个文件）
│   ├── ApiApi.js              #   /api/*          — API 的增删改查、发布、丢弃、批量导出、主表列表
│   ├── CategoryApi.js         #   /categories/*   — 分类树、草稿树、发布/丢弃草稿
│   ├── ProjectApi.js          #   /project/*      — 项目 CRUD
│   ├── TeamApi.js             #   /team/*         — 团队管理
│   ├── UserApi.js             #   /user/*         — 用户信息
│   ├── RequestParamsApi.js    #   /request/param/*— 请求参数
│   └── ResponseApi.js         #   /response/*     — 响应定义（工厂函数）
├── config/                    # 配置常量
│   ├── AxiosConfig/           # Axios 实例（baseURL=/tex, 拦截器, getUrlParams）
│   ├── FormConfig.js          # 调试/设计表单字段配置
│   ├── MethodConfig.js        # HTTP 方法颜色/标签映射
│   ├── StatusConfig.js        # API 状态颜色/标签（0=维护中, 1=开发中, 2=已发布）
│   ├── TypeConfig.js          # 请求/响应数据类型
│   └── ResponseConfig.js      # HTTP 状态码颜色/消息
├── components/                # 可复用 UI 组件
│   ├── topBar.js              # 全局顶栏（logo, 团队名, 头像下拉菜单）
│   ├── teamSidebar.js         # 团队侧栏（团队列表, 创建团队）
│   ├── treeTable.js           # 分类+API 树组件（核心：树渲染、右键菜单、草稿/主表模式）
│   ├── modal.js               # 输入弹窗（createPromptModal）
│   ├── tip.js                 # 确认弹窗（createConfirmModal）
│   ├── toast.js               # Toast 提示
│   ├── jsonEditor.js          # JSON 编辑器
│   ├── paramList.js           # 参数列表渲染
│   ├── apiStatusSpan.js       # 状态选择下拉
│   ├── isNecessaryButton.js   # 必填切换按钮
│   ├── checkButton.js         # 勾选按钮
│   ├── typeDropdown.js        # 类型下拉
│   ├── urlSpan.js             # URL+方法徽章
│   ├── dotWaveBackground.js   # Canvas 粒子波浪背景
│   ├── responsePreviewDiv.js  # 响应体树预览
│   ├── responseJsonExampleDiv.js  # JSON 示例
│   └── responseXmlExampleDiv.js   # XML 示例
├── module/                    # 业务逻辑模块
│   ├── Export.js              # 导出（单 API, 批量分类, 批量项目）→ 生成独立 HTML 文档
│   ├── BodyTree.js            # 响应体 TreeNode 递归结构
│   └── NodeMapManager.js      # TreeNode 单例管理器
├── pages/                     # 页面
│   ├── home/                  # 首页：团队侧栏 + 项目卡片网格
│   ├── detail/                # 编辑页：左侧树 + 右侧 Debug/Design/Preview 三标签
│   ├── master/                # 主表浏览页（只读）：左侧树 + 右侧 API 预览
│   ├── registry/              # 注册页
│   ├── team/manage.html       # 团队管理页（信息编辑, 成员管理, 删除团队）
│   └── user/profile.html      # 个人主页
├── utils/                     # 工具函数
│   ├── AvatarUtil.js          # Canvas 生成首字母头像
│   ├── DateUtil.js            # 日期格式化（中文格式, 相对时间）
│   └── RandomUtil.js          # 随机 ID 生成
└── assets/svg/                # 静态 SVG 图标
```

## 页面导航流程

```
login.html ──→ home.html ──→ master.html (主表浏览，只读)
                │    └──→ detail.html (编辑，草稿模式)
                ├──→ team/manage.html (团队设置)
                └──→ user/profile.html (个人信息)
```

## Axios 通信模型

```javascript
// AxiosConfig.js
const request = axios.create({ baseURL: '/tex', timeout: 500000 });

// 请求拦截器：注入 JWT token 到 header
request.interceptors.request.use(config => {
    config.headers['token'] = localStorage.getItem('token');
    return config;
});

// 响应拦截器：code=1 成功，code=0 业务错误，401 跳转登录
request.interceptors.response.use(res => {
    if (res.data.code === 1) return res;
    showToast(res.data.msg, 'error');
    return Promise.reject(res);
}, err => {
    if (err.response?.status === 401) { localStorage.clear(); location.href = '/index.html'; }
    return Promise.reject(err);
});
```

## treeTable 组件（`components/treeTable.js`）

最复杂的共享组件，负责分类+API 树的渲染和交互。

```
createTreeTable(container, {
    projectId,          // 项目ID（值或函数）
    readOnly,           // true=主表只读模式（隐藏编辑菜单）
    apiListFetcher,     // 自定义 API 列表获取函数（主表模式用 /api/master/list/）
    onApiSelect,        // API 选中回调
    onApiRename/Delete/Add/Move/Export,  // CRUD 回调
    onCategoryExport,   // 分类批量导出回调
})
```

**数据流**：`refresh()` → `CategoryApi.getCategories()/getDraftCategories()` + API 列表 → `buildTree(categories, apis)` → 递归渲染嵌套 `<ul>`

**草稿模式 vs 主表模式**：
- `readOnly=false`：调用 `CategoryApi.getDraftCategories()` + `ApiApi.list()`，显示编辑菜单和草稿徽章
- `readOnly=true`：调用 `CategoryApi.getCategories()` + `ApiApi.listMasters()`，隐藏所有编辑菜单

## 设计规范（`.copilot-instructions.md`）

- **颜色**：无渐变、无玻璃态。白色/浅灰背景，主文字 `#111827`，最多 3 种品牌色
- **字体**：固定字号 12/14/16/20/24/32px，行高 body 1.5 / heading 1.25
- **间距**：4px 基础网格（4, 8, 12, 16, 24, 32, 48, 64），禁止 13px/23px 等魔数
- **卡片**：边框或阴影二选一；圆角 6px 或 8px 最大
- **按钮**：主按钮纯色填充，次按钮轮廓/幽灵；hover 加深 ~10%
- **输入框**：`1px solid #d1d5db`，圆角 6px，focus 用边框色 + outline 而非发光

## 关键文件清单

| 文件 | 职责 |
|------|------|
| `config/AxiosConfig/AxiosConfig.js` | Axios 实例 + 拦截器 |
| `components/treeTable.js` | 核心树组件 |
| `components/topBar.js` | 全局顶栏 |
| `components/teamSidebar.js` | 团队侧栏 |
| `pages/detail/detail.js` | 编辑页主逻辑（~2700 行） |
| `pages/home/home.js` | 首页项目列表 |
| `pages/master/master.js` | 主表浏览页 |
| `module/Export.js` | 导出 HTML 文档 |
| `api/ApiApi.js` | API 相关请求封装 |
| `api/CategoryApi.js` | 分类相关请求封装 |
