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
      title: "Global Variables",
      value: stats.totalValues,
      change: "accessible to all",
      icon: Database,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">{card.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                  {typeof card.value === 'number' ? card.value : card.value}
                </p>
              </div>
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center mt-3 lg:mt-4 text-xs lg:text-sm">
              {card.change.startsWith('+') ? (
                <span className="text-green-600">{card.change}</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400">{card.change}</span>
              )}
              {card.change.includes('%') && (
                <span className="text-slate-600 dark:text-slate-400 ml-2">from last month</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
