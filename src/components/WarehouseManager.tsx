import React, { useState } from "react";
import { Part, AuditLog } from "../types";
import { formatVND } from "../utils";
import { HardDrive, AlertTriangle, ArrowUpDown, ShieldAlert, BadgeInfo, CheckCircle2, History } from "lucide-react";

interface WarehouseManagerProps {
  parts: Part[];
  auditLogs: AuditLog[];
}

export default function WarehouseManager({ parts, auditLogs }: WarehouseManagerProps) {
  const [activeType, setActiveType] = useState<"Vật tư sửa chữa" | "Vật tư Trung tâm sản xuất">("Vật tư sửa chữa");

  const filteredParts = parts.filter((p) => p.category === activeType);
  const lowStockCount = parts.filter((p) => p.stock < p.minStock).length;

  // Filter logs related to stock transactions (Import, Export, stock decrements)
  const stockLogs = auditLogs.filter((log) => {
    return log.action.includes("xuất kho") ||
           log.action.includes("nhập kho") ||
           log.action.includes("Import") ||
           log.action.includes("vật tư") ||
           log.action.includes("linh kiện");
  });

  return (
    <div className="space-y-6" id="warehouse-view-root">
      {/* Overview stats bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800">Quản lý kho vật tư nhà máy Sadico</h2>
          <p className="text-xs text-gray-500 font-vietnamese">
            Giám sát mức tồn kho của hai loại vật tư: Vật tư thuộc phạm vi bảo trì sửa chữa thiết bị, và vật tư hỗ trợ sản xuất phụ trợ.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border flex items-center gap-2.5 text-xs font-semibold">
            <span className="text-gray-500">Mức cảnh báo tối thiểu:</span>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px]">
              &lt; Định mức quy định riêng
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2.5 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
            <span>{lowStockCount} linh kiện sắp hết hàng!</span>
          </div>
        </div>
      </div>

      {/* Selector switches */}
      <div className="flex border-b border-gray-200 p-1 bg-slate-100 rounded-xl max-w-md gap-1">
        <button
          onClick={() => setActiveType("Vật tư sửa chữa")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
            activeType === "Vật tư sửa chữa"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200"
          }`}
          id="btn-switch-repair-parts"
        >
          VẬT TƯ SỬA CHỮA BẢO TRÌ
        </button>
        <button
          onClick={() => setActiveType("Vật tư Trung tâm sản xuất")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
            activeType === "Vật tư Trung tâm sản xuất"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200"
          }`}
          id="btn-switch-prod-parts"
        >
          VẬT TƯ TRUNG TÂM SẢN XUẤT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm uppercase">{activeType} ({filteredParts.length})</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
                  <th className="py-2.5 px-4">Mã số</th>
                  <th className="py-2.5 px-4">Tên linh kiện</th>
                  <th className="py-2.5 px-4 text-center">Tồn thực tế</th>
                  <th className="py-2.5 px-4 text-center">Mức an toàn tối thiểu</th>
                  <th className="py-2.5 px-4 text-right">Chi phí ước tính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredParts.map((p) => {
                  const isLow = p.stock < p.minStock;
                  return (
                    <tr key={p.code} className={`hover:bg-slate-50 ${isLow ? "bg-rose-50/25" : ""}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.code}</td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Serial: {p.serial || "Chung"} | Xuất xứ: {p.origin || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded font-bold ${
                          isLow ? "bg-rose-100 text-rose-800 font-bold" : "bg-emerald-50 text-emerald-800"
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{p.minStock} {p.unit}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{formatVND(p.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger logs on dynamic stock issue */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-indigo-600" />
              <span>Lịch sử Nhập xuất kho tự động</span>
            </h3>

            {stockLogs.length === 0 ? (
              <span className="text-gray-400 italic text-xs">Chưa có giao dịch nhập xuất nào ghi nhận</span>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {stockLogs.map((log) => {
                  const isOut = log.action.includes("xuất");
                  return (
                    <div key={log.id} className="text-[11px] pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          isOut ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {isOut ? "XUẤT KHO" : "NHẬP KHO"}
                        </span>
                        <span className="text-gray-400 font-medium font-mono">{new Date(log.time).toLocaleTimeString("vi-VN")}</span>
                      </div>
                      <p className="font-semibold text-slate-800 mb-1 leading-snug">{log.details}</p>
                      <div className="text-[10px] text-gray-400 font-medium flex justify-between">
                        <span>Nhân sự: <strong>{log.user}</strong></span>
                        <span>{new Date(log.time).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
