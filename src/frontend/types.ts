export interface RoleDetails {
  id: string;
  name: string;
  description: string;
  canManageDevices: boolean;
  canManageWorkOrders: boolean;
  canManageParts: boolean;
  canManageMaterials: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  roleId: string;
  role: string; // Hỗ trợ tương thích ngược (tên hiển thị vai trò)
  roleDetails?: RoleDetails;
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
  deviceId?: string; // Tương thích ngược
  deviceIds?: string[]; // Gán cho 1 hoặc nhiều linh kiện / thiết bị
  isRecovered?: boolean; // Đánh dấu vật tư thu hồi
  recoveredFrom?: string; // Mã phiếu sửa chữa thu hồi từ đó
  recoveredWarehouse?: string; // Kho được chọn để thu hồi
}

export interface PartUsage {
  partCode: string;
  partName: string;
  quantity: number;
  isRecovered?: boolean; // Trực quan hóa thu hồi trên từng part
  recoveredWarehouse?: string; // Kho thu hồi
}

export type WorkOrderStatus =
  | "Nháp"
  | "Chờ duyệt"
  | "Chờ vật tư"
  | "Sẵn sàng thực hiện"
  | "Đang sửa chữa"
  | "Hoàn thành"
  | "Đóng phiếu";

export interface WorkOrderLog {
  time: string;
  user: string;
  action: string;
  details: string;
}

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
  technician: string; // Tương thích ngược: lưu danh sách phân cách dấu phẩy hoặc đại diện chính
  assignedTechnicians?: string[]; // Danh sách ID người thực hiện
  status: WorkOrderStatus;
  notes: string;
  partsUsed: PartUsage[];
  recoveredMaterials?: string; // Vật tư thu hồi
  approvalDate?: string;
  approvedBy?: string;
  completedDate?: string;
  durationHours?: number;
  cost: number;
  history?: WorkOrderLog[]; // Nhật ký tiến trình đầy đủ của phiếu
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
  approvalNotes?: string; // Trưởng ca ghi chú khi duyệt
  expectedDeliveryDate?: string; // Ngày dự kiến hàng về
  procurementNotes?: string;
  deliveryDate?: string;
  receptionDate?: string;
  cost: number;
  invoiceNo?: string;
  supplierName?: string;
  receptionist?: string;
  receptionNotes?: string;
  warehouseName?: string;
  actualItems?: {
    partCode: string;
    partName: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
}

export interface PreventiveMaintenancePlan {
  id: string;
  code: string;
  name: string;
  deviceId: string;
  deviceName: string;
  intervalDays: number;
  lastDoneDate?: string;
  nextDueDate: string;
  description: string;
  assignedTo?: string; // Phân bổ cho ai
  status: "Đúng hạn" | "Sắp đến hạn" | "Quá hạn" | "Đã hoàn thành";
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
