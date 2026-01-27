"use client";

import { useState } from "react";
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
} from "@/store/api/appointment.api";
import { useGetServicesQuery } from "@/store/api/service.api";
import { useGetStaffsQuery } from "@/store/api/staff.api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";

interface Props {
  appointment?: any;
  onClose?: () => void;
}

export default function AppointmentForm({
  appointment,
  onClose,
}: Props) {
  const isEdit = !!appointment;

  const { data: services = [] } = useGetServicesQuery();
  const { data: staffs = [] } = useGetStaffsQuery();

  const [create, { isLoading: creating }] =
    useCreateAppointmentMutation();
  const [update, { isLoading: updating }] =
    useUpdateAppointmentMutation();

  const [open, setOpen] = useState(!isEdit);

  const [form, setForm] = useState({
    customerName: appointment?.customerName ?? "",
    serviceId: appointment?.serviceId ?? "",
    staffId: appointment?.staffId ?? "",
    appointmentAt: appointment
      ? appointment.appointmentAt.slice(0, 16)
      : "",
  });

  const submit = async () => {
    if (!form.customerName || !form.serviceId || !form.appointmentAt) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        customerName: form.customerName,
        serviceId: form.serviceId,
        staffId: form.staffId || undefined, // auto-queue if empty
        appointmentAt: new Date(form.appointmentAt).toISOString(),
      };

      if (isEdit) {
        await update({
          id: appointment.id,
          ...payload,
        }).unwrap();

        toast.success("Appointment updated");
        onClose?.();
      } else {
        await create(payload).unwrap();

        toast.success("Appointment created");
        setOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Operation failed");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) onClose?.();
      }}
    >
      <DialogContent className="sm:max-w-[500px] space-y-4">
        {/* ✅ REQUIRED FOR RADIX ACCESSIBILITY */}
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Appointment" : "Create Appointment"}
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Customer name"
          value={form.customerName}
          onChange={(e) =>
            setForm({ ...form, customerName: e.target.value })
          }
        />

        <Select
          value={form.serviceId}
          onValueChange={(v) =>
            setForm({ ...form, serviceId: v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={form.staffId}
          onValueChange={(v) =>
            setForm({ ...form, staffId: v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Auto assign / Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__QUEUE__">
              Auto assign (Queue)
            </SelectItem>
            {staffs.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="datetime-local"
          value={form.appointmentAt}
          onChange={(e) =>
            setForm({ ...form, appointmentAt: e.target.value })
          }
        />

        <Button
          onClick={submit}
          disabled={creating || updating}
        >
          {isEdit
            ? updating
              ? "Updating..."
              : "Update"
            : creating
            ? "Creating..."
            : "Create"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
