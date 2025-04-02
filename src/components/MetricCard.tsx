
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  title: string;
  value: string | number;
  className?: string;
  status?: "good" | "average" | "poor";
}

export const MetricCard = ({ title, value, className, status }: MetricCardProps) => {
  return (
    <div className={cn(
      "bg-white p-4 rounded-lg border shadow-sm",
      status === "good" && "border-l-4 border-l-emerald-500",
      status === "average" && "border-l-4 border-l-amber-500",
      status === "poor" && "border-l-4 border-l-red-500",
      className
    )}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {status && (
          <Badge variant={
            status === "good" ? "default" : 
            status === "average" ? "outline" : "destructive"
          }>
            {status === "good" ? "Good" : status === "average" ? "Average" : "Poor"}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export const StatCard = ({ title, value, className }: MetricCardProps) => {
  return (
    <div className={cn("bg-white p-4 rounded-lg border shadow-sm", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};
