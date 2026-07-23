import { useEffect } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { Avatar, Button, Layout, Nav, Space, Typography } from '@douyinfe/semi-ui'
import type { MenuKey } from '../types'
import { useShopStore } from '../store/shopStore'
import { getMe } from '../api/auth'
import IconHomeStroked from '@douyinfe/semi-icons/lib/es/icons/IconHomeStroked'
import IconShoppingBagStroked from '@douyinfe/semi-icons/lib/es/icons/IconShoppingBagStroked'
import IconGridStroked from '@douyinfe/semi-icons/lib/es/icons/IconGridStroked'
import IconShieldStroked from '@douyinfe/semi-icons/lib/es/icons/IconShieldStroked'
import IconUserListStroked from '@douyinfe/semi-icons/lib/es/icons/IconUserListStroked'
import IconPlus from '@douyinfe/semi-icons/lib/es/icons/IconPlus'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import ProductListPage from '../pages/ProductListPage'
import ProductEditPage from '../pages/ProductEditPage'
import CustomerPage from '../pages/CustomerPage'
import AfterSalesPage from '../pages/AfterSalesPage'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const menuLabels: Record<MenuKey, string> = {
  dashboard: '首页概览',
  orders: '订单管理',
  products: '商品管理',
  afterSales: '售后管理',
  customers: '客户管理',
}

const menuIcons: Record<MenuKey, React.ReactNode> = {
  dashboard: <IconHomeStroked />,
  orders: <IconShoppingBagStroked />,
  products: <IconGridStroked />,
  afterSales: <IconShieldStroked />,
  customers: <IconUserListStroked />,
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useShopStore((s) => s.token)
  const currentUser = useShopStore((s) => s.currentUser)
  const setAuth = useShopStore((s) => s.setAuth)
  const setActiveMenu = useShopStore((s) => s.setActiveMenu)
  const darkMode = useShopStore((s) => s.darkMode)
  const toggleDarkMode = useShopStore((s) => s.toggleDarkMode)

  useEffect(() => {
    document.body.setAttribute('theme-mode', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (token && !currentUser) {
      getMe().then((user) => setAuth({ token: token!, user })).catch(() => {})
    }
  }, [token, currentUser, setAuth])

  const currentMenu: MenuKey = (() => {
    if (location.pathname.startsWith('/products')) return 'products'
    if (location.pathname.startsWith('/orders')) return 'orders'
    if (location.pathname.startsWith('/after-sales')) return 'afterSales'
    if (location.pathname.startsWith('/customers')) return 'customers'
    return 'dashboard'
  })()

  return (
    <Layout className="admin-layout">
      <Sider className="admin-sider">
        <div className="brand">
          <div className="brand-logo">M</div>
          <div>
            <div className="brand-name">my-shop</div>
            <Text type="tertiary" size="small">电商后台管理系统</Text>
          </div>
        </div>
        <Nav
          className="admin-nav"
          selectedKeys={[currentMenu]}
          onClick={(data) => {
            const key = data.itemKey as MenuKey
            setActiveMenu(key)
            if (key === 'dashboard') navigate('/dashboard')
            else if (key === 'orders') navigate('/orders')
            else if (key === 'products') navigate('/products')
            else if (key === 'afterSales') navigate('/after-sales')
            else if (key === 'customers') navigate('/customers')
          }}
          items={[
            { itemKey: 'dashboard', text: '首页概览', icon: menuIcons.dashboard },
            { itemKey: 'orders', text: '订单管理', icon: menuIcons.orders },
            { itemKey: 'products', text: '商品管理', icon: menuIcons.products },
            { itemKey: 'afterSales', text: '售后管理', icon: menuIcons.afterSales },
            { itemKey: 'customers', text: '客户管理', icon: menuIcons.customers },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <div>
            <Title heading={4}>{menuLabels[currentMenu]}</Title>
          </div>
          <Space>
            <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => navigate('/products/new')}>
              发布商品
            </Button>
            <Button theme="borderless" onClick={toggleDarkMode} style={{ fontSize: 18 }}>
              {darkMode ? '☀️' : '🌙'}
            </Button>
            <Avatar color="light-blue" size="small">MS</Avatar>
          </Space>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductEditPage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/after-sales" element={<AfterSalesPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
