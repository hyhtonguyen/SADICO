import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { Wrench, CheckCircle2, AlertTriangle, Package, Activity, Clock, ShieldAlert, TrendingUp } from "lucide-react";
import { DashboardStats, Part } from "../types";
import { formatVND } from "../utils";
import { motion } from "motion/react";

interface DashboardProps {
  stats: DashboardStats | null;
  onNavigateToWarehouse: () => void;
  onNavigateToWorkOrders: () => void;
  parts: Part[];
  onCreateMaterialRequest: (part: Part) => void;
}

export default function Dashboard({ stats, onNavigateToWarehouse, onNavigateToWorkOrders, parts, onCreateMaterialRequest }: DashboardProps) {
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Define status-based background styling for OEE
  const getOeeColorClass = (val: number) => {
    if (val >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val >= 70) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng thiết bị</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalDevices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium font-vietnamese">Đang hoạt động</p>
            <p className="text-2xl font-bold text-slate-900">{stats.activeDevices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đang bảo trì</p>
            <p className="text-2xl font-bold text-slate-900">{stats.maintainingDevices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đang hỏng</p>
            <p className="text-2xl font-bold text-slate-900">{stats.brokenDevices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-150 flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sắp đến hạn bảo trì</p>
            <p className="text-2xl font-bold text-slate-900">{stats.upcomingMaintenanceCount}</p>
          </div>
        </div>
      </div>

      {/* Industrial KPIs Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">MTBF (Thời gian chạy giữa các sự cố)</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.mtbf}</span>
            <span className="text-sm text-gray-500 font-medium">ngày</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Dựa trên khoảng cách giữa các phiếu sự cố đóng gần nhất.</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">MTTR (Thời gian trung bình để sửa chữa)</span>
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.mttr}</span>
            <span className="text-sm text-gray-500 font-medium font-vietnamese">giờ thực hiện</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Thời gian xử lý trung bình từ lúc duyệt phiếu đến lúc hoàn tất.</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">OEE (Hiệu suất thiết bị toàn phần)</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.oee}%</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Tốt</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Tính toán từ chỉ số thiết bị khả dụng trừ đi tỷ lệ hỏng hóc.</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cost Chart */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>Chi phí bảo trì & mua vật tư 6 tháng qua</span>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyCosts} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`}
                />
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value)), "Chi phí"]}
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff" }}
                />
                <Area type="monotone" dataKey="cost" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Broken Devices */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <h3 className="text-base font-bold text-slate-800 mb-4">Top thiết bị hỏng nhiều nhất</h3>
          {stats.topBrokenDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
              <p className="text-sm font-medium">Không có sự cố hỏng hóc nào gần đây</p>
            </div>
          ) : (
            <div className="h-72 flex flex-col justify-between">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topBrokenDevices} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} tickFormatter={(val) => val.slice(0, 15) + "..."} />
                    <Tooltip
                      formatter={(value: any) => [value + " lần", "Số lần hỏng"]}
                      contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff" }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                      {stats.topBrokenDevices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#ffe4e6"][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Top list text detailed */}
              <div className="space-y-2 mt-4 border-t border-slate-100 pt-3">
                {stats.topBrokenDevices.slice(0, 3).map((device, idx) => (
                  <div key={device.id} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{device.name}</span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">{device.count} lần</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" />
              <span>Cảnh báo tồn kho tối thiểu (&lt; mức định mức)</span>
            </h3>
            <button
              onClick={onNavigateToWarehouse}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              id="btn-nav-warehouse"
            >
              Xem tất cả kho
            </button>
          </div>

          {stats.lowStockParts.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Tồn kho an toàn. Không có linh kiện nào dưới mức tối thiểu định mức!</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-2.5 px-3">Mã vật tư</th>
                    <th className="py-2.5 px-3">Tên vật tư</th>
                    <th className="py-2.5 px-3 text-center">Tồn thực tế</th>
                    <th className="py-2.5 px-3 text-center">Định mức tối thiểu</th>
                    <th className="py-2.5 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {stats.lowStockParts.slice(0, 4).map((part) => (
                    <tr key={part.code} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{part.code}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{part.name}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">
                          {part.stock} {part.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-500">{part.minStock} {part.unit}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCreateMaterialRequest(part)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 font-semibold rounded-md hover:bg-indigo-100 transition"
                          id={`btn-request-${part.code}`}
                        >
                          Đề xuất mua
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Tips or Overdue list */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Chỉ số phản hồi kỹ thuật</span>
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block">Tỷ lệ hoàn thành công việc đúng hạn</span>
                <span className="text-lg font-bold text-slate-800">94.2%</span>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "94.2%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block">Vật tư thu hồi tái sử dụng</span>
                <span className="text-lg font-bold text-slate-800">82.4%</span>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "82.4%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block">Thời gian rảnh lò quay trung bình</span>
                <span className="text-lg font-bold text-slate-800">12.8 giờ / tháng</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToWorkOrders}
            className="w-full mt-4 py-2 text-center text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            id="btn-nav-workorders-quick"
          >
            Quản lý Phiếu Sửa Chữa (7 Trạng Thái)
          </button>
        </div>
      </div>
    </div>
  );
}
