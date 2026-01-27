export interface Appointment {
  id: string;
  customerName: string;
  serviceId: string;
  staffId: string | null;
  appointmentAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    serviceType: string;
    dailyCapacity: number;
    status: string;
  } | null;
  service: {
    id: string;
    name: string;
    duration: "MIN_15" | "MIN_30" | "MIN_60";
    requiredStaffType: "DOCTOR" | "CONSULTANT" | "SUPPORT_AGENT";
  };
}

export interface StaffWithCapacity {
  id: string;
  name: string;
  serviceType: string;
  dailyCapacity: number;
  status: string;
  todayAppointments?: number;
}
