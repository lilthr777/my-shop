import { Card, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

type StatCardProps = {
  label: string
  value: string
  trend: string
  icon?: React.ReactNode
}

export default function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="overview-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {icon}
        <Text type="tertiary">{label}</Text>
      </div>
      <div className="overview-value">{value}</div>
      <Text type="secondary">{trend}</Text>
    </Card>
  )
}
