import React, { useState } from "react";
import { Part, Device } from "../types";
import { formatVND } from "../utils";
import { Plus, Edit2, Trash2, FileSpreadsheet, Search, Filter, X, ArrowDownWideNarrow, ShieldAlert, BadgeInfo } from "lucide-react";

interface PartManagerProps {
  parts: Part[];
  devices: Device[];
  userRole: string;
  onAddPart: (part: Part) => void;
  onEditPart: (code: string, part: Partial<Part>) => void;
  onDeletePart: (code: string) => void;
  onImportParts: (parts: any[]) => void;
}

export default function PartManager({
  parts,
  devices,
  userRole,
  onAddPart,
  onEditPart,
  onDeletePart,
  onImportParts
}: PartManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [deviceFilter, setDeviceFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formCategory, setFormCategory] = useState<Part["category"]>("Vật tư sửa chữa");
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(10);
  const [formLifecycleMonths, setFormLifecycleMonths] = useState(12);
  const [formUnit, setFormUnit] = useState("Cái");
  const [formPrice, setFormPrice] = useState(0);
  const [formOrigin, setFormOrigin] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formDeviceId, setFormDeviceId] = useState("");
  const [formDeviceIds, setFormDeviceIds] = useState<string[]>([]);

  // Excel importer simulator states
  const [csvText, setCsvText] = useState("");
  const [importFeedback, setImportFeedback] = useState("");

  // Filter parts
  const filteredParts = parts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.serial.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchesDevice = deviceFilter === "All" || p.deviceId === deviceFilter || p.deviceIds?.includes(deviceFilter);
    return matchesSearch && matchesCategory && matchesDevice;
  });

  const handleOpenAdd = () => {
    setFormCode(`PART-${Date.now().toString().slice(-4).toUpperCase()}`);
    setFormName("");
    setFormSerial("");
    setFormCategory("Vật tư sửa chữa");
    setFormStock(5);
    setFormMinStock(10);
    setFormLifecycleMonths(12);
    setFormUnit("Cái");
    setFormPrice(1000000);
    setFormOrigin("");
    setFormColor("");
    setFormDeviceId("");
    setFormDeviceIds([]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Part) => {
    setSelectedPart(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormSerial(p.serial);
    setFormCategory(p.category);
    setFormStock(p.stock);
    setFormMinStock(p.minStock);
    setFormLifecycleMonths(p.lifecycleMonths);
    setFormUnit(p.unit);
    setFormPrice(p.price);
    setFormOrigin(p.origin || "");
    setFormColor(p.color || "");
    setFormDeviceId(p.deviceId || "");
    setFormDeviceIds(p.deviceIds || (p.deviceId ? [p.deviceId] : []));
    setShowEditModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPart({
      code: formCode,
      name: formName,
      serial: formSerial,
      category: formCategory,
      stock: Number(formStock),
      minStock: Number(formMinStock),
      lifecycleMonths: Number(formLifecycleMonths),
      unit: formUnit,
      price: Number(formPrice),
      origin: formOrigin,
      color: formColor,
      deviceId: formDeviceIds[0] || undefined,
      deviceIds: formDeviceIds
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    onEditPart(selectedPart.code, {
      name: formName,
      serial: formSerial,
      category: formCategory,
      stock: Number(formStock),
      minStock: Number(formMinStock),
      lifecycleMonths: Number(formLifecycleMonths),
      unit: formUnit,
      price: Number(formPrice),
      origin: formOrigin,
      color: formColor,
      deviceId: formDeviceIds[0] || undefined,
      deviceIds: formDeviceIds
    });
    setShowEditModal(false);
  };

  // CSV template loaders
  const loadCsvTemplate = () => {
    const template = `code,name,serial,category,stock,minStock,lifecycleMonths,unit,price,origin,color,deviceId
PART-V10,Cụm Van điện từ SMC,SMC-551,Vật tư sửa chữa,22,10,24,Cái,1800000,Nhật Bản,Xám bạc,DEV-001
PART-B11,Bạc đạn xoay SKF 22215,SKF-22215,Vật tư sửa chữa,3,8,36,Bộ,4500000,Thụy Điển,Thép sáng,DEV-002
PART-O12,Dầu mỡ bôi trơn bánh răng Kluber,KLUB-GRA-50,Vật tư Trung tâm sản xuất,12,5,12,Hộp (5kg),3200000,Đức,Vàng,DEV-003`;
    setCsvText(template);
    setImportFeedback("Đã tải dữ liệu CSV mẫu vào khung soạn thảo!");
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setImportFeedback("Lỗi: Khung soạn thảo trống!");
      return;
    }

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        setImportFeedback("Lỗi: CSV cần có dòng tiêu đề và ít nhất 1 dòng dữ liệu!");
        return;
      }

      const headers = lines[0].split(",");
      const importedArray: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length < headers.length) continue;

        const partObj: any = {};
        headers.forEach((h, index) => {
          const cleanH = h.trim();
          const val = values[index]?.trim();
          if (cleanH === "stock" || cleanH === "minStock" || cleanH === "lifecycleMonths" || cleanH === "price") {
            partObj[cleanH] = parseFloat(val) || 0;
          } else {
            partObj[cleanH] = val;
          }
        });

        importedArray.push(partObj);
      }

      onImportParts(importedArray);
      setImportFeedback(`✅ Thành công! Đã xử lý ${importedArray.length} dòng dữ liệu.`);
      setTimeout(() => setShowImportModal(false), 1500);
    } catch (err: any) {
      setImportFeedback(`❌ Lỗi phân tích: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" id="part-manager-root">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên linh kiện, serial..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="part-search-input"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Nhóm:</span>
            <select
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 bg-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="part-category-filter"
            >
              <option value="All">Tất cả các nhóm</option>
              <option value="Vật tư sửa chữa">Vật tư sửa chữa</option>
              <option value="Vật tư Trung tâm sản xuất">Vật tư trung tâm sản xuất</option>
            </select>
          </div>

          {/* Linked Device filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Thiết bị:</span>
            <select
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 bg-white max-w-[150px] truncate"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              id="part-device-filter"
            >
              <option value="All">Tất cả thiết bị</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Import from Excel button */}
          {(userRole === "Bộ phận Vật tư" || userRole === "Trưởng ca") && (
            <button
              onClick={() => {
                setCsvText("");
                setImportFeedback("");
                setShowImportModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
              id="btn-import-parts-header"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Create new Part button */}
          {(userRole === "Bộ phận Vật tư" || userRole === "Trưởng ca") && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
              id="btn-add-part-header"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khai báo vật tư</span>
            </button>
          )}
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredParts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowDownWideNarrow className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Không tìm thấy linh kiện nào khớp với bộ lọc tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4">Mã vật tư</th>
                  <th className="py-3 px-4">Tên linh kiện</th>
                  <th className="py-3 px-4">Số Serial</th>
                  <th className="py-3 px-4">Nhóm vật tư</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4 text-center">Định mức tối thiểu</th>
                  <th className="py-3 px-4">Tuổi thọ</th>
                  <th className="py-3 px-4 text-right">Đơn giá</th>
                  <th className="py-3 px-4">Thiết bị liên kết</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParts.map((part) => {
                  const isLowStock = part.stock < part.minStock;
                  const dev = devices.find(d => d.id === part.deviceId);

                  return (
                    <tr key={part.code} className={`hover:bg-slate-50 transition-colors ${isLowStock ? "bg-rose-50/20" : ""}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{part.code}</td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-950 block">{part.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Xuất xứ: {part.origin || "-"} | Màu: {part.color || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">{part.serial || "-"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          part.category === "Vật tư sửa chữa"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {part.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded font-bold ${
                          isLowStock
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          {part.stock} {part.unit}
                        </span>
                        {isLowStock && (
                          <span className="block text-[9px] text-rose-600 font-bold mt-0.5">Tồn kho thấp!</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {part.minStock} {part.unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {part.lifecycleMonths} tháng
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatVND(part.price)}</td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                        {dev ? dev.name : <span className="text-gray-400 italic">Dùng chung</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => handleOpenEdit(part)}
                            className="p-1 border border-gray-300 text-slate-600 hover:bg-slate-100 rounded transition"
                            title="Sửa thông tin linh kiện"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {(userRole === "Bộ phận Vật tư" || userRole === "Trưởng ca") && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa linh kiện ${part.name}?`)) {
                                  onDeletePart(part.code);
                                }
                              }}
                              className="p-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Xóa linh kiện"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add Part */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Khai báo linh kiện/Vật tư mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white" id="btn-close-add-part">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Mã linh kiện (Duy nhất)</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-slate-800 font-mono"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tên linh kiện/Vật tư</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Bạc đạn SKF Explorer..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Số Serial / Model chi tiết</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                    placeholder="Ví dụ: SKF-22212"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Nhóm phân loại vật tư</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Part["category"])}
                  >
                    <option value="Vật tư sửa chữa">Vật tư sửa chữa</option>
                    <option value="Vật tư Trung tâm sản xuất">Vật tư Trung tâm sản xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Ví dụ: Cái, Bộ, Thùng..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1 font-vietnamese">Số lượng tồn ban đầu</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Định mức an toàn tối thiểu</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tuổi thọ vòng đời (Tháng)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formLifecycleMonths}
                    onChange={(e) => setFormLifecycleMonths(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Đơn giá tham khảo (VND)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Xuất xứ</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Ví dụ: Nhật Bản, Đức..."
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Màu sắc đặc trưng</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Màu thép sáng, Đen..."
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-gray-600 font-bold">Thiết bị lắp đặt mặc định (Chọn một hoặc nhiều)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormDeviceIds(devices.map(d => d.id))}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-wider"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFormDeviceIds([])}
                        className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase tracking-wider"
                      >
                        Xóa chọn
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-2.5 bg-slate-50 max-h-32 overflow-y-auto grid grid-cols-2 gap-1.5">
                    {devices.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer select-none hover:bg-slate-200/50 p-1 rounded">
                        <input
                          type="checkbox"
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          checked={formDeviceIds.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormDeviceIds([...formDeviceIds, d.id]);
                            } else {
                              setFormDeviceIds(formDeviceIds.filter(id => id !== d.id));
                            }
                          }}
                        />
                        <span className="text-slate-700 truncate text-[11px] font-semibold">[{d.code}] {d.name}</span>
                      </label>
                    ))}
                  </div>
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

      {/* MODAL: Edit Part */}
      {showEditModal && selectedPart && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Sửa thông tin linh kiện/Vật tư</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white" id="btn-close-edit-part">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Mã linh kiện (Đọc duy nhất)</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 font-bold text-slate-500 font-mono"
                    value={formCode}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tên linh kiện/Vật tư</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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
                  <label className="block text-gray-600 font-bold mb-1">Nhóm phân loại vật tư</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Part["category"])}
                  >
                    <option value="Vật tư sửa chữa">Vật tư sửa chữa</option>
                    <option value="Vật tư Trung tâm sản xuất">Vật tư Trung tâm sản xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Số lượng tồn kho</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Định mức an toàn tối thiểu</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tuổi thọ vòng đời (Tháng)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formLifecycleMonths}
                    onChange={(e) => setFormLifecycleMonths(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Đơn giá tham khảo (VND)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Xuất xứ</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Màu sắc đặc trưng</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-gray-600 font-bold">Thiết bị lắp đặt mặc định (Chọn một hoặc nhiều)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormDeviceIds(devices.map(d => d.id))}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-wider"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFormDeviceIds([])}
                        className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase tracking-wider"
                      >
                        Xóa chọn
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-2.5 bg-slate-50 max-h-32 overflow-y-auto grid grid-cols-2 gap-1.5">
                    {devices.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer select-none hover:bg-slate-200/50 p-1 rounded">
                        <input
                          type="checkbox"
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          checked={formDeviceIds.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormDeviceIds([...formDeviceIds, d.id]);
                            } else {
                              setFormDeviceIds(formDeviceIds.filter(id => id !== d.id));
                            }
                          }}
                        />
                        <span className="text-slate-700 truncate text-[11px] font-semibold">[{d.code}] {d.name}</span>
                      </label>
                    ))}
                  </div>
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

      {/* MODAL: Import Excel Simulator */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Nhập danh mục linh kiện từ Excel (Giả lập)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white" id="btn-close-import-modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <BadgeInfo className="w-4 h-4 text-indigo-600" />
                  Quy định Import dữ liệu linh kiện:
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-vietnamese">
                  Hệ thống yêu cầu tệp CSV/Excel chứa đúng 2 cột bắt buộc là <strong>code</strong> (mã linh kiện duy nhất) và <strong>name</strong> (tên linh kiện). Các cột bổ sung khác như: <em>serial, category, stock, minStock, lifecycleMonths, unit, price, origin, color, deviceId</em> sẽ hỗ trợ tối ưu hóa và liên kết hệ thống tự động.
                </p>
                <button
                  type="button"
                  onClick={loadCsvTemplate}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-bold transition text-[10px]"
                  id="btn-load-csv-template"
                >
                  📥 Nhập File Dữ Liệu Excel Mẫu
                </button>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-xs">
                  Nhập/Dán nội dung bảng tính Excel (.csv):
                </label>
                <textarea
                  required
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-[10px] text-slate-800 leading-normal"
                  placeholder="Paste CSV rows here..."
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>

              {importFeedback && (
                <div className={`p-3 rounded-lg font-bold text-xs ${
                  importFeedback.includes("Lỗi")
                    ? "bg-rose-50 text-rose-800 border border-rose-100"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                }`}>
                  {importFeedback}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                  id="btn-confirm-import"
                >
                  Tiến hành Import vào CSDL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
