# 前端编码规范

## API 封装

### 必须封装，禁止裸调

所有后端 API 调用必须封装在 `api/` 目录下的模块中，页面代码不得直接使用 `request.get/post/put/delete` 或 `axios(...)`。

**模块模式**（参照 `api/TeamApi.js`、`api/ProjectApi.js`）：

```js
import { request } from "../config/AxiosConfig/AxiosConfig.js";

export const XxxApi = {
    async list() {
        return request.get('/xxx/list');
    },
    async add(data) {
        return request.post('/xxx/add', data);
    },
    async update(data) {
        return request.put('/xxx/update', data);
    },
    async delete(id) {
        return request.delete('/xxx/delete/' + id);
    }
};
```

**工厂函数模式**（需要实例化参数的场景，参照 `api/ResponseApi.js`）：

```js
function createXxxApi(instanceId) {
    return {
        async list() {
            return request.get(`/xxx/list/${instanceId}`);
        },
        async get(id) {
            return request.get(`/xxx/${id}`);
        }
    };
}
export { createXxxApi };
```

### 已有 API 模块

| 模块 | 用途 |
|---|---|
| `api/ApiApi.js` | API CRUD、发布、放弃、导出、send |
| `api/RequestParamsApi.js` | 请求参数 CRUD |
| `api/ResponseApi.js` | 响应参数 CRUD（工厂函数） |
| `api/CategoryApi.js` | 分类 CRUD |
| `api/TeamApi.js` | 团队及成员管理 |
| `api/ProjectApi.js` | 项目 CRUD |
| `api/UserApi.js` | 用户信息 |

**新增 API 调用前先确认是否已有对应模块，有则追加方法，无则新建模块。**

---

## 组件化

### 已有组件

| 组件 | 用途 | 用法 |
|---|---|---|
| `components/toast.js` | 消息通知 | `showToast(msg, type, duration)` |
| `components/tip.js` | 确认弹窗 | `createConfirmModal(id, title)` → `modal.open(msg)` |
| `components/modal.js` | 通用弹窗 | 文本输入类弹窗 |
| `components/treeTable.js` | 分类+API 树形列表 | 左侧导航 |
| `components/teamSidebar.js` | 团队侧栏 | 首页侧栏 |
| `components/topBar.js` | 顶栏 | 全局顶栏 |
| `components/jsonEditor.js` | JSON 编辑器 | textarea 增强 |
| `components/paramList.js` | 参数列表渲染 | 纯渲染函数 |
| `components/apiStatusSpan.js` | API 状态标签 | 渲染函数 |
| `components/urlSpan.js` | URL+方法展示 | 渲染函数 |
| `components/responsePreviewDiv.js` | 响应预览区 | 渲染函数 |
| `components/responseJsonExampleDiv.js` | JSON 示例 | 渲染函数 |
| `components/responseXmlExampleDiv.js` | XML 示例 | 渲染函数 |
| `components/typeDropdown.js` | 类型下拉 | UI 组件 |
| `components/isNecessaryButton.js` | 必填切换按钮 | UI 组件 |
| `components/checkButton.js` | 选中切换按钮 | UI 组件 |

### 组件规范

- **禁止使用原生 `alert()` 和 `confirm()`**。用 `showToast()` 提示消息，用 `createConfirmModal().open()` 确认操作。
- **重复 UI 逻辑必须抽取为组件**，放在 `components/` 目录下。
- 组件函数命名：渲染函数用 `createXxx`（返回 DOM 元素），交互组件用 `renderXxx`（直接操作容器）。
- 组件文件用 `export` 导出，页面用 `import` 引用。

### Toast 用法

```js
import { showToast } from "../../components/toast.js";

showToast('操作成功', 'success');   // 绿色
showToast('操作失败：xxx', 'error'); // 红色
showToast('提示信息', 'info');       // 蓝色（默认）
showToast('自定义', 'info', 5000);   // 显示5秒
```

### 确认弹窗用法

```js
import { createConfirmModal } from "../../components/tip.js";

const confirmModal = createConfirmModal('unique-id', '默认标题');

// 确认操作
const ok = await confirmModal.open('确定要删除吗？', '删除确认', '删除');
if (!ok) return;
// 执行删除...
```

---

## 样式规范

（继承自 `CLAUDE.md` 中 Frontend design constraints）

- **禁止内联样式设置颜色、间距、字体**——统一用 CSS 类。
- 颜色：无渐变，纯色。主文字 `#111827`，次要 `#6b7280`，三级 `#9ca3af`。
- 字号：仅用 12/14/16/20/24/32px 固定档位。
- 间距：4px 基准网格——4, 8, 12, 16, 24, 32, 48, 64px。
- 卡片：边框或阴影二选一，圆角 ≤ 8px。
- 按钮：主按钮实心填充，次按钮描边/幽灵；hover 加深约 10%；不用 `rounded-full`。
- 输入框：`border: 1px solid #d1d5db`，圆角 6px；focus 用 border-color 变化 + outline，不用 glow。
- **禁止用 emoji 做功能图标**，用 Bootstrap Icons（`<i class="bi bi-xxx"></i>`）。

---

## 文件组织

```
nginx/html/tex/
├── index.html                    # 登录页
├── api/                          # API 封装模块（每模块一个文件）
├── components/                   # 可复用 UI 组件
├── config/                       # 配置文件
│   └── AxiosConfig/             # axios 实例配置
├── module/                       # 业务逻辑模块（非UI）
├── pages/                        # 页面（每页一个目录，html+js）
│   ├── detail/
│   ├── home/
│   ├── registry/
│   ├── team/
│   └── user/
└── utils/                        # 工具函数
```

### 页面结构

每个页面目录包含：
- `xxx.html` — 页面结构（仅 `<body>` 内的静态结构 + `<style>`）
- `xxx.js` — 页面逻辑（`type="module"` 引入，ESM import/export）

JS 中用 `document.getElementById()` 获取 DOM 引用，禁止在 JS 中拼接大段 HTML 结构（简单的可用，复杂的写 HTML）。

---

## 禁止事项清单

1. 禁止裸调 `request.*` 或 `axios.*` —— 必须走 `api/` 封装
2. 禁止 `alert()` / `confirm()` —— 用 `showToast()` / `confirmModal.open()`
3. 禁止 emoji 做功能图标 —— 用 Bootstrap Icons
4. 禁止内联样式设置颜色/间距/字体
5. 禁止在 JS 中硬编码 API 路径字符串
6. 禁止把 CSS 写在 JS 中（允许 `style.cssText` 仅用于动态计算的值，如 top/left）
