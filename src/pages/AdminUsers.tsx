import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Users as UsersIcon } from 'lucide-react';
import { User } from '../types';

interface EditingUser extends User {
  password?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditingUser>({
    id: '',
    name: '',
    email: '',
    role: 'viewer',
    is_active: true,
    password: ''
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      email: '',
      role: 'viewer',
      is_active: true,
      password: ''
    });
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingId(user.id);
    setFormData({ ...user, password: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { name: formData.name, email: formData.email, role: formData.role, is_active: formData.is_active }
        : { name: formData.name, email: formData.email, role: formData.role, password: formData.password };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user');
      }

      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">User Management</h1>
          </div>
          <p className="text-gray-400">Manage system users and their roles</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingId ? 'Edit User' : 'Add New User'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="active" className="text-sm text-gray-300">Active</label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No users found. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-red-500/30 text-red-300' :
                          user.role === 'editor' ? 'bg-blue-500/30 text-blue-300' :
                          'bg-gray-500/30 text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.is_active ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-blue-500/20 rounded transition text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-500/20 rounded transition text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="text-3xl font-bold text-white">{users.length}</div>
            <div className="text-gray-400 text-sm">Total Users</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="text-3xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-gray-400 text-sm">Admins</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-400">{users.filter(u => u.is_active).length}</div>
            <div className="text-gray-400 text-sm">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
