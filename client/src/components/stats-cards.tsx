import { Card, CardContent } from "@/components/ui/card";
import { Database, ArrowUpDown, Users, Gauge } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalVariables: number;
    totalValues: number;
    apiRequestsToday: number;
    activeUsers: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Variables",
      value: stats.totalVariables,
      change: "+12%",
      icon: Database,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "API Requests",
      value: stats.apiRequestsToday,
      change: "+8%",
      icon: ArrowUpDown,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      change: "Currently online",
      icon: Users,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "Rate Limit",
      value: "78%",
      change: "of daily limit used",
      icon: Gauge,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {typeof card.value === 'number' ? card.value : card.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              {card.change.startsWith('+') ? (
                <span className="text-green-600">{card.change}</span>
              ) : (
                <span className="text-slate-600">{card.change}</span>
              )}
              {card.change.includes('%') && (
                <span className="text-slate-600 ml-2">from last month</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
