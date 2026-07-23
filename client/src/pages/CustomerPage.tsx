import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Table, Typography, Modal, Tag, Space, Empty, Button } from '@douyinfe/semi-ui'
import { getCustomers, getCustomerOrders } from '../api/customers'
import type { CustomerRow, CustomerDetailData } from '../types'

const statusTextMap: Record<string, string> = {
  wait_pay: '待付款', wait_ship: '待发货', wait_receive: '待收货', done: '已完成', closed: '已关闭',
}

const { Text, Title } = Typography

export default function CustomerPage() {
  const [data, setData] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<CustomerDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 10 }
      if (search) params.search = search
      const res = await getCustomers(params)
      setData(res.list); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData(page) }, [page])
  useEffect(() => { setPage(1); fetchData(1) }, [search])

  const handleViewDetail = async (record: CustomerRow) => {
    setDetailLoading(true)
    setDetail({ customer: record, orders: [] })
    try {
      const orders = await getCustomerOrders(record.id)
      setDetail({ customer: record, orders })
    } catch {
      setDetail({ customer: record, orders: [] })
    } finally {
      setDetailLoading(false)
    }
  }

  const columns = useMemo(() => [
    {
      title: '客户姓名', dataIndex: 'name',
      render: (name: string, record: CustomerRow) => (
        <Text strong style={{ cursor: 'pointer', color: 'var(--semi-color-primary)' }} onClick={() => handleViewDetail(record)}>{name}</Text>
      ),
    },
    { title: '手机号', dataIndex: 'phone' },
    { title: '累计订单', dataIndex: 'orderCount', render: (count: number) => `${count} 单` },
    {
      title: '累计消费', dataIndex: 'totalSpent',
      render: (amount: number) => `¥ ${(amount / 100).toFixed(2)}`,
    },
    { title: '最后下单时间', dataIndex: 'lastOrderAt' },
    {
      title: '操作', dataIndex: 'operate',
      render: (_: any, record: CustomerRow) => (
        <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
      ),
    },
  ], [])

  return (
    <Card className="content-card" title="客户管理">
      <Input placeholder="搜索客户姓名/手机号" value={search} onChange={setSearch} style={{ width: 280, marginBottom: 16 }} showClear />
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ currentPage: page, total, pageSize: 10, onChange: (p) => setPage(p) }}
        loading={loading}
        rowKey="phone"
        empty={<Empty title="暂无客户数据" description={search ? '换个关键词试试' : '还没有客户记录'} />}
      />
      <Modal
        title="客户详情"
        visible={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={640}
      >
        {detail && (
          <div>
            <Space vertical spacing={12} style={{ width: '100%' }}>
              <div>
                <Title heading={5}>{detail.customer.name}</Title>
                <Text type="secondary">手机号：{detail.customer.phone}</Text>
              </div>
              <Space>
                <Tag color="blue">累计 {detail.customer.orderCount} 单</Tag>
                <Tag color="green">消费 ¥ {(detail.customer.totalSpent / 100).toFixed(2)}</Tag>
                <Tag color="grey">最近下单：{detail.customer.lastOrderAt}</Tag>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Title heading={6}>历史订单</Title>
                {detailLoading ? (
                  <Text type="tertiary">加载中...</Text>
                ) : detail.orders.length === 0 ? (
                  <Empty title="暂无订单" />
                ) : (
                  detail.orders.map((order) => (
                    <div key={order.key} style={{ padding: '10px 0', borderBottom: '1px solid var(--semi-color-border)' }}>
                      <Space spacing={16}>
                        <Text strong>{order.orderNo}</Text>
                        <Tag>{statusTextMap[order.status] || order.status}</Tag>
                        <Text type="secondary">¥ {(order.amount / 100).toFixed(2)}</Text>
                        <Text type="tertiary" size="small">{order.createdAt}</Text>
                      </Space>
                    </div>
                  ))
                )}
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </Card>
  )
}
