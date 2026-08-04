import { useEffect, useState } from "react";
import { FiTrash2, FiShield, FiUser } from "react-icons/fi";
import { getUsers, updateUserRole, deleteUser } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError("Failed to load users list.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser._id) {
      alert("You cannot change your own administrative role!");
      return;
    }
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      setUpdatingId(userId);
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => ((u._id || u.id) === userId ? { ...u, role: updated.role } : u)));
    } catch (err) {
      alert("Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser._id) {
      alert("You cannot delete your own administrative account!");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user? All their order records remain, but they cannot sign in.")) return;

    try {
      setUpdatingId(userId);
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
    } catch (err) {
      alert("Failed to delete user.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading user accounts list…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold">Users Management</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Promote users to administrative privileges or revoke roles, and delete inactive profiles
        </p>
      </div>

      {error ? (
        <div className="text-rose-500 text-center py-10">{error}</div>
      ) : (
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr
                  className="border-b text-xs font-bold uppercase tracking-wider"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-muted)",
                    background: "var(--color-surface-alt)",
                  }}
                >
                  <th className="py-4 px-6 font-semibold">User</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Role</th>
                  <th className="py-4 px-6 font-semibold">Joined Date</th>
                  <th className="py-4 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {users.map((u) => {
                  const uid = u._id || u.id;
                  const isSelf = uid === currentUser._id;
                  const isUpdating = updatingId === uid;

                  return (
                    <tr key={uid} className="hover:bg-[var(--color-surface-alt)] transition">
                      {/* Name with icon badge */}
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{
                            background:
                              u.role === "admin"
                                ? "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)"
                                : "linear-gradient(135deg, var(--color-muted) 0%, #475569 100%)",
                          }}
                        >
                          {u.role === "admin" ? <FiShield size={14} /> : <FiUser size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {u.name} {isSelf && <span className="text-[10px] text-[var(--color-accent)] font-mono">(You)</span>}
                          </p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-medium text-[var(--color-body)]">{u.email}</td>

                      {/* Role selection dropdown */}
                      <td className="py-4 px-6">
                        <select
                          value={u.role}
                          disabled={isSelf || isUpdating}
                          onChange={(e) => handleRoleChange(uid, e.target.value)}
                          className="text-xs font-bold rounded-lg border px-2.5 py-1 outline-none disabled:opacity-50"
                          style={{
                            background: "var(--color-surface-alt)",
                            borderColor: "var(--color-border)",
                            color: u.role === "admin" ? "var(--color-accent)" : "var(--color-body)",
                          }}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Date joined */}
                      <td className="py-4 px-6 text-xs text-[var(--color-muted)]">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Delete option */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDelete(uid)}
                          disabled={isSelf || isUpdating}
                          className="p-2 rounded-lg transition hover:bg-[var(--color-surface-hover)] text-rose-500 disabled:opacity-20"
                          title={isSelf ? "Self-deletion disabled" : "Delete user profile"}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
