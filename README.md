# my-shop — 电商后台管理系统

基于 React + TypeScript + Vite 的全栈电商后台管理系统，对齐抖店业务模型（SPU/SKU、商品审核、售后流程）。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite 8 + Semi Design 2.97 + Zustand 5 + React Router 7 |
| 后端 | Express + sql.js (SQLite) + JWT + Zod |
| 数据库 | SQLite（零配置，clone 即跑） |

### Semi Design 组件使用

项目使用 21 个 Semi Design 组件覆盖 B 端典型场景：

| 类别 | 组件 |
|------|------|
| 数据展示 | `Table` `Card` `Tag` `Badge` `Typography` `Descriptions` `Empty` |
| 表单 | `Form` `Input` `InputNumber` `Select` `TextArea` |
| 反馈 | `Toast` `Modal` `Popconfirm` `Skeleton` |
| 导航/布局 | `Layout` `Nav` `Space` `Button` `Avatar` |

## 快速启动

```bash
git clone <repo-url>
cd my-shop

# 安装依赖
npm install
cd client && npm install
cd ../server && npm install
cd ..

# 一键启动前后端
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000

首次启动自动建表并写入种子数据。

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 运营 | operator | op123 |
| 客服 | cs | cs123 |

## 功能模块

- **首页看板** — GMV、订单状态分布、渠道排行、高价值订单，骨架屏加载态
- **商品管理** — SPU/SKU 模型，五步表单（基本信息→价格库存→素材→物流售后→规格），发布→审核→上架全流程，表单必填校验
- **订单管理** — 订单列表/详情、状态流转（待付款→待发货→待收货→已完成→已关闭）、多维度筛选，`Descriptions` 结构化详情展示
- **售后管理** — 仅退款/退货退款/换货，审核流程（同意/拒绝），拒绝原因弹窗
- **客户管理** — 客户列表、消费统计、点击查看历史订单详情弹窗

## 架构亮点

- **类型安全**: TypeScript 严格模式，泛型接口定义 `OrderRow`/`ProductDraft`/`CustomerRow` 等业务实体，API 层全类型化
- **精准渲染**: Zustand Selector 切片机制，组件级独立订阅 store 字段，避免不必要 re-render
- **计算缓存**: `useMemo` 缓存 Table 列配置、首页看板聚合数据、SKU 规格组合预览
- **表单设计**: 商品编辑五段式卡片表单，`renderField` 抽取字段渲染逻辑，发布前完整性校验
- **错误处理**: API 异常统一拦截（401 自动跳登录），操作级 try/catch + Toast 反馈全覆盖

## 项目结构

```
my-shop/
├── client/                 # 前端
│   └── src/
│       ├── api/            # API 请求层（7 个模块）
│       │   ├── client.ts   #   fetch 封装 + JWT 拦截
│       │   ├── auth.ts     #   登录/用户信息
│       │   ├── dashboard.ts#   看板统计
│       │   ├── products.ts #   商品 CRUD + 审核/上下架
│       │   ├── orders.ts   #   订单列表/详情/状态变更
│       │   ├── afterSales.ts#  售后审核流程
│       │   ├── customers.ts#   客户查询/订单历史
│       │   ├── categories.ts#  类目查询
│       │   └── brands.ts   #   品牌查询
│       ├── components/     # 公共组件
│       │   ├── AppLayout.tsx#  侧边栏 + 顶栏布局
│       │   └── StatCard.tsx#   看板统计卡片
│       ├── pages/          # 6 个功能页面
│       │   ├── DashboardPage.tsx
│       │   ├── ProductListPage.tsx
│       │   ├── ProductEditPage.tsx
│       │   ├── OrdersPage.tsx
│       │   ├── AfterSalesPage.tsx
│       │   ├── CustomerPage.tsx
│       │   └── LoginPage.tsx
│       ├── store/          # Zustand 状态管理
│       │   └── shopStore.ts
│       └── types/          # 前端类型定义
│           └── index.ts
├── server/                 # 后端
│   └── src/
│       ├── routes/         # API 路由
│       ├── db/             # 数据库（schema + seed）
│       └── middleware/     # JWT 认证
├── shared/                 # 前后端共享类型
└── .mcp.json               # Semi Design MCP 服务器配置
```
