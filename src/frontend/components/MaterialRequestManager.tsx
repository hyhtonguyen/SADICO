import React, { useState } from "react";
import { MaterialRequest, WorkOrder, Part } from "../types";
import { formatVND, formatDate } from "../utils";
import { ShoppingBag, CheckCircle2, Truck, Box, X, Clock, HelpCircle, FileText, Ban, AlertTriangle, Calendar } from "lucide-react";

interface MaterialRequestManagerProps {
  materialRequests: MaterialRequest[];
  workOrders: WorkOrder[];
  parts: Part[];
  userRole: string;
  userName: string;
  onUpdateMaterialRequest: (id: string, req: Partial<MaterialRequest>) => void;
}

export default function MaterialRequestManager({
  materialRequests,
  workOrders,
  parts,
  userRole,
  userName,
  onUpdateMaterialRequest
}: MaterialRequestManagerProps) {
  const [selectedReq, setSelectedReq] = useState<MaterialRequest | null>(null);
  
  // Dialog state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [poNotes, setPoNotes] = useState("");
  const [poDeliveryDate, setPoDeliveryDate] = useState("");

  const getStatusBadgeClass = (status: MaterialRequest["status"]) => {
    return {
      "Chờ duyệt": "bg-amber-100 text-amber-800 border-amber-200",
      "Đã duyệt": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "Đang mua hàng": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Đã giao hàng/Nhập kho": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "Bị từ chối": "bg-rose-100 text-rose-800 border-rose-200"
    }[status];
  };

  const handleApprove = (req: MaterialRequest, approve: boolean) => {
    onUpdateMaterialRequest(req.id, {
      status: approve ? "Đã duyệt" : "Bị từ chối",
      approvedBy: userName,
      approvalDate: new Date().toISOString().split("T")[0],
      procurementNotes: approve ? "Đã được trưởng ca phê duyệt phương án mua sắm gấp." : "Bị từ chối do trùng lặp hoặc không cần thiết."
    });
    setSelectedReq(null);
  };

  const handleOpenOrder = (req: MaterialRequest) => {
    setSelectedReq(req);
    setPoNotes(`Đã hoàn tất đặt hàng PO-${Math.floor(1000 + Math.random() * 9000)}`);
    setPoDeliveryDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setShowOrderModal(true);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    onUpdateMaterialRequest(selectedReq.id, {
      status: "Đang mua hàng",
      procurementNotes: poNotes,
      deliveryDate: poDeliveryDate
    });

    setShowOrderModal(false);
    setSelectedReq(null);
  };

  const handleReceiveGoods = (req: MaterialRequest) => {
    onUpdateMaterialRequest(req.id, {
      status: "Đã giao hàng/Nhập kho",
      receptionDate: new Date().toISOString().split("T")[0]
    });
    setSelectedReq(null);
  };

  return (
    <div className="space-y-6" id="procurement-manager-root">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Quy trình mua hàng & Liên kết phòng vật tư</h2>
          <p className="text-xs text-gray-500 font-vietnamese">
            Tiếp nhận nhu cầu vật tư từ kỹ thuật khi kho bị thiếu, lập đề xuất xin sếp duyệt, theo dõi PO đặt hàng và xác nhận nhập kho tự động.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            Chờ duyệt: {materialRequests.filter(r => r.status === "Chờ duyệt").length} phiếu
          </div>
          <div className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-100">
            Đang mua: {materialRequests.filter(r => r.status === "Đang mua hàng").length} đơn
          </div>
        </div>
      </div>

      {/* Split List-Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left list of requests */}
        <div className="lg:col-span-2 space-y-3">
          {materialRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chưa có đề xuất mua sắm vật tư nào được tạo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materialRequests.map((req) => {
                const totalQty = req.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`bg-white p-4 rounded-xl border transition cursor-pointer hover:shadow-md ${
                      selectedReq?.id === req.id ? "border-indigo-600 ring-2 ring-indigo-50/50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {req.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-1">
                      Yêu cầu cho: {req.deviceName || "Kho dự phòng"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      <strong>Lý do:</strong> {req.reason}
                    </p>

                    <div className="flex justify-between items-center text-[10px] border-t border-gray-100 pt-2.5 text-gray-400 font-semibold mt-3">
                      <div>Người đề xuất: {req.proposer}</div>
                      <div>Số lượng đặt: {totalQty} mặt hàng | Tổng: {formatVND(req.cost)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Card with Actions */}
        <div>
          {selectedReq ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4 overflow-hidden">
              <div className="bg-slate-950 text-white p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">{selectedReq.code}</span>
                  <span className="text-[10px] text-gray-400">{selectedReq.date}</span>
                </div>
                <h3 className="font-bold text-base leading-snug">Yêu cầu đặt mua linh kiện</h3>
                <span className="text-xs text-slate-400 block mt-1">Liên quan phiếu sửa chữa: {selectedReq.workOrderId || "Không có"}</span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Người đề xuất & Lý do:</span>
                  <span className="font-semibold text-slate-800">{selectedReq.proposer}</span>
                  <p className="mt-1 bg-slate-50 p-2 rounded text-[11px] font-medium text-slate-700 leading-relaxed">
                    {selectedReq.reason}
                  </p>
                </div>

                {/* Items grid table */}
                <div>
                  <span className="text-gray-400 font-semibold block border-b pb-1 mb-2">Chi tiết mặt hàng yêu cầu đặt mua:</span>
                  <div className="space-y-2">
                    {selectedReq.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.partName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Mã vật tư: {item.partCode}</span>
                          </div>
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                            SL: {item.quantity} {item.unit || "Cái"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">Lý do: {item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div>
                    <span className="text-gray-400 block font-medium">Trạng thái phê duyệt:</span>
                    <span className="font-bold text-slate-800">{selectedReq.status}</span>
                  </div>
                  {selectedReq.approvedBy && (
                    <div>
                      <span className="text-gray-400 block font-medium">Người duyệt:</span>
                      <span className="font-semibold text-slate-800">{selectedReq.approvedBy} ({selectedReq.approvalDate})</span>
                    </div>
                  )}
                  {selectedReq.procurementNotes && (
                    <div>
                      <span className="text-gray-400 block font-medium">Ghi chú bộ phận mua hàng:</span>
                      <p className="bg-blue-50/50 p-2 rounded border border-blue-100 text-blue-900 text-[11px] font-medium">
                        {selectedReq.procurementNotes}
                      </p>
                    </div>
                  )}
                  {selectedReq.deliveryDate && (
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Truck className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span>Ngày dự kiến giao hàng về kho: <strong className="text-cyan-700">{selectedReq.deliveryDate}</strong></span>
                    </div>
                  )}
                  {selectedReq.receptionDate && (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đã xác nhận nhập kho thành công: {selectedReq.receptionDate}</span>
                    </div>
                  )}
                </div>

                {/* ACTION TRIGGER CO-ORDINATORS (ROLE-BASED) */}
                <div className="pt-4 border-t border-gray-150 space-y-2">
                  {/* Approve/Reject triggers for Shift Leader */}
                  {selectedReq.status === "Chờ duyệt" && (userRole === "Trưởng ca" || userRole === "Ban lãnh đạo") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedReq, true)}
                        className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-center"
                        id="btn-approve-purchase-request"
                      >
                        Duyệt Mua Hàng
                      </button>
                      <button
                        onClick={() => handleApprove(selectedReq, false)}
                        className="flex-1 py-2 bg-rose-50 border border-rose-300 text-rose-600 font-bold rounded-lg hover:bg-rose-100 transition text-center"
                        id="btn-reject-purchase-request"
                      >
                        Từ Chối
                      </button>
                    </div>
                  )}

                  {/* Order placing trigger for Procurement */}
                  {selectedReq.status === "Đã duyệt" && userRole === "Bộ phận Vật tư" && (
                    <button
                      onClick={() => handleOpenOrder(selectedReq)}
                      className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition text-center"
                      id="btn-place-order-purchase"
                    >
                      Tiến Hành Đặt Hàng (Lên Đơn PO)
                    </button>
                  )}

                  {/* Reception confirmation trigger for Procurement */}
                  {selectedReq.status === "Đang mua hàng" && userRole === "Bộ phận Vật tư" && (
                    <button
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn đã nhận đủ hàng và đồng ý tự động nhập kho vật tư, cộng dồn tồn kho không?")) {
                          handleReceiveGoods(selectedReq);
                        }
                      }}
                      className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-center"
                      id="btn-receive-goods-purchase"
                    >
                      Xác Nhận Nhập Kho Vật Tư
                    </button>
                  )}

                  {/* Status guides */}
                  {selectedReq.status === "Chờ duyệt" && userRole === "Bộ phận Vật tư" && (
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-lg text-center leading-normal">
                      ⏳ Đang chờ trưởng ca hoặc ban lãnh đạo phê duyệt đề xuất.
                    </div>
                  )}

                  {selectedReq.status === "Đã giao hàng/Nhập kho" && (
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 leading-normal">
                      🎉 Hoàn thành! Vật tư đã cộng dồn thành công vào tồn kho. Phiếu sửa chữa liên quan đã tự động nâng lên <strong>"Sẵn sàng thực hiện"</strong>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-gray-300 p-8 rounded-xl text-center text-slate-400 sticky top-4">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chọn một đề xuất mua sắm trong danh sách để xem tiến độ mua hàng, phê duyệt đề nghị, đặt hàng hoặc xác nhận nhập kho.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Place PO Order */}
      {showOrderModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Đặt hàng vật tư sửa chữa</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveOrder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Ghi chú đơn đặt hàng (Mã PO, Nhà phân phối)</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-bold"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Ngày dự kiến giao hàng về kho</label>
                <input
                  type="date"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Xác nhận đặt mua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
