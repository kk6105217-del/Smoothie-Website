import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryToken = new URLSearchParams(location.search).get('token') || '';

  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.auth.resetPassword({
        token: token.trim(),
        new_password: newPassword
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#eaeded] min-h-screen py-10 px-4 flex flex-col justify-center items-center">
      <Link to="/" className="flex items-center space-x-3 mb-6 group">
        <img
          src="/logo.png"
          alt="VK Technology Logo"
          className="w-12 h-12 object-contain rounded-full bg-white p-1 shadow-md transform group-hover:scale-105 transition-transform shrink-0"
        />
        <div className="flex items-center text-gray-900 text-left">
          <span className="text-2xl font-black">VK</span>
          <span className="text-2xl font-bold text-amber-500 ml-1.5">TECHNOLOGY</span>
        </div>
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-300 w-full max-w-sm text-left">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Create New Password</h1>

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs mb-4 flex items-center">
            <CheckCircle2 size={16} className="mr-2 shrink-0" />
            <span>{successMsg} Redirecting to sign in...</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          {!queryToken && (
            <div>
              <label className="block font-bold text-gray-800 mb-1">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none font-mono"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-800 mb-1">New Password (at least 6 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Re-enter New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-2.5 rounded text-xs shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? 'Resetting Password...' : 'Save changes and sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
