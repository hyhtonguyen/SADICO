import React, { useState, useEffect } from "react";
import { User, Device, Part, WorkOrder, MaterialRequest, AuditLog, DashboardStats } from "./types";
import { formatDate } from "./utils";
import Dashboard from "./components/Dashboard";
import DeviceManager from "./components/DeviceManager";
import PartManager from "./components/PartManager";
import WorkOrderManager from "./components/WorkOrderManager";
import MaterialRequestManager from "./components/MaterialRequestManager";
import WarehouseManager from "./components/WarehouseManager";
import CsharpSqlCenter from "./components/CsharpSqlCenter";
import LoginForm from "./components/LoginForm";
import AdminUsers from "./components/AdminUsers";
import { Wrench, Layers, LayoutDashboard, ShoppingBag, HardDrive, History, FileCode, Users, LogOut, CheckCircle2, ChevronRight, Menu, HelpCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Database States
  const [devices, setDevices] = useState<Device[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // General App State
  const [notification, setNotification] = useState<string | null>(null);
  const [quickDevice, setQuickDevice] = useState<Device | null>(null);

  const refreshUsers = () => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => {
        setUsers(data);
        
        // Read persisted login session
        const savedUser = localStorage.getItem("sadico_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser) as User;
            const matched = data.find((u) => u.id === parsed.id);
            if (matched) {
              setCurrentUser(matched);
              return;
            }
          } catch (e) {
            console.error("Failed to parse saved user from localStorage:", e);
          }
        }
      })
      .catch((err) => console.error("Error loading mock users:", err));
  };

  // Initialize and load
  useEffect(() => {
    refreshUsers();
    refreshAllData();
  }, []);

  // Sync data whenever currentUser changes to update log context
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser]);

  const refreshAllData = () => {
    const userQueryParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";

    // Parallel fetching
    Promise.all([
      fetch(`/api/devices${userQueryParam}`).then((res) => res.json()),
      fetch(`/api/parts${userQueryParam}`).then((res) => res.json()),
      fetch(`/api/work-orders${userQueryParam}`).then((res) => res.json()),
      fetch(`/api/material-requests${userQueryParam}`).then((res) => res.json()),
      fetch(`/api/dashboard${userQueryParam}`).then((res) => res.json()),
      fetch(`/api/audit-logs${userQueryParam}`).then((res) => res.json())
    ])
      .then(([devs, pts, wos, reqs, stats, logs]) => {
        setDevices(devs);
        setParts(pts);
        setWorkOrders(wos);
        setMaterialRequests(reqs);
        setDashboardStats(stats);
        setAuditLogs(logs);
      })
      .catch((err) => console.error("Error refreshing backend data:", err));
  };

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Core CRUD Handlers ---

  const handleRoleChange = (userId: string) => {
    const usr = users.find((u) => u.id === userId);
    if (usr) {
      // API Login Simulation
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usr.username, password: "sadico123" })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCurrentUser(data.user);
            localStorage.setItem("sadico_user", JSON.stringify(data.user));
            triggerNotification(`🔐 Đã giả lập phân quyền: ${data.user.name} (${data.user.role})`);
          }
        });
    }
  };

  // 1. Devices Handlers
  const handleAddDevice = (newDev: Omit<Device, "id">) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/devices${userParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDev)
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`✅ Thêm thiết bị "${newDev.name}" thành công!`);
      });
  };

  const handleEditDevice = (id: string, updatedDev: Partial<Device>) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/devices/${id}${userParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDev)
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`✅ Đã cập nhật thiết bị!`);
      });
  };

  const handleDeleteDevice = (id: string) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/devices/${id}${userParam}`, {
      method: "DELETE"
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`🗑️ Đã xóa thiết bị khỏi hệ thống!`);
      });
  };

  // 2. Parts Handlers
  const handleAddPart = (newPart: Part) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/parts${userParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPart)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.message); });
        }
        return res.json();
      })
      .then(() => {
        refreshAllData();
        triggerNotification(`✅ Khai báo linh kiện ${newPart.code} thành công!`);
      })
      .catch((err) => alert(err.message));
  };

  const handleEditPart = (code: string, updatedPart: Partial<Part>) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/parts/${code}${userParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPart)
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`✅ Cập nhật linh kiện thành công!`);
      });
  };

  const handleDeletePart = (code: string) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/parts/${code}${userParam}`, {
      method: "DELETE"
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`🗑️ Đã xóa linh kiện khỏi danh mục.`);
      });
  };

  const handleImportParts = (importedParts: any[]) => {
    fetch("/api/parts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parts: importedParts,
        user: currentUser?.name
      })
    })
      .then((res) => res.json())
      .then(() => {
        refreshAllData();
        triggerNotification(`📥 Đã nhập khẩu danh sách linh kiện thành công!`);
      });
  };

  // 3. Work Order Handlers
  const handleCreateWorkOrder = (newWO: Omit<WorkOrder, "id" | "code" | "date">) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    
    // Create actual Work Order on backend
    fetch(`/api/work-orders${userParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWO)
    })
      .then((res) => res.json())
      .then((data) => {
        // If initial status was "Chờ vật tư", automatically raise a Material Request ticket!
        if (data.workOrder && data.workOrder.status === "Chờ vật tư") {
          // Find which parts are deficient
          const mrItems = newWO.partsUsed.map((p) => {
            const partObj = parts.find((x) => x.code === p.partCode);
            const deficitQty = Math.max(1, p.quantity - (partObj ? partObj.stock : 0));
            return {
              partCode: p.partCode,
              partName: p.partName,
              quantity: deficitQty + 10, // purchase additional to restore safety margin
              unit: partObj ? partObj.unit : "Cái",
              reason: `Thay thế hư hỏng máy ${newWO.deviceName} và bồi đắp định mức tối thiểu.`
            };
          });

          const mockMR: Omit<MaterialRequest, "id" | "code" | "date"> = {
            proposer: currentUser?.name || "Kỹ thuật bảo trì",
            workOrderId: data.workOrder.id,
            deviceId: newWO.deviceId,
            deviceName: newWO.deviceName,
            reason: `Yêu cầu bổ sung linh kiện bảo trì khẩn cấp cho thiết bị ${newWO.deviceName}. Linh kiện trong kho không đủ phục vụ sửa chữa.`,
            status: "Chờ duyệt",
            items: mrItems,
            cost: mrItems.reduce((acc, curr) => {
              const matchedPart = parts.find(p => p.code === curr.partCode);
              return acc + (matchedPart ? matchedPart.price * curr.quantity : 0);
            }, 0),
            history: [
              {
                time: new Date().toISOString(),
                user: currentUser?.name || "Kỹ thuật bảo trì",
                action: "Tự động lập đề xuất",
                details: `Thiết lập đề xuất tự động do thiếu hụt linh kiện sửa chữa cho thiết bị: ${newWO.deviceName}.`
              }
            ]
          };

          fetch(`/api/material-requests${userParam}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mockMR)
          }).then(() => refreshAllData());

          triggerNotification(`⚠️ Thiếu linh kiện! Phiếu sửa chữa ${data.workOrder.code} đặt "Chờ vật tư". Đã tự động tạo Đề Xuất Mua sắm gửi phòng Vật tư.`);
        } else {
          refreshAllData();
          triggerNotification(`✅ Phiếu sửa chữa ${data.workOrder.code} đã được phát hành thành công.`);
        }
      });
  };

  const handleUpdateWorkOrder = (id: string, updatedWO: Partial<WorkOrder>) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/work-orders/${id}${userParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedWO)
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`🔄 Đã cập nhật trạng thái phiếu sửa chữa!`);
      });
  };

  const handleDeleteWorkOrder = (id: string) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/work-orders/${id}${userParam}`, {
      method: "DELETE"
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`🗑️ Đã hủy phiếu sửa chữa.`);
      });
  };

  // 4. Material Requests Handlers
  const handleUpdateMaterialRequest = (id: string, updatedReq: Partial<MaterialRequest>) => {
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    fetch(`/api/material-requests/${id}${userParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedReq)
    })
      .then(() => {
        refreshAllData();
        triggerNotification(`🔄 Đã cập nhật trạng thái đề xuất vật tư!`);
      });
  };

  // Fast Navigation & Action linking
  const handleTriggerQuickRepair = (device: Device) => {
    setQuickDevice(device);
    setActiveTab("workOrders");
  };

  const handleNavigateToMaterialRequestFromPart = (part: Part) => {
    // Navigate and auto-fill can be simulated or we directly prompt a generic standalone material request
    const userParam = currentUser ? `?user=${encodeURIComponent(currentUser.name)}` : "";
    const standaloneMR = {
      proposer: currentUser?.name || "Hệ thống",
      reason: `Đề xuất bồi đắp định mức tồn kho tối thiểu cho linh kiện dán nhãn ${part.name}`,
      status: "Chờ duyệt" as const,
      deviceName: "Kho dự trữ trung tâm",
      items: [
        {
          partCode: part.code,
          partName: part.name,
          quantity: 15,
          unit: part.unit,
          reason: "Bù đắp dự phòng sản xuất tối thiểu."
        }
      ],
      cost: part.price * 15,
      history: [
        {
          time: new Date().toISOString(),
          user: currentUser?.name || "Hệ thống",
          action: "Lập đề xuất thủ công",
          details: `Thiết lập đề xuất mua sắm linh kiện dự trữ cho: ${part.name}. Số lượng đề xuất: 15 cái.`
        }
      ]
    };

    fetch(`/api/material-requests${userParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(standaloneMR)
    }).then(() => {
      refreshAllData();
      setActiveTab("materialRequests");
      triggerNotification(`📦 Đã tạo đề xuất mua sắm 15 cái ${part.name} gửi đến trưởng ca duyệt.`);
    });
  };

  if (!currentUser) {
    return (
      <LoginForm
        users={users}
        onLogin={(usr) => {
          setCurrentUser(usr);
          localStorage.setItem("sadico_user", JSON.stringify(usr));
        }}
        triggerNotification={triggerNotification}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="sadico-app-container">
      {/* Dynamic Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 text-white font-semibold py-3 px-5 rounded-xl shadow-2xl border border-slate-700 animate-slide-up flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 px-6 py-3 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-inner shrink-0">
              <Wrench className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">SADICO CMMS</h1>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                Hệ thống Quản lý Bảo trì và Kho thiết bị nhà máy
              </span>
            </div>
          </div>

          {/* Professional User Profile Display and Subtle Demo Switcher */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Main Professional Identity Display */}
            <div className="flex items-center gap-2.5 bg-indigo-950/45 border border-indigo-500/30 px-3.5 py-2 rounded-xl shadow-inner w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="text-xs">
                <span className="font-mono font-extrabold text-indigo-300 uppercase tracking-wider mr-1.5 border-r border-indigo-500/20 pr-1.5">
                  {currentUser?.role}
                </span>
                <span className="font-bold text-slate-100">{currentUser?.name}</span>
              </div>
            </div>



            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem("sadico_user");
                triggerNotification("🔒 Đã đăng xuất khỏi hệ thống.");
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition duration-150 border border-red-700 shadow-sm"
              id="header-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout with Responsive Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row px-4 md:px-6 py-6 gap-6">
        {/* Left Sidebar Menu */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {/* Active profile banner */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-xs mb-4">
            <span className="text-gray-400 block font-medium mb-0.5">Nhân sự đăng nhập:</span>
            <span className="font-bold text-slate-800 text-sm block leading-tight">{currentUser?.name}</span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider block mt-1.5 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
              {currentUser?.role}
            </span>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Bàn làm việc (Dashboard)", icon: LayoutDashboard },
              { id: "devices", label: "Danh mục Thiết bị & QR", icon: HardDrive },
              { id: "parts", label: "Cấu trúc Linh kiện", icon: Layers },
              { id: "workOrders", label: "Phiếu Sửa Chữa (7 Bước)", icon: Wrench },
              { id: "materialRequests", label: "Yêu cầu Mua vật tư", icon: ShoppingBag },
              { id: "warehouse", label: "Quản lý kho Vật tư", icon: Layers },
              ...(currentUser?.roleDetails?.canViewAuditLogs !== false
                ? [{ id: "auditLogs", label: "Nhật ký hệ thống", icon: History }]
                : []),
              { id: "csharpsql", label: "Tài liệu ASP.NET & SQL", icon: FileCode },
              ...(currentUser?.roleDetails?.canManageUsers || currentUser?.role === "Ban lãnh đạo"
                ? [{ id: "adminUsers", label: "Quản trị & Phân Quyền", icon: Users }]
                : [])
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // clear quickSelected when shifting pages manually
                    if (item.id !== "workOrders") setQuickDevice(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                  }`}
                  id={`sidebar-btn-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition ${isActive ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-gray-200 text-[11px] text-gray-400 space-y-1 bg-white p-4 rounded-xl border">
            <p className="font-semibold text-slate-500">🏢 Công ty Cổ phần SADICO</p>
            <p>Hạ tầng API: <strong>ASP.NET Core 9</strong></p>
            <p>CSDL: <strong>Microsoft SQL Server</strong></p>
            <p>Lưu trữ File: <strong>MinIO S3 Bucket</strong></p>
          </div>
        </aside>

        {/* Right Active Viewport Panel */}
        <main className="flex-1 min-w-0">
          {activeTab === "dashboard" && (
            <Dashboard
              stats={dashboardStats}
              onNavigateToWarehouse={() => setActiveTab("warehouse")}
              onNavigateToWorkOrders={() => setActiveTab("workOrders")}
              parts={parts}
              onCreateMaterialRequest={handleNavigateToMaterialRequestFromPart}
            />
          )}

          {activeTab === "devices" && (
            <DeviceManager
              devices={devices}
              parts={parts}
              workOrders={workOrders}
              userRole={currentUser?.role || ""}
              userName={currentUser?.name || ""}
              onAddDevice={handleAddDevice}
              onEditDevice={handleEditDevice}
              onDeleteDevice={handleDeleteDevice}
              onTriggerQuickRepair={handleTriggerQuickRepair}
            />
          )}

          {activeTab === "parts" && (
            <PartManager
              parts={parts}
              devices={devices}
              userRole={currentUser?.role || ""}
              onAddPart={handleAddPart}
              onEditPart={handleEditPart}
              onDeletePart={handleDeletePart}
              onImportParts={handleImportParts}
            />
          )}

          {activeTab === "workOrders" && (
            <WorkOrderManager
              workOrders={workOrders}
              devices={devices}
              parts={parts}
              userRole={currentUser?.role || ""}
              userName={currentUser?.name || ""}
              onCreateWorkOrder={handleCreateWorkOrder}
              onUpdateWorkOrder={handleUpdateWorkOrder}
              onDeleteWorkOrder={handleDeleteWorkOrder}
              quickSelectedDevice={quickDevice}
              onClearQuickSelectedDevice={() => setQuickDevice(null)}
            />
          )}

          {activeTab === "materialRequests" && (
            <MaterialRequestManager
              materialRequests={materialRequests}
              workOrders={workOrders}
              parts={parts}
              userRole={currentUser?.role || ""}
              userName={currentUser?.name || ""}
              onUpdateMaterialRequest={handleUpdateMaterialRequest}
            />
          )}

          {activeTab === "warehouse" && (
            <WarehouseManager
              parts={parts}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === "auditLogs" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Nhật ký hoạt động hệ thống (Audit Log)</h2>
                <p className="text-xs text-gray-500 font-vietnamese">Ghi lại thời gian, tài khoản tác vụ và hoạt động chi tiết để hỗ trợ thanh tra và kiểm duyệt chất lượng kỹ thuật.</p>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4">Tài khoản</th>
                      <th className="py-2.5 px-4">Hành động</th>
                      <th className="py-2.5 px-4">Chi tiết hoạt động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-400">{formatDate(log.time)}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{log.user}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "adminUsers" && (
            <AdminUsers
              currentUser={currentUser}
              users={users}
              onRefreshUsers={refreshUsers}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "csharpsql" && (
            <CsharpSqlCenter />
          )}
        </main>
      </div>
    </div>
  );
}
