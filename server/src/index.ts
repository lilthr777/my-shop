import express from 'express'
import cors from 'cors'
import { initDB } from './db/index.js'
import { seedIfEmpty } from './db/seed.js'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { productsRouter } from './routes/products.js'
import { categoriesRouter } from './routes/categories.js'
import { brandsRouter } from './routes/brands.js'
import { ordersRouter } from './routes/orders.js'
import { afterSalesRouter } from './routes/afterSales.js'
import { customersRouter } from './routes/customers.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const PORT = 3000

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// 公开路由
app.use('/api/v1/auth', authRouter)

// 受保护路由
app.use('/api/v1/dashboard', authMiddleware, dashboardRouter)
app.use('/api/v1/products', authMiddleware, productsRouter)
app.use('/api/v1/categories', authMiddleware, categoriesRouter)
app.use('/api/v1/brands', authMiddleware, brandsRouter)
app.use('/api/v1/orders', authMiddleware, ordersRouter)
app.use('/api/v1/after-sales', authMiddleware, afterSalesRouter)
app.use('/api/v1/customers', authMiddleware, customersRouter)

async function main() {
  await initDB()
  seedIfEmpty()

  app.listen(PORT, () => {
    console.log(`[server] running at http://localhost:${PORT}`)
  })
}

main().catch(console.error)
