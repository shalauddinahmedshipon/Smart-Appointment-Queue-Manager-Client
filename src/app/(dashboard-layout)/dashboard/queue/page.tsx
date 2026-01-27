// app/dashboard/queue/page.tsx
"use client";

import { useState } from "react";
import {
  useGetWaitingQueueQuery,
  useAssignFromQueueMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} from "@/store/api/appointment.api";
import { useGetStaffsQuery } from "@/store/api/staff.api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Calendar,
  Clock,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useMemo } from "react";
import { Appointment } from "@/types/appointment.types";

export default function QueuePage() {
  const { data: queue = [], isLoading } = useGetWaitingQueueQuery();
  const { data: staffs = [] } = useGetStaffsQuery();
  const [assignFromQueue, { isLoading: autoAssigning }] = useAssignFromQueueMutation();
  const [updateAppointment, { isLoading: manualAssigning }] = useUpdateAppointmentMutation();
  const [deleteAppointment, { isLoading: deleting }] = useDeleteAppointmentMutation();

  const [manualAssignDialog, setManualAssignDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // Calculate staff capacity
  const staffCapacity = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const capacityMap: Record<
      string,
      { count: number; capacity: number; name: string; type: string }
    > = {};

    staffs.forEach((staff) => {
      capacityMap[staff.id] = {
        count: 0,
        capacity: staff.dailyCapacity,
        name: staff.name,
        type: staff.serviceType,
      };
    });

    return capacityMap;
  }, [staffs]);

  // Get eligible staff for an appointment
  const getEligibleStaff = (appointment: Appointment) => {
    return staffs.filter(
      (staff) =>
        staff.serviceType === appointment.service.requiredStaffType &&
        staff.status === "AVAILABLE"
    );
  };

  const handleAutoAssign = async () => {
    try {
      const result = await assignFromQueue().unwrap();
      
      if (result.assigned > 0) {
        toast.success(
          <div>
            <div className="font-semibold">Auto-assignment completed</div>
            <div className="text-sm text-muted-foreground">
              {result.assigned} appointment(s) assigned
              {result.skipped > 0 && `, ${result.skipped} skipped`}
            </div>
          </div>
        );
      } else {
        toast.info("No appointments could be assigned at this time");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign from queue");
    }
  };

  const handleManualAssign = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedStaffId("");
    setManualAssignDialog(true);
  };

  const confirmManualAssign = async () => {
    if (!selectedAppointment || !selectedStaffId) return;

    try {
      await updateAppointment({
        id: selectedAppointment.id,
        staffId: selectedStaffId,
      }).unwrap();

      const staff = staffs.find((s) => s.id === selectedStaffId);
      toast.success(
        `Appointment for ${selectedAppointment.customerName} assigned to ${staff?.name}`
      );
      setManualAssignDialog(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign staff");
    }
  };

  const handleDelete = (appointment: Appointment) => {
    toast.custom(
      (t: any) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-2">Remove from Queue?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Remove appointment for <strong>{appointment.customerName}</strong> from waiting
            queue?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={async () => {
                toast.dismiss(t.id);
                await toast.promise(deleteAppointment(appointment.id).unwrap(), {
                  loading: "Removing...",
                  success: "Removed from queue",
                  error: "Failed to remove",
                });
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Remove"}
            </Button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const getDurationLabel = (duration: string) => {
    return duration === "MIN_15" ? "15 min" : duration === "MIN_30" ? "30 min" : "60 min";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Waiting Queue</h1>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Queue Overview</CardTitle>
            <CardDescription>Appointments waiting for staff assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiting Queue</h1>
          <p className="text-muted-foreground mt-1">
            Appointments waiting for staff assignment
          </p>
        </div>
        <Button onClick={handleAutoAssign} disabled={queue.length === 0 || autoAssigning}>
          {autoAssigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Auto-Assign All
            </>
          )}
        </Button>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-yellow-600" />
              <div className="text-3xl font-bold">{queue.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold">
                {staffs.filter((s) => s.status === "AVAILABLE").length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oldest Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="text-xl font-bold">
                {queue.length > 0
                  ? format(parseISO(queue[0].appointmentAt), "MMM dd, hh:mm a")
                  : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waiting Appointments</CardTitle>
          <CardDescription>
            Appointments are ordered by scheduled time (earliest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
              <p className="text-muted-foreground">
                All appointments have been assigned to staff members.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Position</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Required Staff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((appointment, index) => {
                    const eligibleStaff = getEligibleStaff(appointment);
                    const hasAvailableStaff = eligibleStaff.length > 0;

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold"
                          >
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {appointment.customerName}
                        </TableCell>
                        <TableCell>{appointment.service.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(parseISO(appointment.appointmentAt), "MMM dd, yyyy")}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {format(parseISO(appointment.appointmentAt), "hh:mm a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getDurationLabel(appointment.service.duration)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {appointment.service.requiredStaffType.replace("_", " ")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {hasAvailableStaff ? (
                                <span className="text-green-600">
                                  {eligibleStaff.length} available
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  None available
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualAssign(appointment)}
                            disabled={!hasAvailableStaff}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Staff
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(appointment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Assignment Dialog */}
      <Dialog open={manualAssignDialog} onOpenChange={setManualAssignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
            <DialogDescription>
              Select a staff member for {selectedAppointment?.customerName}'s appointment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Appointment Details:</p>
              <div className="text-sm text-muted-foreground space-y-1 pl-4">
                <div>Service: {selectedAppointment?.service.name}</div>
                <div>
                  Duration: {getDurationLabel(selectedAppointment?.service.duration || "")}
                </div>
                <div>
                  Time:{" "}
                  {selectedAppointment &&
                    format(
                      parseISO(selectedAppointment.appointmentAt),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff Member</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {selectedAppointment &&
                    getEligibleStaff(selectedAppointment).map((staff) => {
                      const capacity = staffCapacity[staff.id];
                      const isAtCapacity = capacity.count >= capacity.capacity;

                      return (
                        <SelectItem
                          key={staff.id}
                          value={staff.id}
                          disabled={isAtCapacity}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {staff.name} ({capacity.count} / {capacity.capacity})
                            </span>
                            {isAtCapacity && (
                              <Badge
                                variant="secondary"
                                className="ml-2 bg-red-100 text-red-800"
                              >
                                Full
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only showing available{" "}
                {selectedAppointment?.service.requiredStaffType.replace("_", " ").toLowerCase()}
                s
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualAssignDialog(false)}
              disabled={manualAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmManualAssign}
              disabled={!selectedStaffId || manualAssigning}
            >
              {manualAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Staff
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
