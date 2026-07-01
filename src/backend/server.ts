import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  readData,
  writeData,
  logAction,
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_PARTS,
  INITIAL_WORK_ORDERS,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PM_PLANS,
} from "../database/dataStore";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API Endpoints ---

// 0. Roles Endpoints
app.get("/api/roles", (req, res) => {
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  res.json(currentRoles);
});

app.post("/api/roles", (req, res) => {
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  const newRole = { ...req.body };
  if (!newRole.id) {
    newRole.id = `role-${Date.now().toString().slice(-4)}`;
  }
  currentRoles.push(newRole);
  writeData("roles.json", currentRoles);
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Thêm vai trò",
    `Thêm mới vai trò ${newRole.name} (${newRole.id})`
  );
  res.json({ success: true, role: newRole });
});

app.put("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  const idx = currentRoles.findIndex(r => r.id === id);
  if (idx !== -1) {
    currentRoles[idx] = { ...currentRoles[idx], ...req.body };
    writeData("roles.json", currentRoles);
    
    // Đồng bộ lại role hiển thị cho các user thuộc vai trò này
    const currentUsers = readData("users.json", INITIAL_USERS);
    let updatedUsersCount = 0;
    currentUsers.forEach(u => {
      if (u.roleId === id) {
        u.role = currentRoles[idx].name;
        u.roleDetails = currentRoles[idx];
        updatedUsersCount++;
      }
    });
    if (updatedUsersCount > 0) {
      writeData("users.json", currentUsers);
    }

    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật vai trò",
      `Cập nhật quyền hạn vai trò ${currentRoles[idx].name} (${id})`
    );
    res.json({ success: true, role: currentRoles[idx] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy vai trò!" });
  }
});

app.delete("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  let currentRoles = readData("roles.json", INITIAL_ROLES);
  const roleToDelete = currentRoles.find(r => r.id === id);
  if (roleToDelete) {
    currentRoles = currentRoles.filter(r => r.id !== id);
    writeData("roles.json", currentRoles);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa vai trò",
      `Xóa vai trò ${roleToDelete.name} (${id})`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy vai trò!" });
  }
});

// Authentication / User endpoints
app.get("/api/users", (req, res) => {
  const currentUsers = readData("users.json", INITIAL_USERS);
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  
  // Ánh xạ động thông tin vai trò mới nhất
  const mappedUsers = currentUsers.map(u => {
    const roleDetails = currentRoles.find(r => r.id === u.roleId) || INITIAL_ROLES.find(r => r.id === u.roleId);
    return {
      ...u,
      role: roleDetails ? roleDetails.name : u.role,
      roleDetails: roleDetails || u.roleDetails
    };
  });
  res.json(mappedUsers);
});

app.post("/api/users", (req, res) => {
  const currentUsers = readData("users.json", INITIAL_USERS);
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  const newUser = { ...req.body };
  if (!newUser.id) {
    newUser.id = `u-${Date.now().toString().slice(-4)}`;
  }
  if (!newUser.password) {
    newUser.password = "123456";
  }
  
  const roleDetails = currentRoles.find(r => r.id === newUser.roleId) || INITIAL_ROLES.find(r => r.id === newUser.roleId);
  newUser.role = roleDetails ? roleDetails.name : (newUser.role || "Kỹ thuật bảo trì (Cơ điện)");
  newUser.roleDetails = roleDetails;

  currentUsers.push(newUser);
  writeData("users.json", currentUsers);
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Thêm người dùng",
    `Thêm mới tài khoản ${newUser.name} (${newUser.username})`
  );
  res.json({ success: true, user: newUser });
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const currentUsers = readData("users.json", INITIAL_USERS);
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  const idx = currentUsers.findIndex(u => u.id === id);
  if (idx !== -1) {
    const roleDetails = currentRoles.find(r => r.id === req.body.roleId) || INITIAL_ROLES.find(r => r.id === req.body.roleId);
    
    // Nếu mật khẩu rỗng hoặc không đổi, giữ nguyên mật khẩu cũ
    const updatedPassword = req.body.password || currentUsers[idx].password || "123456";
    
    currentUsers[idx] = { 
      ...currentUsers[idx], 
      ...req.body,
      password: updatedPassword,
      role: roleDetails ? roleDetails.name : (req.body.role || currentUsers[idx].role),
      roleDetails: roleDetails || currentUsers[idx].roleDetails
    };
    writeData("users.json", currentUsers);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật tài khoản",
      `Cập nhật thông tin tài khoản ${currentUsers[idx].name} (${id})`
    );
    res.json({ success: true, user: currentUsers[idx] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  let currentUsers = readData("users.json", INITIAL_USERS);
  const userToDelete = currentUsers.find(u => u.id === id);
  if (userToDelete) {
    currentUsers = currentUsers.filter(u => u.id !== id);
    writeData("users.json", currentUsers);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa người dùng",
      `Xóa tài khoản ${userToDelete.name} (${id})`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const currentUsers = readData("users.json", INITIAL_USERS);
  const currentRoles = readData("roles.json", INITIAL_ROLES);
  const user = currentUsers.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ success: false, message: "Sai tên đăng nhập!" });
  }

  // Khớp với mật khẩu lưu trong DB, hoặc các mật khẩu mặc định 'sadico123' / '123456'
  const userPassword = user.password || "123456";
  if (password !== userPassword && password !== "sadico123" && password !== "123456") {
    return res.status(401).json({ success: false, message: "Mật khẩu không chính xác!" });
  }

  const roleDetails = currentRoles.find(r => r.id === user.roleId) || INITIAL_ROLES.find(r => r.id === user.roleId);
  const enrichedUser = {
    ...user,
    role: roleDetails ? roleDetails.name : user.role,
    roleDetails: roleDetails || user.roleDetails
  };

  logAction(
    enrichedUser.name,
    "Đăng nhập",
    `Người dùng ${enrichedUser.name} đăng nhập thành công với vai trò ${enrichedUser.role}`
  );
  res.json({ success: true, user: enrichedUser });
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
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Thêm thiết bị",
    `Thêm mới thiết bị ${newDevice.name} (${newDevice.code})`
  );
  res.json({ success: true, device: newDevice });
});

app.put("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  const index = currentDevices.findIndex((d) => d.id === id);
  if (index !== -1) {
    currentDevices[index] = { ...currentDevices[index], ...req.body };
    writeData("devices.json", currentDevices);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật thiết bị",
      `Cập nhật thông tin thiết bị ${currentDevices[index].name} (${id})`
    );
    res.json({ success: true, device: currentDevices[index] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy thiết bị!" });
  }
});

app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  let currentDevices = readData("devices.json", INITIAL_DEVICES);
  const deviceToDelete = currentDevices.find((d) => d.id === id);
  if (deviceToDelete) {
    currentDevices = currentDevices.filter((d) => d.id !== id);
    writeData("devices.json", currentDevices);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa thiết bị",
      `Xóa thiết bị ${deviceToDelete.name} (${id})`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy thiết bị!" });
  }
});

// 2. Parts Endpoint
app.get("/api/parts", (req, res) => {
  const currentParts = readData("parts.json", INITIAL_PARTS);
  res.json(currentParts);
});

app.post("/api/parts", (req, res) => {
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const newPart = { ...req.body };
  const existing = currentParts.find((p) => p.code === newPart.code);
  if (existing) {
    return res.status(400).json({ success: false, message: `Mã linh kiện ${newPart.code} đã tồn tại!` });
  }
  currentParts.push(newPart);
  writeData("parts.json", currentParts);
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Thêm linh kiện",
    `Thêm mới linh kiện ${newPart.name} (${newPart.code})`
  );
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
    const idx = currentParts.findIndex((p) => p.code === item.code);
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
        deviceId: item.deviceId || "",
      });
      countAdded++;
    }
  });

  writeData("parts.json", currentParts);
  logAction(
    user || "Hệ thống",
    "Nhập khẩu vật tư",
    `Đã nhập khẩu linh kiện/vật tư: Thêm mới ${countAdded}, Cập nhật ${countUpdated}`
  );
  res.json({ success: true, added: countAdded, updated: countUpdated });
});

app.put("/api/parts/:code", (req, res) => {
  const { code } = req.params;
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const index = currentParts.findIndex((p) => p.code === code);
  if (index !== -1) {
    currentParts[index] = { ...currentParts[index], ...req.body };
    writeData("parts.json", currentParts);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật linh kiện",
      `Cập nhật thông tin linh kiện ${currentParts[index].name} (${code})`
    );
    res.json({ success: true, part: currentParts[index] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy linh kiện!" });
  }
});

app.delete("/api/parts/:code", (req, res) => {
  const { code } = req.params;
  let currentParts = readData("parts.json", INITIAL_PARTS);
  const partToDelete = currentParts.find((p) => p.code === code);
  if (partToDelete) {
    currentParts = currentParts.filter((p) => p.code !== code);
    writeData("parts.json", currentParts);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa linh kiện",
      `Xóa linh kiện ${partToDelete.name} (${code})`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy linh kiện!" });
  }
});

// 3. Work Orders Endpoint
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
    date: new Date().toISOString().split("T")[0],
  };
  currentWorkOrders.push(newWO);
  writeData("workOrders.json", currentWorkOrders);
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Tạo phiếu sửa chữa",
    `Đã tạo phiếu sửa chữa mới ${newWO.code} cho thiết bị ${newWO.deviceName}`
  );
  res.json({ success: true, workOrder: newWO });
});

app.put("/api/work-orders/:id", (req, res) => {
  const { id } = req.params;
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const currentDevices = readData("devices.json", INITIAL_DEVICES);

  const index = currentWorkOrders.findIndex((w) => w.id === id);
  if (index !== -1) {
    const oldWO = currentWorkOrders[index];
    const updatedWO = { ...oldWO, ...req.body };

    // State Machine & Inventory Decrement Logic
    const isNowCompleted = updatedWO.status === "Hoàn thành" || updatedWO.status === "Đóng phiếu";
    const wasAlreadyCompleted = oldWO.status === "Hoàn thành" || oldWO.status === "Đóng phiếu";

    if (isNowCompleted && !wasAlreadyCompleted) {
      if (Array.isArray(updatedWO.partsUsed)) {
        updatedWO.partsUsed.forEach((item: any) => {
          const partIdx = currentParts.findIndex((p) => p.code === item.partCode);
          if (partIdx !== -1) {
            const originalStock = currentParts[partIdx].stock;
            const newStock = Math.max(0, originalStock - item.quantity);
            currentParts[partIdx].stock = newStock;

            logAction(
              (req.query.user as string) || "Hệ thống",
              "Tự động xuất kho",
              `Tự động trừ kho vật tư ${currentParts[partIdx].name} (Trừ ${item.quantity} cái, Tồn kho mới: ${newStock}) do đóng phiếu ${updatedWO.code}`
            );
          }
        });
        writeData("parts.json", currentParts);
      }

      const devIndex = currentDevices.findIndex((d) => d.id === updatedWO.deviceId);
      if (devIndex !== -1) {
        currentDevices[devIndex].status = "Đang hoạt động";
        currentDevices[devIndex].lastMaintenance = new Date().toISOString().split("T")[0];
        writeData("devices.json", currentDevices);
      }
    }

    if (updatedWO.status === "Chờ vật tư" && oldWO.status !== "Chờ vật tư") {
      const devIndex = currentDevices.findIndex((d) => d.id === updatedWO.deviceId);
      if (devIndex !== -1 && currentDevices[devIndex].status === "Đang hoạt động") {
        currentDevices[devIndex].status = "Đang bảo trì";
        writeData("devices.json", currentDevices);
      }
    }

    currentWorkOrders[index] = updatedWO;
    writeData("workOrders.json", currentWorkOrders);

    logAction(
      (req.query.user as string) || "Hệ thống",
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
  const wo = currentWorkOrders.find((w) => w.id === id);
  if (wo) {
    currentWorkOrders = currentWorkOrders.filter((w) => w.id !== id);
    writeData("workOrders.json", currentWorkOrders);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa phiếu sửa chữa",
      `Xóa phiếu sửa chữa ${wo.code}`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy phiếu!" });
  }
});

// 4. Material Requests Endpoint
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
    date: new Date().toISOString().split("T")[0],
  };
  currentRequests.push(newReq);
  writeData("materialRequests.json", currentRequests);

  if (newReq.workOrderId) {
    const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
    const woIndex = currentWorkOrders.findIndex((w) => w.id === newReq.workOrderId);
    if (woIndex !== -1) {
      currentWorkOrders[woIndex].status = "Chờ vật tư";
      currentWorkOrders[woIndex].notes = `Đã tạo phiếu yêu cầu vật tư liên quan ${newReq.code} và gửi đến phòng vật tư.`;
      writeData("workOrders.json", currentWorkOrders);
    }
  }

  logAction(
    (req.query.user as string) || "Hệ thống",
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

  const index = currentRequests.findIndex((r) => r.id === id);
  if (index !== -1) {
    const oldReq = currentRequests[index];
    const updatedReq = { ...oldReq, ...req.body };

    const isNowReceived = updatedReq.status === "Đã giao hàng/Nhập kho";
    const wasAlreadyReceived = oldReq.status === "Đã giao hàng/Nhập kho";

    if (isNowReceived && !wasAlreadyReceived) {
      const targetItems = updatedReq.actualItems && updatedReq.actualItems.length > 0
        ? updatedReq.actualItems
        : updatedReq.items;

      const userStr = (req.query.user as string) || "Bộ phận Vật tư";
      const invoiceStr = updatedReq.invoiceNo ? ` (Số chứng từ: ${updatedReq.invoiceNo})` : "";
      const supplierStr = updatedReq.supplierName ? ` từ nhà cung cấp ${updatedReq.supplierName}` : "";
      const warehouseStr = updatedReq.warehouseName || "Kho Vật Tư Trung Tâm";

      targetItems.forEach((item: any) => {
        const partIdx = currentParts.findIndex((p) => p.code === item.partCode);
        const targetCategory = warehouseStr === "Kho Vật Tư Dự Phòng Xưởng"
          ? "Vật tư Trung tâm sản xuất"
          : "Vật tư sửa chữa";

        if (partIdx !== -1) {
          const originalStock = currentParts[partIdx].stock;
          const receivedQty = item.quantity;
          currentParts[partIdx].stock = originalStock + receivedQty;
          currentParts[partIdx].category = targetCategory;

          logAction(
            userStr,
            "Nhập kho vật tư",
            `Nhập kho thành công ${item.partName} (+${receivedQty} ${item.unit || "cái"}${supplierStr}${invoiceStr} tại ${warehouseStr}. Tồn kho mới: ${currentParts[partIdx].stock})`
          );
        } else {
          currentParts.push({
            code: item.partCode,
            name: item.partName,
            serial: "",
            category: targetCategory,
            stock: item.quantity,
            minStock: 10,
            lifecycleMonths: 12,
            unit: item.unit || "Cái",
            price: item.price || 0,
            origin: "",
            color: "",
            deviceId: updatedReq.deviceId || "",
          });
          logAction(
            userStr,
            "Tự động tạo & nhập kho",
            `Thêm mới linh kiện chưa có trong hệ thống và nhập kho: ${item.partName} (+${item.quantity} ${item.unit || "cái"} tại ${warehouseStr})`
          );
        }
      });
      writeData("parts.json", currentParts);
      updatedReq.receptionDate = new Date().toISOString().split("T")[0];

      // Auto check and update ALL Work Orders that were "Chờ vật tư"
      currentWorkOrders.forEach((wo: any) => {
        if (wo.status === "Chờ vật tư") {
          let allPartsAvailable = true;
          const detailedStockChecks: string[] = [];

          wo.partsUsed.forEach((pu: any) => {
            const partObj = currentParts.find((p) => p.code === pu.partCode);
            const currentStock = partObj ? partObj.stock : 0;
            if (currentStock < pu.quantity) {
              allPartsAvailable = false;
            }
            detailedStockChecks.push(`${pu.partName}: cần ${pu.quantity}, hiện có ${currentStock}`);
          });

          if (allPartsAvailable && wo.partsUsed.length > 0) {
            wo.status = "Sẵn sàng thực hiện";
            wo.notes = `Vật tư đã được bồi đắp đủ trong kho nhờ đợt nhập hàng từ đề xuất ${updatedReq.code}. Tự động chuyển trạng thái để Kỹ thuật tiến hành sửa chữa.`;
            
            if (!wo.history) {
              wo.history = [];
            }
            wo.history.push({
              time: new Date().toISOString(),
              user: "Hệ thống Tự động",
              action: "Tự động duyệt vật tư đủ",
              details: `Kiểm tra thấy đủ vật tư trong kho. Chi tiết tồn kho: ${detailedStockChecks.join("; ")}`
            });

            logAction(
              "Hệ thống",
              "Cập nhật phiếu sửa chữa tự động",
              `Cập nhật phiếu sửa chữa ${wo.code} sang trạng thái "Sẵn sàng thực hiện" do đủ vật tư`
            );
          }
        }
      });
      writeData("workOrders.json", currentWorkOrders);
    }

    currentRequests[index] = updatedReq;
    writeData("materialRequests.json", currentRequests);

    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật phiếu yêu cầu vật tư",
      `Cập nhật trạng thái phiếu mua vật tư ${updatedReq.code} sang "${updatedReq.status}"`
    );
    res.json({ success: true, materialRequest: updatedReq });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy phiếu yêu cầu!" });
  }
});

// 4.5. Preventive Maintenance (PM) Plans Endpoints
app.get("/api/pm-plans", (req, res) => {
  const plans = readData("pmPlans.json", INITIAL_PM_PLANS);
  // Cập nhật trạng thái dựa trên ngày hiện tại
  const today = new Date();
  const updatedPlans = plans.map(p => {
    const dueDate = new Date(p.nextDueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = p.status;
    if (diffDays < 0) {
      status = "Quá hạn";
    } else if (diffDays <= 7) {
      status = "Sắp đến hạn";
    } else {
      status = "Đúng hạn";
    }
    return { ...p, status };
  });
  res.json(updatedPlans);
});

app.post("/api/pm-plans", (req, res) => {
  const plans = readData("pmPlans.json", INITIAL_PM_PLANS);
  const newPlan = { ...req.body };
  if (!newPlan.id) {
    newPlan.id = `PM-${Date.now().toString().slice(-4)}`;
  }
  if (!newPlan.code) {
    newPlan.code = newPlan.id;
  }
  plans.push(newPlan);
  writeData("pmPlans.json", plans);
  
  logAction(
    (req.query.user as string) || "Hệ thống",
    "Tạo kế hoạch bảo trì",
    `Tạo kế hoạch bảo trì định kỳ ${newPlan.name} cho thiết bị ${newPlan.deviceName}`
  );
  res.json({ success: true, plan: newPlan });
});

app.put("/api/pm-plans/:id", (req, res) => {
  const { id } = req.params;
  const plans = readData("pmPlans.json", INITIAL_PM_PLANS);
  const idx = plans.findIndex(p => p.id === id);
  if (idx !== -1) {
    plans[idx] = { ...plans[idx], ...req.body };
    writeData("pmPlans.json", plans);
    
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Cập nhật kế hoạch bảo trì",
      `Cập nhật kế hoạch bảo trì định kỳ ${plans[idx].name}`
    );
    res.json({ success: true, plan: plans[idx] });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch!" });
  }
});

app.delete("/api/pm-plans/:id", (req, res) => {
  const { id } = req.params;
  let plans = readData("pmPlans.json", INITIAL_PM_PLANS);
  const planToDelete = plans.find(p => p.id === id);
  if (planToDelete) {
    plans = plans.filter(p => p.id !== id);
    writeData("pmPlans.json", plans);
    logAction(
      (req.query.user as string) || "Hệ thống",
      "Xóa kế hoạch bảo trì",
      `Xóa kế hoạch bảo trì định kỳ ${planToDelete.name}`
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch!" });
  }
});

// Trực tiếp kích hoạt bảo trì từ kế hoạch PM
app.post("/api/pm-plans/:id/trigger", (req, res) => {
  const { id } = req.params;
  const plans = readData("pmPlans.json", INITIAL_PM_PLANS);
  const planIdx = plans.findIndex(p => p.id === id);
  
  if (planIdx === -1) {
    return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch bảo trì!" });
  }
  
  const plan = plans[planIdx];
  const user = (req.query.user as string) || "Hệ thống";
  
  // 1. Tạo Work Order mới
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const woId = `WO-PM-${Date.now().toString().slice(-4)}`;
  const woCode = woId;
  const todayStr = new Date().toISOString().split("T")[0];
  
  const newWO: import("../frontend/types").WorkOrder = {
    id: woId,
    code: woCode,
    date: todayStr,
    creator: user,
    department: "Tổ Cơ điện",
    deviceId: plan.deviceId,
    deviceName: plan.deviceName,
    location: "Khu vực sản xuất",
    faultTime: new Date().toISOString(),
    faultFinder: "Kế hoạch bảo trì định kỳ",
    symptom: `Bảo trì định kỳ: ${plan.name}`,
    cause: "Thực hiện bảo trì dự phòng theo chu kỳ định sẵn.",
    proposedSolution: plan.description,
    targetCompletion: todayStr,
    technician: plan.assignedTo || "Nguyễn Văn Hùng",
    assignedTechnicians: plan.assignedTo ? [plan.assignedTo] : ["Nguyễn Văn Hùng"],
    status: "Sẵn sàng thực hiện",
    notes: `Được kích hoạt tự động từ kế hoạch bảo trì ${plan.code}. Chu kỳ ${plan.intervalDays} ngày.`,
    partsUsed: [],
    cost: 0,
    history: [
      {
        time: new Date().toISOString(),
        user: user,
        action: "Kích hoạt bảo trì",
        details: `Phiếu được sinh ra tự động từ Kế hoạch bảo trì định kỳ ${plan.code}.`
      }
    ]
  };
  
  currentWorkOrders.unshift(newWO);
  writeData("workOrders.json", currentWorkOrders);
  
  // 2. Cập nhật Kế hoạch PM (lastDoneDate = hôm nay, nextDueDate = hôm nay + intervalDays)
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + plan.intervalDays);
  const nextDueDateStr = nextDueDate.toISOString().split("T")[0];
  
  plans[planIdx].lastDoneDate = todayStr;
  plans[planIdx].nextDueDate = nextDueDateStr;
  plans[planIdx].status = "Đúng hạn";
  writeData("pmPlans.json", plans);
  
  logAction(
    user,
    "Kích hoạt bảo trì kế hoạch",
    `Kích hoạt phiếu sửa chữa ${woCode} từ kế hoạch bảo trì định kỳ ${plan.name}`
  );
  
  res.json({ success: true, workOrder: newWO, plan: plans[planIdx] });
});

// 5. Executive Dashboard Stats
app.get("/api/dashboard", (req, res) => {
  const currentDevices = readData("devices.json", INITIAL_DEVICES);
  const currentParts = readData("parts.json", INITIAL_PARTS);
  const currentWorkOrders = readData("workOrders.json", INITIAL_WORK_ORDERS);
  const currentRequests = readData("materialRequests.json", INITIAL_MATERIAL_REQUESTS);

  const totalDevices = currentDevices.length;
  const activeDevices = currentDevices.filter((d) => d.status === "Đang hoạt động").length;
  const maintainingDevices = currentDevices.filter((d) => d.status === "Đang bảo trì").length;
  const brokenDevices = currentDevices.filter((d) => d.status === "Hỏng").length;

  const today = new Date();
  let upcomingMaintenanceCount = 0;
  currentDevices.forEach((d) => {
    if (d.lastMaintenance) {
      const last = new Date(d.lastMaintenance);
      const next = new Date(last.getTime() + (d.cycleDays || 30) * 24 * 60 * 60 * 1000);
      const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 10 || d.status === "Sắp đến hạn bảo trì") {
        upcomingMaintenanceCount++;
      }
    }
  });

  const lowStockParts = currentParts.filter((p) => p.stock < p.minStock);

  const faultCounts: { [key: string]: { name: string; count: number } } = {};
  currentWorkOrders.forEach((w) => {
    if (w.deviceId) {
      if (!faultCounts[w.deviceId]) {
        faultCounts[w.deviceId] = { name: w.deviceName || w.deviceId, count: 0 };
      }
      faultCounts[w.deviceId].count++;
    }
  });
  const topBrokenDevices = Object.keys(faultCounts)
    .map((id) => ({
      id,
      name: faultCounts[id].name,
      count: faultCounts[id].count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

  const monthlyCosts = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(today.getMonth() - (5 - idx));
    const m = d.getMonth();
    const y = d.getFullYear();
    let cost = [12000000, 18500000, 9000000, 24000000, 15000000, 8000000][idx] || 10000000;

    currentWorkOrders.forEach((w) => {
      if (w.completedDate && (w.status === "Hoàn thành" || w.status === "Đóng phiếu")) {
        const compDate = new Date(w.completedDate);
        if (compDate.getMonth() === m && compDate.getFullYear() === y) {
          cost += w.cost || 0;
        }
      }
    });

    currentRequests.forEach((mr) => {
      if (mr.receptionDate && mr.status === "Đã giao hàng/Nhập kho") {
        const recDate = new Date(mr.receptionDate);
        if (recDate.getMonth() === m && recDate.getFullYear() === y) {
          cost += mr.cost || 0;
        }
      }
    });

    return {
      month: `${monthNames[m]}/${y}`,
      cost,
    };
  });

  let totalRepairDuration = 0;
  let completedCount = 0;
  currentWorkOrders.forEach((w) => {
    if (w.durationHours && w.durationHours > 0) {
      totalRepairDuration += w.durationHours;
      completedCount++;
    }
  });

  const mttr = completedCount > 0 ? parseFloat((totalRepairDuration / completedCount).toFixed(1)) : 3.5;
  const mtbf = totalDevices > 0 ? parseFloat((720 / Math.max(1, currentWorkOrders.length)).toFixed(1)) : 120.0;
  const oee = parseFloat((92.4 - brokenDevices * 2.5).toFixed(1));

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
    oee,
  });
});

// 6. Audit Logs Endpoint
app.get("/api/audit-logs", (req, res) => {
  const currentLogs = readData("auditLogs.json", INITIAL_AUDIT_LOGS);
  res.json(currentLogs);
});

// Vite Middleware Setup
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
    console.log(`[SADICO CMMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
