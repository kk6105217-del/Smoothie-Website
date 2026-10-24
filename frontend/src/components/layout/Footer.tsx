import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Mail, Phone, MapPin, ShieldCheck, Truck, RefreshCw, Headphones, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="text-slate-300 font-sans">
      {/* 1. Amazon-Style "Back to top" bar */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 bg-[#37475a] hover:bg-[#485769] text-white text-xs font-semibold text-center transition-colors block"
      >
        Back to top
      </button>

      {/* 2. Main 4-Column Navigation Grid (#232f3e) */}
      <div className="bg-[#232f3e] text-slate-300 py-12 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Column 1: Get to Know Us */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
              Get to Know Us
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/about" className="hover:underline hover:text-white">
                  About VK Technology
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline hover:text-white">
                  Maker Mission & Vision
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:underline hover:text-white">
                  All DIY Hardware Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline hover:text-white">
                  Lab & Engineering College Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Connect with Us */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
              Connect with Us
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-1.5">
                <Phone size={13} className="text-amber-400 flex-shrink-0" />
                <span>+91 8555997052 (Hotline)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail size={13} className="text-cyan-400 flex-shrink-0" />
                <span>karthik.suroju@gmail.com</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <span>Electronics City, Bengaluru, Karnataka 560100</span>
              </li>
              <li>
                <Link to="/contact" className="hover:underline hover:text-white text-cyan-400 font-semibold block pt-1">
                  WhatsApp Support (Instant Reply)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: DIY Tech & Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
              DIY Tech Categories
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/categories/arduino-boards-and-kits" className="hover:underline hover:text-white">
                  Arduino Boards & Starter Kits
                </Link>
              </li>
              <li>
                <Link to="/categories/esp32-and-iot-modules" className="hover:underline hover:text-white">
                  ESP32 & IoT Wi-Fi Telemetry
                </Link>
              </li>
              <li>
                <Link to="/categories/robotics-and-motor-drivers" className="hover:underline hover:text-white">
                  Robotics Chassis & Motor Drivers
                </Link>
              </li>
              <li>
                <Link to="/categories/sensors-and-electronic-components" className="hover:underline hover:text-white">
                  Sensors & Breakout Modules
                </Link>
              </li>
              <li>
                <Link to="/categories/stem-and-educational-kits" className="hover:underline hover:text-white">
                  STEM Student Educational Kits
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Let Us Help You */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
              Let Us Help You
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/account" className="hover:underline hover:text-white">
                  Your Account & Addresses
                </Link>
              </li>
              <li>
                <Link to="/account?tab=orders" className="hover:underline hover:text-white">
                  Your Orders & Tracking
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:underline hover:text-white">
                  Shipping Rates & Policies
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:underline hover:text-white">
                  7-Day Returns & Replacements
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:underline hover:text-white">
                  Help & FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Amazon-Style Logo & Country Center Strip (#131921) */}
      <div className="bg-[#131921] py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
              <Cpu size={20} />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              VK <span className="text-cyan-400">TECHNOLOGY</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
            <span className="px-3 py-1 border border-slate-600 rounded flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>India</span>
            </span>
            <span className="px-3 py-1 border border-slate-600 rounded">
              INR - Indian Rupee (₹)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Legal & Payment Badges (#131921 darker) */}
      <div className="bg-[#0f141c] py-8 text-center text-xs text-slate-400 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <Link to="/policies" className="hover:underline hover:text-slate-300">Conditions of Use & Sale</Link>
          <Link to="/policies" className="hover:underline hover:text-slate-300">Privacy Notice</Link>
          <Link to="/policies" className="hover:underline hover:text-slate-300">GST Invoice Available</Link>
          <Link to="/contact" className="hover:underline hover:text-slate-300">Owner Contact</Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Supported Payments:</span>
          <span className="text-slate-300 font-bold">UPI</span>
          <span>•</span>
          <span className="text-slate-300 font-bold">Razorpay</span>
          <span>•</span>
          <span className="text-slate-300 font-bold">RuPay</span>
          <span>•</span>
          <span className="text-slate-300 font-bold">Visa / Master</span>
          <span>•</span>
          <span className="text-slate-300 font-bold">Net Banking</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">Cash on Delivery (COD)</span>
        </div>

        <p className="text-[11px] text-slate-500">
          © 2026, VK Technology – DIY Tech Projects. Built by Karthik (karthik.suroju@gmail.com). All rights reserved.
        </p>
      </div>
    </footer>
  );
};
