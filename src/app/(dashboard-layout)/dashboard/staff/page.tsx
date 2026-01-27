// app/dashboard/staff/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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

export default function StaffPage() {
  const { data: staffs = [], isLoading } = useGetStaffsQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();

  const [open, setOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      serviceType: "DOCTOR",
      dailyCapacity: 5,
      status: "AVAILABLE",
    },
    mode: "onChange", // validate as user types
  });

  // Reset form when modal opens/closes
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
      (t:any) => (
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
          {staffs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No staff added yet. Click "Add Staff" to get started.
            </p>
          ) : (
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
                {staffs.map((staff) => (
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
                    <TableCell>{staff.dailyCapacity} hours/day</TableCell>
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

  {/* Staff Type + Status in one row - full width */}
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
        <FormLabel>Daily Capacity (hours/day)</FormLabel>
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