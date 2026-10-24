import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; token?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);

    try {
      setIsLoading(true);
      const res = await api.auth.forgotPassword(email.trim());
      setSuccessInfo({
        message: res.message,
        token: res.resetToken
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Request failed. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Assistance</h1>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Enter the email address associated with your VK Technology account to reset your password.
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs flex items-start space-x-2">
              <CheckCircle2 size={16} className="mr-1 shrink-0 mt-0.5" />
              <span>{successInfo.message}</span>
            </div>

            {successInfo.token && (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs space-y-2">
                <span className="font-bold text-gray-800 block">Development Reset Token:</span>
                <code className="bg-gray-200 p-1.5 rounded block text-[11px] font-mono break-all text-gray-900">
                  {successInfo.token}
                </code>
                <Link
                  to={`/reset-password?token=${successInfo.token}`}
                  className="block bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-2 rounded text-xs text-center mt-2 shadow"
                >
                  Proceed to Reset Password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-2.5 rounded text-xs shadow-sm transition disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Continue'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-3 border-t border-gray-200 text-xs">
          <Link to="/login" className="text-vk-blue hover:underline font-semibold">
            ← Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
