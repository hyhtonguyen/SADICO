import path from "path";
import fs from "fs";
import { User, Device, Part, WorkOrder, MaterialRequest, AuditLog } from "../frontend/types";

// Data Directory Configuration (points to root 'data' folder)
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper for persistent JSON files
export function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

export function readData<T>(filename: string, defaultVal: T): T {
  const file = getFilePath(filename);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), "utf8");
    return defaultVal;
  }
  try {
    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content) as T;
  } catch (e) {
    console.error(`Error reading ${filename}:`, e);
    return defaultVal;
  }
}

export function writeData<T>(filename: string, data: T): void {
  const file = getFilePath(filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// --- Seed Data Definitions ---
export const INITIAL_USERS: User[] = [
  { id: "u1", username: "codien1", name: "Nguyễn Văn Hùng", role: "Kỹ thuật bảo trì (Cơ điện)", dept: "Tổ Cơ điện" },
  { id: "u2", username: "vattu1", name: "Lê Thị Lan", role: "Bộ phận Vật tư", dept: "Phòng Vật tư" },
  { id: "u3", username: "truongca1", name: "Trần Minh Đức", role: "Trưởng ca", dept: "Ban Quản lý Sản xuất" },
  { id: "u4", username: "lanhdao1", name: "Phạm Việt Hoàng", role: "Ban lãnh đạo", dept: "Ban Giám đốc" }
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: "DEV-001",
    code: "DEV-001",
    name: "Máy đóng bao xi măng Haver & Boecker 8 vòi",
    model: "HB-ROTO-8",
    serial: "SN-99812-HB",
    purchaseDate: "2022-03-15",
    value: 1250000000,
    location: "Khu vực đóng gói xi măng",
    department: "Xưởng đóng bao",
    status: "Đang hoạt động",
    lastMaintenance: "2026-05-10",
    cycleDays: 60,
  },
  {
    id: "DEV-002",
    code: "DEV-002",
    name: "Hệ thống cấp liệu băng tải xích clinker",
    model: "SADICO-CH-1200",
    serial: "SN-2021-SAD-55",
    purchaseDate: "2021-08-20",
    value: 750000000,
    location: "Khu vực lò nung clinker",
    department: "Xưởng clinker",
    status: "Đang hoạt động",
    lastMaintenance: "2026-06-01",
    cycleDays: 30,
  },
  {
    id: "DEV-003",
    code: "DEV-003",
    name: "Máy nén khí trục vít Atlas Copco GA75",
    model: "GA75-VSD",
    serial: "AC-VSD-750912",
    purchaseDate: "2023-01-10",
    value: 480000000,
    location: "Trạm khí nén trung tâm",
    department: "Tổ Cơ điện hỗ trợ",
    status: "Đang bảo trì",
    lastMaintenance: "2026-04-20",
    cycleDays: 90,
  },
  {
    id: "DEV-004",
    code: "DEV-004",
    name: "Gầu tải liệu đá vôi nâng đứng",
    model: "GT-LIME-50T",
    serial: "GT-LIME-1029",
    purchaseDate: "2020-05-18",
    value: 320000000,
    location: "Kho nguyên liệu đá vôi",
    department: "Xưởng chuẩn bị liệu",
    status: "Hỏng",
    lastMaintenance: "2026-03-05",
    cycleDays: 45,
  },
  {
    id: "DEV-005",
    code: "DEV-005",
    name: "Hệ thống quạt hút lọc bụi lò quay số 1",
    model: "EP-DUST-F180",
    serial: "SN-EP-F180-22",
    purchaseDate: "2022-11-05",
    value: 920000000,
    location: "Hệ thống lọc bụi tĩnh điện lò quay",
    department: "Xưởng lò nung",
    status: "Sắp đến hạn bảo trì",
    lastMaintenance: "2026-05-01",
    cycleDays: 60,
  }
];

export const INITIAL_PARTS: Part[] = [
  {
    code: "PART-V01",
    name: "Van khí nén 5/2 SMC điện từ",
    serial: "SMC-SY5120-5D",
    category: "Vật tư sửa chữa",
    stock: 12,
    minStock: 10,
    lifecycleMonths: 18,
    unit: "Cái",
    price: 1500000,
    origin: "Nhật Bản",
    color: "Xám bạc",
    deviceId: "DEV-001"
  },
  {
    code: "PART-B02",
    name: "Vòng bi SKF Explorer 22212",
    serial: "SKF-22212-E",
    category: "Vật tư sửa chữa",
    stock: 4,
    minStock: 8,
    lifecycleMonths: 24,
    unit: "Bộ",
    price: 3200000,
    origin: "Thụy Điển",
    color: "Thép sáng",
    deviceId: "DEV-002"
  },
  {
    code: "PART-G03",
    name: "Dầu hộp số công nghiệp Shell Omala S2 G220",
    serial: "SHELL-OMALA-220",
    category: "Vật tư Trung tâm sản xuất",
    stock: 15,
    minStock: 5,
    lifecycleMonths: 12,
    unit: "Thùng (20L)",
    price: 2400000,
    origin: "Singapore",
    color: "Vàng hổ phách",
    deviceId: "DEV-003"
  },
  {
    code: "PART-S04",
    name: "Cảm biến tiệm cận Autonics PR12-4DN",
    serial: "AUTO-PR12",
    category: "Vật tư sửa chữa",
    stock: 25,
    minStock: 10,
    lifecycleMonths: 36,
    unit: "Cái",
    price: 450000,
    origin: "Hàn Quốc",
    color: "Đen",
    deviceId: "DEV-001"
  },
  {
    code: "PART-C05",
    name: "Dây curoa răng truyền động bản rộng Gates 8M-1200",
    serial: "GATES-8M-1200",
    category: "Vật tư Trung tâm sản xuất",
    stock: 2,
    minStock: 10,
    lifecycleMonths: 12,
    unit: "Sợi",
    price: 850000,
    origin: "Mỹ",
    color: "Đen tuyền",
    deviceId: "DEV-004"
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-260601",
    code: "WO-260601",
    date: "2026-06-25",
    creator: "Nguyễn Văn Hùng",
    department: "Tổ Cơ điện",
    deviceId: "DEV-004",
    deviceName: "Gầu tải liệu đá vôi nâng đứng",
    location: "Kho nguyên liệu đá vôi",
    faultTime: "2026-06-25T08:30:00",
    faultFinder: "Trần Minh Đức (Trưởng ca)",
    symptom: "Đứt xích truyền động, gầu bị kẹt cứng không thể vận hành cấp liệu.",
    cause: "Dây curoa / xích truyền động Gates bị mài mòn quá hạn chưa được thay thế kịp thời.",
    imageBefore: "",
    imageAfter: "",
    proposedSolution: "Kiểm tra gầu tải, tháo gỡ phần bị kẹt, thay thế dây curoa mới và bôi trơn hệ thống xích nâng.",
    targetCompletion: "2026-06-30",
    technician: "Nguyễn Văn Hùng",
    status: "Chờ vật tư",
    notes: "Đang chờ mua bổ sung Dây curoa Gates 8M-1200 từ phòng vật tư do số lượng tồn kho chỉ còn 2 sợi (mức tối thiểu là 10).",
    partsUsed: [
      { partCode: "PART-C05", partName: "Dây curoa răng truyền động bản rộng Gates 8M-1200", quantity: 2 }
    ],
    recoveredMaterials: "Xích truyền động cũ và dây curoa hỏng thu hồi về kho vật tư tái chế.",
    approvalDate: "2026-06-25",
    approvedBy: "Trần Minh Đức",
    completedDate: "",
    durationHours: 0,
    cost: 1700000
  },
  {
    id: "WO-260602",
    code: "WO-260602",
    date: "2026-06-28",
    creator: "Nguyễn Văn Hùng",
    department: "Tổ Cơ điện",
    deviceId: "DEV-001",
    deviceName: "Máy đóng bao xi măng Haver & Boecker 8 vòi",
    location: "Khu vực đóng gói xi măng",
    faultTime: "2026-06-28T09:15:00",
    faultFinder: "Nguyễn Văn Hùng",
    symptom: "Vòi phun số 3 cấp liệu không đều, cảm biến tiệm cận lúc nhận lúc không.",
    cause: "Cảm biến tiệm cận Autonics PR12 bị lệch vị trí lắp đặt và mờ thấu kính.",
    imageBefore: "",
    imageAfter: "",
    proposedSolution: "Cân chỉnh khoảng cách lắp đặt cảm biến, vệ sinh thấu kính. Nếu không khắc phục được thì thay mới.",
    targetCompletion: "2026-06-29",
    technician: "Nguyễn Văn Hùng",
    status: "Sẵn sàng thực hiện",
    notes: "Linh kiện cảm biến Autonics PR12 có sẵn trong kho 25 cái, có thể thực hiện ngay.",
    partsUsed: [
      { partCode: "PART-S04", partName: "Cảm biến tiệm cận Autonics PR12-4DN", quantity: 1 }
    ],
    recoveredMaterials: "Cảm biến tiệm cận cũ mờ hỏng.",
    approvalDate: "2026-06-28",
    approvedBy: "Trần Minh Đức",
    completedDate: "",
    durationHours: 0,
    cost: 450000
  },
  {
    id: "WO-260603",
    code: "WO-260603",
    date: "2026-06-05",
    creator: "Nguyễn Văn Hùng",
    department: "Tổ Cơ điện",
    deviceId: "DEV-002",
    deviceName: "Hệ thống cấp liệu băng tải xích clinker",
    location: "Khu vực lò nung clinker",
    faultTime: "2026-06-05T14:00:00",
    faultFinder: "Lê Văn Bảy",
    symptom: "Đầu hộp số bị nóng ran (trên 80 độ C), tiếng rít kim loại phát ra to hơn bình thường.",
    cause: "Hết dầu bôi trơn hộp số hoặc dầu bị lẫn tạp chất, mạt kim loại.",
    imageBefore: "",
    imageAfter: "",
    proposedSolution: "Xả hết dầu cũ, súc rửa sạch hộp số, thay mới 2 thùng dầu Shell Omala S2 G220.",
    targetCompletion: "2026-06-06",
    technician: "Nguyễn Văn Hùng",
    status: "Đóng phiếu",
    notes: "Đã hoàn thành xuất sắc, nhiệt độ hộp số đã hạ xuống 45 độ C, tiếng máy êm.",
    partsUsed: [
      { partCode: "PART-G03", partName: "Dầu hộp số công nghiệp Shell Omala S2 G220", quantity: 2 }
    ],
    recoveredMaterials: "Dầu hộp số cũ thu hồi vào phuy chứa dầu thải tái chế.",
    approvalDate: "2026-06-05",
    approvedBy: "Trần Minh Đức",
    completedDate: "2026-06-06",
    durationHours: 4,
    cost: 4800000
  }
];

export const INITIAL_MATERIAL_REQUESTS: MaterialRequest[] = [
  {
    id: "MR-260601",
    code: "MR-260601",
    date: "2026-06-25",
    proposer: "Nguyễn Văn Hùng",
    workOrderId: "WO-260601",
    deviceId: "DEV-004",
    deviceName: "Gầu tải liệu đá vôi nâng đứng",
    items: [
      { partCode: "PART-C05", partName: "Dây curoa răng truyền động bản rộng Gates 8M-1200", quantity: 15, unit: "Sợi", reason: "Mua dự phòng thay thế khẩn cấp và bù đắp tồn kho tối thiểu." }
    ],
    reason: "Gầu tải DEV-004 bị đứt curoa xích cấp liệu làm ngừng trệ sản xuất, số lượng tồn kho thực tế chỉ còn 2 sợi (mức an toàn tối thiểu là 10). Cần mua gấp 15 sợi để sửa chữa và khôi phục tồn kho.",
    status: "Đang mua hàng",
    approvedBy: "Trần Minh Đức (Trưởng ca)",
    approvalDate: "2026-06-25",
    procurementNotes: "Đang trình ký Sếp mua hàng từ nhà phân phối Gates Việt Nam. Đã lên đơn đặt hàng PO-8891.",
    deliveryDate: "2026-07-02",
    receptionDate: "",
    cost: 12750000
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "log-1", time: "2026-06-29T10:00:00", user: "Nguyễn Văn Hùng", action: "Đăng nhập hệ thống", details: "Đăng nhập thành công với vai trò Kỹ thuật bảo trì (Cơ điện)" },
  { id: "log-2", time: "2026-06-29T11:15:00", user: "Trần Minh Đức", action: "Duyệt phiếu sửa chữa", details: "Duyệt phiếu sửa chữa WO-260602 cho thiết bị DEV-001" },
  { id: "log-3", time: "2026-06-29T14:30:00", user: "Lê Thị Lan", action: "Cập nhật đơn đặt hàng", details: "Cập nhật trạng thái phiếu mua vật tư MR-260601 sang 'Đang mua hàng'" },
  { id: "log-4", time: "2026-06-29T16:00:00", user: "Phạm Việt Hoàng", action: "Xem báo cáo", details: "Xem báo cáo KPI và chi phí bảo trì quý 2" }
];

export function logAction(user: string, action: string, details: string): void {
  const currentLogs = readData<AuditLog[]>("auditLogs.json", INITIAL_AUDIT_LOGS);
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    user,
    action,
    details
  };
  currentLogs.unshift(newLog);
  writeData("auditLogs.json", currentLogs.slice(0, 500));
}
