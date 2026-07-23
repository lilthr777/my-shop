import { Card, Skeleton } from '@douyinfe/semi-ui'

type ChartCardProps = {
  title: string
  loading?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function ChartCard({ title, loading, children, style }: ChartCardProps) {
  return (
    <Card className="content-card" title={title} style={style}>
      <Skeleton placeholder={<div style={{ height: 300, background: 'var(--semi-color-fill-0)', borderRadius: 6 }} />} loading={!!loading}>
        {children}
      </Skeleton>
    </Card>
  )
}
