"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} from "@/store/api/appointment.api";
import { useGetStaffsQuery } from "@/store/api/staff.api";
import { useGetServicesQuery } from "@/store/api/service.api";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Edit, Trash2, Calendar, User, Clock, Filter, X, AlertCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { appointmentSchema, AppointmentInput } from "@/lib/validations/appointment.schema";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Appointment } from "@/types/appointment.types";
import { Separator } from "@/components/ui/separator";

export default function AppointmentsPage() {
  const { data: appointments = [], isLoading } = useGetAppointmentsQuery();
  const { data: staffs = [] } = useGetStaffsQuery();
  const { data: services = [] } = useGetServicesQuery();
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
  const [updateAppointment, { isLoading: updating }] = useUpdateAppointmentMutation();
  const [deleteAppointment, { isLoading: deleting }] = useDeleteAppointmentMutation();

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");
  
  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerName: "",
      serviceId: "",
      staffId: undefined,
      appointmentAt: ""
    },
    mode: "onChange",
  });


  // Get current datetime in local timezone for min attribute
const getMinDateTime = () => {
  const now = new Date();
  // Add 5 minutes buffer to avoid edge cases
  now.setMinutes(now.getMinutes() + 5);
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

  const selectedServiceId = form.watch("serviceId");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Filter eligible staff based on selected service
  const eligibleStaff = useMemo(() => {
    if (!selectedService) return [];
    
    return staffs.filter(
      (staff) =>
        staff.serviceType === selectedService.requiredStaffType &&
        staff.status === "AVAILABLE"
    );
  }, [selectedService, staffs]);

  // Calculate today's appointment count for each staff
  const staffCapacity = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const capacityMap: Record<string, number> = {};

    eligibleStaff.forEach((staff) => {
      const todayCount = appointments.filter(
        (appt) =>
          appt.staffId === staff.id &&
          appt.status === "SCHEDULED" &&
          new Date(appt.appointmentAt) >= todayStart &&
          new Date(appt.appointmentAt) <= todayEnd
      ).length;

      capacityMap[staff.id] = todayCount;
    });

    return capacityMap;
  }, [eligibleStaff, appointments]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      form.reset({
        customerName: "",
        serviceId: "",
        staffId: undefined,
        appointmentAt: ""
      });
      setEditingAppointment(null);
      setAssignmentMode("auto");
    }
  }, [open, form]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Date filter
      if (filterDate) {
        const apptDate = format(parseISO(appt.appointmentAt), "yyyy-MM-dd");
        if (apptDate !== filterDate) return false;
      }

      // Staff filter
      if (filterStaff !== "all") {
        if (filterStaff === "unassigned" && appt.staffId !== null) return false;
        if (filterStaff !== "unassigned" && appt.staffId !== filterStaff) return false;
      }

      // Status filter
      if (filterStatus !== "all" && appt.status !== filterStatus) return false;

      return true;
    });
  }, [appointments, filterDate, filterStaff, filterStatus]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStaff, filterStatus, itemsPerPage]);

  const clearFilters = () => {
    setFilterDate("");
    setFilterStaff("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = filterDate || filterStaff !== "all" || filterStatus !== "all";

const onSubmit = async (values: AppointmentInput) => {
  try {
    const payload: any = {
      customerName: values.customerName,
      serviceId: values.serviceId,
      appointmentAt: new Date(values.appointmentAt).toISOString(), // Convert to ISO-8601
      staffId: assignmentMode === "auto" ? undefined : values.staffId,
    };

    // Only include status when editing
    if (editingAppointment && values.status) {
      payload.status = values.status;
    }

    if (editingAppointment) {
      await updateAppointment({ id: editingAppointment.id, ...payload }).unwrap();
      toast.success("Appointment updated successfully");
    } else {
      const result = await createAppointment(payload).unwrap();
      
      if (result.staffId) {
        toast.success(`Appointment created and assigned to ${result.staff?.name}`);
      } else {
        toast.info("Appointment created and added to waiting queue");
      }
    }
    setOpen(false);
  } catch (err: any) {
    const errorMsg = err?.data?.message || "Operation failed";
    toast.error(errorMsg);
  }
};

  const handleView = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setViewOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    const mode = appointment.staffId ? "manual" : "auto";
    setAssignmentMode(mode);
    
    form.reset({
      customerName: appointment.customerName,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId || undefined,
      appointmentAt: format(parseISO(appointment.appointmentAt), "yyyy-MM-dd'T'HH:mm"),
      status: appointment.status,
    });
    setOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
    toast.custom(
      (t: any) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-2">Delete Appointment?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to remove appointment for{" "}
            <strong>{appointment.customerName}</strong>?
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
                  loading: "Removing appointment...",
                  success: "Appointment removed",
                  error: "Failed to remove appointment",
                });
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const handleAddNew = () => {
    setEditingAppointment(null);
    form.reset();
    setAssignmentMode("auto");
    setOpen(true);
  };

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants: Record<string, { color: string; label: string }> = {
      SCHEDULED: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100", label: "Scheduled" },
      COMPLETED: { color: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100", label: "Completed" },
      CANCELLED: { color: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100", label: "Cancelled" },
      NO_SHOW: { color: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100", label: "No Show" },
    };
    const variant = variants[status];
    return (
      <Badge variant="secondary" className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  const getDurationLabel = (duration: string) => {
    return duration === "MIN_15" ? "15 min" : duration === "MIN_30" ? "30 min" : "60 min";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>Manage customer appointments and scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-date">Date</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="filter-staff">Staff</Label>
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger id="filter-staff" className="mt-1.5">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="unassigned">Unassigned (Queue)</SelectItem>
                  {staffs.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status" className="mt-1.5">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

{/* Appointments Table */}
<Card>
  <CardHeader>
    <CardTitle>All Appointments</CardTitle>
    <CardDescription>
      {hasActiveFilters
        ? `Showing ${filteredAppointments.length} of ${appointments.length} appointments`
        : `Total ${appointments.length} appointments`}
    </CardDescription>
  </CardHeader>
  <CardContent>
    {filteredAppointments.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        {hasActiveFilters
          ? "No appointments match the selected filters."
          : 'No appointments scheduled yet. Click "New Appointment" to get started.'}
      </p>
    ) : (
      <>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="max-w-[120px] lg:max-w-none truncate lg:whitespace-normal">
                          {appointment.customerName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[100px] lg:max-w-none truncate lg:whitespace-normal block">
                        {appointment.service.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {appointment.staff ? (
                        <span className="text-sm max-w-[80px] lg:max-w-none truncate lg:whitespace-normal block">
                          {appointment.staff.name}
                        </span>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs whitespace-nowrap">
                          Queue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-2 text-sm">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{format(parseISO(appointment.appointmentAt), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{format(parseISO(appointment.appointmentAt), "hh:mm a")}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {getDurationLabel(appointment.service.duration)}
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(appointment)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(appointment)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(appointment)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="items-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page:
            </Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger id="items-per-page" className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of{" "}
              {filteredAppointments.length} results
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    )}
  </CardContent>
</Card>

      {/* View Details Modal */}
<Dialog open={viewOpen} onOpenChange={setViewOpen}>
  <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Appointment Details
      </DialogTitle>
    </DialogHeader>
    {viewingAppointment && (
      <div className="space-y-6 py-4">
        {/* Customer Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Customer Information
          </h3>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{viewingAppointment.customerName}</p>
              <p className="text-sm text-muted-foreground">Customer</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Service & Staff Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Service</Label>
            <p className="font-medium">{viewingAppointment.service.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {getDurationLabel(viewingAppointment.service.duration)}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Assigned Staff</Label>
            {viewingAppointment.staff ? (
              <div>
                <p className="font-medium">{viewingAppointment.staff.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {viewingAppointment.staff.serviceType.replace("_", " ").toLowerCase()}
                </p>
              </div>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                In Waiting Queue
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Date & Time */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Appointment Date & Time</Label>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {format(parseISO(viewingAppointment.appointmentAt), "EEEE, MMMM dd, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(viewingAppointment.appointmentAt), "hh:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status & Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Status</Label>
            <div>{getStatusBadge(viewingAppointment.status)}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Service Type</Label>
            <p className="font-medium capitalize">
              {viewingAppointment.service.requiredStaffType.replace("_", " ").toLowerCase()}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>Created: {format(parseISO(viewingAppointment.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
          <p>Last Updated: {format(parseISO(viewingAppointment.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
        </div>
      </div>
    )}
    <DialogFooter className="sm:justify-between sticky bottom-0 bg-background pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => {
          setViewOpen(false);
          if (viewingAppointment) {
            handleEdit(viewingAppointment);
          }
        }}
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <Button variant="default" onClick={() => setViewOpen(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit Appointment" : "New Appointment"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Selection */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({getDurationLabel(service.duration)}) - Requires{" "}
                            {service.requiredStaffType.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            

              {/* Date & Time */}
<FormField
  control={form.control}
  name="appointmentAt"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Appointment Date & Time</FormLabel>
      <FormControl>
        <Input 
          type="datetime-local" 
          min={getMinDateTime()}
          {...field} 
        />
      </FormControl>
      <p className="text-xs text-muted-foreground mt-1">
        Select a future date and time for the appointment
      </p>
      <FormMessage />
    </FormItem>
  )}
/>

              {/* Assignment Mode */}
              {selectedServiceId && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <Label className="text-base font-medium">Staff Assignment</Label>
                  <RadioGroup
                    value={assignmentMode}
                    onValueChange={(value: "auto" | "manual") => {
                      setAssignmentMode(value);
                      if (value === "auto") {
                        form.setValue("staffId", undefined);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auto" id="auto" />
                      <Label htmlFor="auto" className="font-normal cursor-pointer">
                        Auto-assign (System will find available staff)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="font-normal cursor-pointer">
                        Manually select staff
                      </Label>
                    </div>
                  </RadioGroup>

{assignmentMode === "manual" && (
  <FormField
    control={form.control}
    name="staffId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Select Staff</FormLabel>
        {eligibleStaff.length === 0 ? (
          <div className="p-4 border border-dashed rounded-md bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>
                No staff available for this service type.
                {selectedService && (
                  <span className="font-medium">
                    {" "}
                    (Requires{" "}
                    {selectedService.requiredStaffType.replace("_", " ")})
                  </span>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The appointment will be added to the waiting queue automatically.
            </p>
          </div>
        ) : (
          <>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {eligibleStaff.map((staff) => {
                  const count = staffCapacity[staff.id] || 0;
                  const isAtCapacity = count >= staff.dailyCapacity;
                  return (
                    <SelectItem
                      key={staff.id}
                      value={staff.id}
                      disabled={isAtCapacity}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {staff.name} ({count} / {staff.dailyCapacity})
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
            <p className="text-xs text-muted-foreground mt-1">
              Showing {eligibleStaff.length} available{" "}
              {selectedService?.requiredStaffType.replace("_", " ").toLowerCase()}
              (s)
            </p>
          </>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
)}

                  {assignmentMode === "auto" && (
                    <p className="text-xs text-muted-foreground">
                      The system will automatically assign an available staff member. If none
                      available, the appointment will be added to the waiting queue.
                    </p>
                  )}
                </div>
              )}

              {/* Status (only for editing) */}
              {editingAppointment && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="NO_SHOW">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || updating}>
                  {creating || updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAppointment ? "Updating..." : "Creating..."}
                    </>
                  ) : editingAppointment ? (
                    "Update Appointment"
                  ) : (
                    "Create Appointment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}




// "use client";

// import { useState, useEffect, useMemo } from "react";
// import {
//   useGetAppointmentsQuery,
//   useCreateAppointmentMutation,
//   useUpdateAppointmentMutation,
//   useDeleteAppointmentMutation,
// } from "@/store/api/appointment.api";
// import { useGetStaffsQuery } from "@/store/api/staff.api";
// import { useGetServicesQuery } from "@/store/api/service.api";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Loader2, Plus, Edit, Trash2, Calendar, User, Clock, Filter, X, AlertCircle, Eye } from "lucide-react";
// import { toast } from "sonner";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { appointmentSchema, AppointmentInput } from "@/lib/validations/appointment.schema";
// import { format, parseISO, startOfDay, endOfDay } from "date-fns";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Appointment } from "@/types/appointment.types";
// import { Separator } from "@/components/ui/separator";

// export default function AppointmentsPage() {
//   const { data: appointments = [], isLoading } = useGetAppointmentsQuery();
//   const { data: staffs = [] } = useGetStaffsQuery();
//   const { data: services = [] } = useGetServicesQuery();
//   const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
//   const [updateAppointment, { isLoading: updating }] = useUpdateAppointmentMutation();
//   const [deleteAppointment, { isLoading: deleting }] = useDeleteAppointmentMutation();

//   const [open, setOpen] = useState(false);
//   const [viewOpen, setViewOpen] = useState(false);
//   const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
//   const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
//   const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");
  
//   // Filters
//   const [filterDate, setFilterDate] = useState("");
//   const [filterStaff, setFilterStaff] = useState("all");
//   const [filterStatus, setFilterStatus] = useState("all");

//   const form = useForm<AppointmentInput>({
//     resolver: zodResolver(appointmentSchema),
//     defaultValues: {
//       customerName: "",
//       serviceId: "",
//       staffId: undefined,
//       appointmentAt: ""
//     },
//     mode: "onChange",
//   });


//   // Get current datetime in local timezone for min attribute
// const getMinDateTime = () => {
//   const now = new Date();
//   // Add 5 minutes buffer to avoid edge cases
//   now.setMinutes(now.getMinutes() + 5);
  
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day = String(now.getDate()).padStart(2, '0');
//   const hours = String(now.getHours()).padStart(2, '0');
//   const minutes = String(now.getMinutes()).padStart(2, '0');
  
//   return `${year}-${month}-${day}T${hours}:${minutes}`;
// };

//   const selectedServiceId = form.watch("serviceId");
//   const selectedService = services.find((s) => s.id === selectedServiceId);

//   // Filter eligible staff based on selected service
//   const eligibleStaff = useMemo(() => {
//     if (!selectedService) return [];
    
//     return staffs.filter(
//       (staff) =>
//         staff.serviceType === selectedService.requiredStaffType &&
//         staff.status === "AVAILABLE"
//     );
//   }, [selectedService, staffs]);

//   // Calculate today's appointment count for each staff
//   const staffCapacity = useMemo(() => {
//     const today = new Date();
//     const todayStart = startOfDay(today);
//     const todayEnd = endOfDay(today);

//     const capacityMap: Record<string, number> = {};

//     eligibleStaff.forEach((staff) => {
//       const todayCount = appointments.filter(
//         (appt) =>
//           appt.staffId === staff.id &&
//           appt.status === "SCHEDULED" &&
//           new Date(appt.appointmentAt) >= todayStart &&
//           new Date(appt.appointmentAt) <= todayEnd
//       ).length;

//       capacityMap[staff.id] = todayCount;
//     });

//     return capacityMap;
//   }, [eligibleStaff, appointments]);

//   // Reset form when modal opens/closes
//   useEffect(() => {
//     if (!open) {
//       form.reset({
//         customerName: "",
//         serviceId: "",
//         staffId: undefined,
//         appointmentAt: ""
//       });
//       setEditingAppointment(null);
//       setAssignmentMode("auto");
//     }
//   }, [open, form]);

//   // Filtered appointments
//   const filteredAppointments = useMemo(() => {
//     return appointments.filter((appt) => {
//       // Date filter
//       if (filterDate) {
//         const apptDate = format(parseISO(appt.appointmentAt), "yyyy-MM-dd");
//         if (apptDate !== filterDate) return false;
//       }

//       // Staff filter
//       if (filterStaff !== "all") {
//         if (filterStaff === "unassigned" && appt.staffId !== null) return false;
//         if (filterStaff !== "unassigned" && appt.staffId !== filterStaff) return false;
//       }

//       // Status filter
//       if (filterStatus !== "all" && appt.status !== filterStatus) return false;

//       return true;
//     });
//   }, [appointments, filterDate, filterStaff, filterStatus]);

//   const clearFilters = () => {
//     setFilterDate("");
//     setFilterStaff("all");
//     setFilterStatus("all");
//   };

//   const hasActiveFilters = filterDate || filterStaff !== "all" || filterStatus !== "all";

// const onSubmit = async (values: AppointmentInput) => {
//   try {
//     const payload: any = {
//       customerName: values.customerName,
//       serviceId: values.serviceId,
//       appointmentAt: new Date(values.appointmentAt).toISOString(), // Convert to ISO-8601
//       staffId: assignmentMode === "auto" ? undefined : values.staffId,
//     };

//     // Only include status when editing
//     if (editingAppointment && values.status) {
//       payload.status = values.status;
//     }

//     if (editingAppointment) {
//       await updateAppointment({ id: editingAppointment.id, ...payload }).unwrap();
//       toast.success("Appointment updated successfully");
//     } else {
//       const result = await createAppointment(payload).unwrap();
      
//       if (result.staffId) {
//         toast.success(`Appointment created and assigned to ${result.staff?.name}`);
//       } else {
//         toast.info("Appointment created and added to waiting queue");
//       }
//     }
//     setOpen(false);
//   } catch (err: any) {
//     const errorMsg = err?.data?.message || "Operation failed";
//     toast.error(errorMsg);
//   }
// };

//   const handleView = (appointment: Appointment) => {
//     setViewingAppointment(appointment);
//     setViewOpen(true);
//   };

//   const handleEdit = (appointment: Appointment) => {
//     setEditingAppointment(appointment);
//     const mode = appointment.staffId ? "manual" : "auto";
//     setAssignmentMode(mode);
    
//     form.reset({
//       customerName: appointment.customerName,
//       serviceId: appointment.serviceId,
//       staffId: appointment.staffId || undefined,
//       appointmentAt: format(parseISO(appointment.appointmentAt), "yyyy-MM-dd'T'HH:mm"),
//       status: appointment.status,
//     });
//     setOpen(true);
//   };

//   const handleDelete = (appointment: Appointment) => {
//     toast.custom(
//       (t: any) => (
//         <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full">
//           <h3 className="text-lg font-semibold mb-2">Delete Appointment?</h3>
//           <p className="text-sm text-muted-foreground mb-6">
//             Are you sure you want to remove appointment for{" "}
//             <strong>{appointment.customerName}</strong>?
//           </p>
//           <div className="flex justify-end gap-3">
//             <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               size="sm"
//               disabled={deleting}
//               onClick={async () => {
//                 toast.dismiss(t.id);
//                 await toast.promise(deleteAppointment(appointment.id).unwrap(), {
//                   loading: "Removing appointment...",
//                   success: "Appointment removed",
//                   error: "Failed to remove appointment",
//                 });
//               }}
//             >
//               {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
//             </Button>
//           </div>
//         </div>
//       ),
//       { duration: Infinity, position: "top-center" }
//     );
//   };

//   const handleAddNew = () => {
//     setEditingAppointment(null);
//     form.reset();
//     setAssignmentMode("auto");
//     setOpen(true);
//   };

//   const getStatusBadge = (status: Appointment["status"]) => {
//     const variants: Record<string, { color: string; label: string }> = {
//       SCHEDULED: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100", label: "Scheduled" },
//       COMPLETED: { color: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100", label: "Completed" },
//       CANCELLED: { color: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100", label: "Cancelled" },
//       NO_SHOW: { color: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100", label: "No Show" },
//     };
//     const variant = variants[status];
//     return (
//       <Badge variant="secondary" className={variant.color}>
//         {variant.label}
//       </Badge>
//     );
//   };

//   const getDurationLabel = (duration: string) => {
//     return duration === "MIN_15" ? "15 min" : duration === "MIN_30" ? "30 min" : "60 min";
//   };

//   if (isLoading) {
//     return (
//       <div className="p-6 space-y-6">
//         <div className="flex items-center justify-between">
//           <h1 className="text-3xl font-bold">Appointments</h1>
//           <Skeleton className="h-10 w-32 rounded-md" />
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>All Appointments</CardTitle>
//             <CardDescription>Manage customer appointments and scheduling</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <Skeleton key={i} className="h-16 w-full" />
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold">Appointments</h1>
//         <Button onClick={handleAddNew}>
//           <Plus className="mr-2 h-4 w-4" /> New Appointment
//         </Button>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Filter className="h-5 w-5 text-muted-foreground" />
//               <CardTitle className="text-lg">Filters</CardTitle>
//             </div>
//             {hasActiveFilters && (
//               <Button variant="ghost" size="sm" onClick={clearFilters}>
//                 <X className="mr-2 h-4 w-4" />
//                 Clear Filters
//               </Button>
//             )}
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="filter-date">Date</Label>
//               <Input
//                 id="filter-date"
//                 type="date"
//                 value={filterDate}
//                 onChange={(e) => setFilterDate(e.target.value)}
//                 className="mt-1.5"
//               />
//             </div>
//             <div>
//               <Label htmlFor="filter-staff">Staff</Label>
//               <Select value={filterStaff} onValueChange={setFilterStaff}>
//                 <SelectTrigger id="filter-staff" className="mt-1.5">
//                   <SelectValue placeholder="All Staff" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Staff</SelectItem>
//                   <SelectItem value="unassigned">Unassigned (Queue)</SelectItem>
//                   {staffs.map((staff) => (
//                     <SelectItem key={staff.id} value={staff.id}>
//                       {staff.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label htmlFor="filter-status">Status</Label>
//               <Select value={filterStatus} onValueChange={setFilterStatus}>
//                 <SelectTrigger id="filter-status" className="mt-1.5">
//                   <SelectValue placeholder="All Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="SCHEDULED">Scheduled</SelectItem>
//                   <SelectItem value="COMPLETED">Completed</SelectItem>
//                   <SelectItem value="CANCELLED">Cancelled</SelectItem>
//                   <SelectItem value="NO_SHOW">No Show</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

// {/* Appointments Table */}
// <Card>
//   <CardHeader>
//     <CardTitle>All Appointments</CardTitle>
//     <CardDescription>
//       {hasActiveFilters
//         ? `Showing ${filteredAppointments.length} of ${appointments.length} appointments`
//         : `Total ${appointments.length} appointments`}
//     </CardDescription>
//   </CardHeader>
//   <CardContent>
//     {filteredAppointments.length === 0 ? (
//       <p className="text-center text-muted-foreground py-8">
//         {hasActiveFilters
//           ? "No appointments match the selected filters."
//           : 'No appointments scheduled yet. Click "New Appointment" to get started.'}
//       </p>
//     ) : (
//       <div className="border rounded-lg overflow-hidden">
//         <div className="overflow-x-auto">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Customer</TableHead>
//                 <TableHead>Service</TableHead>
//                 <TableHead>Staff</TableHead>
//                 <TableHead>Date & Time</TableHead>
//                 <TableHead>Duration</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredAppointments.map((appointment) => (
//                 <TableRow key={appointment.id}>
//                   <TableCell className="font-medium">
//                     <div className="flex items-center gap-2">
//                       <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
//                       <span className="max-w-[120px] lg:max-w-none truncate lg:whitespace-normal">
//                         {appointment.customerName}
//                       </span>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <span className="max-w-[100px] lg:max-w-none truncate lg:whitespace-normal block">
//                       {appointment.service.name}
//                     </span>
//                   </TableCell>
//                   <TableCell>
//                     {appointment.staff ? (
//                       <span className="text-sm max-w-[80px] lg:max-w-none truncate lg:whitespace-normal block">
//                         {appointment.staff.name}
//                       </span>
//                     ) : (
//                       <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs whitespace-nowrap">
//                         Queue
//                       </Badge>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-2 text-sm">
//                       <div className="flex items-center gap-1.5 whitespace-nowrap">
//                         <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
//                         <span>{format(parseISO(appointment.appointmentAt), "MMM dd, yyyy")}</span>
//                       </div>
//                       <div className="flex items-center gap-1.5 whitespace-nowrap">
//                         <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
//                         <span>{format(parseISO(appointment.appointmentAt), "hh:mm a")}</span>
//                       </div>
//                     </div>
//                   </TableCell>
//                   <TableCell className="text-sm whitespace-nowrap">
//                     {getDurationLabel(appointment.service.duration)}
//                   </TableCell>
//                   <TableCell>{getStatusBadge(appointment.status)}</TableCell>
//                   <TableCell>
//                     <div className="flex items-center justify-end gap-1">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8"
//                         onClick={() => handleView(appointment)}
//                         title="View Details"
//                       >
//                         <Eye className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8"
//                         onClick={() => handleEdit(appointment)}
//                         title="Edit"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8"
//                         onClick={() => handleDelete(appointment)}
//                         title="Delete"
//                       >
//                         <Trash2 className="h-4 w-4 text-destructive" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </div>
//     )}
//   </CardContent>
// </Card>
//       {/* View Details Modal */}
// <Dialog open={viewOpen} onOpenChange={setViewOpen}>
//   <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
//     <DialogHeader>
//       <DialogTitle className="flex items-center gap-2">
//         <Calendar className="h-5 w-5" />
//         Appointment Details
//       </DialogTitle>
//     </DialogHeader>
//     {viewingAppointment && (
//       <div className="space-y-6 py-4">
//         {/* Customer Info */}
//         <div className="space-y-3">
//           <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
//             Customer Information
//           </h3>
//           <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
//             <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
//               <User className="h-6 w-6 text-primary" />
//             </div>
//             <div>
//               <p className="font-semibold text-lg">{viewingAppointment.customerName}</p>
//               <p className="text-sm text-muted-foreground">Customer</p>
//             </div>
//           </div>
//         </div>

//         <Separator />

//         {/* Service & Staff Info */}
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label className="text-muted-foreground">Service</Label>
//             <p className="font-medium">{viewingAppointment.service.name}</p>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Clock className="h-3.5 w-3.5" />
//               {getDurationLabel(viewingAppointment.service.duration)}
//             </div>
//           </div>
//           <div className="space-y-2">
//             <Label className="text-muted-foreground">Assigned Staff</Label>
//             {viewingAppointment.staff ? (
//               <div>
//                 <p className="font-medium">{viewingAppointment.staff.name}</p>
//                 <p className="text-sm text-muted-foreground capitalize">
//                   {viewingAppointment.staff.serviceType.replace("_", " ").toLowerCase()}
//                 </p>
//               </div>
//             ) : (
//               <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
//                 In Waiting Queue
//               </Badge>
//             )}
//           </div>
//         </div>

//         <Separator />

//         {/* Date & Time */}
//         <div className="space-y-2">
//           <Label className="text-muted-foreground">Appointment Date & Time</Label>
//           <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Calendar className="h-5 w-5 text-primary" />
//               <div>
//                 <p className="font-medium">
//                   {format(parseISO(viewingAppointment.appointmentAt), "EEEE, MMMM dd, yyyy")}
//                 </p>
//                 <p className="text-sm text-muted-foreground">
//                   {format(parseISO(viewingAppointment.appointmentAt), "hh:mm a")}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <Separator />

//         {/* Status & Metadata */}
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label className="text-muted-foreground">Status</Label>
//             <div>{getStatusBadge(viewingAppointment.status)}</div>
//           </div>
//           <div className="space-y-2">
//             <Label className="text-muted-foreground">Service Type</Label>
//             <p className="font-medium capitalize">
//               {viewingAppointment.service.requiredStaffType.replace("_", " ").toLowerCase()}
//             </p>
//           </div>
//         </div>

//         {/* Timestamps */}
//         <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
//           <p>Created: {format(parseISO(viewingAppointment.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
//           <p>Last Updated: {format(parseISO(viewingAppointment.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
//         </div>
//       </div>
//     )}
//     <DialogFooter className="sm:justify-between sticky bottom-0 bg-background pt-4 border-t">
//       <Button
//         variant="outline"
//         onClick={() => {
//           setViewOpen(false);
//           if (viewingAppointment) {
//             handleEdit(viewingAppointment);
//           }
//         }}
//       >
//         <Edit className="mr-2 h-4 w-4" />
//         Edit
//       </Button>
//       <Button variant="default" onClick={() => setViewOpen(false)}>
//         Close
//       </Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>

//       {/* Add / Edit Dialog */}
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>
//               {editingAppointment ? "Edit Appointment" : "New Appointment"}
//             </DialogTitle>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
//               {/* Customer Name */}
//               <FormField
//                 control={form.control}
//                 name="customerName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Customer Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g. John Doe" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Service Selection */}
//               <FormField
//                 control={form.control}
//                 name="serviceId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Service</FormLabel>
//                     <Select
//                       onValueChange={field.onChange}
//                       defaultValue={field.value}
//                       value={field.value}
//                     >
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a service" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {services.map((service) => (
//                           <SelectItem key={service.id} value={service.id}>
//                             {service.name} ({getDurationLabel(service.duration)}) - Requires{" "}
//                             {service.requiredStaffType.replace("_", " ")}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

            

//               {/* Date & Time */}
// <FormField
//   control={form.control}
//   name="appointmentAt"
//   render={({ field }) => (
//     <FormItem>
//       <FormLabel>Appointment Date & Time</FormLabel>
//       <FormControl>
//         <Input 
//           type="datetime-local" 
//           min={getMinDateTime()}
//           {...field} 
//         />
//       </FormControl>
//       <p className="text-xs text-muted-foreground mt-1">
//         Select a future date and time for the appointment
//       </p>
//       <FormMessage />
//     </FormItem>
//   )}
// />

//               {/* Assignment Mode */}
//               {selectedServiceId && (
//                 <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
//                   <Label className="text-base font-medium">Staff Assignment</Label>
//                   <RadioGroup
//                     value={assignmentMode}
//                     onValueChange={(value: "auto" | "manual") => {
//                       setAssignmentMode(value);
//                       if (value === "auto") {
//                         form.setValue("staffId", undefined);
//                       }
//                     }}
//                   >
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="auto" id="auto" />
//                       <Label htmlFor="auto" className="font-normal cursor-pointer">
//                         Auto-assign (System will find available staff)
//                       </Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="manual" id="manual" />
//                       <Label htmlFor="manual" className="font-normal cursor-pointer">
//                         Manually select staff
//                       </Label>
//                     </div>
//                   </RadioGroup>

// {assignmentMode === "manual" && (
//   <FormField
//     control={form.control}
//     name="staffId"
//     render={({ field }) => (
//       <FormItem>
//         <FormLabel>Select Staff</FormLabel>
//         {eligibleStaff.length === 0 ? (
//           <div className="p-4 border border-dashed rounded-md bg-muted/50">
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <AlertCircle className="h-4 w-4 text-yellow-600" />
//               <span>
//                 No staff available for this service type.
//                 {selectedService && (
//                   <span className="font-medium">
//                     {" "}
//                     (Requires{" "}
//                     {selectedService.requiredStaffType.replace("_", " ")})
//                   </span>
//                 )}
//               </span>
//             </div>
//             <p className="text-xs text-muted-foreground mt-2">
//               The appointment will be added to the waiting queue automatically.
//             </p>
//           </div>
//         ) : (
//           <>
//             <Select
//               onValueChange={field.onChange}
//               defaultValue={field.value}
//               value={field.value}
//             >
//               <FormControl>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Choose a staff member" />
//                 </SelectTrigger>
//               </FormControl>
//               <SelectContent>
//                 {eligibleStaff.map((staff) => {
//                   const count = staffCapacity[staff.id] || 0;
//                   const isAtCapacity = count >= staff.dailyCapacity;
//                   return (
//                     <SelectItem
//                       key={staff.id}
//                       value={staff.id}
//                       disabled={isAtCapacity}
//                     >
//                       <div className="flex items-center justify-between w-full">
//                         <span>
//                           {staff.name} ({count} / {staff.dailyCapacity})
//                         </span>
//                         {isAtCapacity && (
//                           <Badge
//                             variant="secondary"
//                             className="ml-2 bg-red-100 text-red-800"
//                           >
//                             Full
//                           </Badge>
//                         )}
//                       </div>
//                     </SelectItem>
//                   );
//                 })}
//               </SelectContent>
//             </Select>
//             <p className="text-xs text-muted-foreground mt-1">
//               Showing {eligibleStaff.length} available{" "}
//               {selectedService?.requiredStaffType.replace("_", " ").toLowerCase()}
//               (s)
//             </p>
//           </>
//         )}
//         <FormMessage />
//       </FormItem>
//     )}
//   />
// )}

//                   {assignmentMode === "auto" && (
//                     <p className="text-xs text-muted-foreground">
//                       The system will automatically assign an available staff member. If none
//                       available, the appointment will be added to the waiting queue.
//                     </p>
//                   )}
//                 </div>
//               )}

//               {/* Status (only for editing) */}
//               {editingAppointment && (
//                 <FormField
//                   control={form.control}
//                   name="status"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Status</FormLabel>
//                       <Select onValueChange={field.onChange} defaultValue={field.value}>
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select status" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="SCHEDULED">Scheduled</SelectItem>
//                           <SelectItem value="COMPLETED">Completed</SelectItem>
//                           <SelectItem value="CANCELLED">Cancelled</SelectItem>
//                           <SelectItem value="NO_SHOW">No Show</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               )}

//               <DialogFooter className="mt-6">
//                 <Button type="button" variant="outline" onClick={() => setOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={creating || updating}>
//                   {creating || updating ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       {editingAppointment ? "Updating..." : "Creating..."}
//                     </>
//                   ) : editingAppointment ? (
//                     "Update Appointment"
//                   ) : (
//                     "Create Appointment"
//                   )}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


