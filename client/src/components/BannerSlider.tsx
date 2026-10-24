import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { Banner } from '../types';
import { api } from '../services/api';

export const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.banners.getAll()
      .then(res => {
        if (Array.isArray(res?.banners) && res.banners.length > 0) {
          setBanners(res.banners);
        } else {
          // Default fallback
          setBanners([
            {
              id: 1,
              title: 'Build Your Ideas with VK Technology',
              subtitle: 'Explore DIY Electronics, Robotics, IoT Components and Innovative Project Kits.',
              image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
              link_url: '/category/arduino-boards-and-kits',
              button_text: 'Shop Now',
              display_order: 1,
              is_active: 1
            }
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white min-h-[300px] sm:min-h-[420px] lg:min-h-[480px] flex items-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={current.image_url}
          alt={current.title}
          className="w-full h-full object-cover object-center opacity-35 transform scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/40 to-transparent pointer-events-none" />
      </div>

      {/* Slide Content */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-8 py-10 sm:py-16 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles size={14} className="text-amber-400" />
            <span>VK Technology • DIY Electronics & Robotics</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-4 drop-shadow-md">
            {current.title}
          </h1>

          <p className="text-base sm:text-xl text-gray-200 mb-8 leading-relaxed max-w-xl drop-shadow">
            {current.subtitle || 'Explore DIY Electronics, Robotics, IoT Components and Innovative Project Kits.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={current.link_url || '/products'}
              className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-6 py-3 rounded-md text-sm sm:text-base shadow-lg transition-transform transform active:scale-95 flex items-center space-x-2"
            >
              <span>{current.button_text || 'Shop Now'}</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/category/student-diy-project-kits"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold px-6 py-3 rounded-md text-sm sm:text-base transition active:scale-95 flex items-center"
            >
              Explore Project Kits
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {(banners ?? []).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === idx ? 'bg-amber-400 w-8' : 'bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
