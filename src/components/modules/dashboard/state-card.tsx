import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  description,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "destructive";
  description?: string;
}) {
  const baseClasses = "rounded-xl border shadow-sm";

  const variantStyles = {
    default: "bg-card text-card-foreground",
    success: "bg-green-50/80 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    warning: "bg-yellow-50/80 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
    destructive: "bg-red-50/80 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  }[variant];

  return (
    <Card className={`${baseClasses} ${variantStyles}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground opacity-80" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}