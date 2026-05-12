"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useEffect, useState, useCallback } from "react";
import { Shield, UserPlus, Trash2, Search, Users, Crown, UserCheck, AlertTriangle, Pencil, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { LoadingOverlay, ConfirmDialog } from "./AdminUI";

interface UserData {
  id: string;
  email: string;
  nama?: string;
  role: string;
  createdAt?: string;
}

export default function AdminKelolaAdminClient() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    msg: "",
    type: "info" as "info" | "delete",
    action: () => {}
  });

  const askConfirm = (title: string, msg: string, type: "info" | "delete", action: () => void) => {
    setConfirmState({ open: true, title, msg, type, action });
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && userRole !== "admin") {
      router.replace("/admin");
    }
  }, [authLoading, userRole, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const userList: UserData[] = await res.json();
      // Sort: admin first, then by email
      userList.sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return a.email.localeCompare(b.email);
      });
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Gagal memuat data pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole, fetchUsers]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleToggleRole(userData: UserData) {
    if (userData.id === user?.uid) {
      showToast("Anda tidak bisa mengubah role Anda sendiri!", "error");
      return;
    }
    const nextRole = userData.role === "admin" ? "user" : "admin";
    askConfirm("Ubah Role", `Apakah Anda yakin ingin mengubah role ${userData.email} menjadi ${nextRole}?`, "info", async () => {
      setConfirmState(prev => ({ ...prev, open: false }));
      setProcessing(true);
      try {
        const res = await fetchWithAuth("/api/auth/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userData.id, role: nextRole }),
        });
        if (!res.ok) throw new Error("Failed to update role");
        showToast(`Role ${userData.email} berhasil diubah menjadi ${nextRole}`, "success");
        fetchUsers();
      } catch (err) {
        console.error("Error updating role:", err);
        showToast("Gagal mengubah role pengguna", "error");
      } finally {
        setProcessing(false);
      }
    });
  }

  function resetUserForm() {
    setShowAddModal(false);
    setEditTarget(null);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setShowPassword(false);
  }

  function openAddModal() {
    setEditTarget(null);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setShowAddModal(true);
  }

  function openEditModal(userData: UserData) {
    setEditTarget(userData);
    setNewName(userData.nama || "");
    setNewEmail(userData.email);
    setNewPassword("");
    setNewRole(userData.role === "admin" ? "admin" : "user");
    setShowAddModal(true);
  }

  function handleSaveUser() {
    if (!newName.trim()) { showToast("Nama tidak boleh kosong!", "error"); return; }
    if (!newEmail.trim()) { showToast("Email tidak boleh kosong!", "error"); return; }
    if (!editTarget && newPassword.length < 6) { showToast("Password minimal 6 karakter!", "error"); return; }
    if (editTarget && newPassword && newPassword.length < 6) { showToast("Password minimal 6 karakter!", "error"); return; }
    
    const actionLabel = editTarget ? "menyimpan perubahan pengguna ini" : "menambahkan pengguna ini";
    askConfirm("Konfirmasi Simpan", `Apakah Anda yakin ingin ${actionLabel}?`, "info", async () => {
      setConfirmState(prev => ({ ...prev, open: false }));
      setProcessing(true);
      try {
        const res = await fetchWithAuth("/api/auth/users", {
          method: editTarget ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget?.id,
            email: newEmail.trim(),
            password: newPassword,
            nama: newName.trim(),
            role: newRole,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save user");
        }

        showToast(
          editTarget
            ? `Pengguna ${newEmail} berhasil diperbarui`
            : `Pengguna ${newEmail} berhasil ditambahkan sebagai ${newRole}`,
          "success"
        );
        resetUserForm();
        fetchUsers();
      } catch (err: any) {
        console.error("Error saving user:", err);
        showToast(err.message || "Gagal menyimpan pengguna", "error");
      } finally {
        setProcessing(false);
      }
    });
  }

  function handleDeleteClick(userData: UserData) {
    if (userData.id === user?.uid) {
      showToast("Anda tidak bisa menghapus akun Anda sendiri!", "error");
      return;
    }
    setDeleteTarget(userData);
    setShowConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setShowConfirm(false);
    setProcessing(true);
    try {
      const res = await fetchWithAuth(`/api/auth/users?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      showToast(`Pengguna ${deleteTarget.email} berhasil dihapus`, "success");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Gagal menghapus pengguna", "error");
    } finally {
      setProcessing(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAdmin = users.filter((u) => u.role === "admin").length;
  const totalUser = users.filter((u) => u.role === "user").length;

  if (authLoading || userRole !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-l-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <LoadingOverlay show={processing} text="Sedang Memproses..." />
      <ConfirmDialog
        show={confirmState.open}
        title={confirmState.title}
        message={confirmState.msg}
        type={confirmState.type}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />
      <ConfirmDialog
        show={showConfirm}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${deleteTarget?.email}"? Tindakan ini tidak dapat dibatalkan.`}
        type="delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteTarget(null);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-[9999] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-3 animate-slide-in-right ${toast.type === "success"
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
            : "bg-gradient-to-r from-rose-500 to-rose-600"
            }`}
        >
          {toast.type === "success" ? (
            <UserCheck size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Kelola Admin</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manajemen pengguna dan hak akses</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
        >
          <UserPlus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Users className="text-violet-600 dark:text-violet-400" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Total Pengguna</p>
            <p className="text-3xl font-black text-violet-700 dark:text-violet-300">{users.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Crown className="text-amber-600 dark:text-amber-400" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Admin</p>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{totalAdmin}</p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <UserCheck className="text-emerald-600 dark:text-emerald-400" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">User</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalUser}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Cari pengguna berdasarkan email atau role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-l-violet-500 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Tidak ada pengguna ditemukan</p>
            <p className="text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
          </div>
        ) : (
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengguna</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Terdaftar</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${u.id === user?.uid ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                      }`}
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === "admin"
                          ? "bg-gradient-to-br from-violet-500 to-purple-600"
                          : "bg-gradient-to-br from-slate-400 to-slate-500"
                          }`}>
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {u.nama || "Tanpa Nama"}
                            {u.id === user?.uid && (
                              <span className="ml-2 text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.id.substring(0, 20)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${u.role === "admin"
                          ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                          }`}
                      >
                        {u.role === "admin" ? <Crown size={12} /> : <UserCheck size={12} />}
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={u.id === user?.uid}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${u.id === user?.uid
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                            : u.role === "admin"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                              : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                            }`}
                          title={u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                        >
                          {u.role === "admin" ? "→ User" : "→ Admin"}
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                          title="Edit Pengguna"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          disabled={u.id === user?.uid}
                          className={`p-2 rounded-lg transition-all ${u.id === user?.uid
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                            }`}
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="grid gap-4 lg:hidden p-4">
            {filteredUsers.map((u, idx) => (
              <div
                key={u.id}
                className={`rounded-2xl border p-4 space-y-3 ${u.id === user?.uid
                  ? "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/10"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${u.role === "admin"
                      ? "bg-gradient-to-br from-violet-500 to-purple-600"
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                      }`}>
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {u.nama || "Tanpa Nama"}
                        {u.id === user?.uid && (
                          <span className="ml-2 text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
                            Anda
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${u.role === "admin"
                      ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                      }`}
                  >
                    {u.role === "admin" ? <Crown size={12} /> : <UserCheck size={12} />}
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "-"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleToggleRole(u)}
                    disabled={u.id === user?.uid}
                    className={`flex-1 min-w-[130px] px-3 py-2 rounded-lg text-xs font-bold transition-all ${u.id === user?.uid
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                      : u.role === "admin"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                        : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                      }`}
                  >
                    {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                  </button>
                  <button
                    onClick={() => openEditModal(u)}
                    className="flex-1 min-w-[130px] px-3 py-2 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(u)}
                    disabled={u.id === user?.uid}
                    className={`flex-1 min-w-[130px] px-3 py-2 rounded-lg text-xs font-bold transition-all ${u.id === user?.uid
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                      }`}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center py-10">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <UserPlus className="text-violet-500" size={22} />
                {editTarget ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {editTarget ? "Perbarui data pengguna dan hak akses" : "Masukkan email pengguna yang ingin ditambahkan"}
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={editTarget ? "Kosongkan jika tidak diganti" : "Minimal 6 karakter"}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewRole("user")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${newRole === "user"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <UserCheck size={16} className="inline mr-2" />
                    User
                  </button>
                  <button
                    onClick={() => setNewRole("admin")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${newRole === "admin"
                      ? "bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400 ring-2 ring-violet-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <Crown size={16} className="inline mr-2" />
                    Admin
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    resetUserForm();
                  }}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/30"
                >
                  {editTarget ? "Simpan" : "Tambahkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
