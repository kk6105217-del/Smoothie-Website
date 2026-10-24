import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdmin } = useAuth();

  const [email, setEmail] = useState('karthik.suroju@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (email.trim().toLowerCase() !== 'karthik.suroju@gmail.com') {
      setErrorMsg('Access denied. Only the authorized owner (karthik.suroju@gmail.com) can access this administration portal.');
      return;
    }

    try {
      setIsLoading(true);
      await adminLogin({ email: email.trim(), password });
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your admin password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 flex flex-col justify-center items-center text-left">
      {/* Brand */}
      <Link to="/" className="flex items-center space-x-3 mb-6">
        <img
          src="/logo.png"
          alt="VK Technology Logo"
          className="w-14 h-14 rounded-full bg-white p-1 object-contain shadow-2xl shrink-0"
        />
        <div className="text-white text-left">
          <div className="flex items-center">
            <span className="text-2xl font-black">VK</span>
            <span className="text-2xl font-bold text-amber-400 ml-1.5">Technology</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
            Administrative Control Center
          </span>
        </div>
      </Link>

      {/* Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
          <Lock size={14} />
          <span>Restricted Portal • Authorized Owner Only</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Administrator Login
        </h1>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Manage products, categories, orders, inventory, and customer fulfillment for VK Technology.
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Owner Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none font-medium text-gray-900 bg-gray-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-gray-700">Admin Password</label>
              <Link to="/forgot-password" className="text-vk-blue hover:underline text-[11px]">
                Reset password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your administrative password"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 space-y-0.5">
            <span className="font-bold">Initial Setup Password:</span>
            <p>If logging in for the first time, use <code>Admin@VK2026!</code> and change it inside the dashboard profile.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-2.5 rounded text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs">
          <Link to="/" className="text-gray-500 hover:text-gray-900 font-medium">
            ← Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
