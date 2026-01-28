// app/dashboard/staff/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  useGetStaffsQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from "@/store/api/staff.api";
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
import { Loader2, Plus, Edit, Trash2, UserCheck, UserX, Search, Filter, X } from "lucide-react";
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
import { staffSchema, StaffInput } from "@/lib/validations/staff.schema";
import { Staff } from "@/types/staff.types";

const ITEMS_PER_PAGE = 10;

export default function StaffPage() {
  const { data: staffs = [], isLoading } = useGetStaffsQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();

  const [open, setOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      serviceType: "DOCTOR",
      dailyCapacity: 5,
      status: "AVAILABLE",
    },
    mode: "onChange",
  });

  // Reset form & page when modal opens/closes
  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        serviceType: "DOCTOR",
        dailyCapacity: 5,
        status: "AVAILABLE",
      });
      setEditingStaff(null);
    }
  }, [open, form]);

  // Filter and Search Logic
  const filteredStaffs = useMemo(() => {
    let result = [...staffs];

    // Search by name or capacity
    if (searchQuery.trim()) {
      result = result.filter((staff) => {
        const query = searchQuery.toLowerCase();
        const matchesName = staff.name.toLowerCase().includes(query);
        const matchesCapacity = staff.dailyCapacity.toString().includes(query);
        return matchesName || matchesCapacity;
      });
    }

    // Filter by type
    if (filterType !== "ALL") {
      result = result.filter((staff) => staff.serviceType === filterType);
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      result = result.filter((staff) => staff.status === filterStatus);
    }

    return result;
  }, [staffs, searchQuery, filterType, filterStatus]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  // Pagination logic
  const totalItems = filteredStaffs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentStaffs = filteredStaffs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("ALL");
    setFilterStatus("ALL");
  };

  const hasActiveFilters = searchQuery || filterType !== "ALL" || filterStatus !== "ALL";

  const onSubmit = async (values: StaffInput) => {
    try {
      if (editingStaff) {
        await updateStaff({ id: editingStaff.id, ...values }).unwrap();
        toast.success("Staff updated successfully");
      } else {
        await createStaff(values).unwrap();
        toast.success("Staff added successfully");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    form.reset({
      name: staff.name,
      serviceType: staff.serviceType,
      dailyCapacity: staff.dailyCapacity,
      status: staff.status,
    });
    setOpen(true);
  };

  const handleDelete = (staff: Staff) => {
    toast.custom(
      (t: any) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-2">Delete Staff?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to remove <strong>{staff.name}</strong>?
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
                await toast.promise(deleteStaff(staff.id).unwrap(), {
                  loading: "Removing staff...",
                  success: "Staff removed",
                  error: "Failed to remove staff",
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
    setEditingStaff(null);
    form.reset();
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Staff</h1>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Manage doctors, consultants and support agents</CardDescription>
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
        <h1 className="text-3xl font-bold">Staff</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>Manage doctors, consultants and support agents</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or capacity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display & Clear Button */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {filterType !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {filterType}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilterType("ALL")}
                    />
                  </Badge>
                )}
                {filterStatus !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filterStatus}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilterStatus("ALL")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {totalItems === 0 ? (
            <div className="text-center py-12">
              {hasActiveFilters ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    No staff found matching your filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No staff added yet. Click "Add Staff" to get started.
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStaffs.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            staff.serviceType === "DOCTOR"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
                              : staff.serviceType === "CONSULTANT"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100"
                          }
                        >
                          {staff.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>{staff.dailyCapacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {staff.status === "AVAILABLE" ? (
                            <>
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">Available</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 font-medium">On Leave</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(staff)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(staff)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add New Staff"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dr. Farhan Ahmed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>Staff Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="CONSULTANT">Consultant</SelectItem>
                          <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dailyCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        step="1"
                        placeholder="5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? 5 : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || updating}>
                  {creating || updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingStaff ? "Updating..." : "Creating..."}
                    </>
                  ) : editingStaff ? (
                    "Update Staff"
                  ) : (
                    "Add Staff"
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
