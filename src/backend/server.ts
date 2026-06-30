import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  readData,
  writeData,
  logAction,
  INITIAL_USERS,
  INITIAL_DEVICES,
  INITIAL_PARTS,
  INITIAL_WORK_ORDERS,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_AUDIT_LOGS,
} from "../database/dataStore";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API Endpoints ---

// Authentication / User endpoints
app.get("/api/users", (req, res) => {
  res.json(INITIAL_USERS);
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = INITIAL_USERS.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ success: false, message: "Sai tên đăng nhập!" });
  }

  // Validate password - all default users have password 'sadico123'
  if (password !== "sadico123") {
    return res.status(401).json({ success: false, message: "Mật khẩu không chính xác!" });
  }

  logAction(
    user.name,
    "Đăng nhập",
    `Người dùng ${user.name} đăng nhập thành công với vai trò ${user.role}`
  );
  res.json({ success: true, user });
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
      updatedReq.items.forEach((item: any) => {
        const partIdx = currentParts.findIndex((p) => p.code === item.partCode);
        if (partIdx !== -1) {
          const originalStock = currentParts[partIdx].stock;
          const receivedQty = item.quantity;
          currentParts[partIdx].stock = originalStock + receivedQty;

          logAction(
            (req.query.user as string) || "Hệ thống",
            "Nhập kho vật tư",
            `Nhập kho thành công ${item.partName} (+${receivedQty} cái, Tồn kho mới: ${currentParts[partIdx].stock})`
          );
        } else {
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
            deviceId: updatedReq.deviceId || "",
          });
          logAction(
            (req.query.user as string) || "Hệ thống",
            "Tự động tạo & nhập kho",
            `Thêm mới linh kiện chưa có trong hệ thống và nhập kho: ${item.partName} (+${item.quantity})`
          );
        }
      });
      writeData("parts.json", currentParts);
      updatedReq.receptionDate = new Date().toISOString().split("T")[0];

      if (updatedReq.workOrderId) {
        const woIdx = currentWorkOrders.findIndex((w) => w.id === updatedReq.workOrderId);
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
      (req.query.user as string) || "Hệ thống",
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
