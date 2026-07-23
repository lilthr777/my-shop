import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', '..', 'data', 'shop.db')

let db: SqlJsDatabase

export interface SqlJsDatabase {
  run(sql: string, params?: any[]): void
  get<T = any>(sql: string, params?: any[]): T | undefined
  all<T = any>(sql: string, params?: any[]): T[]
  exec(sql: string): void
  save(): void
}

function createWrapper(sqlDb: any): SqlJsDatabase {
  function bind(stmt: any, params?: any[]) {
    if (!params) return
    stmt.bind(params.map((p) => (p === null || p === undefined ? null : String(p))))
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function doSave() {
    if (saveTimer) return
    saveTimer = setTimeout(() => {
      saveTimer = null
      const dir = dirname(DB_PATH)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(DB_PATH, Buffer.from(sqlDb.export()))
    }, 300)
  }

  return {
    run(sql: string, params?: any[]) {
      sqlDb.run(sql, params)
      doSave()
    },

    get<T = any>(sql: string, params?: any[]): T | undefined {
      const stmt = sqlDb.prepare(sql)
      bind(stmt, params)
      if (stmt.step()) {
        const cols = stmt.getColumnNames()
        const vals = stmt.get()
        stmt.free()
        const row: any = {}
        cols.forEach((c: string, i: number) => { row[c] = vals[i] })
        return row as T
      }
      stmt.free()
      return undefined
    },

    all<T = any>(sql: string, params?: any[]): T[] {
      const results: T[] = []
      const stmt = sqlDb.prepare(sql)
      bind(stmt, params)
      while (stmt.step()) {
        const cols = stmt.getColumnNames()
        const vals = stmt.get()
        const row: any = {}
        cols.forEach((c: string, i: number) => { row[c] = vals[i] })
        results.push(row as T)
      }
      stmt.free()
      return results
    },

    exec(sql: string) {
      const stmts = sql.split(';').filter((s) => s.trim())
      for (const stmt of stmts) {
        sqlDb.run(stmt + ';')
      }
      doSave()
    },

    save() {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
      doSave()
    },
  }
}

export async function initDB(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs()

  let sqlDb: any
  if (existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(readFileSync(DB_PATH))
  } else {
    sqlDb = new SQL.Database()
  }

  db = createWrapper(sqlDb)

  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL,
      shop_id TEXT NOT NULL UNIQUE,
      avatar TEXT,
      dsr_score REAL DEFAULT 5.0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER REFERENCES shops(id),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      level INTEGER NOT NULL,
      qualification_required INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER REFERENCES shops(id),
      spu_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      category_id INTEGER REFERENCES categories(id),
      brand_id INTEGER REFERENCES brands(id),
      cover_url TEXT,
      images TEXT,
      detail_html TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      audit_reason TEXT,
      freight_template TEXT,
      delivery_promise TEXT,
      after_sale TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spec_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      name TEXT NOT NULL,
      spec_values TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      sku_code TEXT NOT NULL,
      spec_combo TEXT NOT NULL,
      price INTEGER NOT NULL,
      market_price INTEGER,
      stock INTEGER DEFAULT 0,
      sale_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'on'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      total_orders INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      last_order_at TEXT,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      shop_id INTEGER REFERENCES shops(id),
      customer_id INTEGER REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      total_amount INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      freight_amount INTEGER DEFAULT 0,
      pay_amount INTEGER NOT NULL DEFAULT 0,
      pay_time TEXT,
      status TEXT NOT NULL DEFAULT 'wait_pay',
      channel TEXT NOT NULL,
      buyer_words TEXT,
      seller_words TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) NOT NULL,
      sku_id INTEGER REFERENCES product_skus(id),
      spu_id INTEGER REFERENCES products(id),
      sku_code TEXT NOT NULL,
      product_title TEXT NOT NULL,
      spec_text TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      after_sale_no TEXT NOT NULL UNIQUE,
      order_id INTEGER REFERENCES orders(id) NOT NULL,
      order_item_id INTEGER REFERENCES order_items(id),
      type TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_urls TEXT,
      refund_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'wait_audit',
      reject_reason TEXT,
      logistics_no TEXT,
      created_at TEXT NOT NULL
    );
  `)

  console.log('[db] 数据库初始化完成')
  return db
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('数据库未初始化，请先调用 initDB()')
  return db
}
