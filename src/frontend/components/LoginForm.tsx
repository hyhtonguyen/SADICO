import React, { useState } from "react";
import { User } from "../types";
import { Wrench, Shield, Lock, Eye, EyeOff, AlertCircle, KeyRound, ArrowRight } from "lucide-react";

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
  triggerNotification: (msg: string) => void;
}

export default function LoginForm({ users, onLogin, triggerNotification }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Đăng nhập thất bại!");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          onLogin(data.user);
          triggerNotification(`🔑 Đăng nhập thành công: ${data.user.name} (${data.user.role})`);
        } else {
          setError("Thông tin đăng nhập không chính xác!");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        setError(err.message || "Không thể kết nối đến máy chủ bảo trì!");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuickLogin = (demoUser: User) => {
    setUsername(demoUser.username);
    setPassword("sadico123");
    setError(null);

    // Auto trigger submission with small delay for visual feedback
    setLoading(true);
    setTimeout(() => {
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoUser.username, password: "sadico123" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            onLogin(data.user);
            triggerNotification(`⚡ Đăng nhập nhanh: ${data.user.name} (${data.user.role})`);
          } else {
            setError("Đăng nhập nhanh thất bại!");
          }
        })
        .catch(() => setError("Lỗi kết nối máy chủ!"))
        .finally(() => setLoading(false));
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" id="sadico-login-container">
      {/* Subtle abstract background details */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-850 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden z-10">
        {/* Left column: Branding & System Intro */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-700 to-slate-900 p-8 text-white flex flex-col justify-between relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/15">
                <Wrench className="w-6 h-6 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">SADICO CMMS</h1>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Hệ thống Điều hành Bảo trì</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold leading-snug font-vietnamese">Quản Lý Bảo Trì Thông Minh Cho Nhà Máy SADICO</h2>
              <p className="text-xs text-indigo-100/80 leading-relaxed font-vietnamese">
                Giải pháp toàn diện giúp chuẩn hóa quy trình bảo trì 7 bước, giám sát linh kiện kho vật tư thời gian thực và tự động tính toán chỉ số hiệu năng OEE, MTTR, MTBF của thiết bị.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 space-y-3 text-[11px] text-indigo-200/70">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-300" />
              <span>Phân quyền vai trò người dùng (RBAC)</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-300" />
              <span>Mã hóa bảo mật thông tin nội bộ</span>
            </div>
            <p className="text-[10px] text-indigo-300/50 mt-4">🏢 CỔ PHẦN SADICO © 2026</p>
          </div>
        </div>

        {/* Right column: Login Form & Demo accounts */}
        <div className="lg:col-span-7 bg-slate-900 p-8 flex flex-col justify-between space-y-6">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white font-vietnamese">Đăng nhập hệ thống</h2>
              <p className="text-xs text-slate-400 mt-1 font-vietnamese">Vui lòng cung cấp thông tin tài khoản được cấp từ ban quản trị.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-pulse">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-vietnamese">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tên đăng nhập</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập (ví dụ: codien1)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu (mặc định: sadico123)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang kiểm tra thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP NGAY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo User Accounts */}
          <div className="pt-6 border-t border-slate-800 max-w-md w-full mx-auto">
            <div className="flex items-center gap-1.5 mb-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>ĐĂNG NHẬP NHANH VỚI TÀI KHOẢN MẪU</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 text-left transition duration-150 group"
                  disabled={loading}
                  type="button"
                >
                  <span className="text-white text-[11px] font-bold block leading-tight group-hover:text-indigo-400 transition-colors">
                    {u.name}
                  </span>
                  <span className="text-[9px] text-slate-500 block truncate mt-0.5 font-vietnamese">
                    {u.role.split(" (")[0]}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 block mt-1 bg-slate-900/50 px-1 py-0.2 rounded border border-slate-800 w-fit">
                    user: {u.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
