import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ArrowLeft, Home, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Cpu size={36} />
        </div>
        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">404</span>
          <h1 className="text-xl font-bold text-slate-900">Component Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page, pinout schematic, or product link you were looking for doesn't exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={14} /> Return to Homepage
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Search size={14} /> Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
