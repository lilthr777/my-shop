import { Card, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

type StatCardProps = {
  label: string
  value: string
  trend: string
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <Card className="overview-card">
      <Text type="tertiary">{label}</Text>
      <div className="overview-value">{value}</div>
      <Text type="secondary">{trend}</Text>
    </Card>
  )
}
