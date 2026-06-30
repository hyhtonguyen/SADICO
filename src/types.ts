export type Role = "Kỹ thuật bảo trì (Cơ điện)" | "Bộ phận Vật tư" | "Trưởng ca" | "Ban lãnh đạo";

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  dept: string;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  model: string;
  serial: string;
  purchaseDate: string;
  value: number;
  location: string;
  department: string;
  status: "Đang hoạt động" | "Đang bảo trì" | "Hỏng" | "Sắp đến hạn bảo trì";
  lastMaintenance: string;
  cycleDays: number;
}

export interface Part {
  code: string;
  name: string;
  serial: string;
  category: "Vật tư sửa chữa" | "Vật tư Trung tâm sản xuất";
  stock: number;
  minStock: number;
  lifecycleMonths: number;
  unit: string;
  price: number;
  origin?: string;
  color?: string;
  deviceId?: string;
}

export interface PartUsage {
  partCode: string;
  partName: string;
  quantity: number;
}

export type WorkOrderStatus =
  | "Nháp"
  | "Chờ duyệt"
  | "Chờ vật tư"
  | "Sẵn sàng thực hiện"
  | "Đang sửa chữa"
  | "Hoàn thành"
  | "Đóng phiếu";

export interface WorkOrder {
  id: string;
  code: string;
  date: string;
  creator: string;
  department: string;
  deviceId: string;
  deviceName: string;
  location: string;
  faultTime: string;
  faultFinder: string;
  symptom: string;
  cause: string;
  imageBefore?: string; // base64
  imageAfter?: string;  // base64
  proposedSolution: string;
  targetCompletion: string;
  technician: string;
  status: WorkOrderStatus;
  notes: string;
  partsUsed: PartUsage[];
  recoveredMaterials?: string; // Vật tư thu hồi
  approvalDate?: string;
  approvedBy?: string;
  completedDate?: string;
  durationHours?: number;
  cost: number;
}

export interface RequestItem {
  partCode: string;
  partName: string;
  quantity: number;
  unit: string;
  reason: string;
}

export interface MaterialRequest {
  id: string;
  code: string;
  date: string;
  proposer: string;
  workOrderId?: string;
  deviceId?: string;
  deviceName?: string;
  items: RequestItem[];
  reason: string;
  status: "Chờ duyệt" | "Đã duyệt" | "Đang mua hàng" | "Đã giao hàng/Nhập kho" | "Bị từ chối";
  approvedBy?: string;
  approvalDate?: string;
  procurementNotes?: string;
  deliveryDate?: string;
  receptionDate?: string;
  cost: number;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  maintainingDevices: number;
  brokenDevices: number;
  upcomingMaintenanceCount: number;
  lowStockCount: number;
  lowStockParts: Part[];
  topBrokenDevices: { id: string; name: string; count: number }[];
  monthlyCosts: { month: string; cost: number }[];
  mttr: number;
  mtbf: number;
  oee: number;
}
