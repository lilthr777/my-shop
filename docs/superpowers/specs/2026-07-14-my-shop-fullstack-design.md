# my-shop 全栈重构设计文档

> 日期: 2026-07-14
> 状态: 设计完成，待评审

## 一、背景与目标

my-shop 当前是一个纯前端电商后台管理系统原型，数据全部硬编码在 Zustand store 中。本次重构将其升级为全栈项目：

- **后端**：Node.js + Express + TypeScript，SQLite + Drizzle ORM
- **前端**：保留 React 18 + TypeScript + Vite + Semi Design + Zustand，数据改为从 API 获取
- **启动**：`npm run dev` 一键同时启动前后端，clone 即跑
- **目标场景**：GitHub 仓库 + 面试时本地共享屏幕演示

## 二、架构概览

采用方案 B：单体仓库、controller/service 分层。

```
my-shop/
├── client/          # 前端（Vite + React 18 + Semi Design + Zustand）
├── server/          # 后端（Express + Drizzle + SQLite）
│   ├── routes/      # 路由层
│   ├── services/    # 业务逻辑层
│   ├── db/          # schema + seed + 连接
│   └── middleware/  # auth 中间件
├── shared/          # 前后端共享类型
└── package.json     # concurrently 启动
```

### 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端框架 | React 18 + TypeScript | 简历一致，降级自 React 19 |
| 构建 | Vite | 简历一致 |
| UI | Semi Design (`@douyinfe/semi-ui`) | 简历一致 |
| 状态管理 | Zustand | 简历一致，selector 精准订阅 |
| 后端框架 | Express | 轻量，Node.js 标准 |
| ORM | Drizzle | TypeScript-first |
| 数据库 | SQLite (better-sqlite3) | 零配置，clone 即跑 |
| 认证 | JWT | 无状态 |
| 校验 | Zod | 请求体校验 + 类型推导 |
| 启动 | concurrently | 一条命令前后端同时起 |

## 三、数据库设计（10 张表）

### 3.1 表结构

#### shops — 店铺信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| shop_name | text | 店铺名称 |
| shop_id | text | 抖音店铺 ID |
| avatar | text | 店铺头像 URL |
| dsr_score | real | 商家体验分（0-5.0） |
| created_at | text | |

#### users — 后台子账号

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| shop_id | integer FK→shops | |
| username | text | 登录名 |
| password_hash | text | bcrypt |
| role | text | admin / operator / warehouse / cs |
| avatar_url | text | |
| created_at | text | |

#### categories — 商品类目（三级树）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| name | text | 类目名 |
| parent_id | integer | 自引用，null=一级 |
| level | integer | 1/2/3，只有 3 级可挂商品 |
| qualification_required | integer | 0/1 |
| created_at | text | |

#### brands — 品牌库

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| name | text | 品牌名 |
| logo_url | text | |
| status | text | approved / pending |
| created_at | text | |

#### products — SPU（商品主表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| shop_id | integer FK→shops | |
| spu_id | text | 商品 ID |
| title | text | 商品标题 |
| subtitle | text | 卖点短文案 |
| category_id | integer FK→categories | 叶子类目 |
| brand_id | integer FK→brands | 可空 |
| cover_url | text | 主图 |
| images | text | 图集 JSON 数组 |
| detail_html | text | 商品详情富文本 |
| status | text | draft / audit_pending / audit_reject / on_sale / off_shelf |
| audit_reason | text | 审核驳回原因（可空） |
| created_at | text | |
| updated_at | text | |

#### spec_templates — 规格模板

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| product_id | integer FK→products | |
| name | text | 规格名 |
| values | text | JSON 数组 |

#### product_skus — SKU

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| product_id | integer FK→products | |
| sku_code | text | SKU 编码 |
| spec_combo | text | 规格组合 JSON |
| price | integer | 销售价（分） |
| market_price | integer | 划线价（分） |
| stock | integer | 库存 |
| sale_count | integer | 已售件数 |
| status | text | on / off |

> 价格用**分**存储，避免浮点精度问题。前端展示时除以 100。

#### orders — 订单

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| order_no | text | 订单号 |
| shop_id | integer FK→shops | |
| customer_id | integer FK→customers | |
| customer_name | text | 买家昵称 |
| customer_phone | text | 脱敏手机号 |
| address | text | 收货地址 JSON |
| total_amount | integer | 商品总价（分） |
| discount_amount | integer | 优惠金额（分） |
| freight_amount | integer | 运费（分） |
| pay_amount | integer | 实付金额（分） |
| pay_time | text | 支付时间 |
| status | text | wait_pay / wait_ship / wait_receive / done / closed |
| channel | text | live / video / search / shop_home / recommend |
| buyer_words | text | 买家留言 |
| seller_words | text | 卖家备注 |
| created_at | text | |

#### order_items — 订单明细快照

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| order_id | integer FK→orders | |
| sku_id | integer FK→product_skus | |
| spu_id | integer FK→products | |
| sku_code | text | |
| product_title | text | 下单时商品标题（快照） |
| spec_text | text | 规格快照 |
| quantity | integer | 数量 |
| unit_price | integer | 单价（分） |
| created_at | text | |

#### after_sales — 售后单

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK | |
| after_sale_no | text | 售后单号 |
| order_id | integer FK→orders | |
| order_item_id | integer FK→order_items | |
| type | text | refund / return / exchange |
| reason | text | 原因 |
| evidence_urls | text | 凭证图片 JSON |
| refund_amount | integer | 退款金额（分） |
| status | text | wait_audit / wait_return / wait_receive / done / reject |
| reject_reason | text | 拒绝原因 |
| logistics_no | text | 买家寄回物流单号 |
| created_at | text | |

### 3.2 ER 关系

```
shops ──┬── users
        ├── products ──┬── spec_templates
        │              └── product_skus
        ├── orders ──┬── order_items
        │            └── after_sales
        └── customers

categories ── products
brands ── products
```

## 四、API 设计（31 个接口）

前缀 `/api/v1`，返回格式 `{ code: 0, data: ... }` / `{ code: 非0, msg: "..." }`。

### 4.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 登录，返回 JWT token |
| POST | /api/v1/auth/logout | 登出 |
| GET | /api/v1/auth/me | 当前用户信息 |

### 4.2 首页概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/dashboard/stats | 今日 GMV、订单数、客单价、待处理售后 |
| GET | /api/v1/dashboard/order-status | 订单状态分布 |
| GET | /api/v1/dashboard/channel-ranking | 渠道销售排行 |
| GET | /api/v1/dashboard/recent-orders | 近期高价值订单 TOP N |

### 4.3 商品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/products | 商品列表（分页+搜索+筛选） |
| GET | /api/v1/products/:id | 商品详情（含 SKU+规格） |
| POST | /api/v1/products | 创建商品（草稿） |
| PUT | /api/v1/products/:id | 编辑商品 |
| POST | /api/v1/products/:id/submit-audit | 提交审核 |
| POST | /api/v1/products/:id/shelf | 上架/下架 |
| DELETE | /api/v1/products/:id | 删除（仅草稿） |

### 4.4 类目 & 品牌

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/categories | 类目树 |
| GET | /api/v1/categories/:id/children | 子类目 |
| GET | /api/v1/brands | 品牌列表 |
| POST | /api/v1/brands | 新增品牌 |

### 4.5 订单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/orders | 订单列表（分页+搜索+筛选+时间范围） |
| GET | /api/v1/orders/:id | 订单详情（含明细+售后记录） |
| PUT | /api/v1/orders/:id/status | 修改状态 |
| PUT | /api/v1/orders/:id/note | 修改卖家备注 |

### 4.6 售后管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/after-sales | 售后单列表 |
| GET | /api/v1/after-sales/:id | 售后详情 |
| POST | /api/v1/after-sales/:id/approve | 同意 |
| POST | /api/v1/after-sales/:id/reject | 拒绝（需原因） |
| POST | /api/v1/after-sales/:id/confirm-receive | 确认收到退货 |

### 4.7 客户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/customers | 客户列表（分页+搜索） |
| GET | /api/v1/customers/:id | 客户详情 |
| GET | /api/v1/customers/:id/orders | 客户历史订单 |
| POST | /api/v1/customers/:id/note | 修改备注 |

## 五、前端改造

### 5.1 页面变化

| 原页面 | 改造后 | 变化程度 |
|--------|--------|----------|
| — | LoginPage | 新增：简单登录表单 |
| DashboardPage | DashboardPage | 数据从 API 获取，useMemo 聚合逻辑保留 |
| — | ProductListPage | 新增：商品列表（分页+筛选+状态管理） |
| ProductPublishPage | ProductEditPage | 复杂表单保留，新增保存+提交审核，类目从 API 加载 |
| — | AfterSalesPage | 新增：售后管理表格页 |
| OrdersPage | OrdersPage + 详情弹窗 | 表格保留，新增详情 Modal |
| CustomerPage | CustomerPage + 详情弹窗 | 表格保留，新增客户详情 |

### 5.2 简历亮点保留

| 简历描述 | 代码对应 |
|----------|----------|
| Semi Design 快速构建复杂表单与表格 | ProductEditPage 表单、OrdersPage/CustomerPage 表格不动 |
| Zustand Selector 组件级精准订阅 | store 结构不变，selector 用法不变 |
| TypeScript 泛型严格定义业务实体 | `types/index.ts` 类型保留，后端 schema 对齐 |
| useMemo 缓存列配置与看板数据 | DashboardPage 聚合 + OrdersPage columns 原样保留 |

### 5.3 导航菜单与路由

```
/login               → LoginPage
/                    → AppLayout（受 auth 保护）
  /dashboard         → DashboardPage
  /products          → ProductListPage（列表）
  /products/new      → ProductEditPage（新建）
  /products/:id/edit → ProductEditPage（编辑）
  /orders            → OrdersPage
  /after-sales       → AfterSalesPage
  /customers         → CustomerPage
```

侧边栏导航保持不变：首页概览、商品管理、订单管理、售后管理、客户管理。

### 5.4 商品发布核心流程

```
新建商品 → 填写草稿 → 保存草稿 → 提交审核
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               审核通过          审核驳回         (审核中)
                    │               │
                    ▼               ▼
                 上架         修改后重新提交
                    │
                    ▼
                 下架
```

## 六、目录结构

```
my-shop/
├── client/
│   ├── src/
│   │   ├── api/                # API 请求封装
│   │   │   ├── client.ts       # fetch 封装（base URL + token）
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── afterSales.ts
│   │   │   └── customers.ts
│   │   ├── components/         # AppLayout, StatCard
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductEditPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── AfterSalesPage.tsx
│   │   │   └── CustomerPage.tsx
│   │   ├── store/              # Zustand
│   │   ├── types/              # 前端类型（含 API 响应类型）
│   │   ├── App.tsx             # 路由配置
│   │   └── main.tsx
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── routes/             # 按模块拆分
│   │   ├── services/           # 业务逻辑
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle 表定义
│   │   │   ├── seed.ts         # 种子数据
│   │   │   └── index.ts        # 连接 + 自动建表
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT 校验
│   │   └── index.ts            # Express 入口
│   └── tsconfig.json
│
├── shared/
│   └── types.ts                # 前后端共享类型
│
├── package.json                # concurrently
└── README.md
```

## 七、待确认 / 风险点

1. **React 版本**：client 需从 React 19 降级到 18，修改 `package.json` 依赖版本
2. **前端路由**：需要引入 `react-router-dom` 实现 Login → 首页的跳转
3. **图片上传**：当前仅有 URL 输入框，本次不引入真实文件上传（保持简洁）
4. **审核流程**：审核为模拟行为——seed 数据时随机通过/驳回

## 八、启动方式

```bash
git clone <repo>
cd my-shop
npm install && cd client && npm install && cd ../server && npm install && cd ..
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:3000
# 数据库自动创建 + 种子数据自动写入
```
