import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable JSON parser with large limit for before/after photo uploads (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Data Directory Configuration
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper for persistent JSON files
function getFilePath(filename: string) {
  return path.join(DATA_DIR, filename);
}

function readData<T>(filename: string, defaultVal: T): T {
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

function writeData<T>(filename: string, data: T) {
  const file = getFilePath(filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// --- Seed Data Definitions ---
const INITIAL_USERS = [
  { id: "u1", username: "codien1", name: "Nguyễn Văn Hùng", role: "Kỹ thuật bảo trì (Cơ điện)", dept: "Tổ Cơ điện" },
  { id: "u2", username: "vattu1", name: "Lê Thị Lan", role: "Bộ phận Vật tư", dept: "Phòng Vật tư" },
  { id: "u3", username: "truongca1", name: "Trần Minh Đức", role: "Trưởng ca", dept: "Ban Quản lý Sản xuất" },
  { id: "u4", username: "lanhdao1", name: "Phạm Việt Hoàng", role: "Ban lãnh đạo", dept: "Ban Giám đốc" }
];

const INITIAL_DEVICES = [
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
    status: "Đang hoạt động", // Đang hoạt động, Đang bảo trì, Hỏng, Sắp đến hạn bảo trì
    lastMaintenance: "2026-05-10",
    cycleDays: 60, // 2 months
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
    cycleDays: 30, // 1 month
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
    cycleDays: 90, // 3 months
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

const INITIAL_PARTS = [
  {
    code: "PART-V01",
    name: "Van khí nén 5/2 SMC điện từ",
    serial: "SMC-SY5120-5D",
    category: "Vật tư sửa chữa", // Vật tư sửa chữa / Vật tư Trung tâm sản xuất
    stock: 12,
    minStock: 10,
    lifecycleMonths: 18,
    unit: "Cái",
    price: 1500000,
    origin: "Nhật Bản",
    color: "Xám bạc",
    deviceId: "DEV-001" // linked default
  },
  {
    code: "PART-B02",
    name: "Vòng bi SKF Explorer 22212",
    serial: "SKF-22212-E",
    category: "Vật tư sửa chữa",
    stock: 4,
    minStock: 8, // triggers low stock warning
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
    minStock: 10, // triggers low stock warning
    lifecycleMonths: 12,
    unit: "Sợi",
    price: 850000,
    origin: "Mỹ",
    color: "Đen tuyền",
    deviceId: "DEV-004"
  }
];

const INITIAL_WORK_ORDERS = [
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
    status: "Chờ vật tư", // Nháp, Chờ duyệt, Chờ vật tư, Sẵn sàng thực hiện, Đang sửa chữa, Hoàn thành, Đóng phiếu
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

const INITIAL_MATERIAL_REQUESTS = [
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
    status: "Đang mua hàng", // Chờ duyệt, Đã duyệt, Đang mua hàng, Đã giao hàng/Nhập kho, Bị từ chối
    approvedBy: "Trần Minh Đức (Trưởng ca)",
    approvalDate: "2026-06-25",
    procurementNotes: "Đang trình ký Sếp mua hàng từ nhà phân phối Gates Việt Nam. Đã lên đơn đặt hàng PO-8891.",
    deliveryDate: "2026-07-02",
    receptionDate: "",
    cost: 12750000
  }
];

const INITIAL_AUDIT_LOGS = [
  { id: "log-1", time: "2026-06-29T10:00:00", user: "Nguyễn Văn Hùng", action: "Đăng nhập hệ thống", details: "Đăng nhập thành công với vai trò Kỹ thuật bảo trì (Cơ điện)" },
  { id: "log-2", time: "2026-06-29T11:15:00", user: "Trần Minh Đức", action: "Duyệt phiếu sửa chữa", details: "Duyệt phiếu sửa chữa WO-260602 cho thiết bị DEV-001" },
  { id: "log-3", time: "2026-06-29T14:30:00", user: "Lê Thị Lan", action: "Cập nhật đơn đặt hàng", details: "Cập nhật trạng thái phiếu mua vật tư MR-260601 sang 'Đang mua hàng'" },
  { id: "log-4", time: "2026-06-29T16:00:00", user: "Phạm Việt Hoàng", action: "Xem báo cáo", details: "Xem báo cáo KPI và chi phí bảo trì quý 2" }
];

// Load current files or initialize with seeds
const devices = readData("devices.json", INITIAL_DEVICES);
const parts = readData("parts.json", INITIAL_PARTS);
const workOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
const materialRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);
const auditLogs = readData("auditLogs.json", INITIAL_AUDIT_LOGS);

// Logging helper
function logAction(user: string, action: string, details: string) {
  const currentLogs = readData("auditLogs.json", INITIAL_AUDIT_LOGS);
  const newLog = {
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    user,
    action,
    details
  };
  currentLogs.unshift(newLog);
  writeData("auditLogs.json", currentLogs.slice(0, 500)); // limit 500 logs
}

// --- API Endpoints ---

// Simulated authentication / role switcher info
app.get("/api/users", (req, res) => {
  res.json(INITIAL_USERS);
});

app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;
  const user = INITIAL_USERS.find(u => u.username === username);
  if (user) {
    logAction(user.name, "Đăng nhập", `Người dùng ${user.name} đăng nhập với vai trò ${user.role}`);
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Sai tên đăng nhập!" });
  }
});

// 1. Devices Endpoint
app.get("/api/devices", (req, res) => {
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  res.json(currentDevices);
});

app.post("/api/devices", (req, res) => {
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  const newDevice = { ...req.body, id: req.body.code || `DEV-${Date.now().toString().slice(-4)}` };
  currentDevices.push(newDevice);
  writeData("devices.json", currentDevices);
  logAction(req.query.user as string || "Hệ thống", "Thêm thiết bị", `Thêm mới thiết bị ${newDevice.name} (${newDevice.code})`);
  res.json({ success: true, device: newDevice });
});

app.put("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  const index = currentDevices.findIndex(d => d.id === id);
  if (index !== -1) {
    currentDevices[index] = { ...currentDevices[index], ...req.body };
    writeData("devices.json", currentDevices);
    logAction(req.query.user as string || "Hệ thống", "Cập nhật thiết bị", `Cập nhật thông tin thiết bị ${currentDevices[index].name} (${id})`);
    res.json({ success: true, device: currentDevices[index] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy thiết bị!" });
  }
});

app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  let currentDevices = readData("devices.json", INITIAL_DEVICES);
  const deviceToDelete = currentDevices.find(d => d.id === id);
  if (deviceToDelete) {
    currentDevices = currentDevices.filter(d => d.id !== id);
    writeData("devices.json", currentDevices);
    logAction(req.query.user as string || "Hệ thống", "Xóa thiết bị", `Xóa thiết bị ${deviceToDelete.name} (${id})`);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy thiết bị!" });
  }
});

// 2. Parts (Linh kiện / Kho vật tư) Endpoint
app.get("/api/parts", (req, res) => {
  const currentParts = readData("parts.json", INITIAL_PARTS);
  res.json(currentParts);
});

app.post("/api/parts", (req, res) => {
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const newPart = { ...req.body };
  // Check duplication
  const existing = currentParts.find(p => p.code === newPart.code);
  if (existing) {
    return res.status(400).json({ success: false, message: `Mã linh kiện ${newPart.code} đã tồn tại!` });
  }
  currentParts.push(newPart);
  writeData("parts.json", currentParts);
  logAction(req.query.user as string || "Hệ thống", "Thêm linh kiện", `Thêm mới linh kiện ${newPart.name} (${newPart.code})`);
  res.json({ success: true, part: newPart });
});

app.post("/api/parts/import", (req, res) => {
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const { parts: importedParts, user } = req.body;
  if (!Array.isArray(importedParts)) {
    return res.status(400).json({ success: false, message: "Dữ liệu import không hợp lệ" });
  }

  let countAdded = 0;
  let countUpdated = 0;

  importedParts.forEach((item: any) => {
    if (!item.code || !item.name) return;
    const idx = currentParts.findIndex(p => p.code === item.code);
    if (idx !== -1) {
      currentParts[idx] = { ...currentParts[idx], ...item };
      countUpdated++;
    } else {
      currentParts.push({
        code: item.code,
        name: item.name,
        serial: item.serial || "",
        category: item.category || "Vật tư sửa chữa",
        stock: parseInt(item.stock) || 0,
        minStock: parseInt(item.minStock) || 10,
        lifecycleMonths: parseInt(item.lifecycleMonths) || 12,
        unit: item.unit || "Cái",
        price: parseInt(item.price) || 0,
        origin: item.origin || "",
        color: item.color || "",
        deviceId: item.deviceId || ""
      });
      countAdded++;
    }
  });

  writeData("parts.json", currentParts);
  logAction(user || "Hệ thống", "Nhập khẩu vật tư", `Đã nhập khẩu linh kiện/vật tư: Thêm mới ${countAdded}, Cập nhật ${countUpdated}`);
  res.json({ success: true, added: countAdded, updated: countUpdated });
});

app.put("/api/parts/:code", (req, res) => {
  const { code } = req.params;
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const index = currentParts.findIndex(p => p.code === code);
  if (index !== -1) {
    currentParts[index] = { ...currentParts[index], ...req.body };
    writeData("parts.json", currentParts);
    logAction(req.query.user as string || "Hệ thống", "Cập nhật linh kiện", `Cập nhật thông tin linh kiện ${currentParts[index].name} (${code})`);
    res.json({ success: true, part: currentParts[index] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy linh kiện!" });
  }
});

app.delete("/api/parts/:code", (req, res) => {
  const { code } = req.params;
  let currentParts = readData("parts.json", INITIAL_PARTS);
  const partToDelete = currentParts.find(p => p.code === code);
  if (partToDelete) {
    currentParts = currentParts.filter(p => p.code !== code);
    writeData("parts.json", currentParts);
    logAction(req.query.user as string || "Hệ thống", "Xóa linh kiện", `Xóa linh kiện ${partToDelete.name} (${code})`);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy linh kiện!" });
  }
});

// 3. Work Orders Endpoint (Quy trình 7 trạng thái)
app.get("/api/work-orders", (req, res) => {
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  res.json(currentWorkOrders);
});

app.post("/api/work-orders", (req, res) => {
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const newWO = {
    ...req.body,
    id: req.body.code || `WO-${Date.now().toString().slice(-6)}`,
    code: req.body.code || `WO-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0]
  };
  currentWorkOrders.push(newWO);
  writeData("workOrders.json", currentWorkOrders);
  logAction(req.query.user as string || "Hệ thống", "Tạo phiếu sửa chữa", `Đã tạo phiếu sửa chữa mới ${newWO.code} cho thiết bị ${newWO.deviceName}`);
  res.json({ success: true, workOrder: newWO });
});

app.put("/api/work-orders/:id", (req, res) => {
  const { id } = req.params;
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const currentDevices = readData("devices.json", INITIAL_DEVICES);

  const index = currentWorkOrders.findIndex(w => w.id === id);
  if (index !== -1) {
    const oldWO = currentWorkOrders[index];
    const updatedWO = { ...oldWO, ...req.body };

    // --- State Machine & Inventory Decrement Logic ---
    // If work order is moved to "Hoàn thành" or "Đóng phiếu" AND it wasn't already in those states:
    const isNowCompleted = (updatedWO.status === "Hoàn thành" || updatedWO.status === "Đóng phiếu");
    const wasAlreadyCompleted = (oldWO.status === "Hoàn thành" || oldWO.status === "Đóng phiếu");

    if (isNowCompleted && !wasAlreadyCompleted) {
      // Automatic inventory deduct for parts used!
      if (Array.isArray(updatedWO.partsUsed)) {
        updatedWO.partsUsed.forEach((item: any) => {
          const partIdx = currentParts.findIndex(p => p.code === item.partCode);
          if (partIdx !== -1) {
            const originalStock = currentParts[partIdx].stock;
            const newStock = Math.max(0, originalStock - item.quantity);
            currentParts[partIdx].stock = newStock;
            
            logAction(
              req.query.user as string || "Hệ thống",
              "Tự động xuất kho",
              `Tự động trừ kho vật tư ${currentParts[partIdx].name} (Trừ ${item.quantity} cái, Tồn kho mới: ${newStock}) do đóng phiếu ${updatedWO.code}`
            );
          }
        });
        writeData("parts.json", currentParts);
      }

      // Automatically update the device status back to "Đang hoạt động" or mark last maintenance date!
      const devIndex = currentDevices.findIndex(d => d.id === updatedWO.deviceId);
      if (devIndex !== -1) {
        currentDevices[devIndex].status = "Đang hoạt động";
        currentDevices[devIndex].lastMaintenance = new Date().toISOString().split("T")[0];
        writeData("devices.json", currentDevices);
      }
    }

    // If marked as "Chờ vật tư", automatically flag the device as "Đang bảo trì" or "Hỏng"
    if (updatedWO.status === "Chờ vật tư" && oldWO.status !== "Chờ vật tư") {
      const devIndex = currentDevices.findIndex(d => d.id === updatedWO.deviceId);
      if (devIndex !== -1 && currentDevices[devIndex].status === "Đang hoạt động") {
        currentDevices[devIndex].status = "Đang bảo trì";
        writeData("devices.json", currentDevices);
      }
    }

    currentWorkOrders[index] = updatedWO;
    writeData("workOrders.json", currentWorkOrders);

    logAction(
      req.query.user as string || "Hệ thống",
      "Cập nhật phiếu sửa chữa",
      `Cập nhật phiếu ${updatedWO.code} sang trạng thái "${updatedWO.status}"`
    );
    res.json({ success: true, workOrder: updatedWO });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy phiếu sửa chữa!" });
  }
});

app.delete("/api/work-orders/:id", (req, res) => {
  const { id } = req.params;
  let currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const wo = currentWorkOrders.find(w => w.id === id);
  if (wo) {
    currentWorkOrders = currentWorkOrders.filter(w => w.id !== id);
    writeData("workOrders.json", currentWorkOrders);
    logAction(req.query.user as string || "Hệ thống", "Xóa phiếu sửa chữa", `Xóa phiếu sửa chữa ${wo.code}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy phiếu!" });
  }
});

// 4. Material Requests Endpoint (Mua hàng & Liên kết vật tư)
app.get("/api/material-requests", (req, res) => {
  const currentRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);
  res.json(currentRequests);
});

app.post("/api/material-requests", (req, res) => {
  const currentRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);
  const newReq = {
    ...req.body,
    id: req.body.code || `MR-${Date.now().toString().slice(-6)}`,
    code: req.body.code || `MR-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0]
  };
  currentRequests.push(newReq);
  writeData("materialRequests.json", currentRequests);

  // Link status updates in the related work order if applicable
  if (newReq.workOrderId) {
    const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
    const woIndex = currentWorkOrders.findIndex(w => w.id === newReq.workOrderId);
    if (woIndex !== -1) {
      currentWorkOrders[woIndex].status = "Chờ vật tư";
      currentWorkOrders[woIndex].notes = `Đã tạo phiếu yêu cầu vật tư liên quan ${newReq.code} và gửi đến phòng vật tư.`;
      writeData("workOrders.json", currentWorkOrders);
    }
  }

  logAction(
    req.query.user as string || "Hệ thống",
    "Tạo đề xuất mua vật tư",
    `Tạo phiếu yêu cầu mua vật tư ${newReq.code} liên kết với phiếu sửa chữa ${newReq.workOrderId || "không có"}`
  );
  res.json({ success: true, materialRequest: newReq });
});

app.put("/api/material-requests/:id", (req, res) => {
  const { id } = req.params;
  const currentRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);

  const index = currentRequests.findIndex(r => r.id === id);
  if (index !== -1) {
    const oldReq = currentRequests[index];
    const updatedReq = { ...oldReq, ...req.body };

    // Handle warehouse reception when moving to "Đã giao hàng/Nhập kho"
    const isNowReceived = (updatedReq.status === "Đã giao hàng/Nhập kho");
    const wasAlreadyReceived = (oldReq.status === "Đã giao hàng/Nhập kho");

    if (isNowReceived && !wasAlreadyReceived) {
      // Dynamic addition to inventory
      updatedReq.items.forEach((item: any) => {
        const partIdx = currentParts.findIndex(p => p.code === item.partCode);
        if (partIdx !== -1) {
          const originalStock = currentParts[partIdx].stock;
          const receivedQty = item.quantity;
          currentParts[partIdx].stock = originalStock + receivedQty;
          
          logAction(
            req.query.user as string || "Hệ thống",
            "Nhập kho vật tư",
            `Nhập kho thành công ${item.partName} (+${receivedQty} cái, Tồn kho mới: ${currentParts[partIdx].stock})`
          );
        } else {
          // If the part is brand new and was declared, add it to catalog
          currentParts.push({
            code: item.partCode,
            name: item.partName,
            serial: "",
            category: "Vật tư sửa chữa",
            stock: item.quantity,
            minStock: 10,
            lifecycleMonths: 12,
            unit: item.unit || "Cái",
            price: item.price || 0,
            origin: "",
            color: "",
            deviceId: updatedReq.deviceId || ""
          });
          logAction(
            req.query.user as string || "Hệ thống",
            "Tự động tạo & nhập kho",
            `Thêm mới linh kiện chưa có trong hệ thống và nhập kho: ${item.partName} (+${item.quantity})`
          );
        }
      });
      writeData("parts.json", currentParts);
      updatedReq.receptionDate = new Date().toISOString().split("T")[0];

      // Auto notify/update the linked work order! From "Chờ vật tư" to "Sẵn sàng thực hiện"
      if (updatedReq.workOrderId) {
        const woIdx = currentWorkOrders.findIndex(w => w.id === updatedReq.workOrderId);
        if (woIdx !== -1) {
          currentWorkOrders[woIdx].status = "Sẵn sàng thực hiện";
          currentWorkOrders[woIdx].notes = `Vật tư từ phiếu ${updatedReq.code} đã nhập kho thành công. Sẵn sàng thực hiện sửa chữa thiết bị.`;
          writeData("workOrders.json", currentWorkOrders);
          logAction(
            "Hệ thống",
            "Cập nhật phiếu sửa chữa tự động",
            `Cập nhật phiếu sửa chữa ${currentWorkOrders[woIdx].code} sang trạng thái "Sẵn sàng thực hiện" do vật tư đã về`
          );
        }
      }
    }

    currentRequests[index] = updatedReq;
    writeData("materialRequests.json", currentRequests);

    logAction(
      req.query.user as string || "Hệ thống",
      "Cập nhật phiếu yêu cầu vật tư",
      `Cập nhật trạng thái phiếu mua vật tư ${updatedReq.code} sang "${updatedReq.status}"`
    );
    res.json({ success: true, materialRequest: updatedReq });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy phiếu yêu cầu!" });
  }
});

// 5. Executive Dashboard Stats
app.get("/api/dashboard", (req, res) => {
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const currentRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);

  // Totals
  const totalDevices = currentDevices.length;
  const activeDevices = currentDevices.filter(d => d.status === "Đang hoạt động").length;
  const maintainingDevices = currentDevices.filter(d => d.status === "Đang bảo trì").length;
  const brokenDevices = currentDevices.filter(d => d.status === "Hỏng").length;
  
  // Calculate upcoming maintenance based on lastMaintenance + cycleDays vs Current Date
  const today = new Date();
  let upcomingMaintenanceCount = 0;
  currentDevices.forEach(d => {
    if (d.lastMaintenance) {
      const last = new Date(d.lastMaintenance);
      const next = new Date(last.getTime() + (d.cycleDays || 30) * 24 * 60 * 60 * 1000);
      const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Sắp đến hạn bảo trì if within 10 days, or already overdue
      if (diffDays <= 10 || d.status === "Sắp đến hạn bảo trì") {
        upcomingMaintenanceCount++;
      }
    }
  });

  // Low stock warning count (< 10 or < minStock)
  const lowStockParts = currentParts.filter(p => p.stock < p.minStock);

  // Top broken equipment
  // Count frequency in work orders
  const faultCounts: { [key: string]: { name: string; count: number } } = {};
  currentWorkOrders.forEach(w => {
    if (w.deviceId) {
      if (!faultCounts[w.deviceId]) {
        faultCounts[w.deviceId] = { name: w.deviceName || w.deviceId, count: 0 };
      }
      faultCounts[w.deviceId].count++;
    }
  });
  const topBrokenDevices = Object.keys(faultCounts).map(id => ({
    id,
    name: faultCounts[id].name,
    count: faultCounts[id].count
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Maintenance cost by month (mocked for past months + actual for completed work orders)
  const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const currentMonth = today.getMonth(); // 0-11
  
  // Create an array of last 6 months
  const monthlyCosts = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(today.getMonth() - (5 - idx));
    const m = d.getMonth();
    const y = d.getFullYear();
    // Default mock background costs
    let cost = [12000000, 18500000, 9000000, 24000000, 15000000, 8000000][idx] || 10000000;
    
    // Add real costs from completed/closed work orders in that month/year
    currentWorkOrders.forEach(w => {
      if (w.completedDate && (w.status === "Hoàn thành" || w.status === "Đóng phiếu")) {
        const compDate = new Date(w.completedDate);
        if (compDate.getMonth() === m && compDate.getFullYear() === y) {
          cost += w.cost || 0;
        }
      }
    });

    // Add material request costs approved/received in that month
    currentRequests.forEach(mr => {
      if (mr.receptionDate && mr.status === "Đã giao hàng/Nhập kho") {
        const recDate = new Date(mr.receptionDate);
        if (recDate.getMonth() === m && recDate.getFullYear() === y) {
          cost += mr.cost || 0;
        }
      }
    });

    return {
      month: `${monthNames[m]}/${y}`,
      cost
    };
  });

  // Calculate MTBF (Mean Time Between Failures) and MTTR (Mean Time To Repair)
  // Standard simulated values based on actual work orders completed
  let totalRepairDuration = 0;
  let completedCount = 0;
  currentWorkOrders.forEach(w => {
    if (w.durationHours && w.durationHours > 0) {
      totalRepairDuration += w.durationHours;
      completedCount++;
    }
  });

  const mttr = completedCount > 0 ? parseFloat((totalRepairDuration / completedCount).toFixed(1)) : 3.5; // default 3.5 hours
  const mtbf = totalDevices > 0 ? parseFloat((720 / Math.max(1, currentWorkOrders.length)).toFixed(1)) : 120.0; // default days/hours between failures
  const oee = parseFloat((92.4 - (brokenDevices * 2.5)).toFixed(1)); // simulated efficiency index

  res.json({
    totalDevices,
    activeDevices,
    maintainingDevices,
    brokenDevices,
    upcomingMaintenanceCount,
    lowStockCount: lowStockParts.length,
    lowStockParts,
    topBrokenDevices,
    monthlyCosts,
    mttr,
    mtbf,
    oee
  });
});

// 6. Audit Logs Endpoint
app.get("/api/audit-logs", (req, res) => {
  const currentLogs = readData("auditLogs.json", INITIAL_AUDIT_LOGS);
  res.json(currentLogs);
});

// Vite Middleware for Full Stack Experience
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SADICO CMMS] Server running on http://localhost:${PORT}`);
  });
}

startServer();
