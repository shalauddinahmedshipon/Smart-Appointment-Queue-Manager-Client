// app/dashboard/page.tsx
"use client";

import { useGetDashboardStatsQuery } from "@/store/api/dashboard.api";
import { useGetActivityLogsQuery } from "@/store/api/activity-log.api"; // assuming this exists
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, CheckCircle, Clock, AlertCircle, Users } from "lucide-react";
import StatCard from "@/components/modules/dashboard/state-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery();

  const {
    data: logs = [],
    isLoading: logsLoading,
    error: logsError,
  } = useGetActivityLogsQuery({ limit: 5 });

  const router =useRouter();

  if (statsLoading || logsLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (statsError || logsError) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }

  const {
    todayTotal = 0,
    completedToday = 0,
    pendingToday = 0,
    waitingQueue = 0,
    staffLoad = [],
  } = stats || {};

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={todayTotal}
          icon={Calendar}
          description="Total scheduled today"
        />

        <StatCard
          title="Completed Today"
          value={completedToday}
          icon={CheckCircle}
          variant="success"
          description="Successfully finished"
        />

        <StatCard
          title="Pending Today"
          value={pendingToday}
          icon={Clock}
          variant="warning"
          description="Still to be completed"
        />

        <StatCard
          title="Waiting Queue"
          value={waitingQueue}
          icon={AlertCircle}
          variant="destructive"
          description="Unassigned appointments"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Staff Load Summary */}
    <Card>
  <CardHeader>
    <CardTitle>Staff Load Today</CardTitle>
    <CardDescription>Current daily appointment capacity usage</CardDescription>
  </CardHeader>
  
  <CardContent className="space-y-6">
    {staffLoad.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">
        No staff members found
      </p>
    ) : (
      <div className="space-y-4">
        {staffLoad.slice(0, 5).map((staff) => (
          <div
            key={staff.name}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-3 text-xs">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{staff.name}</span>
            </div>
            <Badge
              variant={staff.status === "OK" ? "secondary" : "destructive"}
              className="text-xs"
            >
              {staff.load} {staff.status}
            </Badge>
          </div>
        ))}
      </div>
    )}

    {/* Always show the button when there is data */}
    {staffLoad.length > 0 && (
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/dashboard/staff")}
      >
        View All Staff →
      </Button>
    )}
  </CardContent>
</Card>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in the system (last 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <ul className="space-y-4">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.createdAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


