import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Select, Table, Tag, Button, Toast, Space, Popconfirm, Typography, Empty } from '@douyinfe/semi-ui'
import { getProducts, submitAudit, shelfProduct, deleteProduct, type ProductListItem } from '../api/products'

const { Text } = Typography

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'blue' },
  audit_pending: { text: '审核中', color: 'orange' },
  audit_reject: { text: '审核驳回', color: 'red' },
  on_sale: { text: '已上架', color: 'green' },
  off_shelf: { text: '已下架', color: 'grey' },
}

export default function ProductListPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<ProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 10 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await getProducts(params)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(page) }, [page, statusFilter])
  useEffect(() => { setPage(1); fetchData(1) }, [search])

  const handleAudit = async (id: number) => {
    await submitAudit(id)
    Toast.success('已提交审核，审核结果将在2秒后模拟返回')
    setTimeout(() => fetchData(page), 3000)
  }

  const handleShelf = async (id: number, action: 'on' | 'off') => {
    await shelfProduct(id, action)
    Toast.success(action === 'on' ? '已上架' : '已下架')
    fetchData(page)
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    Toast.success('已删除')
    fetchData(page)
  }

  const columns = useMemo(() => [
    { title: '商品ID', dataIndex: 'spuId', render: (v: string) => <Text strong>{v}</Text> },
    { title: '商品标题', dataIndex: 'title' },
    { title: '类目', dataIndex: 'categoryName' },
    { title: '品牌', dataIndex: 'brandName' },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string, record: ProductListItem) => (
        <Space>
          <Tag color={(statusMap[v]?.color as 'blue' | 'orange' | 'red' | 'green' | 'grey')}>{statusMap[v]?.text || v}</Tag>
          {v === 'audit_reject' && record.auditReason && <Text type="danger" size="small">{record.auditReason}</Text>}
        </Space>
      ),
    },
    { title: '价格', dataIndex: 'price', render: (v: number) => `¥ ${(v / 100).toFixed(2)}` },
    { title: '库存', dataIndex: 'stock' },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: '操作', dataIndex: 'operate',
      render: (_: any, record: ProductListItem) => (
        <Space>
          {(record.status === 'draft' || record.status === 'audit_reject') && (
            <>
              <Button size="small" onClick={() => navigate(`/products/${record.id}/edit`)}>编辑</Button>
              <Button size="small" type="primary" onClick={() => handleAudit(record.id)}>提交审核</Button>
              <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
                <Button size="small" type="danger">删除</Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'on_sale' && (
            <Button size="small" onClick={() => handleShelf(record.id, 'off')}>下架</Button>
          )}
          {record.status === 'off_shelf' && (
            <Button size="small" type="primary" onClick={() => handleShelf(record.id, 'on')}>上架</Button>
          )}
        </Space>
      ),
    },
  ], [page])

  return (
    <Card className="content-card" title="商品管理">
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索商品标题" value={search} onChange={setSearch} style={{ width: 220 }} showClear />
        <Select placeholder="状态筛选" value={statusFilter || undefined} onChange={(v) => { setStatusFilter(v as string); setPage(1) }} style={{ width: 140 }} showClear>
          {Object.entries(statusMap).map(([k, v]) => <Select.Option key={k} value={k}>{v.text}</Select.Option>)}
        </Select>
        <Button theme="solid" type="primary" onClick={() => navigate('/products/new')}>发布商品</Button>
      </Space>
      <Table columns={columns} dataSource={data} pagination={{ currentPage: page, total, pageSize: 10, onChange: (p) => setPage(p) }} loading={loading} rowKey="id" empty={<Empty title="暂无商品" description={search || statusFilter ? '试试调整筛选条件' : '点击"发布商品"开始'} />} />
    </Card>
  )
}
