import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { cn } from "@/lib/utils"

const DEFAULT_DATA = [
  { month: "Jan", value: 65 },
  { month: "Feb", value: 85 },
  { month: "Mar", value: 55 },
  { month: "Apr", value: 75 },
  { month: "May", value: 50 },
  { month: "Jun", value: 65 },
  { month: "Jul", value: 85 },
  { month: "Aug", value: 55 },
]

export function SubscriptionCard({ data, title = "Portfolio Activity", stat = "+2,350", change = "+80.1% from last month", className }) {
  const chartData = (data && data.length) ? data : DEFAULT_DATA
  const barColor = "var(--accent-primary)"

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)', fontSize: '28px' }}>
            {stat}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
            {change}
          </p>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}
              />
              <Bar
                dataKey="value"
                fill={barColor}
                radius={[3, 3, 0, 0]}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubscriptionCard
