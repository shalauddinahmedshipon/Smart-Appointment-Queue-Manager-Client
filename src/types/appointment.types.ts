export interface Appointment {
  id: string;
  customerName: string;
  serviceId: string;
  service?: { name: string; duration: string };
  staffId?: string;
  staff?: { name: string };
  appointmentAt: string; 
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}