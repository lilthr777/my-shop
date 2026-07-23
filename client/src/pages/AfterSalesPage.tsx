import { useEffect, useMemo, useState } from 'react'
import { Card, Select, Table, Tag, Typography, Button, Modal, TextArea, Toast, Space, Empty } from '@douyinfe/semi-ui'
import {
  getAfterSales,
  approveAfterSale,
  rejectAfterSale,
  confirmReceiveAfterSale,
  type AfterSaleListItem,
} from '../api/afterSales'

const { Text } = Typography

const typeMap: Record<string, string> = { refund: '仅退款', return: '退货退款', exchange: '换货' }
const statusMap: Record<string, { text: string; color: string }> = {
  wait_audit: { text: '待审核', color: 'orange' },
  wait_return: { text: '待买家退货', color: 'blue' },
  wait_receive: { text: '待商家收货', color: 'blue' },
  done: { text: '已完成', color: 'green' },
  reject: { text: '已拒绝', color: 'red' },
}

export default function AfterSalesPage() {
  const [data, setData] = useState<AfterSaleListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ id: number; reason: string } | null>(null)
  const [detailModal, setDetailModal] = useState<AfterSaleListItem | null>(null)

  const fetchData = async (p: number, s: string) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 10 }
      if (s) params.status = s
      const res = await getAfterSales(params)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(page, statusFilter) }, [page, statusFilter])

  const columns = useMemo(() => [
    { title: '售后单号', dataIndex: 'afterSaleNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: '关联订单', dataIndex: 'orderNo' },
    { title: '售后类型', dataIndex: 'type', render: (v: string) => <Tag>{typeMap[v] || v}</Tag> },
    { title: '原因', dataIndex: 'reason' },
    { title: '退款金额', dataIndex: 'refundAmount', render: (v: number) => `¥ ${(v / 100).toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={(statusMap[v]?.color as 'orange' | 'blue' | 'green' | 'red')}>{statusMap[v]?.text || v}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: '操作', dataIndex: 'operate',
      render: (_: any, record: AfterSaleListItem) => (
        <Space>
          {record.status === 'wait_audit' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>同意</Button>
              <Button size="small" type="danger" onClick={() => setRejectModal({ id: record.id, reason: '' })}>拒绝</Button>
            </>
          )}
          {(record.status === 'wait_return' || record.status === 'wait_receive') && (
            <Button size="small" type="primary" onClick={() => handleConfirm(record.id)}>确认收货</Button>
          )}
          <Button size="small" theme="borderless" onClick={() => setDetailModal(record)}>详情</Button>
        </Space>
      ),
    },
  ], [])

  const handleApprove = async (id: number) => {
    try {
      await approveAfterSale(id)
      Toast.success('已同意')
      fetchData(page, statusFilter)
    } catch { Toast.error('操作失败，请重试') }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      await rejectAfterSale(rejectModal.id, rejectModal.reason)
      Toast.success('已拒绝')
      setRejectModal(null)
      fetchData(page, statusFilter)
    } catch { Toast.error('操作失败，请重试') }
  }

  const handleConfirm = async (id: number) => {
    try {
      await confirmReceiveAfterSale(id)
      Toast.success('已确认收货')
      fetchData(page, statusFilter)
    } catch { Toast.error('操作失败，请重试') }
  }

  return (
    <Card className="content-card" title="售后管理">
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(v) => { setStatusFilter(v as string); setPage(1) }}
          style={{ width: 160 }}
          showClear
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.text}</Select.Option>
          ))}
        </Select>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ currentPage: page, total, pageSize: 10, onChange: (p) => setPage(p) }}
        loading={loading}
        rowKey="id"
        empty={<Empty title="暂无售后单" description={statusFilter ? '试试切换状态筛选' : '还没有售后记录'} />}
      />
      <Modal
        title="售后单详情"
        visible={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={520}
      >
        {detailModal && (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <div><Text type="secondary">售后单号</Text><br /><Text strong>{detailModal.afterSaleNo}</Text></div>
            <div><Text type="secondary">关联订单</Text><br /><Text>{detailModal.orderNo}</Text></div>
            <div><Text type="secondary">售后类型</Text><br /><Tag>{typeMap[detailModal.type] || detailModal.type}</Tag></div>
            <div><Text type="secondary">售后原因</Text><br /><Text>{detailModal.reason}</Text></div>
            <div><Text type="secondary">退款金额</Text><br /><Text strong>¥ {(detailModal.refundAmount / 100).toFixed(2)}</Text></div>
            <div><Text type="secondary">当前状态</Text><br /><Tag color={(statusMap[detailModal.status]?.color as 'orange' | 'blue' | 'green' | 'red')}>{statusMap[detailModal.status]?.text || detailModal.status}</Tag></div>
            <div><Text type="secondary">创建时间</Text><br /><Text>{detailModal.createdAt}</Text></div>
          </Space>
        )}
      </Modal>

      <Modal
        title="拒绝售后"
        visible={!!rejectModal}
        onOk={handleReject}
        onCancel={() => setRejectModal(null)}
        okText="确认拒绝"
      >
        <TextArea
          placeholder="请输入拒绝原因"
          value={rejectModal?.reason || ''}
          onChange={(v) => setRejectModal((prev) => prev ? { ...prev, reason: v } : null)}
        />
      </Modal>
    </Card>
  )
}
