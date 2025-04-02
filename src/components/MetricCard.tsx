
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export const MetricCard = ({ title, value, className }: MetricCardProps) => {
  return (
    <div className={cn("metric-card", className)}>
      <span className="metric-title">{title}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
};

export const StatCard = ({ title, value, className }: MetricCardProps) => {
  return (
    <div className={cn("stat-card", className)}>
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
};
