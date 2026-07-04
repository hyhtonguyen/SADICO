import React, { useState } from "react";
import { Device, Part, WorkOrder } from "../types";
import { generateDeviceQRCodeSVG, formatVND, formatDate } from "../utils";
import { Plus, Edit2, Trash2, QrCode, Search, Filter, Camera, X, Check, Calendar, HardDrive, MapPin, Building, ShieldAlert } from "lucide-react";

interface DeviceManagerProps {
  devices: Device[];
  parts: Part[];
  workOrders: WorkOrder[];
  userRole: string;
  userName: string;
  onAddDevice: (device: Omit<Device, "id">) => void;
  onEditDevice: (id: string, device: Partial<Device>) => void;
  onDeleteDevice: (id: string) => void;
  onTriggerQuickRepair: (device: Device) => void;
}

export default function DeviceManager({
  devices,
  parts,
  workOrders,
  userRole,
  userName,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onTriggerQuickRepair
}: DeviceManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formValue, setFormValue] = useState(0);
  const [formLocation, setFormLocation] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formStatus, setFormStatus] = useState<Device["status"]>("Đang hoạt động");
  const [formCycleDays, setFormCycleDays] = useState(30);

  // Scanner Simulator states
  const [scannerSelectedId, setScannerSelectedId] = useState("");
  const [scannerScannedResult, setScannerScannedResult] = useState<Device | null>(null);

  // Filters calculation
  const filteredDevices = devices.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesDept = deptFilter === "All" || d.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const departments = Array.from(new Set(devices.map((d) => d.department)));

  const handleOpenAdd = () => {
    setFormCode(`DEV-${Date.now().toString().slice(-4)}`);
    setFormName("");
    setFormModel("");
    setFormSerial("");
    setFormPurchaseDate(new Date().toISOString().split("T")[0]);
    setFormValue(50000000);
    setFormLocation("");
    setFormDepartment(departments[0] || "Xưởng cơ khí");
    setFormStatus("Đang hoạt động");
    setFormCycleDays(30);
    setShowAddModal(true);
  };

  const handleOpenEdit = (d: Device) => {
    setSelectedDevice(d);
    setFormCode(d.code);
    setFormName(d.name);
    setFormModel(d.model);
    setFormSerial(d.serial);
    setFormPurchaseDate(d.purchaseDate);
    setFormValue(d.value);
    setFormLocation(d.location);
    setFormDepartment(d.department);
    setFormStatus(d.status);
    setFormCycleDays(d.cycleDays);
    setShowEditModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDevice({
      code: formCode,
      name: formName,
      model: formModel,
      serial: formSerial,
      purchaseDate: formPurchaseDate,
      value: Number(formValue),
      location: formLocation,
      department: formDepartment,
      status: formStatus,
      lastMaintenance: new Date().toISOString().split("T")[0],
      cycleDays: Number(formCycleDays)
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    onEditDevice(selectedDevice.id, {
      code: formCode,
      name: formName,
      model: formModel,
      serial: formSerial,
      purchaseDate: formPurchaseDate,
      value: Number(formValue),
      location: formLocation,
      department: formDepartment,
      status: formStatus,
      cycleDays: Number(formCycleDays)
    });
    setShowEditModal(false);
  };

  // Simulated Scanning
  const handleSimulateScan = () => {
    const dev = devices.find(d => d.id === scannerSelectedId);
    if (dev) {
      setScannerScannedResult(dev);
    }
  };

  // Helper to draw clean inline QR SVG
  const renderQRCode = (code: string) => {
    const svgContent = generateDeviceQRCodeSVG(code);
    return (
      <div
        className="w-24 h-24 border border-gray-200 rounded p-1 bg-white flex items-center justify-center cursor-pointer hover:border-indigo-500 transition"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        title="Click để tải hoặc in mã QR"
        onClick={() => {
          const w = window.open();
          if (w) {
            w.document.write(`
              <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-center;font-family:sans-serif;margin-top:50px;">
                  <h2>MÃ QR THIẾT BỊ SADICO</h2>
                  <div style="width:250px;height:250px">${svgContent}</div>
                  <h3 style="margin-top:15px;color:#334155">${code}</h3>
                  <p>Dán mã QR này lên thân thiết bị để hỗ trợ quét cơ điện nhanh.</p>
                  <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:5px;cursor:pointer;">In Mã QR</button>
                </body>
              </html>
            `);
            w.document.close();
          }
        }}
      />
    );
  };

  return (
    <div className="space-y-6" id="device-manager-root">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên, model..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="device-search-input"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Trạng thái:</span>
            <select
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="device-status-filter"
            >
              <option value="All">Tất cả</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Đang bảo trì">Đang bảo trì</option>
              <option value="Hỏng">Hỏng</option>
              <option value="Sắp đến hạn bảo trì">Sắp đến hạn bảo trì</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Bộ phận:</span>
            <select
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 bg-white"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              id="device-dept-filter"
            >
              <option value="All">Tất cả bộ phận</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* QR Scan Button */}
          <button
            onClick={() => {
              setScannerScannedResult(null);
              setScannerSelectedId(devices[0]?.id || "");
              setShowScanner(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            id="btn-scan-qr-header"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Quét QR Thiết bị</span>
          </button>

          {/* Add Device Button - restricted to Leaders/Trưởng ca */}
          {(userRole === "Ban lãnh đạo" || userRole === "Trưởng ca" || userRole === "Kỹ thuật bảo trì (Cơ điện)" || userRole === "Bộ phận Vật tư") && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
              id="btn-add-device-header"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thiết Bị</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left is list, Right is selected device info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredDevices.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-slate-400">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-55" />
              <p className="text-sm font-medium">Không tìm thấy thiết bị nào khớp với bộ lọc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((device) => {
                const statusColors = {
                  "Đang hoạt động": "bg-emerald-100 text-emerald-800 border-emerald-200",
                  "Đang bảo trì": "bg-indigo-100 text-indigo-800 border-indigo-200",
                  "Hỏng": "bg-rose-100 text-rose-800 border-rose-200",
                  "Sắp đến hạn bảo trì": "bg-amber-100 text-amber-800 border-amber-200"
                };

                return (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`bg-white p-4 rounded-xl border transition cursor-pointer hover:shadow-md ${
                      selectedDevice?.id === device.id
                        ? "border-indigo-600 ring-2 ring-indigo-50/50 shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {device.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[device.status]}`}>
                        {device.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">{device.name}</h4>
                    <p className="text-xs text-gray-400 font-medium mb-3">Model: {device.model || "N/A"}</p>

                    <div className="grid grid-cols-2 gap-y-1.5 text-[11px] border-t border-gray-100 pt-2.5 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{device.department}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{device.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Device Details */}
        <div className="space-y-4">
          {selectedDevice ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              {/* Header card banner */}
              <div className="bg-slate-900 text-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400 block mb-1">
                      {selectedDevice.code}
                    </span>
                    <h3 className="font-bold text-base leading-tight">{selectedDevice.name}</h3>
                  </div>
                  {renderQRCode(selectedDevice.id)}
                </div>
              </div>

              {/* Specs Body */}
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-150 pb-3">
                  <div>
                    <span className="text-gray-400 block font-medium">Model</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.model || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Số Serial</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedDevice.serial || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Vị trí lắp đặt</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.location || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium font-vietnamese">Bộ phận quản lý</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.department || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Ngày mua</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.purchaseDate || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Giá trị tài sản</span>
                    <span className="font-bold text-slate-800">{formatVND(selectedDevice.value)}</span>
                  </div>
                </div>

                {/* Maintenance cycle */}
                <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-slate-700 block">Chu kỳ bảo trì định kỳ</span>
                      <span className="text-[10px] text-gray-500">Lần cuối: {selectedDevice.lastMaintenance || "N/A"}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                    {selectedDevice.cycleDays} ngày
                  </span>
                </div>

                {/* Parts attached to this device */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 border-b border-gray-100 pb-1 flex items-center gap-1.5">
                    <span>Cơ cấu linh kiện đã khai báo ({parts.filter(p => p.deviceId === selectedDevice.id).length})</span>
                  </h4>
                  {parts.filter(p => p.deviceId === selectedDevice.id).length === 0 ? (
                    <span className="text-gray-400 italic block py-1 text-[11px]">Chưa khai báo linh kiện riêng biệt</span>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {parts.filter(p => p.deviceId === selectedDevice.id).map(part => (
                        <div key={part.code} className="flex justify-between items-center p-2 bg-slate-50 hover:bg-slate-100 rounded border border-gray-100 text-[11px]">
                          <span className="font-medium text-slate-800 truncate max-w-[170px]">{part.name}</span>
                          <span className="font-mono text-slate-400 font-bold">{part.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* History of repairs */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 border-b border-gray-100 pb-1">Nhật ký sửa chữa gần đây</h4>
                  {workOrders.filter(w => w.deviceId === selectedDevice.id).length === 0 ? (
                    <span className="text-gray-400 italic block py-1 text-[11px]">Không có lịch sử sửa chữa</span>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {workOrders.filter(w => w.deviceId === selectedDevice.id).map(wo => (
                        <div key={wo.id} className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-gray-100 text-[11px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-indigo-600">{wo.code}</span>
                            <span className="text-[10px] text-gray-400">{wo.date}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{wo.symptom}</p>
                          <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                            <span className="text-[10px] font-medium text-slate-500">Trạng thái: <strong>{wo.status}</strong></span>
                            {wo.cost > 0 && <span className="font-bold text-slate-700">{formatVND(wo.cost)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons drawer */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onTriggerQuickRepair(selectedDevice)}
                    className="flex-1 py-2 text-center font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                    id="btn-create-repair-from-details"
                  >
                    Báo Sự Cố & Sửa Chữa
                  </button>

                  {(userRole === "Ban lãnh đạo" || userRole === "Trưởng ca") && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(selectedDevice)}
                        className="p-2 border border-gray-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                        title="Sửa thông tin thiết bị"
                        id="btn-edit-device-trigger"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa thiết bị ${selectedDevice.name}?`)) {
                            onDeleteDevice(selectedDevice.id);
                            setSelectedDevice(null);
                          }
                        }}
                        className="p-2 border border-rose-300 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                        title="Xóa thiết bị"
                        id="btn-delete-device-trigger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-gray-300 p-8 text-center text-slate-400 sticky top-4">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chọn một thiết bị trong danh sách để xem chi tiết, mã QR, cấu trúc linh kiện và nhật ký bảo trì.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add Device */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Thêm thiết bị mới vào danh mục Sadico</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white" id="btn-close-add-modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Mã thiết bị (Duy nhất)</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-slate-800"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tên thiết bị</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Máy đóng bao vòi..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Model</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Ví dụ: ROTO-8-HB"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Số Serial</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                    placeholder="Ví dụ: SN-998-SAD"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Bộ phận quản lý</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white font-medium"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                  >
                    <option value="Xưởng đóng bao">Xưởng đóng bao</option>
                    <option value="Xưởng clinker">Xưởng clinker</option>
                    <option value="Tổ Cơ điện hỗ trợ">Tổ Cơ điện hỗ trợ</option>
                    <option value="Xưởng chuẩn bị liệu">Xưởng chuẩn bị liệu</option>
                    <option value="Xưởng lò nung">Xưởng lò nung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Vị trí sử dụng</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Khu vực tháp trao đổi nhiệt..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Ngày mua sắm</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Giá trị tài sản (VND)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Chu kỳ bảo trì (Ngày)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formCycleDays}
                    onChange={(e) => setFormCycleDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Trạng thái ban đầu</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Device["status"])}
                  >
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Đang bảo trì">Đang bảo trì</option>
                    <option value="Hỏng">Hỏng</option>
                    <option value="Sắp đến hạn bảo trì">Sắp đến hạn bảo trì</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Device */}
      {showEditModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Sửa thông tin thiết bị</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white" id="btn-close-edit-modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Mã thiết bị (Đọc duy nhất)</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 font-bold text-slate-500"
                    value={formCode}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tên thiết bị</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Model</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Số Serial</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Bộ phận quản lý</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                  >
                    <option value="Xưởng đóng bao">Xưởng đóng bao</option>
                    <option value="Xưởng clinker">Xưởng clinker</option>
                    <option value="Tổ Cơ điện hỗ trợ">Tổ Cơ điện hỗ trợ</option>
                    <option value="Xưởng chuẩn bị liệu">Xưởng chuẩn bị liệu</option>
                    <option value="Xưởng lò nung">Xưởng lò nung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Vị trí sử dụng</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Ngày mua sắm</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Giá trị tài sản (VND)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Chu kỳ bảo trì (Ngày)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formCycleDays}
                    onChange={(e) => setFormCycleDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Trạng thái hoạt động</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Device["status"])}
                  >
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Đang bảo trì">Đang bảo trì</option>
                    <option value="Hỏng">Hỏng</option>
                    <option value="Sắp đến hạn bảo trì">Sắp đến hạn bảo trì</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR Scanner Simulator */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Trình Giả Lập Quét Mã QR Thiết Bị</h3>
              </div>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white" id="btn-close-scanner">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Virtual Scanner Lens */}
              <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white border-2 border-slate-800 shadow-inner">
                {/* Scanner Frame Guide Overlay */}
                <div className="absolute w-40 h-40 border-2 border-indigo-500 rounded-lg flex items-center justify-center animate-pulse">
                  <div className="w-full h-0.5 bg-red-500 absolute animate-[bounce_2s_infinite]"></div>
                </div>

                <div className="z-10 text-center text-slate-300 px-4 bg-slate-900/65 py-2 rounded-md">
                  <span className="font-semibold block mb-1">ĐANG QUÉT MÃ...</span>
                  <p className="text-[10px] text-slate-400 font-vietnamese">Hướng ống kính Camera về phía nhãn dán QR code đính trên thiết bị</p>
                </div>
              </div>

              {/* Simulation selector for testing */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  👉 CHỌN THIẾT BỊ ĐỂ GIẢ LẬP QUÉT MÃ QR THỰC TẾ:
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white font-medium"
                    value={scannerSelectedId}
                    onChange={(e) => setScannerSelectedId(e.target.value)}
                    id="scanner-simulator-select"
                  >
                    <option value="" disabled>--- Chọn thiết bị ---</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>[{d.code}] {d.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSimulateScan}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                    id="btn-trigger-mock-scan"
                  >
                    Quét nhanh
                  </button>
                </div>
              </div>

              {/* Scanned result card */}
              {scannerScannedResult && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">✅ Đã nhận diện mã: <code>{scannerScannedResult.code}</code></span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                      {scannerScannedResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-600 pt-1.5 border-t border-indigo-100">
                    <div><strong>Tên thiết bị:</strong> {scannerScannedResult.name}</div>
                    <div><strong>Model:</strong> {scannerScannedResult.model}</div>
                    <div><strong>Vị trí:</strong> {scannerScannedResult.location}</div>
                    <div><strong>Chu kỳ:</strong> {scannerScannedResult.cycleDays} ngày</div>
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button
                      onClick={() => {
                        setSelectedDevice(scannerScannedResult);
                        setShowScanner(false);
                      }}
                      className="flex-1 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
                      id="btn-scanner-inspect-details"
                    >
                      Kiểm tra Nhật ký & Linh kiện
                    </button>
                    <button
                      onClick={() => {
                        onTriggerQuickRepair(scannerScannedResult);
                        setShowScanner(false);
                      }}
                      className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                      id="btn-scanner-quick-repair"
                    >
                      Báo hỏng sửa chữa ngay
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
