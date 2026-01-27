
export interface Service {
  id: string;
  name: string;
  duration: "MIN_15" | "MIN_30" | "MIN_60";
  requiredStaffType: "DOCTOR" | "CONSULTANT" | "SUPPORT_AGENT";
  accountId: string;
  createdAt?: string;
}