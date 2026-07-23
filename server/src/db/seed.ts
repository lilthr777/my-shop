import { getDb } from './index.js'
import { createHash } from 'node:crypto'

function hashPassword(pwd: string): string {
  return createHash('sha256').update(pwd).digest('hex')
}

function dateStr(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const now = dateStr(0, 12, 0)

export function seedIfEmpty(): void {
  const db = getDb()
  const existing = db.get('SELECT id FROM products LIMIT 1')
  if (existing) {
    console.log('[db] 数据库已有数据，跳过 seed')
    return
  }

  console.log('[db] 开始写入种子数据...')

  // ==================== 店铺 ====================
  db.run(`INSERT INTO shops (shop_name, shop_id, avatar, dsr_score, created_at) VALUES (?, ?, ?, ?, ?)`,
    ['潮品优选旗舰店', 'SHOP-35628888', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200', 4.82, '2026-06-01T00:00:00.000Z'])

  // ==================== 用户 ====================
  db.run(`INSERT INTO users (shop_id, username, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'admin', hashPassword('admin123'), 'admin', '', now])
  db.run(`INSERT INTO users (shop_id, username, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'operator', hashPassword('op123'), 'operator', '', now])
  db.run(`INSERT INTO users (shop_id, username, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'cs', hashPassword('cs123'), 'cs', '', now])

  // ==================== 类目 ====================
  const cats: [number, string, number | null, number][] = [
    [1, '服饰鞋包', null, 1], [2, '家居日用', null, 1], [3, '数码配件', null, 1], [4, '运动户外', null, 1],
    [5, '男鞋', 1, 2], [6, '女鞋', 1, 2], [7, '双肩包/单肩包', 1, 2], [8, '水杯/保温杯', 2, 2],
    [9, '手机壳/保护套', 3, 2], [10, '运动鞋', 4, 2],
    [11, '运动鞋', 5, 3], [12, '休闲鞋', 5, 3], [13, '商务鞋', 5, 3],
    [14, '保温杯', 8, 3], [15, '玻璃杯', 8, 3], [16, '运动背包', 7, 3],
    [17, '跑步鞋', 10, 3], [18, '篮球鞋', 10, 3],
  ]
  cats.forEach((c) => db.run(`INSERT INTO categories (id, name, parent_id, level, qualification_required, created_at) VALUES (?, ?, ?, ?, 0, ?)`, [...c, now]))

  // ==================== 品牌 ====================
  const brands = ['Nike', 'Adidas', '安踏', '小米', '无品牌', '李宁']
  brands.forEach((b) => db.run(`INSERT INTO brands (name, logo_url, status, created_at) VALUES (?, '', 'approved', ?)`, [b, now]))

  // ==================== 商品 ====================
  const productInsert = (spuId: string, title: string, subtitle: string, catId: number, brandId: number, coverUrl: string, status: string, freight: string, delivery: string, afterSale: string, createdAt: string) => {
    db.run(`INSERT INTO products (shop_id, spu_id, title, subtitle, category_id, brand_id, cover_url, images, detail_html, status, freight_template, delivery_promise, after_sale, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, '[]', '', ?, ?, ?, ?, ?, ?)`,
      [spuId, title, subtitle, catId, brandId, coverUrl, status, freight, delivery, afterSale, createdAt, createdAt])
  }
  const addSpecs = (pid: number, specs: [string, string[]][]) => {
    specs.forEach((s) => db.run(`INSERT INTO spec_templates (product_id, name, spec_values) VALUES (?, ?, ?)`, [pid, s[0], JSON.stringify(s[1])]))
  }
  const addSkus = (pid: number, specs: [string, string[]][], basePrice: number, marketPrice: number, baseStock: number) => {
    const [s1, s2] = specs
    let idx = pid * 100
    s1[1].forEach((v1, i) => {
      (s2 ? s2[1] : ['']).forEach((v2, j) => {
        idx++
        const combo = s2 ? { [s1[0]]: v1, [s2[0]]: v2 } : { [s1[0]]: v1 }
        db.run(`INSERT INTO product_skus (product_id, sku_code, spec_combo, price, market_price, stock, sale_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'on')`,
          [pid, `SKU-${idx}`, JSON.stringify(combo), basePrice, marketPrice, baseStock + Math.floor(Math.random() * 100), Math.floor(Math.random() * 40)])
      })
    })
  }

  // 商品1：运动鞋 (on_sale)
  productInsert('SPU-3562888821092345', '春夏新款轻量运动鞋', '轻量缓震，适合通勤跑步日常训练', 11, 3, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'on_sale', '全国包邮', '48 小时内发货', '7 天无理由退换', dateStr(30))
  addSpecs(1, [['颜色', ['深灰', '米白', '松石绿']], ['尺码', ['39', '40', '41', '42', '43']]])
  addSkus(1, [['颜色', ['深灰', '米白', '松石绿']], ['尺码', ['39', '40', '41', '42', '43']]], 56800, 69900, 200)

  // 商品2：双肩包 (on_sale)
  productInsert('SPU-3562888821092346', '通勤双肩包', '大容量防水，都市通勤首选', 16, 5, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62', 'on_sale', '全国包邮', '24 小时内发货', '7 天无理由退换', dateStr(25))
  addSpecs(2, [['颜色', ['卡其色', '黑色', '海军蓝']], ['容量', ['12L', '24L', '32L']]])
  addSkus(2, [['颜色', ['卡其色', '黑色', '海军蓝']], ['容量', ['12L', '24L', '32L']]], 129900, 159900, 80)

  // 商品3：保温杯 (on_sale)
  productInsert('SPU-3562888821092347', '陶瓷保温杯', '304不锈钢内胆，长效保温12小时', 14, 4, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8', 'on_sale', '满 99 包邮', '48 小时内发货', '15 天无理由退换', dateStr(20))
  addSpecs(3, [['颜色', ['奶油白', '抹茶绿', '曜石黑']], ['容量', ['350ml', '500ml', '750ml']]])
  addSkus(3, [['颜色', ['奶油白', '抹茶绿', '曜石黑']], ['容量', ['350ml', '500ml', '750ml']]], 8650, 12900, 300)

  // 商品4：手机壳 (on_sale)
  productInsert('SPU-3562888821092348', 'MagSafe 磁吸手机壳', '液态硅胶，手感丝滑，全系列适配', 9, 5, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb', 'on_sale', '全国包邮', '24 小时内发货', '7 天无理由退换', dateStr(15))
  addSpecs(4, [['颜色', ['曜石黑', '海盐蓝', '奶油白', '抹茶绿']], ['型号', ['iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16 Pro']]])
  addSkus(4, [['颜色', ['曜石黑', '海盐蓝', '奶油白', '抹茶绿']], ['型号', ['iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16 Pro']]], 3900, 5900, 500)

  // 商品5：篮球鞋 (audit_pending)
  productInsert('SPU-3562888821092349', '飞电3.0竞速篮球鞋', '碳板助弹，透气飞织鞋面', 18, 6, 'https://images.unsplash.com/photo-1579338559194-a162d19bf842', 'audit_pending', '全国包邮', '48 小时内发货', '7 天无理由退换', dateStr(3))
  addSpecs(5, [['颜色', ['曜石黑', '荧光绿', '海盐蓝']], ['尺码', ['39', '40', '41', '42', '43', '44']]])
  addSkus(5, [['颜色', ['曜石黑', '荧光绿', '海盐蓝']], ['尺码', ['39', '40', '41', '42', '43', '44']]], 89900, 109900, 150)

  // 商品6：运动水壶 (draft)
  productInsert('SPU-3562888821092350', 'Tritan 运动水壶', 'BPA-free，750ml大容量，一键弹盖', 15, 5, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8', 'draft', '全国包邮', '48 小时内发货', '7 天无理由退换', dateStr(1))
  addSpecs(6, [['颜色', ['松石绿', '海盐蓝', '曜石黑']]])
  addSkus(6, [['颜色', ['松石绿', '海盐蓝', '曜石黑']], ['默认', ['标准']]], 4900, 7900, 400)

  // ==================== 客户 ====================
  const custData: [string, string, number, number, string, string, string][] = [
    ['张三', '138****6789', 5, 312450, dateStr(1), 'VIP 客户', dateStr(50)],
    ['李四', '139****1234', 4, 286900, dateStr(2), '', dateStr(48)],
    ['王五', '186****4567', 5, 195400, dateStr(3), '', dateStr(45)],
    ['赵六', '152****8901', 3, 124800, dateStr(4), '', dateStr(40)],
    ['孙七', '177****2345', 4, 428600, dateStr(5), '大客户', dateStr(38)],
    ['周八', '133****7890', 2, 234500, dateStr(1), '', dateStr(35)],
    ['吴九', '159****3456', 2, 89200, dateStr(2), '', dateStr(30)],
    ['郑十', '188****0123', 2, 385900, dateStr(3), '', dateStr(28)],
    ['冯十一', '136****5678', 1, 18900, dateStr(6), '', dateStr(25)],
    ['陈十二', '158****9012', 3, 498700, dateStr(1), '企业客户', dateStr(22)],
    ['钱十三', '185****3344', 1, 56800, dateStr(0, 9, 30), '', dateStr(15)],
    ['蒋十四', '137****7788', 2, 145600, dateStr(1), '', dateStr(12)],
    ['沈十五', '150****9900', 1, 3900, dateStr(2), '', dateStr(8)],
    ['韩十六', '182****1122', 1, 8650, dateStr(0, 14, 0), '', dateStr(5)],
    ['杨十七', '176****6655', 3, 267800, dateStr(1, 16, 30), '', dateStr(3)],
  ]
  custData.forEach((c) => db.run(`INSERT INTO customers (name, phone, total_orders, total_spent, last_order_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, c))

  // ==================== 订单（跨30天，确保近7天有数据） ====================
  const channels = ['直播', '短视频', '搜索', '店铺首页', '推荐']
  const statuses = ['done', 'done', 'done', 'wait_receive', 'wait_ship', 'wait_pay', 'closed'] // weighted
  const addresses = [
    ['张三', '138****6789', '浙江省杭州市西湖区'],
    ['李四', '139****1234', '上海市浦东新区'],
    ['王五', '186****4567', '广东省深圳市南山区'],
    ['赵六', '152****8901', '江苏省南京市鼓楼区'],
    ['孙七', '177****2345', '北京市朝阳区'],
    ['周八', '133****7890', '四川省成都市武侯区'],
    ['吴九', '159****3456', '湖北省武汉市洪山区'],
    ['郑十', '188****0123', '湖南省长沙市岳麓区'],
    ['冯十一', '136****5678', '重庆市渝北区'],
    ['陈十二', '158****9012', '福建省厦门市思明区'],
    ['钱十三', '185****3344', '山东省青岛市市南区'],
    ['蒋十四', '137****7788', '陕西省西安市雁塔区'],
    ['沈十五', '150****9900', '河南省郑州市金水区'],
    ['韩十六', '182****1122', '天津市和平区'],
    ['杨十七', '176****6655', '安徽省合肥市蜀山区'],
  ]

  const orderTemplates: [number, number, number, string][] = [
    // [productId, unitPrice, quantity, channel]
    [1, 56800, 1, '直播'], [1, 56800, 2, '短视频'], [2, 129900, 1, '搜索'],
    [2, 26800, 1, '店铺首页'], [3, 8650, 2, '推荐'], [3, 8650, 1, '直播'],
    [4, 3900, 3, '短视频'], [4, 3900, 1, '搜索'], [1, 219800, 1, '直播'],
    [2, 128000, 1, '短视频'], [3, 32500, 1, '店铺首页'], [4, 3900, 5, '推荐'],
    [1, 56800, 1, '搜索'], [2, 129900, 1, '直播'], [3, 8650, 1, '短视频'],
    [4, 3900, 2, '店铺首页'], [1, 75600, 1, '推荐'], [2, 159900, 1, '搜索'],
    [3, 7200, 1, '直播'], [4, 3900, 1, '短视频'], [1, 349900, 1, '搜索'],
    [2, 26800, 3, '店铺首页'], [3, 8650, 2, '推荐'], [4, 3900, 4, '直播'],
    [1, 56800, 1, '短视频'], [2, 129900, 1, '搜索'], [3, 45600, 1, '店铺首页'],
    [4, 3900, 2, '直播'], [1, 159900, 1, '短视频'], [2, 18900, 1, '推荐'],
    [3, 8650, 1, '搜索'], [4, 3900, 3, '店铺首页'],
  ]

  const productTitles = ['春夏新款轻量运动鞋', '通勤双肩包', '陶瓷保温杯', 'MagSafe 磁吸手机壳']
  const orderItems: [number, number, number, string, string, string, number, number, string][] = []

  for (let i = 0; i < orderTemplates.length; i++) {
    const [pid, unitPrice, qty, channel] = orderTemplates[i]
    const [custName, custPhone, addr] = addresses[i % addresses.length]
    const daysAgo = i < 12 ? Math.floor(i * 2.5) : Math.floor(Math.random() * 7) // newest 12 span 30 days evenly, rest in last week
    const status = i < 12 ? statuses[i % statuses.length] : (Math.random() > 0.3 ? 'done' : statuses[Math.floor(Math.random() * 4)])
    const orderNo = `MS${dateStr(daysAgo, 0, 0).slice(0, 10).replace(/-/g, '')}${(i + 1).toString().padStart(3, '0')}`
    const totalAmount = unitPrice * qty
    const title = productTitles[pid - 1] || '未知商品'

    db.run(`INSERT INTO orders (order_no, customer_id, customer_name, customer_phone, address, total_amount, pay_amount, pay_time, status, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, (i % 15) + 1, custName, custPhone, addr, totalAmount, totalAmount, dateStr(daysAgo, 10, 30), status, channel, dateStr(daysAgo, 10, 30)])

    orderItems.push([i + 1, pid * 100 + 1, pid, `SKU-${pid * 100 + 1}`, title, pid === 1 ? '颜色: 深灰 / 尺码: 39' : pid === 2 ? '颜色: 卡其色 / 容量: 24L' : pid === 3 ? '颜色: 奶油白 / 容量: 500ml' : '颜色: 曜石黑 / 型号: iPhone 15 Pro', qty, unitPrice, dateStr(daysAgo, 10, 30)])
  }

  // ==================== 订单商品明细 ====================
  orderItems.forEach((oi) => db.run(`INSERT INTO order_items (order_id, sku_id, spu_id, sku_code, product_title, spec_text, quantity, unit_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, oi))

  // ==================== 售后单 ====================
  const asData: [string, number, number, string, string, number, string, string | null, string][] = [
    ['AS20260715001', 4, 4, 'return', '尺码偏大，需要换小一码', 56800, 'done', null, dateStr(8)],
    ['AS20260718002', 10, 10, 'refund', '背包拉链损坏，质量有问题', 26800, 'wait_audit', null, dateStr(4)],
    ['AS20260719003', 9, 9, 'refund', '不想要了', 349900, 'reject', '商品已拆封使用，不符合七天无理由退货条件', dateStr(3)],
    ['AS20260720004', 16, 16, 'exchange', '颜色发错了，收到的不是曜石黑', 3900, 'wait_return', null, dateStr(2)],
    ['AS20260721005', 22, 22, 'refund', '七天无理由退货', 26800, 'wait_receive', null, dateStr(1)],
    ['AS20260722006', 14, 14, 'return', '商品与描述不符', 56800, 'wait_audit', null, dateStr(0, 9, 0)],
  ]
  asData.forEach((a) => {
    const [no, oid, oiid, type, reason, amount, status, rejectReason, createdAt] = a
    db.run(`INSERT INTO after_sales (after_sale_no, order_id, order_item_id, type, reason, refund_amount, status, ${rejectReason ? 'reject_reason,' : ''} created_at) VALUES (?, ?, ?, ?, ?, ?, ?${rejectReason ? ', ?' : ''}, ?)`,
      rejectReason ? [no, oid, oiid, type, reason, amount, status, rejectReason, createdAt] : [no, oid, oiid, type, reason, amount, status, createdAt])
  })

  // 更新客户统计
  db.run(`UPDATE customers SET total_orders = (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.rowid), total_spent = (SELECT COALESCE(SUM(pay_amount), 0) FROM orders WHERE orders.customer_id = customers.rowid)`)

  console.log('[db] 种子数据写入完成 (6商品, 15客户, 32订单, 6售后单)')
}
