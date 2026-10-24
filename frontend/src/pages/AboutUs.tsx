import React from 'react';
import { Cpu, ShieldCheck, Award, Users, Wrench, Heart } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono font-bold text-cyan-700 uppercase tracking-widest">
          OUR MISSION & ETHOS
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Empowering the Next Generation of Makers in India
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          VK Technology was established by Karthik and a team of hardware engineers and robotics educators
          in Bengaluru with a simple vision: to make high-grade, genuine electronics prototyping
          accessible, affordable, and dependable for every student and innovator across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <ShieldCheck size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Zero Counterfeits Policy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every microcontroller, Wi-Fi module, sensor, and motor driver is sourced directly from
            trusted chipmakers and authorized distributors. We rigorously test each batch in our
            hardware lab before dispatch.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <Wrench size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Comprehensive Project Kits</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We don't just sell loose chips; we provide complete project kits with verified wiring
            diagrams, pinout schematics, and open-source code libraries so you can build with confidence.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <Award size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">STEM & Lab Support</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Partnering with high school robotics clubs, engineering colleges, and IoT labs with
            special academic discounts and custom bill-of-materials fulfillment.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Pan-India Support</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Quick express logistics with same-day dispatch from our central facility in Electronics
            City, Bengaluru, backed by human technical support over email and WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};
