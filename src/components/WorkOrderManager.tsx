import React, { useState } from "react";
import { WorkOrder, Device, Part, WorkOrderStatus, PartUsage } from "../types";
import { formatVND, formatDate } from "../utils";
import { Plus, Check, Clock, Calendar, AlertTriangle, Image, Camera, Printer, Trash2, Edit3, X, User, ArrowRight, ShieldAlert, BadgeInfo } from "lucide-react";

interface WorkOrderManagerProps {
  workOrders: WorkOrder[];
  devices: Device[];
  parts: Part[];
  userRole: string;
  userName: string;
  onCreateWorkOrder: (wo: Omit<WorkOrder, "id" | "code" | "date">) => void;
  onUpdateWorkOrder: (id: string, wo: Partial<WorkOrder>) => void;
  onDeleteWorkOrder: (id: string) => void;
  quickSelectedDevice: Device | null;
  onClearQuickSelectedDevice: () => void;
}

export default function WorkOrderManager({
  workOrders,
  devices,
  parts,
  userRole,
  userName,
  onCreateWorkOrder,
  onUpdateWorkOrder,
  onDeleteWorkOrder,
  quickSelectedDevice,
  onClearQuickSelectedDevice
}: WorkOrderManagerProps) {
  const [activeTab, setActiveTab] = useState<WorkOrderStatus | "All">("All");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const [showAddModal, setShowAddModal] = useState(quickSelectedDevice !== null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form states
  const [formDeviceId, setFormDeviceId] = useState(quickSelectedDevice?.id || devices[0]?.id || "");
  const [formSymptom, setFormSymptom] = useState("");
  const [formCause, setFormCause] = useState("");
  const [formProposedSolution, setFormProposedSolution] = useState("");
  const [formTargetCompletion, setFormTargetCompletion] = useState("");
  const [formTechnician, setFormTechnician] = useState("");
  const [formImageBefore, setFormImageBefore] = useState("");
  const [formPartsUsed, setFormPartsUsed] = useState<PartUsage[]>([]);

  // Parts selector helpers
  const [selectedPartCode, setSelectedPartCode] = useState("");
  const [selectedPartQty, setSelectedPartQty] = useState(1);
  const [partFeedback, setPartFeedback] = useState("");

  // Completed Details Form states
  const [compDuration, setCompDuration] = useState(2);
  const [compCost, setCompCost] = useState(0);
  const [compRecovered, setCompRecovered] = useState("");
  const [compImageAfter, setCompImageAfter] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  React.useEffect(() => {
    if (quickSelectedDevice) {
      setFormDeviceId(quickSelectedDevice.id);
      setFormSymptom(`Bảo trì/Sửa chữa thiết bị ${quickSelectedDevice.name}`);
      setFormTargetCompletion(new Date(Date.now() + 48*60*60*1000).toISOString().split("T")[0]);
      setFormTechnician(userName);
      setFormImageBefore("");
      setFormPartsUsed([]);
      setShowAddModal(true);
    }
  }, [quickSelectedDevice]);

  // Filters
  const filteredWOs = workOrders.filter((w) => {
    return activeTab === "All" || w.status === activeTab;
  });

  const handleDeviceChange = (devId: string) => {
    setFormDeviceId(devId);
  };

  const handleAddPartRow = () => {
    if (!selectedPartCode) return;
    const partObj = parts.find((p) => p.code === selectedPartCode);
    if (!partObj) return;

    // Check duplicate
    if (formPartsUsed.some((p) => p.partCode === selectedPartCode)) {
      setPartFeedback("Lỗi: Linh kiện này đã có trong danh sách yêu cầu!");
      return;
    }

    // Check stock warning
    const stockAvailable = partObj.stock;
    let feedback = "";
    if (selectedPartQty > stockAvailable) {
      feedback = `⚠️ Cảnh báo: Tồn kho hiện có (${stockAvailable} ${partObj.unit}) ít hơn nhu cầu sửa chữa! Hệ thống sẽ tự động chuyển phiếu sửa chữa sang trạng thái "Chờ vật tư" và kích hoạt yêu cầu mua vật tư gửi phòng Vật tư.`;
    }

    setFormPartsUsed([...formPartsUsed, {
      partCode: selectedPartCode,
      partName: partObj.name,
      quantity: Number(selectedPartQty)
    }]);
    setPartFeedback(feedback);
    setSelectedPartCode("");
    setSelectedPartQty(1);
  };

  const handleRemovePartRow = (code: string) => {
    setFormPartsUsed(formPartsUsed.filter((p) => p.partCode !== code));
  };

  // Image upload handles (Base64 conversion)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isBefore: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isBefore) {
        setFormImageBefore(reader.result as string);
      } else {
        setCompImageAfter(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWO = (e: React.FormEvent) => {
    e.preventDefault();
    const dev = devices.find((d) => d.id === formDeviceId);
    if (!dev) return;

    // Determine initial status based on stock pre-verification
    let initialStatus: WorkOrderStatus = "Nháp";
    let isStockDeficient = false;

    formPartsUsed.forEach((item) => {
      const partObj = parts.find((p) => p.code === item.partCode);
      if (partObj && item.quantity > partObj.stock) {
        isStockDeficient = true;
      }
    });

    if (isStockDeficient) {
      initialStatus = "Chờ vật tư";
    } else {
      initialStatus = "Chờ duyệt"; // default to submit for approval
    }

    onCreateWorkOrder({
      deviceId: formDeviceId,
      deviceName: dev.name,
      location: dev.location,
      creator: userName,
      department: dev.department,
      faultTime: new Date().toISOString(),
      faultFinder: userName,
      symptom: formSymptom,
      cause: formCause,
      proposedSolution: formProposedSolution,
      targetCompletion: formTargetCompletion || new Date().toISOString().split("T")[0],
      technician: formTechnician || userName,
      status: initialStatus,
      notes: isStockDeficient ? "Tự động thiết lập Chờ vật tư do thiếu hụt linh kiện trong kho." : "Chờ trưởng ca phê duyệt phương án.",
      partsUsed: formPartsUsed,
      cost: formPartsUsed.reduce((acc, p) => {
        const item = parts.find((x) => x.code === p.partCode);
        return acc + (item ? item.price * p.quantity : 0);
      }, 0),
      recoveredMaterials: ""
    });

    setShowAddModal(false);
    onClearQuickSelectedDevice();
  };

  const handleTransitionStatus = (wo: WorkOrder, target: WorkOrderStatus) => {
    onUpdateWorkOrder(wo.id, {
      status: target,
      notes: `Trạng thái cập nhật bởi ${userName} (${userRole}) thành ${target}`
    });
    // Auto select updated
    setSelectedWO({ ...wo, status: target });
  };

  // Submit complete
  const handleSaveComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    onUpdateWorkOrder(selectedWO.id, {
      status: "Hoàn thành",
      completedDate: new Date().toISOString().split("T")[0],
      durationHours: Number(compDuration),
      cost: selectedWO.cost + Number(compCost),
      recoveredMaterials: compRecovered,
      imageAfter: compImageAfter,
      notes: `Đã hoàn thành sửa chữa. Thời gian thực hiện: ${compDuration} giờ. Vật tư thu hồi: ${compRecovered}`
    });

    setShowCompleteModal(false);
    setSelectedWO(null);
  };

  return (
    <div className="space-y-6" id="workorder-manager-root">
      {/* 7-State Segment Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 bg-slate-50 p-1.5 rounded-xl gap-1">
        {(["All", "Nháp", "Chờ duyệt", "Chờ vật tư", "Sẵn sàng thực hiện", "Đang sửa chữa", "Hoàn thành", "Đóng phiếu"] as const).map((tab) => {
          const count = tab === "All" ? workOrders.length : workOrders.filter((w) => w.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab === "All" ? "Tất cả phiếu" : tab} ({count})
            </button>
          );
        })}

        <button
          onClick={() => {
            setFormSymptom("");
            setFormCause("");
            setFormProposedSolution("");
            setFormTargetCompletion(new Date().toISOString().split("T")[0]);
            setFormPartsUsed([]);
            setPartFeedback("");
            setShowAddModal(true);
          }}
          className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
          id="btn-create-workorder"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Khai báo Phiếu Sửa Chữa
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work order listing */}
        <div className="lg:col-span-2 space-y-4">
          {filteredWOs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Không có phiếu sửa chữa nào thuộc trạng thái này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWOs.map((wo) => {
                const statusTheme = {
                  "Nháp": "bg-slate-100 text-slate-700 border-slate-200",
                  "Chờ duyệt": "bg-amber-100 text-amber-800 border-amber-200",
                  "Chờ vật tư": "bg-rose-100 text-rose-800 border-rose-200",
                  "Sẵn sàng thực hiện": "bg-indigo-100 text-indigo-800 border-indigo-200",
                  "Đang sửa chữa": "bg-cyan-100 text-cyan-800 border-cyan-200",
                  "Hoàn thành": "bg-emerald-100 text-emerald-800 border-emerald-200",
                  "Đóng phiếu": "bg-blue-100 text-blue-800 border-blue-200"
                }[wo.status];

                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWO(wo)}
                    className={`bg-white p-4 rounded-xl border transition cursor-pointer hover:shadow-md ${
                      selectedWO?.id === wo.id ? "border-indigo-600 ring-2 ring-indigo-50/50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {wo.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusTheme}`}>
                        {wo.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-1">{wo.deviceName}</h4>
                    <p className="text-xs text-slate-500 font-vietnamese line-clamp-2 mb-3">
                      <strong>Hiện tượng:</strong> {wo.symptom}
                    </p>

                    <div className="flex justify-between items-center text-[10px] border-t border-gray-100 pt-2.5 text-gray-400 font-semibold">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kỹ thuật: {wo.technician}</span>
                      </div>
                      <div>Hạn hoàn thành: {wo.targetCompletion}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Work Order detail panel */}
        <div>
          {selectedWO ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4 overflow-hidden">
              <div className="bg-slate-950 text-white p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">{selectedWO.code}</span>
                  <span className="text-[10px] text-gray-400">{selectedWO.date}</span>
                </div>
                <h3 className="font-bold text-base leading-snug">{selectedWO.deviceName}</h3>
                <span className="text-xs text-slate-400 block mt-1">Khu vực: {selectedWO.location}</span>
              </div>

              {/* Progress Stepper Visualizer */}
              <div className="bg-slate-50 px-4 py-3 border-b border-gray-150 text-[10px] flex justify-between items-center text-gray-500">
                <div className="flex items-center gap-1 font-bold">
                  <span>Trạng thái:</span>
                  <span className="text-indigo-600 uppercase">{selectedWO.status}</span>
                </div>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 text-[11px]"
                  id="btn-print-order-receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xuất Phiếu (In 2 Bản)</span>
                </button>
              </div>

              {/* WO Detailed Fields */}
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Người phát hiện & Thời gian:</span>
                  <span className="font-semibold text-slate-800">{selectedWO.faultFinder} ({formatDate(selectedWO.faultTime)})</span>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">Mô tả hiện tượng sự cố:</span>
                  <p className="bg-slate-50 p-2.5 rounded border border-gray-100 font-medium text-slate-800 leading-relaxed">
                    {selectedWO.symptom}
                  </p>
                </div>

                {selectedWO.imageBefore && (
                  <div>
                    <span className="text-gray-400 font-medium block mb-1">Hình ảnh hiện trường sự cố:</span>
                    <img src={selectedWO.imageBefore} alt="Hiện trường sự cố" className="w-full h-32 object-cover rounded-lg border" />
                  </div>
                )}

                <div>
                  <span className="text-gray-400 font-medium block">Nguyên nhân dự kiến:</span>
                  <span className="font-semibold text-slate-800 block">{selectedWO.cause || "Chưa xác định"}</span>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">Phương án xử lý kỹ thuật:</span>
                  <span className="font-semibold text-slate-800 block">{selectedWO.proposedSolution || "Chưa khai báo"}</span>
                </div>

                {/* Used parts detailed section */}
                <div>
                  <span className="text-gray-400 font-semibold block border-b pb-1 mb-1.5">Linh kiện cần sử dụng:</span>
                  {selectedWO.partsUsed.length === 0 ? (
                    <span className="text-gray-400 italic">Không sử dụng linh kiện bổ sung</span>
                  ) : (
                    <div className="space-y-1">
                      {selectedWO.partsUsed.map((item, idx) => {
                        const invPart = parts.find((p) => p.code === item.partCode);
                        const isInsufficient = invPart ? invPart.stock < item.quantity : false;
                        return (
                          <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 border rounded text-[11px]">
                            <div>
                              <span className="font-semibold text-slate-900 block">{item.partName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">Mã: {item.partCode}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-800">{item.quantity} cái</span>
                              {isInsufficient && selectedWO.status === "Chờ vật tư" && (
                                <span className="block text-[9px] text-rose-600 font-bold font-vietnamese">Thiếu hàng!</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Salvaged materials indicator */}
                {selectedWO.recoveredMaterials && (
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-emerald-800">
                    <span className="font-bold block mb-0.5">♻️ Vật tư thu hồi về kho:</span>
                    <p className="font-medium text-[11px] leading-snug">{selectedWO.recoveredMaterials}</p>
                  </div>
                )}

                {selectedWO.imageAfter && (
                  <div>
                    <span className="text-gray-400 font-medium block mb-1">Hình ảnh sau khi sửa xong:</span>
                    <img src={selectedWO.imageAfter} alt="Hoàn tất sửa chữa" className="w-full h-32 object-cover rounded-lg border" />
                  </div>
                )}

                <div>
                  <span className="text-gray-400 font-medium block">Chi phí bảo trì lũy kế:</span>
                  <span className="text-base font-bold text-slate-900">{formatVND(selectedWO.cost)}</span>
                </div>

                {/* STATE TRANSITION FLOW TRIGGERS (ROLE-BASED AUTHORIZATION) */}
                <div className="pt-4 border-t border-gray-150 space-y-2">
                  {/* Transition actions */}
                  {selectedWO.status === "Nháp" && userRole === "Kỹ thuật bảo trì (Cơ điện)" && (
                    <button
                      onClick={() => handleTransitionStatus(selectedWO, "Chờ duyệt")}
                      className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition text-center"
                      id="btn-transition-send-approval"
                    >
                      Nộp Đề Xuất Sửa Chữa (Gửi Trưởng Ca Duyệt)
                    </button>
                  )}

                  {selectedWO.status === "Chờ duyệt" && userRole === "Trưởng ca" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTransitionStatus(selectedWO, "Sẵn sàng thực hiện")}
                        className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-center"
                        id="btn-transition-approve"
                      >
                        Phê Duyệt Sửa Chữa
                      </button>
                      <button
                        onClick={() => handleTransitionStatus(selectedWO, "Nháp")}
                        className="p-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Từ chối, trả về nháp"
                        id="btn-transition-reject"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {selectedWO.status === "Sẵn sàng thực hiện" && userRole === "Kỹ thuật bảo trì (Cơ điện)" && (
                    <button
                      onClick={() => handleTransitionStatus(selectedWO, "Đang sửa chữa")}
                      className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition text-center"
                      id="btn-transition-start-repair"
                    >
                      Bắt Đầu Sửa Chữa & Tháo Máy
                    </button>
                  )}

                  {selectedWO.status === "Đang sửa chữa" && userRole === "Kỹ thuật bảo trì (Cơ điện)" && (
                    <button
                      onClick={() => {
                        setCompDuration(2);
                        setCompCost(0);
                        setCompRecovered("");
                        setCompImageAfter("");
                        setShowCompleteModal(true);
                      }}
                      className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-center"
                      id="btn-transition-complete"
                    >
                      Báo Cáo Hoàn Thành Sửa Chữa
                    </button>
                  )}

                  {selectedWO.status === "Hoàn thành" && userRole === "Trưởng ca" && (
                    <button
                      onClick={() => handleTransitionStatus(selectedWO, "Đóng phiếu")}
                      className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition text-center"
                      id="btn-transition-close"
                    >
                      Đóng Phiếu Lưu Trữ
                    </button>
                  )}

                  {/* Empty state warnings */}
                  {selectedWO.status === "Chờ vật tư" && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg text-xs leading-normal">
                      <strong>⚠️ Chờ vật tư từ kho:</strong> Trạng thái này được quản lý tự động bởi liên kết đặt mua vật tư của phòng Vật tư. Khi vật tư được nhập kho, phiếu sẽ tự nâng lên "Sẵn sàng thực hiện".
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-gray-300 p-8 rounded-xl text-center text-slate-400 sticky top-4">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chọn một phiếu sửa chữa để xem chi tiết tiến độ, linh kiện, ảnh trước/sau và thực hiện thao tác duyệt/hoàn thành.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create/Khai báo Phiếu Sửa Chữa */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Khai báo Phiếu yêu cầu Sửa chữa & Bảo trì</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  onClearQuickSelectedDevice();
                }}
                className="text-slate-400 hover:text-white"
                id="btn-close-add-wo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWO} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-600 font-bold mb-1">Chọn thiết bị cần xử lý</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-white font-medium"
                    value={formDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>[{d.code}] {d.name} ({d.location})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-600 font-bold mb-1">Mô tả hiện tượng sự cố (Yêu cầu nhập thực tế)</label>
                  <textarea
                    required
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-medium"
                    placeholder="Báo cáo hiện tượng, ví dụ: Van khí nén vòi 3 đóng không kín, xì hơi lớn..."
                    value={formSymptom}
                    onChange={(e) => setFormSymptom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1">Nguyên nhân dự đoán</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Do kẹt pít-tông, mòn gioăng cao su..."
                    value={formCause}
                    onChange={(e) => setFormCause(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1">Phương án khắc phục dự kiến</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Thay thế Gioăng cao su hoặc thay mới cụm van SMC..."
                    value={formProposedSolution}
                    onChange={(e) => setFormProposedSolution(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1">Người thực hiện (Được điều phối)</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 bg-slate-50 font-bold"
                    value={formTechnician}
                    onChange={(e) => setFormTechnician(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1 font-vietnamese">Hạn hoàn thành dự kiến</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                    value={formTargetCompletion}
                    onChange={(e) => setFormTargetCompletion(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-600 font-bold mb-1">Ảnh hiện trường sự cố (Tải lên trước sửa chữa)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                      id="input-file-before"
                    />
                    <label
                      htmlFor="input-file-before"
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-xs font-semibold"
                    >
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>Chọn ảnh hiện trường</span>
                    </label>
                    {formImageBefore && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Đã tải lên ảnh hiện trường
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Parts Selector Engine */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <span className="block text-slate-800 font-bold text-xs">🛠️ Chọn linh kiện thay thế thiết bị:</span>
                <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-gray-500 text-[10px] mb-0.5">Tên linh kiện</label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-1.5 bg-white text-slate-800 text-xs font-medium"
                      value={selectedPartCode}
                      onChange={(e) => setSelectedPartCode(e.target.value)}
                    >
                      <option value="">-- Chọn linh kiện trong kho --</option>
                      {parts.map((p) => (
                        <option key={p.code} value={p.code}>[{p.code}] {p.name} (Còn {p.stock} cái)</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-gray-500 text-[10px] mb-0.5">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-md p-1.5 text-center text-slate-800 font-bold text-xs"
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPartRow}
                    className="self-end px-3 py-2 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 text-xs"
                    id="btn-add-part-to-wo"
                  >
                    Thêm
                  </button>
                </div>

                {partFeedback && (
                  <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg text-[10px] leading-snug">
                    {partFeedback}
                  </div>
                )}

                {/* Selected parts list table */}
                {formPartsUsed.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-gray-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="py-2 px-3">Mã vật tư</th>
                          <th className="py-2 px-3">Tên vật tư</th>
                          <th className="py-2 px-3 text-center">Yêu cầu</th>
                          <th className="py-2 px-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {formPartsUsed.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.partCode}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{item.partName}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity} cái</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePartRow(item.partCode)}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    onClearQuickSelectedDevice();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                  id="btn-confirm-save-wo"
                >
                  Đăng Ký & Phát Hành Phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Completed Sửa Chữa */}
      {showCompleteModal && selectedWO && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Báo cáo Hoàn Thành Sửa Chữa</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveComplete} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Thời gian thi công thực tế (Giờ)</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 font-bold"
                  value={compDuration}
                  onChange={(e) => setCompDuration(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Chi phí phát sinh ngoài linh kiện (VND)</label>
                <input
                  type="number"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                  value={compCost}
                  onChange={(e) => setCompCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Đánh dấu Vật tư thu hồi (Trả về kho vật tư tái chế)</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="Ví dụ: 1 Cảm biến Autonics cũ mờ hỏng, gioăng cũ..."
                  value={compRecovered}
                  onChange={(e) => setCompRecovered(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Hình ảnh thiết bị sau khi bàn giao (Sau sửa chữa)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                    id="input-file-after"
                  />
                  <label
                    htmlFor="input-file-after"
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-xs font-semibold"
                  >
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>Chụp/Chọn ảnh bàn giao</span>
                  </label>
                  {compImageAfter && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Đã tải lên ảnh bàn giao
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Xác nhận hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable 2-Copy Work Order Receipt */}
      {showPrintModal && selectedWO && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full overflow-hidden my-8">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center print:hidden">
              <span className="font-bold text-base flex items-center gap-1.5">
                <Printer className="w-5 h-5 text-indigo-400" />
                In phiếu sửa chữa liên kết (Xuất 2 Bản gốc)
              </span>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-white" id="btn-close-print-receipt">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Area */}
            <div className="p-8 space-y-12 bg-white max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible text-slate-900" id="print-sheet-content">
              {/* LIÊN 1 */}
              <div className="border-2 border-slate-950 p-6 space-y-6 relative rounded-md">
                <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-300 px-2 py-0.5 rounded">
                  LIÊN 1: PHÒNG KỸ THUẬT & CƠ ĐIỆN LƯU
                </div>
                <div className="flex justify-between items-start border-b-2 border-slate-950 pb-4">
                  <div>
                    <h2 className="font-bold text-base uppercase tracking-tight">CÔNG TY CỔ PHẦN SADICO</h2>
                    <span className="text-[10px] text-gray-500 block font-medium">Bộ phận bảo trì thiết bị & hạ tầng nhà máy</span>
                  </div>
                  <div className="text-right">
                    <h3 className="font-extrabold text-lg text-slate-950">PHIẾU SỬA CHỮA THIẾT BỊ</h3>
                    <span className="font-mono text-xs font-bold text-slate-700 block mt-0.5">Mã phiếu: {selectedWO.code}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><strong>Thiết bị sửa chữa:</strong> {selectedWO.deviceName}</div>
                  <div><strong>Mã số thiết bị:</strong> {selectedWO.deviceId}</div>
                  <div><strong>Khu vực vận hành:</strong> {selectedWO.location}</div>
                  <div><strong>Ngày khởi tạo:</strong> {selectedWO.date}</div>
                  <div><strong>Kỹ thuật bàn giao:</strong> {selectedWO.technician}</div>
                  <div><strong>Trưởng ca điều phối:</strong> {selectedWO.approvedBy || "Đã duyệt tự động"}</div>
                </div>

                <div className="space-y-2 border-t border-slate-950 pt-4">
                  <span className="font-bold text-xs block">I. CHI TIẾT SỰ CỐ & VẬT TƯ THAY THẾ:</span>
                  <p className="text-xs"><strong>Hiện tượng:</strong> {selectedWO.symptom}</p>
                  <p className="text-xs"><strong>Biện pháp khắc phục:</strong> {selectedWO.proposedSolution}</p>
                </div>

                <div className="border border-slate-950 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-950 font-bold">
                        <th className="py-1 px-2">Mã linh kiện</th>
                        <th className="py-1 px-2">Tên vật tư thay thế</th>
                        <th className="py-1 px-2 text-center">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {selectedWO.partsUsed.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-1 px-2 text-center text-gray-400 italic">Không sử dụng vật tư trong kho</td>
                        </tr>
                      ) : (
                        selectedWO.partsUsed.map((item, index) => (
                          <tr key={index}>
                            <td className="py-1.5 px-2 font-mono">{item.partCode}</td>
                            <td className="py-1.5 px-2">{item.partName}</td>
                            <td className="py-1.5 px-2 text-center font-bold">{item.quantity} cái</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-xs pt-8 border-t border-dashed border-slate-400">
                  <div>
                    <span className="font-bold block">Kỹ thuật thi công</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div>
                    <span className="font-bold block">Trưởng ca duyệt</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div>
                    <span className="font-bold block">Vật tư nhận bàn giao</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                </div>
              </div>

              {/* Dotted cutting separator line */}
              <div className="border-b-2 border-dashed border-slate-400 flex items-center justify-center relative">
                <span className="absolute bg-white px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border rounded border-slate-300 font-mono">
                  ✂️ ĐƯỜNG CẮT PHÂN TÁCH HAI LIÊN LƯU
                </span>
              </div>

              {/* LIÊN 2 */}
              <div className="border-2 border-slate-950 p-6 space-y-6 relative rounded-md">
                <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-300 px-2 py-0.5 rounded">
                  LIÊN 2: BAN QUẢN LÝ / VẬT TƯ LƯU TRỮ
                </div>
                <div className="flex justify-between items-start border-b-2 border-slate-950 pb-4">
                  <div>
                    <h2 className="font-bold text-base uppercase tracking-tight">CÔNG TY CỔ PHẦN SADICO</h2>
                    <span className="text-[10px] text-gray-500 block font-medium">Bộ phận bảo trì thiết bị & hạ tầng nhà máy</span>
                  </div>
                  <div className="text-right">
                    <h3 className="font-extrabold text-lg text-slate-950">PHIẾU SỬA CHỮA THIẾT BỊ</h3>
                    <span className="font-mono text-xs font-bold text-slate-700 block mt-0.5">Mã phiếu: {selectedWO.code}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><strong>Thiết bị sửa chữa:</strong> {selectedWO.deviceName}</div>
                  <div><strong>Mã số thiết bị:</strong> {selectedWO.deviceId}</div>
                  <div><strong>Khu vực vận hành:</strong> {selectedWO.location}</div>
                  <div><strong>Ngày khởi tạo:</strong> {selectedWO.date}</div>
                  <div><strong>Kỹ thuật bàn giao:</strong> {selectedWO.technician}</div>
                  <div><strong>Trưởng ca điều phối:</strong> {selectedWO.approvedBy || "Đã duyệt tự động"}</div>
                </div>

                <div className="space-y-2 border-t border-slate-950 pt-4">
                  <span className="font-bold text-xs block">I. CHI TIẾT SỰ CỐ & VẬT TƯ THAY THẾ:</span>
                  <p className="text-xs"><strong>Hiện tượng:</strong> {selectedWO.symptom}</p>
                  <p className="text-xs"><strong>Biện pháp khắc phục:</strong> {selectedWO.proposedSolution}</p>
                </div>

                <div className="border border-slate-950 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-950 font-bold">
                        <th className="py-1 px-2">Mã linh kiện</th>
                        <th className="py-1 px-2">Tên vật tư thay thế</th>
                        <th className="py-1 px-2 text-center">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {selectedWO.partsUsed.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-1 px-2 text-center text-gray-400 italic">Không sử dụng vật tư trong kho</td>
                        </tr>
                      ) : (
                        selectedWO.partsUsed.map((item, index) => (
                          <tr key={index}>
                            <td className="py-1.5 px-2 font-mono">{item.partCode}</td>
                            <td className="py-1.5 px-2">{item.partName}</td>
                            <td className="py-1.5 px-2 text-center font-bold">{item.quantity} cái</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-xs pt-8 border-t border-dashed border-slate-400">
                  <div>
                    <span className="font-bold block">Kỹ thuật thi công</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div>
                    <span className="font-bold block">Trưởng ca duyệt</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div>
                    <span className="font-bold block">Vật tư nhận bàn giao</span>
                    <span className="text-[10px] text-gray-400 block mt-12">(Ký và ghi rõ họ tên)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print triggers */}
            <div className="bg-slate-50 p-4 border-t flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                In Phiếu Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
