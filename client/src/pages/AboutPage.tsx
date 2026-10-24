import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, MapPin, Award, Users, BookOpen, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#eaeded] min-h-screen py-8 sm:py-12 text-left">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Hero Card */}
        <div className="bg-white p-6 sm:p-10 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
          <img
            src="/logo.png"
            alt="VK Technology Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-1 shadow-md object-contain shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Cpu size={16} />
              <span>Innovate • Build • Learn</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              About VK Technology
            </h1>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              <strong>VK Technology</strong> is a premier Indian DIY electronics and robotics platform designed by engineers, for engineers, hobbyists, and student makers.
            </p>

            <p className="text-xs text-gray-600 leading-relaxed">
              Our mission is to eliminate the hurdle of sourcing unreliable, untested electronic components for college projects and robotic prototypes. By maintaining direct quality verification and providing working circuit schematics, source code libraries, and hands-on technical guidance, VK Technology empowers student innovators across India to turn their theoretical concepts into practical working hardware.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">100% Genuine Silicon</h3>
            <p className="text-gray-600 leading-relaxed">
              Every microcontroller, sensor transducer, and driver board is bench-tested before shipping to guarantee reliable performance.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MapPin size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Fast All-India Shipping</h3>
            <p className="text-gray-600 leading-relaxed">
              Express fulfillment network providing tracked parcel logistics across all states and engineering campuses.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Curated DIY Kits</h3>
            <p className="text-gray-600 leading-relaxed">
              Turnkey final-year engineering kits in IoT, robotics, drone stabilization, and edge AI complete with full schematics.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-r from-vk-dark to-gray-900 text-white p-6 sm:p-8 rounded-lg shadow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to kickstart your next project?</h3>
            <p className="text-xs text-gray-300 mt-1">Explore our range of development boards and sensor modules.</p>
          </div>
          <Link
            to="/products"
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-6 py-2.5 rounded text-xs shadow shrink-0 flex items-center space-x-1"
          >
            <span>Explore All Products</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
