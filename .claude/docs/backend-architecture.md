# Backend Architecture

## 项目概览

Spring Boot 3.4 / MyBatis / MySQL 8.0 / Redis 单体后端。Java 17。

## 目录结构

```
src/main/java/com/tex/texapi/
├── common/                    # 公共模块
│   ├── constant/              # 常量（AutoFillConstant, MessageConstant）
│   ├── context/               # ThreadLocal 上下文（BaseContext — 存储当前用户ID）
│   ├── enumeration/           # 枚举（OperationType, CheckType）
│   ├── exception/             # 自定义异常（BaseException, NoPermissionException, RequestException）
│   ├── result/                # 统一响应 Result<T>（code=1成功, code=0失败）
│   └── utils/                 # 工具类（HttpClientUtil）
├── pojo/
│   ├── dto/                   # 请求参数对象（AddApiDTO, UpdateApiDTO, AddCategoryDTO, RequestDTO...）
│   ├── entity/                # 数据库实体（Api, Category, Project, Team, TeamMember, User）
│   └── vo/                    # 视图返回对象（ApiVO, CategoryVO, AddApiVO, RequestVO, ExportBatchVO...）
├── server/
│   ├── annotation/            # 自定义注解（@AutoFill, @TeamAuth）
│   ├── aspect/                # AOP 切面（AutoFillAspect — 自动填充创建/更新时间及用户; TeamAuthAspect — 权限校验）
│   ├── controller/            # REST 控制器
│   ├── interceptor/           # 拦截器（JwtTokenInterceptor — JWT 认证）
│   ├── mapper/                # MyBatis Mapper 接口
│   └── service/
│       ├── impl/              # Service 实现
│       └── *.java             # Service 接口
└── TexApiApplication.java     # Spring Boot 入口
```

## REST API 路由

所有路径前缀 `/tex/`，Nginx 反向代理到 `localhost:8080`。

| 前缀 | Controller | 鉴权 | 功能 |
|------|-----------|------|------|
| `/tex/user` | `UserController` | 无需 JWT | 登录、注册 |
| `/tex/project` | `ProjectController` | JWT + @TeamAuth | 项目 CRUD |
| `/tex/api` | `ApiController` | JWT + @TeamAuth | API CRUD、发送请求、发布/丢弃草稿、批量导出、主表列表 |
| `/tex/categories` | `CategoryController` | JWT + @TeamAuth | 分类树 CRUD、草稿树、发布/丢弃草稿 |
| `/tex/request` | `RequestParamsController` | JWT + @TeamAuth | 请求参数 CRUD |
| `/tex/response` | `ResponseController` | JWT + @TeamAuth | 响应定义 CRUD |
| `/tex/team` | `TeamController` | JWT + @TeamAuth | 团队 CRUD、成员管理 |

## 认证与鉴权流程

```
请求 → JwtTokenInterceptor（解析 JWT → userId → BaseContext ThreadLocal）
     → Controller 方法上的 @TeamAuth(level, checkType)
     → TeamAuthAspect（提取 resourceId → JOIN 查询 team_member.role → 比较 level）
     → 通过则执行 Service，失败则抛 NoPermissionException
```

- **认证**：JWT token 放在 HTTP Header 中（header 名由 `JwtProperties.tokenName` 配置）
- **鉴权**：`@TeamAuth(level=VIEWER/EDITOR/ADMIN/OWNER, checkType=TEAM/PROJECT/API/CATEGORY/PARAM/RESPONSE)`
- **角色**：`TeamMember` 常量 — `VIEWER=1`, `EDITOR=2`, `ADMIN=3`, `OWNER=4`
- **CheckType**：决定从哪个资源开始 JOIN 查询角色（`TEAM → team`, `PROJECT → project.team_id`, `API → api.project_id → project.team_id`, 以此类推）

## 核心业务模式

### 草稿/发布系统

API 和 Category 表共享相同架构：同一张表通过 `is_draft`（0=主表, 1=草稿）和 `base_id`（草稿→主表关联）区分。

| 操作 | ApiServiceImpl | CategoryServiceImpl |
|------|---------------|-------------------|
| 列出草稿 | `listDrafts()` → 自动补齐缺失草稿 | `listDrafts()` → 自动补齐缺失草稿 |
| 创建 | `addApi()` → isDraft=true | `add()` → isDraft=true |
| 编辑 | `updateApi()` → 仅操作草稿行 | `update()` → 自动创建草稿后编辑 |
| 发布 | `publish()` → 创建/更新主表 + 同步参数/响应 + 发布分类 | `publishCategories()` → 批量创建/更新主表 + 删除标记 |
| 删除 | `delete()` → 删除草稿行 | `delete()` → 标记删除/直接删除草稿 |

### 自动填充（AutoFill）

`@AutoFill(OperationType.INSERT/UPDATE)` 注解在 Mapper 方法上 → `AutoFillAspect` 切面反射调用实体的 `setCreateTime(LocalDateTime)`, `setCreateUser(Long)`, `setUpdateTime(LocalDateTime)`, `setUpdateUser(Long)`。当前用户 ID 从 `BaseContext.getCurrentId()` 获取。

### Redis 缓存

请求参数缓存在 `params_{apiId}_{formatType}` 键下。响应缓存在 `response_{apiId}` 下。写操作后通过 `redisTemplate.keys(pattern)` + `delete(keys)` 清除。

## 关键文件清单

| 文件 | 职责 |
|------|------|
| `server/interceptor/JwtTokenInterceptor.java` | JWT 解析 → ThreadLocal |
| `server/aspect/TeamAuthAspect.java` | @TeamAuth AOP 鉴权 |
| `server/aspect/AutoFillAspect.java` | @AutoFill AOP 自动填充 |
| `server/service/impl/ApiServiceImpl.java` | API 草稿/发布核心逻辑 + 请求代理 |
| `server/service/impl/CategoryServiceImpl.java` | 分类草稿/发布 + 合并树构建 |
| `resources/mapper/ApiMapper.xml` | API SQL（listDrafts, listMasters, publish...） |
| `resources/mapper/CategoryMapper.xml` | 分类 SQL |
| `resources/db/init/create_table.sql` | 数据库建表脚本 |
