# 缘圈子 (Yuan Quan Zi) — 项目索引

> 内部学习型论坛系统 | 知识分享与学习交流平台

---

## 目录

1. [项目概览](#1-项目概览)
2. [项目结构](#2-项目结构)
3. [后端模块索引 (api/)](#3-后端模块索引-api)
4. [前端页面索引 (web/)](#4-前端页面索引-web)
5. [配置与依赖](#5-配置与依赖)
6. [API 接口清单](#6-api-接口清单)
7. [数据模型](#7-数据模型)
8. [开发指南](#8-开发指南)
9. [参考文档](#9-参考文档)

---

## 1. 项目概览

| 项目 | 信息 |
|------|------|
| 名称 | 缘圈子 (Yuan Quan Zi) |
| 定位 | 内部学习型论坛，仅对内部成员开放 |
| 状态 | 开发中 (Initial) |
| Git | `main` 分支，2 commits |

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 19.x / 6.0 |
| 构建工具 | Vite | 8.x |
| UI 库 | Ant Design | 6.x |
| 状态管理 | Zustand | 5.x |
| 后端框架 | NestJS | 11.x |
| ORM | TypeORM | 0.3.x |
| 数据库 | SQLite (开发) → PostgreSQL 15 (生产) |
| 认证 | JWT + Passport + bcrypt |
| 搜索引擎 | MeiliSearch (规划中) |
| 消息队列 | BullMQ / Redis (规划中) |
| 容器化 | Docker + Docker Compose (规划中) |

### 当前实现进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 项目初始化 | ✅ | NestJS + Vite 项目结构搭建 |
| 数据库配置 | ✅ | TypeORM + SQLite 配置 |
| 用户认证 | ✅ | JWT 登录/刷新/登出/改密 |
| 用户管理 | ✅ | 资料/主页/搜索/关注 |
| 板块管理 | ✅ | CRUD + 列表展示 |
| 内容管理 | ✅ | 帖子 CRUD + Markdown 编辑 |
| 评论系统 | ✅ | 发表/回复/删除/列表 |
| 点赞系统 | ✅ | 点赞/取消/状态查询 |
| 收藏系统 | ✅ | 收藏夹 CRUD + 内容管理 |
| 关注系统 | ✅ | 关注/取消/列表/计数 |
| 通知系统 | ✅ | 通知列表/已读/删除 |
| 草稿箱 | ✅ | CRUD + 发布 |
| 搜索系统 | ✅ | 文章搜索/用户搜索/热门/联想 |
| 管理后台 | ✅ | 用户管理 + 板块管理 |
| 内容审核 | 🔄 | 规划中 |
| 内容抓取 | 🔄 | 规划中 |
| Docker 部署 | 🔄 | 规划中 |
| E2E 测试 | 🔄 | 规划中 |

---

## 2. 项目结构

```
yuan/
├── api/                          # NestJS 后端
│   ├── src/
│   │   ├── main.ts               # 应用入口
│   │   ├── app.module.ts         # 根模块 (导入所有功能模块)
│   │   ├── app.controller.ts     # 根控制器
│   │   ├── app.service.ts        # 根服务
│   │   ├── common/               # 公共组件
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts    # JWT 认证守卫
│   │   │   │   └── roles.guard.ts       # 角色权限守卫
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts   # 角色装饰器
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts  # 全局异常过滤器
│   │   │   └── types/
│   │   │       └── request.types.ts     # 请求类型定义
│   │   └── modules/              # 功能模块
│   │       ├── auth/             # 认证
│   │       ├── user/             # 用户
│   │       ├── board/            # 板块
│   │       ├── post/             # 帖子
│   │       ├── comment/          # 评论
│   │       ├── like/             # 点赞
│   │       ├── collection/       # 收藏
│   │       ├── follow/           # 关注
│   │       ├── notification/     # 通知
│   │       ├── draft/            # 草稿
│   │       ├── search/           # 搜索
│   │       └── admin/            # 管理后台
│   ├── test/                     # E2E 测试
│   └── sqlite.db                 # 开发数据库文件
│
├── web/                          # React 前端
│   ├── src/
│   │   ├── main.tsx              # 应用入口
│   │   ├── App.tsx               # 根组件
│   │   ├── router.tsx            # 路由配置 + 路由守卫
│   │   ├── services/
│   │   │   └── api.ts            # API 客户端 (Axios + 拦截器)
│   │   ├── stores/
│   │   │   └── auth.ts           # 认证状态 (Zustand + persist)
│   │   ├── components/
│   │   │   └── MainLayout.tsx    # 主布局 (Header + 导航)
│   │   └── pages/
│   │       ├── Login/            # 登录页
│   │       ├── Home/             # 首页 (帖子列表)
│   │       ├── PostDetail/       # 帖子详情
│   │       ├── PostEditor/       # 帖子编辑器
│   │       ├── Profile/          # 个人中心
│   │       ├── Search/           # 搜索页
│   │       ├── Notifications/    # 通知中心
│   │       ├── Settings/         # 个人设置
│   │       └── Admin/            # 管理后台
│   │           ├── AdminLayout.tsx
│   │           ├── UserManage.tsx
│   │           └── BoardManage.tsx
│   └── index.html
│
├── .claude/
│   ├── specs/yuanquanzi/
│   │   ├── requirements.md       # 产品需求文档
│   │   ├── design.md             # 系统设计文档
│   │   └── tasks.md              # 实施任务清单
│   └── skills/code-guidelines/
│       ├── SKILL.md
│       └── SKILL.zh.md
├── CLAUDE.md                     # 项目级 CLAUDE 配置
└── README.md
```

---

## 3. 后端模块索引 (api/)

### 3.1 模块依赖关系

```
auth → user
user → post, comment, like, follow, collection, notification
post → comment, like, collection
board → post
draft → user
notification → user
admin → user, board
search → post, user
```

### 3.2 模块清单

#### [Auth](api/src/modules/auth/) — 认证模块

| 文件 | 职责 |
|------|------|
| `auth.controller.ts` | 登录/登出/刷新令牌/修改密码 端点 |
| `auth.service.ts` | 用户验证、Token 生成、密码校验 |
| `auth.module.ts` | 模块配置，导入 JWT/Passport |
| `jwt.strategy.ts` | JWT 策略 (从请求头提取并验证 Token) |

**端点**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password`

**核心逻辑**:
- 学号 + bcrypt 密码验证
- JWT 双令牌 (accessToken 15min + refreshToken 7d)
- 首次登录强制改密

---

#### [User](api/src/modules/user/) — 用户模块

| 文件 | 职责 |
|------|------|
| `user.controller.ts` | 用户信息 CRUD 端点 |
| `user.service.ts` | 用户查询/创建/更新/统计 |
| `user.entity.ts` | 用户实体 (studentNo, username, role, status) |
| `user.module.ts` | 模块配置 |

**端点**: `GET /users/me`, `PATCH /users/me`, `GET /users/:id/profile`, `GET /users/me/stats`

**实体字段**: id, studentNo, username, email, passwordHash, avatarUrl, bio, role (admin/user), status (active/inactive/banned), isFirstLogin, lastLoginAt

---

#### [Board](api/src/modules/board/) — 板块模块

| 文件 | 职责 |
|------|------|
| `board.controller.ts` | 板块 CRUD 端点 |
| `board.service.ts` | 板块管理逻辑 |
| `board.entity.ts` | 板块实体 |
| `board.service.spec.ts` | 单元测试 |

**端点**: `GET /boards`, `GET /boards/:id`, `POST /boards`, `PATCH /boards/:id`, `DELETE /boards/:id`

**实体字段**: id, name, description, icon, sortOrder, isVisible

---

#### [Post](api/src/modules/post/) — 帖子模块

| 文件 | 职责 |
|------|------|
| `post.controller.ts` | 帖子 CRUD + 上传图片 端点 |
| `post.service.ts` | 帖子管理、状态流转、计数同步 |
| `post.entity.ts` | 帖子实体 |
| `post.service.spec.ts` | 单元测试 |
| `post.module.ts` | 模块配置 |

**端点**: `GET /posts`, `GET /posts/:id`, `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id`, `POST /posts/upload`

**实体字段**: id, authorId, boardId, title, content, type (original/repost/crawler), status (draft/pending/approved/rejected/hidden), viewCount, likeCount, commentCount, collectCount, isTop, isEssence, coverImage

**状态流转**: draft → pending → approved → visible | rejected → hidden

---

#### [Comment](api/src/modules/comment/) — 评论模块

| 文件 | 职责 |
|------|------|
| `comment.controller.ts` | 评论 CRUD 端点 |
| `comment.service.ts` | 评论管理、嵌套回复 |
| `comment.entity.ts` | 评论实体 (支持自关联嵌套) |
| `comment.service.spec.ts` | 单元测试 |
| `comment.module.ts` | 模块配置 |

**端点**: `GET /comments`, `POST /comments`, `DELETE /comments/:id`

**实体字段**: id, postId, authorId, parentId (自关联), content, likeCount, status

---

#### [Like](api/src/modules/like/) — 点赞模块

| 文件 | 职责 |
|------|------|
| `like.controller.ts` | 点赞/取消/状态查询/列表 端点 |
| `like.service.ts` | 点赞逻辑、幂等性处理、计数同步 |
| `like.entity.ts` | 点赞实体 (多态: post/comment) |
| `like.module.ts` | 模块配置 |

**端点**: `POST /likes/:targetType/:targetId`, `DELETE /likes/:targetType/:targetId`, `GET /likes/status/:targetType/:targetId`, `GET /likes/my`

**实体字段**: id, userId, targetId, targetType (post/comment) — 唯一索引 (userId, targetId, targetType)

---

#### [Collection](api/src/modules/collection/) — 收藏模块

| 文件 | 职责 |
|------|------|
| `collection.controller.ts` | 收藏夹 CRUD + 内容管理 端点 |
| `collection.service.ts` | 收藏夹管理逻辑 |
| `collection.entity.ts` | 收藏夹实体 |
| `collection-item.entity.ts` | 收藏夹-帖子关联实体 |
| `collection.module.ts` | 模块配置 |

**端点**: `GET /collections`, `POST /collections`, `PATCH /collections/:id`, `DELETE /collections/:id`, `POST /collections/:id/items`, `DELETE /collections/:id/items/:itemId`, `GET /collections/status/:postId`

---

#### [Follow](api/src/modules/follow/) — 关注模块

| 文件 | 职责 |
|------|------|
| `follow.controller.ts` | 关注/取消/状态/列表/计数 端点 |
| `follow.service.ts` | 关注逻辑 (多态: user/board/tag) |
| `follow.entity.ts` | 关注实体 |
| `follow.module.ts` | 模块配置 |

**端点**: `POST /follows/:targetType/:targetId`, `DELETE /follows/:targetType/:targetId`, `GET /follows/status/:targetType/:targetId`, `GET /follows/my/followings`, `GET /follows/my/followers`, `GET /follows/counts/:userId`

---

#### [Notification](api/src/modules/notification/) — 通知模块

| 文件 | 职责 |
|------|------|
| `notification.controller.ts` | 通知列表/已读/删除 端点 |
| `notification.service.ts` | 通知管理逻辑 |
| `notification.entity.ts` | 通知实体 (JSON data 字段) |
| `notification.module.ts` | 模块配置 |

**端点**: `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id`

**通知类型**: comment, reply, like_post, like_comment, collect, follow, audit_result, system

---

#### [Draft](api/src/modules/draft/) — 草稿模块

| 文件 | 职责 |
|------|------|
| `draft.controller.ts` | 草稿 CRUD + 发布 端点 |
| `draft.service.ts` | 草稿管理逻辑 |
| `draft.entity.ts` | 草稿实体 (JSON tags 字段) |
| `draft.module.ts` | 模块配置 |

**端点**: `GET /drafts`, `GET /drafts/:id`, `POST /drafts`, `PATCH /drafts/:id`, `DELETE /drafts/:id`, `POST /drafts/:id/publish`

---

#### [Search](api/src/modules/search/) — 搜索模块

| 文件 | 职责 |
|------|------|
| `search.controller.ts` | 搜索/建议/热门 端点 |
| `search.service.ts` | 搜索逻辑 (数据库 LIKE 查询，后续迁移 MeiliSearch) |
| `search.module.ts` | 模块配置 |

**端点**: `GET /search`, `GET /search/users`, `GET /search/suggestions`, `GET /search/trending`

---

#### [Admin](api/src/modules/admin/) — 管理后台模块

| 文件 | 职责 |
|------|------|
| `admin.controller.ts` | 用户管理/板块管理 端点 |
| `admin.service.ts` | 管理逻辑 |
| `admin.module.ts` | 模块配置 |

**端点**: `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/:id/status`, `PATCH /admin/users/:id/role`, `POST /admin/users/:id/reset-password`

---

### 3.3 公共组件 (common/)

| 文件 | 职责 |
|------|------|
| `guards/jwt-auth.guard.ts` | JWT 认证守卫 — 验证 Bearer Token |
| `guards/roles.guard.ts` | 角色权限守卫 — 检查 @Roles() 装饰器 |
| `decorators/roles.decorator.ts` | @Roles('admin') 装饰器 |
| `filters/http-exception.filter.ts` | 全局异常过滤器 — 统一错误响应格式 |
| `types/request.types.ts` | AuthenticatedRequest 类型定义 |

---

## 4. 前端页面索引 (web/)

### 4.1 路由结构

```
/login                  → Login           (公开)
/                       → MainLayout      (需登录)
  /                     → Home            (帖子列表)
  /post/:id             → PostDetail      (帖子详情)
  /post/new             → PostEditor      (发布帖子)
  /post/:id/edit        → PostEditor      (编辑帖子)
  /profile              → Profile         (个人主页)
  /profile/:id          → Profile         (他人主页)
  /notifications        → Notifications   (通知中心)
  /search               → Search          (搜索)
  /settings             → Settings        (个人设置)
/admin                  → AdminLayout     (需管理员)
  /admin/users          → UserManage      (用户管理)
  /admin/boards         → BoardManage     (板块管理)
```

### 4.2 页面组件清单

| 页面 | 路径 | 功能 |
|------|------|------|
| [Login](web/src/pages/Login/index.tsx) | `/login` | 学号登录、首次登录强制改密 |
| [Home](web/src/pages/Home/index.tsx) | `/` | 帖子列表、板块筛选、最新/最热排序、分页 |
| [PostDetail](web/src/pages/PostDetail/index.tsx) | `/post/:id` | Markdown 渲染 (代码高亮)、点赞/收藏、评论/回复 |
| [PostEditor](web/src/pages/PostEditor/index.tsx) | `/post/new`, `/post/:id/edit` | Markdown 编辑器 (@uiw/react-md-editor)、封面图上传、图片粘贴 |
| [Profile](web/src/pages/Profile/index.tsx) | `/profile`, `/profile/:id` | 用户信息、关注/粉丝统计、文章列表、关注操作 |
| [Notifications](web/src/pages/Notifications/index.tsx) | `/notifications` | 通知列表、已读/未读筛选、全部已读、删除 |
| [Search](web/src/pages/Search/index.tsx) | `/search` | 文章/用户搜索、热门标签、结果分页 |
| [Settings](web/src/pages/Settings/index.tsx) | `/settings` | 基本资料编辑、头像上传、修改密码 |
| [AdminLayout](web/src/pages/Admin/AdminLayout.tsx) | `/admin` | 管理后台布局 (侧边栏导航) |
| [UserManage](web/src/pages/Admin/UserManage.tsx) | `/admin/users` | 用户列表、添加用户、状态/角色修改、密码重置 |
| [BoardManage](web/src/pages/Admin/BoardManage.tsx) | `/admin/boards` | 板块列表、添加/编辑/删除板块 |

### 4.3 核心组件

| 组件 | 路径 | 功能 |
|------|------|------|
| MainLayout | `components/MainLayout.tsx` | 顶部导航栏 + 搜索框 + 通知图标 + 用户下拉菜单 |
| RequireAuth | `router.tsx` | 路由守卫 (登录验证 + 管理员验证) |

### 4.4 数据层

| 文件 | 职责 |
|------|------|
| [stores/auth.ts](web/src/stores/auth.ts) | Zustand 状态管理 — 认证信息持久化 (localStorage) |
| [services/api.ts](web/src/services/api.ts) | Axios 实例 + 请求/响应拦截器 (Token 注入 + 自动刷新) |

**API 客户端模块**: authApi, userApi, boardApi, postApi, commentApi, likeApi, followApi, collectionApi, notificationApi, draftApi, searchApi, adminApi

---

## 5. 配置与依赖

### 5.1 后端依赖 (api/package.json)

| 依赖 | 用途 |
|------|------|
| @nestjs/common/core/config | NestJS 核心 |
| @nestjs/jwt/passport | JWT 认证 |
| @nestjs/typeorm | TypeORM 集成 |
| @nestjs/platform-express | Express 平台 |
| typeorm + sqlite3 | 数据库 ORM + 开发数据库 |
| bcrypt | 密码哈希 |
| class-validator/transformer | 请求验证/转换 |
| passport/passport-jwt | 认证策略 |
| multer | 文件上传 |

### 5.2 前端依赖 (web/package.json)

| 依赖 | 用途 |
|------|------|
| react 19 + react-dom 19 | UI 框架 |
| react-router-dom 7 | 路由 |
| antd 6 + @ant-design/icons | UI 组件库 |
| axios | HTTP 客户端 |
| zustand | 状态管理 |
| @uiw/react-md-editor | Markdown 编辑器 |
| react-markdown + rehype-raw + remark-gfm | Markdown 渲染 |
| react-syntax-highlighter | 代码语法高亮 |

### 5.3 构建配置

| 文件 | 内容 |
|------|------|
| [web/vite.config.ts](web/vite.config.ts) | Vite 构建配置 |
| [web/tsconfig.json](web/tsconfig.json) | TypeScript 配置 |
| [web/tsconfig.app.json](web/tsconfig.app.json) | 应用 TS 配置 |
| [web/tsconfig.node.json](web/tsconfig.node.json) | Node 环境 TS 配置 |
| [web/eslint.config.js](web/eslint.config.js) | ESLint 配置 |
| [api/tsconfig.json](api/tsconfig.json) | NestJS TypeScript 配置 |
| [api/nest-cli.json](api/nest-cli.json) | NestJS CLI 配置 |
| [api/.prettierrc](api/.prettierrc) | Prettier 配置 |
| [api/eslint.config.mjs](api/eslint.config.mjs) | ESLint 配置 |

---

## 6. API 接口清单

### 认证 /api/auth

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /auth/login | 否 | 学号密码登录 |
| POST | /auth/refresh | 否 | 刷新令牌 |
| POST | /auth/logout | 是 | 登出 |
| POST | /auth/change-password | 是 | 修改密码 |

### 用户 /api/users

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /users/me | 是 | 当前用户信息 |
| PATCH | /users/me | 是 | 更新个人信息 |
| GET | /users/:id/profile | 是 | 用户主页 |
| GET | /users/me/stats | 是 | 学习数据统计 |

### 板块 /api/boards

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /boards | 是 | 板块列表 |
| GET | /boards/:id | 是 | 板块详情 |
| POST | /boards | 是 | 创建板块 |
| PATCH | /boards/:id | 是 | 更新板块 |
| DELETE | /boards/:id | 是 | 删除板块 |

### 帖子 /api/posts

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /posts | 是 | 帖子列表 (分页/筛选/排序) |
| GET | /posts/:id | 是 | 帖子详情 |
| POST | /posts | 是 | 发布帖子 |
| PATCH | /posts/:id | 是 | 更新帖子 |
| DELETE | /posts/:id | 是 | 删除帖子 |
| POST | /posts/upload | 是 | 上传图片 |

### 评论 /api/comments

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /comments | 是 | 评论列表 |
| POST | /comments | 是 | 发表评论 |
| DELETE | /comments/:id | 是 | 删除评论 |

### 点赞 /api/likes

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /likes/:targetType/:targetId | 是 | 点赞 |
| DELETE | /likes/:targetType/:targetId | 是 | 取消点赞 |
| GET | /likes/status/:targetType/:targetId | 是 | 点赞状态 |
| GET | /likes/my | 是 | 我的点赞列表 |

### 收藏 /api/collections

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /collections | 是 | 收藏夹列表 |
| POST | /collections | 是 | 创建收藏夹 |
| PATCH | /collections/:id | 是 | 更新收藏夹 |
| DELETE | /collections/:id | 是 | 删除收藏夹 |
| POST | /collections/:id/items | 是 | 添加内容 |
| DELETE | /collections/:id/items/:itemId | 是 | 移除内容 |
| GET | /collections/status/:postId | 是 | 收藏状态 |

### 关注 /api/follows

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /follows/:targetType/:targetId | 是 | 关注 |
| DELETE | /follows/:targetType/:targetId | 是 | 取消关注 |
| GET | /follows/status/:targetType/:targetId | 是 | 关注状态 |
| GET | /follows/my/followings | 是 | 关注列表 |
| GET | /follows/my/followers | 是 | 粉丝列表 |
| GET | /follows/counts/:userId | 是 | 关注计数 |

### 通知 /api/notifications

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /notifications | 是 | 通知列表 |
| POST | /notifications/:id/read | 是 | 标记已读 |
| POST | /notifications/read-all | 是 | 全部已读 |
| DELETE | /notifications/:id | 是 | 删除通知 |

### 草稿 /api/drafts

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /drafts | 是 | 草稿列表 |
| GET | /drafts/:id | 是 | 草稿详情 |
| POST | /drafts | 是 | 创建草稿 |
| PATCH | /drafts/:id | 是 | 更新草稿 |
| DELETE | /drafts/:id | 是 | 删除草稿 |
| POST | /drafts/:id/publish | 是 | 发布草稿 |

### 搜索 /api/search

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /search | 是 | 搜索文章 |
| GET | /search/users | 是 | 搜索用户 |
| GET | /search/suggestions | 是 | 搜索建议 |
| GET | /search/trending | 是 | 热门搜索 |

### 管理后台 /api/admin

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /admin/users | 管理员 | 用户列表 |
| POST | /admin/users | 管理员 | 添加用户 |
| PATCH | /admin/users/:id/status | 管理员 | 修改用户状态 |
| PATCH | /admin/users/:id/role | 管理员 | 修改用户角色 |
| POST | /admin/users/:id/reset-password | 管理员 | 重置密码 |

---

## 7. 数据模型

### 实体关系

```
User 1──N Post        (authorId)
User 1──N Comment     (authorId)
User 1──N Like        (userId)
User 1──N Collection  (userId)
User 1──N Follow      (followerId)
User 1──N Notification (userId)
User 1──N Draft       (userId)
Post  1──N Comment    (postId)
Post  1──N Like       (targetId + targetType='post')
Post  N──N Collection (via CollectionItem)
Board 1──N Post       (boardId)
```

### 核心实体字段摘要

| 实体 | 关键字段 | 关系 |
|------|----------|------|
| User | studentNo, username, passwordHash, role, status, isFirstLogin | — |
| Board | name, description, icon, sortOrder, isVisible | — |
| Post | title, content, type, status, view/like/comment/collectCount, isTop, isEssence | →User, →Board |
| Comment | content, likeCount, status | →Post, →User, ↻self(parentId) |
| Like | targetId, targetType | →User, 多态(post/comment) |
| Collection | name, description, isPublic | →User |
| CollectionItem | — | →Collection, →Post |
| Follow | targetId, targetType | →User, 多态(user/board/tag) |
| Notification | type, title, content, data(JSON), isRead | →User |
| Draft | title, content, tags(JSON), autoSavedAt | →User |

---

## 8. 开发指南

### 启动开发环境

```bash
# 1. 启动后端
cd api
npm install
npm run start:dev        # http://localhost:3000

# 2. 启动前端 (新终端)
cd web
npm install
npm run dev              # http://localhost:5173
```

### 运行测试

```bash
# 后端测试
cd api
npm run test             # 单元测试
npm run test:cov         # 覆盖率
npm run test:e2e         # E2E 测试

# 前端测试
cd web
npm run test
```

### 代码规范

- **后端**: NestJS 模块化架构 (Controller/Service/Entity/Module)
- **前端**: React 函数组件 + Hooks, Zustand 状态管理
- **命名**: camelCase (变量/函数), PascalCase (组件/类/实体)
- **数据库**: TypeORM 实体 + SQLite (开发) / PostgreSQL (生产)

### 添加新模块

1. `api/src/modules/<name>/` 下创建 entity/service/controller/module
2. 在 `app.module.ts` 中注册新模块
3. `web/src/services/api.ts` 中添加 API 调用
4. `web/src/pages/` 下创建页面组件
5. 在 `web/src/router.tsx` 中注册路由

---

## 9. 参考文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品需求 | [.claude/specs/yuanquanzi/requirements.md](.claude/specs/yuanquanzi/requirements.md) | 完整的需求文档 (EARS 格式) |
| 系统设计 | [.claude/specs/yuanquanzi/design.md](.claude/specs/yuanquanzi/design.md) | 架构设计、数据模型、API 设计 |
| 实施计划 | [.claude/specs/yuanquanzi/tasks.md](.claude/specs/yuanquanzi/tasks.md) | 分阶段任务清单 (12 阶段) |
| 代码指南 | [.claude/skills/code-guidelines/SKILL.md](.claude/skills/code-guidelines/SKILL.md) | 编码规范和质量标准 |
| 项目配置 | [CLAUDE.md](CLAUDE.md) | 项目级 CLAUDE 配置 |

---

*生成日期: 2026-04-22 | 自动生成 by `/sc:index`*
