export interface Staff {
  id: string;
  name: string;
  serviceType: "DOCTOR" | "CONSULTANT" | "SUPPORT_AGENT";
  dailyCapacity: number;
  status: "AVAILABLE" | "ON_LEAVE";
}