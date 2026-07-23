import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, Space, Tag, Typography } from '@douyinfe/semi-ui'
import ReactECharts from 'echarts-for-react'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import { useShopStore } from '../store/shopStore'
import IconNoteMoneyStroked from '@douyinfe/semi-icons/lib/es/icons/IconNoteMoneyStroked'
import IconShoppingBagStroked from '@douyinfe/semi-icons/lib/es/icons/IconShoppingBagStroked'
import IconCoinMoneyStroked from '@douyinfe/semi-icons/lib/es/icons/IconCoinMoneyStroked'
import IconHelpCircleStroked from '@douyinfe/semi-icons/lib/es/icons/IconHelpCircleStroked'
import {
  getDashboardStats,
  getOrderStatus,
  getChannelRanking,
  getRecentOrders,
  getGmvTrend,
  getCategorySales,
  type DashboardStats,
  type OrderStatusItem,
  type ChannelRankingItem,
  type GmvTrendItem,
  type CategorySalesItem,
} from '../api/dashboard'
import type { RecentOrderItem } from '../types'

const { Text } = Typography

const statusBadgeMap: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
  wait_pay: 'warning', wait_ship: 'primary', wait_receive: 'primary', done: 'success', closed: 'danger',
}

const SEMI_PRIMARY = '#3370ff'
const SEMI_COLORS = ['#3370ff', '#2ba471', '#f58a1f', '#d72c2c', '#8b8fa3', '#00b4d8']

export default function DashboardPage() {
  const darkMode = useShopStore((s) => s.darkMode)
  const axisLabelColor = darkMode ? '#999' : '#8b8fa3'
  const splitLineColor = darkMode ? '#2a2a2a' : '#f2f3f5'
  const axisLineColor = darkMode ? '#333' : '#e5e6eb'

  const [stats, setStats] = useState<DashboardStats>({ todayGmv: 0, orderCount: 0, avgOrderAmount: 0, pendingAfterSales: 0 })
  const [orderStatus, setOrderStatus] = useState<OrderStatusItem[]>([])
  const [channelRanking, setChannelRanking] = useState<ChannelRankingItem[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([])
  const [gmvTrend, setGmvTrend] = useState<GmvTrendItem[]>([])
  const [categorySales, setCategorySales] = useState<CategorySalesItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDashboardStats(),
      getOrderStatus(),
      getChannelRanking(),
      getRecentOrders(),
      getGmvTrend(),
      getCategorySales(),
    ]).then(([s, os, cr, ro, gt, cs]) => {
      setStats(s); setOrderStatus(os); setChannelRanking(cr); setRecentOrders(ro)
      setGmvTrend(gt); setCategorySales(cs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const topOrders = useMemo(() => recentOrders.slice(0, 3), [recentOrders])

  const gmvChartOption = useMemo(() => ({
    grid: { top: 20, right: 24, bottom: 24, left: 60 },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const val = p?.value ?? 0
        return `${p?.axisValue ?? ''}<br/>GMV: ¥ ${(val / 100).toLocaleString('zh-CN')}`
      },
    },
    xAxis: {
      type: 'category' as const,
      data: gmvTrend.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: axisLabelColor },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: axisLabelColor, formatter: (v: number) => `¥${(v / 1000000).toFixed(0)}万` },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [{
      type: 'line',
      data: gmvTrend.map((d) => d.amount),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: SEMI_PRIMARY, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(51,112,255,0.15)' }, { offset: 1, color: 'rgba(51,112,255,0.02)' }] } },
      itemStyle: { color: SEMI_PRIMARY },
    }],
  }), [gmvTrend, darkMode, axisLabelColor, splitLineColor, axisLineColor])

  const pieChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: any) => `${params.name}: ¥ ${(params.value / 100).toLocaleString('zh-CN')} (${params.percent}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: axisLabelColor, fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data: categorySales.map((d) => ({ name: d.category, value: d.amount })),
    }],
    color: SEMI_COLORS,
  }), [categorySales, darkMode])

  const barChartOption = useMemo(() => ({
    grid: { top: 8, right: 24, bottom: 24, left: 60 },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p?.name ?? ''}<br/>GMV: ¥ ${((p?.value ?? 0) / 100).toLocaleString('zh-CN')}`
      },
    },
    xAxis: {
      type: 'value' as const,
      axisLabel: { color: axisLabelColor, formatter: (v: number) => `¥${(v / 1000000).toFixed(0)}万` },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: 'category' as const,
      data: channelRanking.map((d) => d.channel),
      inverse: true,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: axisLabelColor },
    },
    series: [{
      type: 'bar',
      data: channelRanking.map((d) => d.amount),
      barWidth: 18,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#3370ff' }, { offset: 1, color: '#85a5ff' }] },
      },
    }],
  }), [channelRanking, darkMode, axisLabelColor, splitLineColor, axisLineColor])

  return (
    <div className="dashboard-grid">
      <StatCard icon={<IconNoteMoneyStroked style={{ color: 'var(--semi-color-primary)' }} />} label="今日成交额" value={`¥ ${(stats.todayGmv / 100).toLocaleString('zh-CN')}`} trend={`订单总量 ${stats.orderCount}`} />
      <StatCard icon={<IconShoppingBagStroked style={{ color: 'var(--semi-color-success)' }} />} label="订单总量" value={String(stats.orderCount)} trend={`客单价 ¥ ${(stats.avgOrderAmount / 100).toFixed(2)}`} />
      <StatCard icon={<IconCoinMoneyStroked style={{ color: 'var(--semi-color-warning)' }} />} label="客单价" value={`¥ ${(stats.avgOrderAmount / 100).toFixed(2)}`} trend={`${stats.orderCount} 笔订单`} />
      <StatCard icon={<IconHelpCircleStroked style={{ color: 'var(--semi-color-danger)' }} />} label="待处理售后" value={String(stats.pendingAfterSales)} trend="需及时处理" />

      <ChartCard title="近 7 天 GMV 趋势" loading={loading} style={{ gridColumn: 'span 4' }}>
        <ReactECharts option={gmvChartOption} style={{ height: 300 }} notMerge />
      </ChartCard>

      <ChartCard title="类目销售额分布" loading={loading} style={{ gridColumn: 'span 2' }}>
        <ReactECharts option={pieChartOption} style={{ height: 300 }} notMerge />
      </ChartCard>

      <ChartCard title="渠道销售对比" loading={loading} style={{ gridColumn: 'span 2' }}>
        <ReactECharts option={barChartOption} style={{ height: 300 }} notMerge />
      </ChartCard>

      <Card className="content-card dashboard-section" title="订单状态分布">
        <div className="status-grid">
          {orderStatus.map((item) => (
            <div className="status-item" key={item.status}>
              <Space spacing={8}>
                <Badge type={statusBadgeMap[item.status] || 'primary'} />
                <Text strong>{item.text}</Text>
              </Space>
              <div className="status-count">{item.count}</div>
              <Text type="secondary">占比 {item.percent}%</Text>
            </div>
          ))}
        </div>
      </Card>

      <Card className="content-card dashboard-wide" title="近期高价值订单">
        <div className="top-order-list">
          {topOrders.map((order) => (
            <div className="top-order-item" key={order.order_no}>
              <div>
                <Text strong>{order.order_no}</Text>
                <Text type="secondary">{order.customer_name} · {order.channel}</Text>
              </div>
              <Tag color={order.status === 'done' ? 'green' : order.status === 'closed' ? 'grey' : 'blue'}>{order.status === 'done' ? '已完成' : order.status === 'closed' ? '已关闭' : '处理中'}</Tag>
              <Text strong>¥ {(order.pay_amount / 100).toFixed(2)}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
