import React, { useState, useEffect } from "react";
import { User, RoleDetails } from "../types";
import { 
  Shield, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Save, 
  Check, 
  X, 
  Lock, 
  CheckCircle2, 
  ShieldAlert, 
  UserCheck, 
  Briefcase 
} from "lucide-react";

interface AdminUsersProps {
  currentUser: User | null;
  users: User[];
  onRefreshUsers: () => void;
  triggerNotification: (msg: string) => void;
}

export default function AdminUsers({
  currentUser,
  users,
  onRefreshUsers,
  triggerNotification
}: AdminUsersProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "roles">("users");
  const [roles, setRoles] = useState<RoleDetails[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDetails | null>(null);
  
  // Form states for creating/editing User
  const [userName, setUserName] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState("");
  const [userDept, setUserDept] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Fetch Roles from server
  const fetchRoles = () => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data: RoleDetails[]) => {
        setRoles(data);
      })
      .catch((err) => console.error("Lỗi tải danh sách vai trò:", err));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle Save / Add User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userUsername || !userRoleId || !userDept) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const payload = {
      name: userName,
      username: userUsername,
      password: userPassword || undefined,
      roleId: userRoleId,
      dept: userDept
    };

    try {
      if (editingUser) {
        // Update user
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          triggerNotification(`✔️ Đã cập nhật thành viên ${userName}`);
          setEditingUser(null);
          onRefreshUsers();
        } else {
          const err = await res.json();
          alert(err.message || "Lỗi cập nhật thành viên");
        }
      } else {
        // Add new user
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          triggerNotification(`✔️ Đã tạo tài khoản thành viên ${userName}`);
          setIsAddingUser(false);
          resetUserForm();
          onRefreshUsers();
        } else {
          const err = await res.json();
          alert(err.message || "Lỗi thêm mới thành viên");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến máy chủ.");
    }
  };

  const resetUserForm = () => {
    setUserName("");
    setUserUsername("");
    setUserPassword("");
    setUserRoleId(roles[0]?.id || "");
    setUserDept("");
  };

  const handleStartEditUser = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserUsername(user.username);
    setUserPassword(user.password || "");
    setUserRoleId(user.roleId);
    setUserDept(user.dept);
    setIsAddingUser(false);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      alert("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa thành viên ${name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        triggerNotification(`🗑️ Đã xóa thành viên ${name}`);
        onRefreshUsers();
      } else {
        alert("Lỗi khi xóa tài khoản.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Role Permissions
  const handleUpdateRolePermission = async (role: RoleDetails, key: keyof RoleDetails, value: boolean) => {
    const updatedRole = { ...role, [key]: value };
    
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRole)
      });
      if (res.ok) {
        triggerNotification(`🛡️ Đã cập nhật quyền hạn cho vai trò: ${role.name}`);
        
        // Update local roles state
        setRoles(roles.map(r => r.id === role.id ? updatedRole : r));
        // Refresh users to ensure they get newest role details
        onRefreshUsers();
      } else {
        alert("Lỗi khi cập nhật vai trò");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRoleDetailsText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRole)
      });
      if (res.ok) {
        triggerNotification(`✔️ Đã cập nhật thông tin vai trò ${editingRole.name}`);
        setEditingRole(null);
        fetchRoles();
        onRefreshUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="admin-users-view">
      {/* View Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold tracking-tight">Quản trị Hệ thống & Phân Quyền</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Thiết lập danh sách nhân sự, cấu hình quyền hạn hành động trên từng mô-đun (Thiết bị, Sửa chữa, Kho, Vật tư).
          </p>
        </div>
        
        {/* Toggle sub-tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 w-full md:w-auto shrink-0">
          <button
            onClick={() => {
              setActiveSubTab("users");
              setEditingUser(null);
              setIsAddingUser(false);
            }}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${
              activeSubTab === "users" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Danh sách Nhân sự
          </button>
          <button
            onClick={() => {
              setActiveSubTab("roles");
              setEditingRole(null);
            }}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${
              activeSubTab === "roles" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Vai trò & Phân Quyền
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Danh sách cán bộ kỹ thuật và quản lý
                </h3>
                <p className="text-[11px] text-gray-500">Tài khoản đăng nhập CMMS chuẩn của nhà máy SADICO.</p>
              </div>

              {!isAddingUser && !editingUser && (
                <button
                  onClick={() => {
                    setIsAddingUser(true);
                    setUserRoleId(roles[0]?.id || "codien");
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm thành viên mới</span>
                </button>
              )}
            </div>

            {/* Form Thêm/Sửa */}
            {(isAddingUser || editingUser) && (
              <form onSubmit={handleSaveUser} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    {editingUser ? `Cập nhật tài khoản: ${editingUser.name}` : "Tạo tài khoản mới"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUser(false);
                      setEditingUser(null);
                      resetUserForm();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và Tên</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nguyễn Văn A"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên Đăng Nhập (Username)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="nguyenvana"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      disabled={!!editingUser}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mật Khẩu</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="Trống = giữ nguyên"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vai Trò Hệ Thống</label>
                    <select
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                      value={userRoleId}
                      onChange={(e) => setUserRoleId(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tổ Đội / Phòng Ban</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      placeholder="Tổ Cơ điện, Phòng Vật tư..."
                      value={userDept}
                      onChange={(e) => setUserDept(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUser(false);
                      setEditingUser(null);
                      resetUserForm();
                    }}
                    className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-lg transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thông tin</span>
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách người dùng dạng bảng */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Thành viên</th>
                    <th className="py-3 px-4">Tên Đăng Nhập</th>
                    <th className="py-3 px-4">Mật khẩu</th>
                    <th className="py-3 px-4">Tổ Đội / Bộ phận</th>
                    <th className="py-3 px-4">Vai trò bảo mật</th>
                    <th className="py-3 px-4">Quyền hạn chi tiết</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {users.map((u) => {
                    const r = u.roleDetails;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs shrink-0">
                              {u.name.split(" ").pop()?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{u.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{u.username}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 select-all">{u.password || "123456"}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-slate-600 font-semibold">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.dept}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {r?.canManageDevices && (
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold">
                                Thiết bị
                              </span>
                            )}
                            {r?.canManageWorkOrders && (
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold">
                                Sửa chữa
                              </span>
                            )}
                            {r?.canManageParts && (
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold">
                                Linh kiện
                              </span>
                            )}
                            {r?.canManageMaterials && (
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold">
                                Đề xuất vật tư
                              </span>
                            )}
                            {r?.canManageUsers && (
                              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Quản trị viên
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(u)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className={`p-1.5 rounded-lg transition ${
                                u.id === currentUser?.id
                                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "bg-red-50 hover:bg-red-100 text-red-600"
                              }`}
                              title="Xóa tài khoản"
                              disabled={u.id === currentUser?.id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === "roles" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Bảng ma trận quyền hạn hệ thống theo vai trò
                </h3>
                <p className="text-[11px] text-gray-500">
                  Phân quyền trực tiếp dựa trên cấu hình bảo mật. Bật/Tắt các checkbox dưới đây để thay đổi quyền hạn tức thời.
                </p>
              </div>
            </div>

            {editingRole && (
              <form onSubmit={handleUpdateRoleDetailsText} className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" /> Thay đổi mô tả vai trò: {editingRole.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="p-1 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên Hiển Thị</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả Vai trò</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                      value={editingRole.description || ""}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-3 py-1 border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold text-xs rounded-md"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-1 rounded-md transition"
                  >
                    Lưu mô tả
                  </button>
                </div>
              </form>
            )}

            {/* Ma Trận Phân Quyền */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-[240px]">Vai trò</th>
                    <th className="py-3.5 px-4 text-center">Quản lý Thiết bị</th>
                    <th className="py-3.5 px-4 text-center">Quản lý Sửa chữa (7 Bước)</th>
                    <th className="py-3.5 px-4 text-center">Quản lý Kho linh kiện</th>
                    <th className="py-3.5 px-4 text-center">Quản lý Đề xuất vật tư</th>
                    <th className="py-3.5 px-4 text-center">Cấu hình hệ thống & Người dùng</th>
                    <th className="py-3.5 px-4 text-center">Xem nhật ký (Audit Logs)</th>
                    <th className="py-3.5 px-4 text-center w-[100px]">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {roles.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>{r.name}</span>
                          <button
                            onClick={() => setEditingRole(r)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition"
                            title="Sửa tên/mô tả vai trò"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-mono">Mã: {r.id}</span>
                      </td>

                      {/* Quản lý Thiết bị */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canManageDevices}
                          onChange={(e) => handleUpdateRolePermission(r, "canManageDevices", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Quản lý Sửa chữa */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canManageWorkOrders}
                          onChange={(e) => handleUpdateRolePermission(r, "canManageWorkOrders", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Quản lý Kho linh kiện */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canManageParts}
                          onChange={(e) => handleUpdateRolePermission(r, "canManageParts", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Quản lý Đề xuất vật tư */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canManageMaterials}
                          onChange={(e) => handleUpdateRolePermission(r, "canManageMaterials", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Cấu hình hệ thống */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canManageUsers}
                          onChange={(e) => handleUpdateRolePermission(r, "canManageUsers", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Xem nhật ký */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r.canViewAuditLogs}
                          onChange={(e) => handleUpdateRolePermission(r, "canViewAuditLogs", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-[10px] text-gray-500 font-medium italic leading-normal max-w-[200px] font-vietnamese">
                          {r.description || "Không có mô tả."}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 text-xs block">Nguyên tắc bảo mật SADICO:</span>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  Tất cả thay đổi cấu hình phân quyền sẽ có hiệu lực <strong>ngay lập tức</strong> cho toàn bộ người dùng đang trực thuộc vai trò đó. Hệ thống sẽ lưu nhật ký bảo trì và kiểm toán bảo mật tự động của mọi thao tác thay đổi phân quyền.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
