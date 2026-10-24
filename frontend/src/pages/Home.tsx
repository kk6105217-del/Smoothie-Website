import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  ArrowRight,
  Layers,
  Cpu,
} from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealsProducts, setDealsProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Scroll ref for horizontal carousels
  const dealsScrollRef = useRef<HTMLDivElement>(null);
  const bestsellersScrollRef = useRef<HTMLDivElement>(null);

  const heroSlides = [
    {
      id: 1,
      badge: 'MEGA ELECTRONICS SALE',
      title: 'Arduino & ESP32 Starter Kits',
      subtitle: 'Up to 35% Off on bestselling DIY IoT project kits, microcontrollers, and sensor packs.',
      ctaText: "Shop Today's Deals",
      ctaLink: '/shop?sale=true',
      image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=1200&q=80',
      tagColor: 'bg-amber-400 text-slate-950',
    },
    {
      id: 2,
      badge: 'ROBOTICS & MOTORS',
      title: 'Build Autonomous Smart Bots',
      subtitle: 'Complete 4WD chassis, L298N drivers, metal gear servos, and obstacle avoidance ultrasonic modules.',
      ctaText: 'Explore Robotics',
      ctaLink: '/categories/robotics-and-motor-drivers',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      tagColor: 'bg-cyan-400 text-slate-950',
    },
    {
      id: 3,
      badge: 'SENSORS & BREAKOUTS',
      title: 'Precision Sensors starting at ₹49',
      subtitle: 'Temperature, humidity, motion, gas, optical, and sound detection modules ready for breadboard testing.',
      ctaText: 'Shop Sensors',
      ctaLink: '/categories/sensors-and-electronic-components',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      tagColor: 'bg-emerald-400 text-slate-950',
    },
    {
      id: 4,
      badge: 'STEM & EDUCATION',
      title: 'Hands-On Tech for Indian Makers',
      subtitle: 'Complete beginner-friendly engineering kits with schematics, open-source code, and guidebooks.',
      ctaText: 'Browse STEM Kits',
      ctaLink: '/categories/stem-and-educational-kits',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      tagColor: 'bg-purple-400 text-slate-950',
    },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [featRes, allRes, catRes] = await Promise.all([
          api.listProducts({ featured: true, page_size: 10 }),
          api.listProducts({ page_size: 20 }),
          api.listCategories(),
        ]);
        setFeaturedProducts(featRes.items);
        setDealsProducts(allRes.items.filter((p) => p.sale_price && p.sale_price < p.price));
        setBestsellers(allRes.items.slice(0, 10));
        setCategories(catRes);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Automatic hero slide timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#e3e6e6] min-h-screen text-slate-900 pb-12 font-sans space-y-6">
      {/* 1. Amazon-Style Hero Banner Slider */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[380px] sm:min-h-[460px] md:min-h-[520px]">
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient Overlays for High-Contrast Text & Amazon-style fade at bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#e3e6e6] via-[#e3e6e6]/60 to-transparent" />

            {/* Slide Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-20 pb-16">
              <div className="max-w-xl space-y-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-widest ${slide.tagColor}`}
                >
                  {slide.badge}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="pt-2">
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-slate-950 font-bold rounded-full text-xs sm:text-sm shadow-md transition-all border border-[#fcd200]"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Arrow Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/30 hover:bg-black/60 text-white rounded-r-lg transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/30 hover:bg-black/60 text-white rounded-l-lg transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={28} />
        </button>

        {/* Slide Dots Indicator */}
        <div className="absolute bottom-16 sm:bottom-20 inset-x-0 z-20 flex justify-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-8 bg-amber-400' : 'w-2 bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-20 -mt-20 sm:-mt-28 md:-mt-36">
        {/* 2. Amazon-Style Quad-Cards Showcase Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Microcontrollers */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-snug">
                Explore Microcontrollers & Kits
              </h2>
              <div className="grid grid-cols-2 gap-3 my-3">
                <Link to="/products/arduino-uno-r3-ultimate-starter-kit" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=300&q=80"
                      alt="Arduino Uno"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Uno R3 Kits</span>
                </Link>
                <Link to="/products/esp32-s3-ai-iot-development-board" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=300&q=80"
                      alt="ESP32 Module"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">ESP32-S3 IoT</span>
                </Link>
                <Link to="/categories/raspberry-pi-and-embedded-systems" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80"
                      alt="Raspberry Pi"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Raspberry Pi</span>
                </Link>
                <Link to="/categories/arduino-boards-and-kits" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80"
                      alt="Nano Boards"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Nano & Shields</span>
                </Link>
              </div>
            </div>
            <Link
              to="/categories/arduino-boards-and-kits"
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
            >
              See all microcontrollers <ChevronRight size={12} />
            </Link>
          </div>

          {/* Card 2: Robotics Deals */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-base leading-snug">
                  Up to 35% off | Robotics
                </h2>
                <span className="bg-[#cc0c39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Deal
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 my-3">
                <Link to="/products/4wd-smart-robot-car-chassis-kit" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80"
                      alt="Robot Chassis"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">4WD Chassis</span>
                </Link>
                <Link to="/categories/robotics-and-motor-drivers" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=300&q=80"
                      alt="Motor Drivers"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">L298N Drivers</span>
                </Link>
                <Link to="/categories/robotics-and-motor-drivers" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=300&q=80"
                      alt="Servos"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Servo Motors</span>
                </Link>
                <Link to="/categories/drone-components" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=300&q=80"
                      alt="Drones"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Drone Propellers</span>
                </Link>
              </div>
            </div>
            <Link
              to="/categories/robotics-and-motor-drivers"
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
            >
              Explore robotics deals <ChevronRight size={12} />
            </Link>
          </div>

          {/* Card 3: Sensors Starting ₹49 */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-snug">
                Sensors & Modules starting ₹49
              </h2>
              <div className="grid grid-cols-2 gap-3 my-3">
                <Link to="/products/37-in-1-sensor-modules-kit" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"
                      alt="Sensor Kit"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">37-in-1 Sensor Kit</span>
                </Link>
                <Link to="/categories/sensors-and-electronic-components" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=300&q=80"
                      alt="Ultrasonic"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Ultrasonic Sensors</span>
                </Link>
                <Link to="/categories/sensors-and-electronic-components" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80"
                      alt="PIR Motion"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">PIR Motion</span>
                </Link>
                <Link to="/categories/sensors-and-electronic-components" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80"
                      alt="Temp & Gas"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Temp & Gas</span>
                </Link>
              </div>
            </div>
            <Link
              to="/categories/sensors-and-electronic-components"
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
            >
              Shop sensor collection <ChevronRight size={12} />
            </Link>
          </div>

          {/* Card 4: Complete DIY Project Kits */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-snug">
                Trending in DIY Tech Kits
              </h2>
              <div className="grid grid-cols-2 gap-3 my-3">
                <Link to="/products/iot-smart-agriculture-weather-monitoring-kit" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80"
                      alt="IoT Weather Kit"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">IoT Weather Kit</span>
                </Link>
                <Link to="/products/quadcopter-drone-diy-starter-kit" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=300&q=80"
                      alt="Drone Kit"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Drone Starter Kit</span>
                </Link>
                <Link to="/categories/stem-and-educational-kits" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=300&q=80"
                      alt="STEM Kit"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">STEM Labs</span>
                </Link>
                <Link to="/categories/pcb-and-prototyping" className="group">
                  <div className="aspect-square bg-slate-50 rounded overflow-hidden p-2 border border-slate-100 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=300&q=80"
                      alt="Prototyping"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block mt-1 truncate font-medium">Prototyping</span>
                </Link>
              </div>
            </div>
            <Link
              to="/categories/diy-tech-projects"
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
            >
              Discover all DIY kits <ChevronRight size={12} />
            </Link>
          </div>
        </section>

        {/* 3. Horizontally Scrollable Carousel: "Today's Deals" (Amazon Style) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-700">
                <Flame size={18} className="fill-amber-500 text-amber-500" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Today's Deals <span className="text-xs text-slate-500 font-normal">| Limited Time Electronics Offers</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/shop?sale=true" className="text-xs text-cyan-700 hover:underline font-semibold">
                See all deals
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scrollContainer(dealsScrollRef, 'left')}
                  className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollContainer(dealsScrollRef, 'right')}
                  className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Track */}
          <div
            ref={dealsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
          >
            {dealsProducts.map((p) => (
              <div key={p.id} className="w-56 sm:w-64 flex-shrink-0">
                <ProductCard product={p} dealTag="Limited time deal" />
              </div>
            ))}
          </div>
        </section>

        {/* 4. Category Circle Quick Nav (Amazon Icon Bar) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Shop By Department
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3 text-center">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group flex flex-col items-center p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-2 flex items-center justify-center group-hover:scale-105 group-hover:border-cyan-500 transition-all shadow-xs">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-700 group-hover:text-cyan-700 mt-2 leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Horizontally Scrollable Carousel: "Best Sellers in DIY Tech" */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-100 text-cyan-800">
                <Sparkles size={18} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Best Sellers in DIY Tech & IoT
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/shop?sort=bestselling" className="text-xs text-cyan-700 hover:underline font-semibold">
                Explore Best Sellers
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scrollContainer(bestsellersScrollRef, 'left')}
                  className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollContainer(bestsellersScrollRef, 'right')}
                  className="p-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Track */}
          <div
            ref={bestsellersScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
          >
            {bestsellers.map((p, index) => (
              <div key={p.id} className="w-56 sm:w-64 flex-shrink-0">
                <ProductCard product={p} isBestSeller={index < 3} />
              </div>
            ))}
          </div>
        </section>

        {/* 6. Amazon-Style Value & Trust Strip */}
        <section className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 flex-shrink-0">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Free Express Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">Free shipping on orders above ₹999 across all Indian pincodes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-200 flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">100% Tested Components</h4>
                <p className="text-xs text-slate-500 mt-0.5">Every microcontroller and sensor is lab-bench tested before dispatch.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex-shrink-0">
                <RotateCcw size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">7-Day Replacement Policy</h4>
                <p className="text-xs text-slate-500 mt-0.5">Guaranteed replacement or refund for any manufacturing defective parts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 flex-shrink-0">
                <Headphones size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Direct Maker Hotline</h4>
                <p className="text-xs text-slate-500 mt-0.5">WhatsApp and call assistance at +91 8555997052 for pinout and code setup.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
