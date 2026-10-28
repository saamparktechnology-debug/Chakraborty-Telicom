export interface DseExecutive {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  assignedRetailers: number;
  assignedCustomers: number;
  pendingDeliveries: number;
  todayCashCollected: string;
  todayUpiCollected: string;
  todayTotalBilled: string;
}

export interface CreateDsePayload {
  role: "DSE";
  name: string;
  phone: string;
  password: string;
  address: string;
}

export interface DseRecord {
  dseId: string;
  dseName: string;
  dsePhone: string;
  beat: string;
  cashCollected: string;
  upiCollected: string;
  totalBilled: string;
  assignedRetailers: number;
  assignedCustomers: number;
  pendingIndents: number;
}
