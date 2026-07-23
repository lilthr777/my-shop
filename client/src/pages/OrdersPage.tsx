import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, Input, Select, Space, Table, Tag, Typography, Modal, Button, Empty, Descriptions, Toast } from '@douyinfe/semi-ui'
import { getOrders, getOrder, updateOrderStatus, type OrderListItem, type OrderDetail } from '../api/orders'

const { Text } = Typography

const asTypeMap: Record<string, string> = { refund: '仅退款', return: '退货退款', exchange: '换货' }
const asStatusMap: Record<string, string> = { wait_audit: '待审核', wait_return: '待买家退货', wait_receive: '待商家收货', done: '已完成', reject: '已拒绝' }

const statusMap: Record<string, { text: string; color: string; badge: 'success' | 'primary' | 'warning' | 'danger' }> = {
  wait_pay: { text: '待付款', color: 'orange', badge: 'warning' },
  wait_ship: { text: '待发货', color: 'blue', badge: 'primary' },
  wait_receive: { text: '待收货', color: 'blue', badge: 'primary' },
  done: { text: '已完成', color: 'green', badge: 'success' },
  closed: { text: '已关闭', color: 'grey', badge: 'danger' },
}

export default function OrdersPage() {
  const [data, setData] = useState<OrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<OrderDetail | null>(null)

  const fetchData = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 10 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await getOrders(params)
      setData(res.list); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData(page) }, [page, statusFilter])
  useEffect(() => { setPage(1); fetchData(1) }, [search])

  const handleViewDetail = async (id: number) => { try { const d = await getOrder(id); setDetail(d) } catch { Toast.error('加载订单详情失败') } }
  const handleStatusChange = async (id: number, status: string) => { try { await updateOrderStatus(id, status); fetchData(page); Toast.success('状态已更新') } catch { Toast.error('状态更新失败') } }

  const columns = useMemo(() => [
    { title: '订单号', dataIndex: 'orderNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: '客户', dataIndex: 'customerName' },
    { title: '金额', dataIndex: 'payAmount', render: (v: number) => `¥ ${(v / 100).toFixed(2)}` },
    { title: '状态', dataIndex: 'status', render: (v: string) => { const s = statusMap[v] || { text: v, color: 'grey', badge: 'primary' as const }; return <Space><Badge type={s.badge} /><Tag color={s.color as 'orange' | 'blue' | 'green' | 'grey'}>{s.text}</Tag></Space> } },
    { title: '渠道', dataIndex: 'channel' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '操作', dataIndex: 'operate', render: (_: any, record: OrderListItem) => (
      <Space>
        <Button size="small" onClick={() => handleViewDetail(record.id)}>详情</Button>
        <Select size="small" value={record.status} style={{ width: 96 }} onChange={(v) => handleStatusChange(record.id, v as string)}>
          {Object.entries(statusMap).map(([k, item]) => <Select.Option key={k} value={k}>{item.text}</Select.Option>)}
        </Select>
      </Space>
    )},
  ], [page])

  return (
    <Card className="content-card" title="订单管理">
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索订单号/客户名" value={search} onChange={setSearch} style={{ width: 220 }} showClear />
        <Select placeholder="状态筛选" value={statusFilter || undefined} onChange={(v) => { setStatusFilter(v as string); setPage(1) }} style={{ width: 140 }} showClear>
          {Object.entries(statusMap).map(([k, item]) => <Select.Option key={k} value={k}>{item.text}</Select.Option>)}
        </Select>
      </Space>
      <Table columns={columns} dataSource={data} pagination={{ currentPage: page, total, pageSize: 10, onChange: (p) => setPage(p) }} loading={loading} rowKey="id" empty={<Empty title="暂无订单" description={search || statusFilter ? '试试调整筛选条件' : '还没有订单记录'} />} />
      <Modal title={`订单详情 - ${detail?.orderNo || ''}`} visible={!!detail} onCancel={() => setDetail(null)} footer={null} width={680}>
        {detail && (
          <div>
            <Descriptions
              data={[
                { key: '客户', value: `${detail.customerName} · ${detail.customerPhone}` },
                { key: '地址', value: detail.address },
                { key: '支付金额', value: `¥ ${(detail.payAmount / 100).toFixed(2)}` },
                { key: '渠道', value: detail.channel },
                { key: '创建时间', value: detail.createdAt },
              ]}
            />
            <div style={{ marginTop: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>商品明细</Text>
              {detail.items.map((item) => (
                <div key={item.id} style={{ padding: '10px 12px', marginBottom: 8, background: 'var(--semi-color-fill-0)', borderRadius: 6 }}>
                  <Space spacing={8}>
                    <Text strong>{item.productTitle}</Text>
                    <Text type="secondary">{item.specText}</Text>
                    <Text>x{item.quantity}</Text>
                    <Text style={{ marginLeft: 'auto' }}>¥ {(item.unitPrice / 100).toFixed(2)}</Text>
                  </Space>
                </div>
              ))}
            </div>
            {detail.afterSales.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>关联售后单</Text>
                {detail.afterSales.map((as) => (
                  <Tag key={as.id} style={{ marginRight: 8 }}>{asTypeMap[as.type] || as.type} · {asStatusMap[as.status] || as.status}</Tag>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  )
}
