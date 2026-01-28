// app/dashboard/services/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from "@/store/api/service.api";
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
import { Loader2, Plus, Edit, Trash2, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@/types/service.types";
import { Badge } from "@/components/ui/badge";
import { ServiceForm, serviceSchema } from "@/lib/validations/service.schema";

const ITEMS_PER_PAGE = 10;

export default function ServicesPage() {
  const { data: services = [], isLoading } = useGetServicesQuery();
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDuration, setFilterDuration] = useState<string>("ALL");
  const [filterStaffType, setFilterStaffType] = useState<string>("ALL");

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      duration: "MIN_30",
      requiredStaffType: "DOCTOR",
    },
  });

  // Filter and Search Logic
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Search by name
    if (searchQuery.trim()) {
      result = result.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by duration
    if (filterDuration !== "ALL") {
      result = result.filter((service) => service.duration === filterDuration);
    }

    // Filter by staff type
    if (filterStaffType !== "ALL") {
      result = result.filter((service) => service.requiredStaffType === filterStaffType);
    }

    return result;
  }, [services, searchQuery, filterDuration, filterStaffType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDuration, filterStaffType]);

  // Pagination logic
  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentServices = filteredServices.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterDuration("ALL");
    setFilterStaffType("ALL");
  };

  const hasActiveFilters = searchQuery || filterDuration !== "ALL" || filterStaffType !== "ALL";

  const onSubmit = async (values: ServiceForm) => {
    try {
      if (editingService) {
        await updateService({ id: editingService.id, ...values }).unwrap();
        toast.success("Service updated successfully");
      } else {
        await createService(values).unwrap();
        toast.success("Service created successfully");
      }
      form.reset();
      setOpen(false);
      setEditingService(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      duration: service.duration,
      requiredStaffType: service.requiredStaffType,
    });
    setOpen(true);
  };

  const handleDelete = (service: Service) => {
    toast.custom(
      (t: any) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-2">Delete Service?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete <strong>{service.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={async () => {
                try {
                  toast.dismiss(t.id);
                  await toast.promise(deleteService(service.id).unwrap(), {
                    loading: "Deleting service...",
                    success: "Service deleted successfully",
                    error: (err) => err?.data?.message || "Failed to delete service",
                  });
                } catch {}
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      }
    );
  };

  const handleAddNew = () => {
    setEditingService(null);
    form.reset({
      name: "",
      duration: "MIN_30",
      requiredStaffType: "DOCTOR",
    });
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Services</h1>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service List</CardTitle>
            <CardDescription>
              Manage consultation types, durations and required staff types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
        <h1 className="text-3xl font-bold">Services</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service List</CardTitle>
          <CardDescription>
            Manage consultation types, durations and required staff types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Duration Filter */}
              <Select value={filterDuration} onValueChange={setFilterDuration}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Durations</SelectItem>
                  <SelectItem value="MIN_15">15 minutes</SelectItem>
                  <SelectItem value="MIN_30">30 minutes</SelectItem>
                  <SelectItem value="MIN_60">60 minutes</SelectItem>
                </SelectContent>
              </Select>

              {/* Staff Type Filter */}
              <Select value={filterStaffType} onValueChange={setFilterStaffType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by staff type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Staff Types</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
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
                {filterDuration !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    Duration: {filterDuration.replace("MIN_", "")} min
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilterDuration("ALL")}
                    />
                  </Badge>
                )}
                {filterStaffType !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {filterStaffType}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilterStaffType("ALL")}
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
                    No services found matching your filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No services added yet. Click "Add Service" to get started.
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Required Staff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {service.duration.replace("MIN_", "")} minutes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            service.requiredStaffType === "DOCTOR"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
                              : service.requiredStaffType === "CONSULTANT"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100"
                          }
                        >
                          {service.requiredStaffType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service)}
                          disabled={isDeleting}
                        >
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. General Consultation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MIN_15">15 minutes</SelectItem>
                          <SelectItem value="MIN_30">30 minutes</SelectItem>
                          <SelectItem value="MIN_60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiredStaffType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Staff Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingService ? "Updating..." : "Creating..."}
                    </>
                  ) : editingService ? (
                    "Update Service"
                  ) : (
                    "Create Service"
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
