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
  const [compRecoveredWarehouse, setCompRecoveredWarehouse] = useState("Kho Vật Tư Trung Tâm");
  const [compRecoveredQty, setCompRecoveredQty] = useState(1);
  const [compRecoveredPart, setCompRecoveredPart] = useState("");
  const [compImageAfter, setCompImageAfter] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Dynamic users and tech list states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [formAssignedTechnicians, setFormAssignedTechnicians] = useState<string[]>([]);

  // Reassignment sub-states
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignWOId, setReassignWOId] = useState("");
  const [reassignTechs, setReassignTechs] = useState<string[]>([]);
  const [reassignReason, setReassignReason] = useState("");

  // Insufficient stock popup states inside Add Work Order
  const [showInsufficientStockPopup, setShowInsufficientStockPopup] = useState(false);
  const [insufficientItemsList, setInsufficientItemsList] = useState<any[]>([]);
  const [procurementReason, setProcurementReason] = useState("Mua vật tư phục vụ phiếu sửa chữa khẩn cấp.");
  const [procurementQtyMap, setProcurementQtyMap] = useState<{[code: string]: number}>({});

  React.useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsersList(data);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  React.useEffect(() => {
    if (quickSelectedDevice) {
      setFormDeviceId(quickSelectedDevice.id);
      setFormSymptom(`Bảo trì/Sửa chữa thiết bị ${quickSelectedDevice.name}`);
      setFormTargetCompletion(new Date(Date.now() + 48*60*60*1000).toISOString().split("T")[0]);
      setFormTechnician(userName);
      setFormImageBefore("");
      setFormPartsUsed([]);
      setFormAssignedTechnicians([]);
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

    // Check deficient items
    const deficient = formPartsUsed.map(item => {
      const p = parts.find(x => x.code === item.partCode);
      const stock = p ? p.stock : 0;
      return {
        partCode: item.partCode,
        partName: item.partName,
        required: item.quantity,
        stock: stock,
        deficit: item.quantity - stock,
        unit: p ? p.unit : "Cái"
      };
    }).filter(item => item.deficit > 0);

    if (deficient.length > 0) {
      setInsufficientItemsList(deficient);
      const qMap: {[code: string]: number} = {};
      deficient.forEach(item => {
        qMap[item.partCode] = item.deficit * 2; // Default to buying double the deficit
      });
      setProcurementQtyMap(qMap);
      setShowInsufficientStockPopup(true);
      return;
    }

    const finalTechStr = formAssignedTechnicians.length > 0
      ? formAssignedTechnicians.map(id => usersList.find(u => u.id === id)?.name || id).join(", ")
      : formTechnician || userName;

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
      technician: finalTechStr,
      assignedTechnicians: formAssignedTechnicians,
      status: "Chờ duyệt",
      notes: "Khởi tạo phiếu thành công, gửi Trưởng ca phê duyệt.",
      partsUsed: formPartsUsed,
      cost: formPartsUsed.reduce((acc, p) => {
        const item = parts.find((x) => x.code === p.partCode);
        return acc + (item ? item.price * p.quantity : 0);
      }, 0),
      recoveredMaterials: "",
      history: [
        {
          time: new Date().toISOString(),
          user: userName,
          action: "Tạo phiếu sửa chữa",
          details: `Gửi phê duyệt phương án. Người thực hiện: ${finalTechStr}`
        }
      ]
    });

    setShowAddModal(false);
    onClearQuickSelectedDevice();
  };

  const handleConfirmProcurementAndSaveWO = (createRequest: boolean) => {
    const dev = devices.find((d) => d.id === formDeviceId);
    if (!dev) return;

    const finalTechStr = formAssignedTechnicians.length > 0
      ? formAssignedTechnicians.map(id => usersList.find(u => u.id === id)?.name || id).join(", ")
      : formTechnician || userName;

    // Create the Work Order with status "Chờ vật tư"
    const newWO: Omit<WorkOrder, "id" | "code" | "date"> = {
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
      technician: finalTechStr,
      assignedTechnicians: formAssignedTechnicians,
      status: "Chờ vật tư",
      notes: "Tạo phiếu thành công. Trạng thái 'Chờ vật tư' do thiếu hụt linh kiện trong kho.",
      partsUsed: formPartsUsed,
      cost: formPartsUsed.reduce((acc, p) => {
        const item = parts.find((x) => x.code === p.partCode);
        return acc + (item ? item.price * p.quantity : 0);
      }, 0),
      recoveredMaterials: "",
      history: [
        {
          time: new Date().toISOString(),
          user: userName,
          action: "Tạo phiếu sửa chữa",
          details: `Thiết lập trạng thái 'Chờ vật tư'. Thiết bị: ${dev.name}. Người thực hiện: ${finalTechStr}`
        }
      ]
    };

    if (createRequest) {
      const itemsToRequest = insufficientItemsList.map(item => ({
        partCode: item.partCode,
        partName: item.partName,
        quantity: procurementQtyMap[item.partCode] || item.deficit,
        unit: item.unit,
        reason: `Cần cho phiếu sửa chữa khẩn cấp ${dev.name} (${item.partCode})`
      }));

      const reqBody = {
        proposer: userName,
        reason: procurementReason,
        items: itemsToRequest,
        deviceName: dev.name,
        deviceId: dev.id
      };

      fetch("/api/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      })
      .then(res => res.json())
      .then(data => {
        newWO.notes += ` Đã tự động lập phiếu yêu cầu mua vật tư ${data.code || ""} gửi Trưởng ca duyệt.`;
        newWO.history?.push({
          time: new Date().toISOString(),
          user: userName,
          action: "Tự động tạo phiếu mua hàng",
          details: `Tạo phiếu yêu cầu mua vật tư ${data.code || ""} cho các linh kiện thiếu hụt.`
        });
        onCreateWorkOrder(newWO);
      })
      .catch(err => {
        console.error("Error creating material request:", err);
        onCreateWorkOrder(newWO);
      });
    } else {
      onCreateWorkOrder(newWO);
    }

    setShowInsufficientStockPopup(false);
    setShowAddModal(false);
    onClearQuickSelectedDevice();
  };

  const handleReassignTechnicians = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    const newTechNames = reassignTechs.map(id => usersList.find(u => u.id === id)?.name || id).join(", ");
    const updatedHistory = selectedWO.history || [];
    const logEntry = {
      time: new Date().toISOString(),
      user: userName,
      action: "Điều chuyển nhân sự",
      details: `Thay đổi người thực hiện thành: [${newTechNames}]. Lý do: ${reassignReason || "Điều động sản xuất"}`
    };

    onUpdateWorkOrder(selectedWO.id, {
      assignedTechnicians: reassignTechs,
      technician: newTechNames,
      history: [...updatedHistory, logEntry],
      notes: `Đã thay đổi nhân sự thực hiện: ${newTechNames}. Lý do: ${reassignReason}`
    });

    setSelectedWO({
      ...selectedWO,
      assignedTechnicians: reassignTechs,
      technician: newTechNames,
      history: [...updatedHistory, logEntry],
      notes: `Đã thay đổi nhân sự thực hiện: ${newTechNames}. Lý do: ${reassignReason}`
    });

    setShowReassignModal(false);
    setReassignReason("");
  };

  const handleTransitionStatus = (wo: WorkOrder, target: WorkOrderStatus) => {
    const updatedHistory = wo.history || [];
    const logEntry = {
      time: new Date().toISOString(),
      user: userName,
      action: "Cập nhật trạng thái",
      details: `Chuyển trạng thái từ [${wo.status}] sang [${target}]`
    };

    onUpdateWorkOrder(wo.id, {
      status: target,
      notes: `Trạng thái cập nhật bởi ${userName} (${userRole}) thành ${target}`,
      history: [...updatedHistory, logEntry]
    });

    setSelectedWO({
      ...wo,
      status: target,
      history: [...updatedHistory, logEntry]
    });
  };

  const handleSaveComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    const updatedHistory = selectedWO.history || [];
    const logEntry = {
      time: new Date().toISOString(),
      user: userName,
      action: "Hoàn thành sửa chữa",
      details: `Khai báo hoàn tất sửa chữa. Thời gian thực hiện: ${compDuration} giờ. Chi phí phát sinh: ${compCost} VND. Vật tư thu hồi: ${compRecovered || "Không có"}. Trả về: ${compRecoveredWarehouse}`
    };

    onUpdateWorkOrder(selectedWO.id, {
      status: "Hoàn thành",
      completedDate: new Date().toISOString().split("T")[0],
      durationHours: Number(compDuration),
      cost: selectedWO.cost + Number(compCost),
      recoveredMaterials: compRecovered || "Không có",
      imageAfter: compImageAfter,
      notes: `Đã hoàn thành sửa chữa. Thời gian thực hiện: ${compDuration} giờ. Vật tư thu hồi: ${compRecovered || "Không có"}. Kho lưu trữ: ${compRecoveredWarehouse}`,
      history: [...updatedHistory, logEntry]
    });

    if (compRecoveredPart) {
      const originalPart = parts.find(p => p.code === compRecoveredPart);
      if (originalPart) {
        const recPartBody = {
          code: `${compRecoveredPart}-REC-${Date.now().toString().slice(-4)}`,
          name: `[Thu Hồi] ${originalPart.name}`,
          serial: originalPart.serial || "CHUNG",
          category: originalPart.category || "Vật tư sửa chữa",
          stock: Number(compRecoveredQty),
          minStock: 0,
          lifecycleMonths: originalPart.lifecycleMonths || 12,
          unit: originalPart.unit || "Cái",
          price: originalPart.price || 0,
          origin: originalPart.origin,
          color: originalPart.color,
          deviceId: selectedWO.deviceId,
          deviceIds: [selectedWO.deviceId],
          isRecovered: true,
          recoveredFrom: selectedWO.code,
          recoveredWarehouse: compRecoveredWarehouse
        };

        fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recPartBody)
        })
        .then(res => res.json())
        .then(() => {
          console.log("Recovered part registered successfully");
        })
        .catch(err => console.error("Error saving recovered part:", err));
      }
    }

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

                {/* Chronological Traceability History Logs */}
                <div className="border-t border-gray-200 pt-4">
                  <span className="text-gray-500 font-semibold block border-b pb-1 mb-2">📋 Lịch sử tiến trình chi tiết:</span>
                  <div className="space-y-3 pl-1 max-h-52 overflow-y-auto pr-1">
                    {(selectedWO.history && selectedWO.history.length > 0 ? selectedWO.history : [
                      {
                        time: selectedWO.faultTime || selectedWO.date,
                        user: selectedWO.creator || "Hệ thống",
                        action: "Khai báo sự cố",
                        details: `Đăng ký phiếu thành công. Kỹ thuật viên ban đầu: ${selectedWO.technician}`
                      }
                    ]).map((log, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-indigo-500 pb-1">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                          <span>{log.action}</span>
                          <span>{formatDate(log.time)}</span>
                        </div>
                        <p className="text-[11px] text-slate-800 font-semibold mt-0.5">{log.details}</p>
                        <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1 rounded block w-max mt-0.5 uppercase">
                          Thực hiện: {log.user}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATE TRANSITION FLOW TRIGGERS (ROLE-BASED AUTHORIZATION) */}
                <div className="pt-4 border-t border-gray-150 space-y-2">
                  {/* Supervisor Personnel Reassignment approved button */}
                  {(userRole === "Trưởng ca" || userRole === "ADMIN") && 
                   selectedWO.status !== "Hoàn thành" && 
                   selectedWO.status !== "Đóng phiếu" && (
                    <button
                      type="button"
                      onClick={() => {
                        setReassignWOId(selectedWO.id);
                        setReassignTechs(selectedWO.assignedTechnicians || []);
                        setReassignReason("");
                        setShowReassignModal(true);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition text-center flex items-center justify-center gap-1.5 text-[11px] mb-2"
                    >
                      <span>🔄 Điều chuyển nhân sự bảo trì</span>
                    </button>
                  )}

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
                        setCompRecoveredPart("");
                        setCompRecoveredQty(1);
                        setCompRecoveredWarehouse("Kho Vật Tư Trung Tâm");
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

                <div className="col-span-2">
                  <label className="block text-gray-600 font-bold mb-1">Nhân sự thực hiện (Hệ thống Kỹ thuật bảo trì - Cơ điện)</label>
                  <div className="border border-gray-300 rounded-lg p-3 bg-slate-50 max-h-36 overflow-y-auto space-y-2">
                    {(() => {
                      const techniciansList = usersList.filter(u => 
                        u.role === "Kỹ thuật bảo trì (Cơ điện)" || 
                        u.role?.toLowerCase().includes("kỹ thuật") || 
                        u.role?.toLowerCase().includes("bảo trì")
                      );
                      const finalTechList = techniciansList.length > 0 ? techniciansList : usersList;
                      return finalTechList.map((user) => {
                        const isChecked = formAssignedTechnicians.includes(user.id);
                        return (
                          <label key={user.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-100 rounded">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormAssignedTechnicians([...formAssignedTechnicians, user.id]);
                                } else {
                                  setFormAssignedTechnicians(formAssignedTechnicians.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <div>
                              <span className="font-bold text-slate-800">{user.name}</span>
                              <span className="text-[10px] text-indigo-600 ml-2 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-100">
                                {user.role}
                              </span>
                            </div>
                          </label>
                        );
                      });
                    })()}
                    {usersList.length === 0 && (
                      <span className="text-gray-400 italic">Đang tải danh sách tài khoản cơ điện...</span>
                    )}
                  </div>
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
                          <th className="py-2 px-3 text-center">Tồn kho</th>
                          <th className="py-2 px-3 text-center">Yêu cầu</th>
                          <th className="py-2 px-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {formPartsUsed.map((item, idx) => {
                          const partObj = parts.find(p => p.code === item.partCode);
                          const currentStock = partObj ? partObj.stock : 0;
                          return (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.partCode}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{item.partName}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-500 bg-slate-50">{currentStock} {partObj?.unit || "cái"}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity} {partObj?.unit || "cái"}</td>
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
                          );
                        })}
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
                <label className="block text-gray-600 font-bold mb-1">Mô tả vật tư thu hồi (Ghi chú tự do)</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="Ví dụ: 1 Cảm biến Autonics cũ mờ hỏng, gioăng cao su cũ..."
                  value={compRecovered}
                  onChange={(e) => setCompRecovered(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <span className="block text-slate-800 font-bold text-[11px] uppercase border-b pb-1">
                  ♻️ Khai báo vật tư nhập kho thu hồi:
                </span>
                
                <div>
                  <label className="block text-gray-500 text-[10px] mb-1 font-bold">Lọc mã linh kiện cần thu hồi</label>
                  <select
                    className="w-full border border-gray-300 rounded p-1.5 bg-white text-slate-800 font-medium"
                    value={compRecoveredPart}
                    onChange={(e) => setCompRecoveredPart(e.target.value)}
                  >
                    <option value="">-- Không đăng ký linh kiện thu hồi cụ thể --</option>
                    {parts.map((p) => (
                      <option key={p.code} value={p.code}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 text-[10px] mb-1 font-bold">Số lượng thu hồi</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded p-1 text-center font-bold text-slate-800"
                      value={compRecoveredQty}
                      onChange={(e) => setCompRecoveredQty(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-[10px] mb-1 font-bold">Phạm vi kho thu hồi</label>
                    <select
                      className="w-full border border-gray-300 rounded p-1 bg-white text-slate-800 font-bold text-[11px]"
                      value={compRecoveredWarehouse}
                      onChange={(e) => setCompRecoveredWarehouse(e.target.value)}
                    >
                      <option value="Kho Vật Tư Trung Tâm">Vật tư sửa chữa (Kho TT)</option>
                      <option value="Kho Vật Tư Dự Phòng Xưởng">Vật tư Trung tâm sản xuất</option>
                    </select>
                  </div>
                </div>
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

      {/* MODAL: Popup Cảnh Báo Thiếu Hụt Tồn Kho & Lập Phiếu Yêu Cầu Vật Tư */}
      {showInsufficientStockPopup && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-white" />
                Cảnh báo: Không đủ hàng tồn kho sửa chữa!
              </h3>
              <button onClick={() => setShowInsufficientStockPopup(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed font-vietnamese">
                Các linh kiện sau đây có số lượng tồn kho thực tế ít hơn nhu cầu sửa chữa của thiết bị. Hệ thống đề xuất tạo phiếu yêu cầu mua vật tư gửi Trưởng ca duyệt ngay:
              </p>

              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs bg-amber-50/20">
                  <thead>
                    <tr className="border-b border-amber-200 bg-amber-100/50 font-semibold text-slate-700 text-[10px] uppercase">
                      <th className="py-2 px-3">Linh kiện</th>
                      <th className="py-2 px-3 text-center">Nhu cầu</th>
                      <th className="py-2 px-3 text-center">Tồn kho</th>
                      <th className="py-2 px-3 text-center">Thiếu hụt</th>
                      <th className="py-2 px-3 text-right">Đề xuất mua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 text-slate-800">
                    {insufficientItemsList.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <span className="font-semibold block">{item.partName}</span>
                          <span className="text-[9px] font-mono text-gray-500">Mã: {item.partCode}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{item.required}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-400">{item.stock}</td>
                        <td className="py-2 px-3 text-center font-bold text-rose-600">-{item.deficit}</td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={item.deficit}
                            className="w-16 border border-amber-300 rounded px-1.5 py-0.5 text-center font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
                            value={procurementQtyMap[item.partCode] || item.deficit}
                            onChange={(e) => {
                              const val = Math.max(item.deficit, Number(e.target.value));
                              setProcurementQtyMap({
                                ...procurementQtyMap,
                                [item.partCode]: val
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Lý do lập phiếu mua hàng khẩn cấp</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-slate-800"
                  rows={2}
                  value={procurementReason}
                  onChange={(e) => setProcurementReason(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => handleConfirmProcurementAndSaveWO(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition"
                >
                  Bỏ qua mua khẩn cấp
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmProcurementAndSaveWO(true)}
                  className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition"
                >
                  Đồng ý Tạo yêu cầu mua & Phát hành phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Điều chuyển nhân sự approved by Trưởng Ca */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">🔄 Trưởng ca duyệt điều chuyển nhân sự sửa chữa</h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReassignTechnicians} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1.5">
                  Chọn nhân sự kỹ thuật thay thế (Được phép chọn nhiều người)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 bg-slate-50 max-h-36 overflow-y-auto space-y-1.5">
                  {usersList.map((user) => {
                    const isChecked = reassignTechs.includes(user.id);
                    return (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 rounded">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReassignTechs([...reassignTechs, user.id]);
                            } else {
                              setReassignTechs(reassignTechs.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <div>
                          <span className="font-bold text-slate-800">{user.name}</span>
                          <span className="text-[10px] text-indigo-600 ml-2 uppercase font-semibold bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                            {user.role}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">
                  Lý do điều chuyển nhân sự (Lưu trữ và truy cứu tiến trình)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kỹ thuật viên A bận ca trực máy đùn số 2; Cần bổ sung kỹ thuật điện..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Duyệt điều chuyển nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
