import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Button, Typography, Toast } from '@douyinfe/semi-ui'
import { login } from '../api/auth'
import { useShopStore } from '../store/shopStore'

const { Title, Text } = Typography

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useShopStore((s) => s.setAuth)

  const handleLogin = async () => {
    if (!username || !password) { Toast.error('请输入用户名和密码'); return }
    setLoading(true)
    try {
      const result = await login({ username, password })
      setAuth(result)
      Toast.success('登录成功')
      navigate('/dashboard')
    } catch (err: any) {
      Toast.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title heading={3}>my-shop</Title>
          <Text type="tertiary">电商后台管理系统</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            size="large"
            placeholder="用户名"
            value={username}
            onChange={(v) => setUsername(v)}
            onEnterPress={handleLogin}
          />
          <Input
            size="large"
            placeholder="密码"
            type="password"
            value={password}
            onChange={(v) => setPassword(v)}
            onEnterPress={handleLogin}
          />
          <Button theme="solid" type="primary" size="large" loading={loading} onClick={handleLogin} block>
            登录
          </Button>
          <Text type="tertiary" size="small" style={{ textAlign: 'center' }}>
            测试账号：admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  )
}
