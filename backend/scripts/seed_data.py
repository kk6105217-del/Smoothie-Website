import sys
import os
import asyncio
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.product import Category, Product, ProductImage, ProductSpec
from app.models.coupon import Coupon
from app.models.review import Review
from app.models.settings import StoreSetting
from app.core.security import hash_password
from app.models.user import User

CATEGORIES = [
    {
        "name": "DIY Tech Projects",
        "slug": "diy-tech-projects",
        "description": "Comprehensive all-in-one project kits complete with microcontrollers, sensors, guides, and pre-written code for makers.",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "sort_order": 1
    },
    {
        "name": "Arduino Boards and Kits",
        "slug": "arduino-boards-and-kits",
        "description": "Original and compatible Arduino boards, development shields, and comprehensive learning kits.",
        "image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80",
        "sort_order": 2
    },
    {
        "name": "ESP32 and IoT Modules",
        "slug": "esp32-and-iot-modules",
        "description": "High-performance dual-core Wi-Fi & Bluetooth microcontrollers, NodeMCU, ESP8266, and IoT telemetry breakout boards.",
        "image_url": "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=800&q=80",
        "sort_order": 3
    },
    {
        "name": "Sensors and Electronic Components",
        "slug": "sensors-and-electronic-components",
        "description": "Precision sensors for temperature, humidity, ultrasonic distance, PIR motion, gas detection, and optical tracking.",
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        "sort_order": 4
    },
    {
        "name": "Robotics and Motor Drivers",
        "slug": "robotics-and-motor-drivers",
        "description": "Robotic chassis kits, stepper motors, servo motors, L298N drivers, and smart obstacle avoidance components.",
        "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "sort_order": 5
    },
    {
        "name": "Drone Components",
        "slug": "drone-components",
        "description": "Brushless DC motors, electronic speed controllers (ESCs), flight controllers, propellers, and telemetry modules.",
        "image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
        "sort_order": 6
    },
    {
        "name": "Raspberry Pi and Embedded Systems",
        "slug": "raspberry-pi-and-embedded-systems",
        "description": "Single-board computers, camera modules, active cooling enclosures, display panels, and power adapters.",
        "image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
        "sort_order": 7
    },
    {
        "name": "PCB and Prototyping",
        "slug": "pcb-and-prototyping",
        "description": "Solderless breadboards, perfboards, copper clad boards, soldering stations, flux, and test leads.",
        "image_url": "https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80",
        "sort_order": 8
    },
    {
        "name": "STEM and Educational Kits",
        "slug": "stem-and-educational-kits",
        "description": "Hands-on engineering learning kits designed for schools, college labs, and aspiring tech enthusiasts.",
        "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
        "sort_order": 9
    },
    {
        "name": "Cables, Connectors and Accessories",
        "slug": "cables-connectors-and-accessories",
        "description": "Dupont jumper wires, JST connectors, USB cables, terminal blocks, heat shrink tubes, and power jacks.",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        "sort_order": 10
    }
]

PRODUCTS = [
    {
        "category_slug": "arduino-boards-and-kits",
        "name": "Arduino Uno R3 Ultimate Starter Kit with 45+ Components",
        "slug": "arduino-uno-r3-ultimate-starter-kit",
        "sku": "ARD-UNO-STKIT-01",
        "brand": "DIY Tech",
        "short_description": "The complete learning kit with Arduino Uno R3 board, sensors, LCD display, stepper motor, and step-by-step guidebook.",
        "description": "Embark on electronics and embedded programming with our flagship Arduino Uno R3 Ultimate Starter Kit. Designed specifically for beginners and engineering students, this kit contains everything required to build over 30 interactive projects including smart home controllers, weather monitors, and automated security alarms. Comes in a sturdy tackle box with full schematics and open-source code libraries.",
        "price": 249900,  # ₹2,499
        "sale_price": 199900,  # ₹1,999
        "stock_quantity": 45,
        "low_stock_threshold": 8,
        "is_featured": True,
        "weight_grams": 750,
        "package_dimensions": "23 x 16 x 6 cm",
        "package_contents": "1x Arduino Uno R3 (ATmega328P), 1x 830-Point Breadboard, 1x 16x2 I2C LCD Display, 1x Stepper Motor + ULN2003 Driver, 1x SG90 Micro Servo, 65x Jumper Wires, 1x HC-SR04 Ultrasonic Sensor, Assorted LEDs, Resistors, Potentiometers, 1x 9V Battery Snap, 1x Durable Storage Box.",
        "compatibility_info": "Compatible with Arduino IDE 1.8.x & 2.x on Windows, macOS, and Linux.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80", "alt_text": "Arduino Uno Starter Kit in case", "sort_order": 0},
            {"image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80", "alt_text": "Circuit components and board", "sort_order": 1}
        ],
        "specs": [
            {"spec_name": "Microcontroller", "spec_value": "ATmega328P (16 MHz)"},
            {"spec_name": "Operating Voltage", "spec_value": "5V DC"},
            {"spec_name": "Input Voltage (Recommended)", "spec_value": "7-12V DC"},
            {"spec_name": "Digital I/O Pins", "spec_value": "14 (6 PWM outputs)"},
            {"spec_name": "Analog Inputs", "spec_value": "6 Pins"},
            {"spec_name": "Flash Memory", "spec_value": "32 KB"}
        ]
    },
    {
        "category_slug": "esp32-and-iot-modules",
        "name": "ESP32-WROOM-32D Development Board (Wi-Fi + BLE)",
        "slug": "esp32-wroom-32d-development-board",
        "sku": "ESP32-DEV-38PIN",
        "brand": "Espressif",
        "short_description": "Powerful 240MHz dual-core IoT microcontroller with integrated 802.11b/g/n Wi-Fi and Bluetooth 4.2 BR/EDR & BLE.",
        "description": "The industry standard for Internet of Things prototyping. Powered by Espressif's dual-core Tensilica Xtensa 32-bit LX6 microprocessor, this 38-pin breakout board features CP2102 USB-to-UART converter for seamless programming over Micro-USB. Perfect for home automation gateways, sensor clouds, smart lighting, and wearable electronics.",
        "price": 54900,  # ₹549
        "sale_price": 44900,  # ₹449
        "stock_quantity": 120,
        "low_stock_threshold": 15,
        "is_featured": True,
        "weight_grams": 45,
        "package_dimensions": "5.5 x 2.8 x 1.2 cm",
        "package_contents": "1x ESP32-WROOM-32D 38-pin DevKit board in anti-static bag.",
        "compatibility_info": "Program with Arduino IDE, ESP-IDF, MicroPython, or CircuitPython.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=800&q=80", "alt_text": "ESP32 module top view", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "CPU", "spec_value": "Dual-Core Xtensa 32-bit LX6 @ 240 MHz"},
            {"spec_name": "Wi-Fi", "spec_value": "802.11 b/g/n (up to 150 Mbps)"},
            {"spec_name": "Bluetooth", "spec_value": "v4.2 BR/EDR and BLE"},
            {"spec_name": "SRAM", "spec_value": "520 KB"},
            {"spec_name": "Flash", "spec_value": "4 MB SPI Flash"},
            {"spec_name": "USB Interface", "spec_value": "CP2102 with auto-reset circuit"}
        ]
    },
    {
        "category_slug": "robotics-and-motor-drivers",
        "name": "Smart 4WD Robot Car Chassis Kit with Speed Encoders",
        "slug": "smart-4wd-robot-car-chassis-kit",
        "sku": "ROB-4WD-CHASSIS-01",
        "brand": "RoboCraft",
        "short_description": "Four-wheel drive acrylic robot platform with TT gear motors, rubber wheels, optical speed discs, and battery box.",
        "description": "Build autonomous line tracking, Bluetooth-controlled, or obstacle-avoiding rovers. This dual-layer transparent acrylic chassis provides generous mounting holes for Arduino, Raspberry Pi, motor shields, ultrasound mounts, and pan-tilt mechanisms.",
        "price": 129900,  # ₹1,299
        "sale_price": 99900,  # ₹999
        "stock_quantity": 30,
        "low_stock_threshold": 5,
        "is_featured": True,
        "weight_grams": 480,
        "package_dimensions": "26 x 16 x 5 cm",
        "package_contents": "2x Acrylic Chassis Plates, 4x TT DC Gear Motors (1:48), 4x Grippy Rubber Wheels, 4x Speed Encoders, 1x 4xAA Battery Holder, Screws, Nuts, and Brass Standoffs.",
        "compatibility_info": "Compatible with L298N, TB6612FNG, and standard Arduino/Raspberry Pi motor shields.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80", "alt_text": "Robotics chassis kit", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "Motor Voltage", "spec_value": "3V - 6V DC"},
            {"spec_name": "Reduction Ratio", "spec_value": "1:48"},
            {"spec_name": "Wheel Diameter", "spec_value": "66 mm"},
            {"spec_name": "Max Speed", "spec_value": "48 RPM @ 6V"},
            {"spec_name": "Chassis Size", "spec_value": "250 x 150 mm"}
        ]
    },
    {
        "category_slug": "sensors-and-electronic-components",
        "name": "37-in-1 Sensor Module Super Kit for Arduino & Raspberry Pi",
        "slug": "37-in-1-sensor-module-super-kit",
        "sku": "SEN-37IN1-KIT",
        "brand": "DIY Tech",
        "short_description": "Comprehensive bundle of 37 breakout sensors including DHT11, Ultrasonic, Flame, Sound, Gas, and Infrared.",
        "description": "Every sensor an electronics enthusiast could ever desire in one organized kit! Test analog and digital sensing, calibrate environmental indicators, and interface with any 3.3V or 5V development board. Includes code snippets and wiring diagrams for each module.",
        "price": 189900,  # ₹1,899
        "sale_price": 159900,  # ₹1,599
        "stock_quantity": 25,
        "low_stock_threshold": 5,
        "is_featured": True,
        "weight_grams": 400,
        "package_dimensions": "28 x 19 x 5 cm",
        "package_contents": "37x Popular Modules (Joystick, Relay, Sound, Tracking, Avoidance, DHT11 Temp/Humidity, Laser, Vibration, MQ Gas, RGB LED, Rotary Encoder, Hall sensor, etc.) + Compartment Case.",
        "compatibility_info": "3.3V & 5V logic compatible. Arduino, ESP32, ESP8266, Raspberry Pi, STM32.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", "alt_text": "Sensors and circuit module kit", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "Module Count", "spec_value": "37 Individual Breakout Modules"},
            {"spec_name": "Supply Voltage", "spec_value": "3.3V - 5V DC"},
            {"spec_name": "Pinout", "spec_value": "Standard 2.54mm Pitch Headers"},
            {"spec_name": "Packaging", "spec_value": "Durable Transparent Organizer Box"}
        ]
    },
    {
        "category_slug": "raspberry-pi-and-embedded-systems",
        "name": "Raspberry Pi 5 Desktop Starter Kit (8GB RAM Edition)",
        "slug": "raspberry-pi-5-starter-kit-8gb",
        "sku": "RPI5-KIT-8GB",
        "brand": "Raspberry Pi",
        "short_description": "Next-gen 2.4GHz quad-core 64-bit Arm Cortex-A76 mini computer with active cooler, 27W USB-C PSU, and 64GB A2 MicroSD.",
        "description": "Experience up to 3x CPU performance and 2x GPU speed compared to Raspberry Pi 4. Featuring dual 4K60p HDMI output, PCIe 2.0 interface, dual-band Wi-Fi, Gigabit Ethernet, and on-board power button. Includes official active cooler and pre-flashed Raspberry Pi OS on Sandisk Extreme 64GB card.",
        "price": 1099900,  # ₹10,999
        "sale_price": 999900,  # ₹9,999
        "stock_quantity": 18,
        "low_stock_threshold": 4,
        "is_featured": True,
        "weight_grams": 600,
        "package_dimensions": "18 x 12 x 7 cm",
        "package_contents": "1x Raspberry Pi 5 8GB Board, 1x Official Active Cooler, 1x 27W USB-C PD Power Supply, 1x 64GB Class 10 A2 MicroSD, 1x Micro-HDMI to HDMI Cable, 1x Aluminum Case.",
        "compatibility_info": "Runs official Raspberry Pi OS (Debian 12 Bookworm), Ubuntu, Kali Linux, and RetroPie.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80", "alt_text": "Raspberry Pi single board computer", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "Processor", "spec_value": "Broadcom BCM2712 2.4GHz Quad-Core 64-bit Arm Cortex-A76"},
            {"spec_name": "RAM", "spec_value": "8GB LPDDR4X-4267 SDRAM"},
            {"spec_name": "GPU", "spec_value": "VideoCore VII @ 800 MHz (Vulkan 1.2, OpenGL ES 3.1)"},
            {"spec_name": "Connectivity", "spec_value": "Gigabit Ethernet with PoE+ support, Wi-Fi 5, Bluetooth 5.0"},
            {"spec_name": "Storage Port", "spec_value": "PCIe 2.0 x1 interface for high-speed NVMe M.2 SSDs"}
        ]
    },
    {
        "category_slug": "drone-components",
        "name": "F405 V3 50A Stack Flight Controller & 4-in-1 ESC Combo",
        "slug": "f405-v3-50a-stack-flight-controller-esc",
        "sku": "DRN-F405-STACK-50A",
        "brand": "SpeedyBee",
        "short_description": "BLHeli_S 50A 4-in-1 ESC with STM32F405 flight controller, wireless Bluetooth tuning, and barometer.",
        "description": "Build high-speed FPV freestyle or cinematic racing quads. Configure PIDs, motor direction, and firmware straight from your smartphone via wireless Bluetooth without plugging in a computer at the field. Supports 3S to 6S LiPo power.",
        "price": 649900,  # ₹6,499
        "sale_price": 579900,  # ₹5,799
        "stock_quantity": 14,
        "low_stock_threshold": 3,
        "is_featured": True,
        "weight_grams": 95,
        "package_dimensions": "9 x 9 x 4 cm",
        "package_contents": "1x F405 V3 Flight Controller, 1x 50A 4-in-1 ESC, 1x 35V 1000uF Low-ESR Capacitor, 1x XT60 Pigtail Cable, Anti-vibration Rubber Grommets.",
        "compatibility_info": "Betaflight, INAV, ArduPilot compatible.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80", "alt_text": "Drone electronics and flight controller", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "MCU", "spec_value": "STM32F405 (168MHz)"},
            {"spec_name": "IMU (Gyro)", "spec_value": "BMI270 6-Axis"},
            {"spec_name": "Continuous Current", "spec_value": "50A x 4 Channels"},
            {"spec_name": "Burst Current", "spec_value": "55A (5 Seconds)"},
            {"spec_name": "Input Voltage", "spec_value": "3-6S LiPo (11.1V - 25.2V)"}
        ]
    },
    {
        "category_slug": "pcb-and-prototyping",
        "name": "60W Adjustable Temperature Soldering Iron Workstation Kit",
        "slug": "60w-adjustable-temperature-soldering-iron-kit",
        "sku": "PCB-SOLD-KIT-60W",
        "brand": "SoldrPro",
        "short_description": "Complete soldering toolkit with ceramic heating element iron (200°C - 450°C), desoldering pump, stand, and flux.",
        "description": "Essential tool for any DIY tech maker or hardware hacker. Fast-heating 60W internal ceramic core with temperature regulation knob. Comes with 5 interchangeable tips for fine SMD soldering or heavy ground plane tinning, brass wire cleaner, solder wire tube, and anti-static tweezers.",
        "price": 119900,  # ₹1,199
        "sale_price": 89900,  # ₹899
        "stock_quantity": 60,
        "low_stock_threshold": 10,
        "is_featured": False,
        "weight_grams": 550,
        "package_dimensions": "26 x 14 x 4 cm",
        "package_contents": "1x 60W Adjustable Soldering Iron, 5x Solder Tips (I/B/K/3C/2.4D), 1x Solder Sucker, 1x Solder Wire Tube, 1x Safety Metal Stand + Sponge, 1x ESD Tweezers, 1x PU Leather Storage Bag.",
        "compatibility_info": "220V - 240V AC 50Hz Indian 3-Pin Plug.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80", "alt_text": "Soldering iron and prototyping tools", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "Power", "spec_value": "60 Watts"},
            {"spec_name": "Temperature Range", "spec_value": "200°C - 450°C (392°F - 842°F)"},
            {"spec_name": "Heating Core", "spec_value": "High-durability Ceramic"},
            {"spec_name": "Plug Type", "spec_value": "Bureau of Indian Standards (BIS) 3-Pin"}
        ]
    },
    {
        "category_slug": "cables-connectors-and-accessories",
        "name": "120-Piece Premium Dupont Jumper Wire Ribbon Cable Kit",
        "slug": "120-piece-dupont-jumper-wire-kit",
        "sku": "CAB-DUP-120PC",
        "brand": "DIY Tech",
        "short_description": "20cm 40-pin Male-to-Male, Male-to-Female, and Female-to-Female multi-color breadboard connector wires.",
        "description": "High conductivity copper core jumper cables with molded durable header connectors. Peels cleanly into individual or grouped ribbon lines for custom bus wiring between sensors, breadboards, and microcontrollers.",
        "price": 29900,  # ₹299
        "sale_price": 24900,  # ₹249
        "stock_quantity": 200,
        "low_stock_threshold": 25,
        "is_featured": False,
        "weight_grams": 110,
        "package_dimensions": "21 x 10 x 2 cm",
        "package_contents": "1x 40-pin Male-to-Male (20cm), 1x 40-pin Male-to-Female (20cm), 1x 40-pin Female-to-Female (20cm).",
        "compatibility_info": "Standard 2.54mm pitch pins and sockets.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", "alt_text": "Color ribbon wires", "sort_order": 0}
        ],
        "specs": [
            {"spec_name": "Length", "spec_value": "20 cm (7.87 inch)"},
            {"spec_name": "Pin Spacing", "spec_value": "2.54 mm (0.1 inch)"},
            {"spec_name": "Conductor", "spec_value": "Tinned Copper Wire"},
            {"spec_name": "Insulation", "spec_value": "PVC Multi-color (10 distinct colors)"}
        ]
    }
]

COUPONS = [
    {
        "code": "MAKER10",
        "description": "10% off for passionate makers on all orders above ₹999",
        "discount_type": "PERCENT",
        "discount_value": 10,  # 10%
        "minimum_order": 99900,
        "usage_limit": 500,
        "valid_until": datetime.now(timezone.utc) + timedelta(days=90),
        "is_active": True
    },
    {
        "code": "WELCOME100",
        "description": "Flat ₹100 instant discount on your first DIY kit purchase",
        "discount_type": "FIXED",
        "discount_value": 10000,  # ₹100 in paise
        "minimum_order": 49900,
        "usage_limit": 1000,
        "valid_until": datetime.now(timezone.utc) + timedelta(days=120),
        "is_active": True
    },
    {
        "code": "ROBOTICS500",
        "description": "Flat ₹500 discount on advanced robotics & drone kits",
        "discount_type": "FIXED",
        "discount_value": 50000,  # ₹500 in paise
        "minimum_order": 499900,
        "usage_limit": 200,
        "valid_until": datetime.now(timezone.utc) + timedelta(days=60),
        "is_active": True
    }
]

SETTINGS = [
    ("store_name", "VK Technology – DIY Tech Projects", "Brand name of the online store"),
    ("currency", "INR", "Base currency code"),
    ("contact_email", "karthik.suroju@gmail.com", "Official customer support email"),
    ("contact_phone", "+91 8555997052", "Customer support phone hotline"),
    ("whatsapp_number", "+91 8555997052", "WhatsApp business support number"),
    ("default_shipping_paise", "7000", "Standard delivery fee in paise (₹70)"),
    ("free_shipping_threshold_paise", "99900", "Cart subtotal required for free shipping in paise (₹999)"),
    ("tax_rate_percent", "18.0", "Applicable GST percentage for electronics"),
    ("cod_enabled", "true", "Enable or disable Cash on Delivery checkout"),
    ("cod_max_limit_paise", "2500000", "Maximum permissible cart total for COD in paise (₹25,000)"),
    ("return_window_days", "7", "Customer return request eligibility window in days"),
    ("email_notifications_enabled", "true", "Send email notifications for orders and status changes"),
    ("whatsapp_notifications_enabled", "true", "Send WhatsApp alerts for order updates"),
    ("sms_notifications_enabled", "true", "Send SMS alerts for order updates")
]

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        print("[*] Starting database seed for DIY Tech Projects...")

        # 1. Seed Categories
        category_map = {}
        for cat_data in CATEGORIES:
            res = await db.execute(select(Category).where(Category.slug == cat_data["slug"]))
            existing = res.scalars().first()
            if not existing:
                cat = Category(**cat_data)
                db.add(cat)
                await db.flush()
                category_map[cat.slug] = cat.id
                print(f"  [+] Created category: {cat.name}")
            else:
                category_map[existing.slug] = existing.id

        await db.commit()

        # 2. Seed Products
        for prod_data in PRODUCTS:
            sku = prod_data["sku"]
            res = await db.execute(select(Product).where(Product.sku == sku))
            existing = res.scalars().first()
            if not existing:
                cat_id = category_map.get(prod_data["category_slug"])
                product = Product(
                    category_id=cat_id,
                    name=prod_data["name"],
                    slug=prod_data["slug"],
                    sku=prod_data["sku"],
                    brand=prod_data["brand"],
                    short_description=prod_data["short_description"],
                    description=prod_data["description"],
                    price=prod_data["price"],
                    sale_price=prod_data.get("sale_price"),
                    stock_quantity=prod_data["stock_quantity"],
                    low_stock_threshold=prod_data["low_stock_threshold"],
                    is_published=True,
                    is_featured=prod_data.get("is_featured", False),
                    weight_grams=prod_data.get("weight_grams"),
                    package_dimensions=prod_data.get("package_dimensions"),
                    package_contents=prod_data.get("package_contents"),
                    compatibility_info=prod_data.get("compatibility_info"),
                    warranty_info="6 Months Manufacturing Warranty",
                    return_eligible=True,
                    seo_title=f"{prod_data['name']} - Buy Online in India",
                    seo_description=prod_data["short_description"]
                )
                db.add(product)
                await db.flush()

                # Images
                for img in prod_data.get("images", []):
                    db.add(ProductImage(
                        product_id=product.id,
                        image_url=img["image_url"],
                        alt_text=img.get("alt_text", product.name),
                        sort_order=img.get("sort_order", 0)
                    ))

                # Specs
                for spec in prod_data.get("specs", []):
                    db.add(ProductSpec(
                        product_id=product.id,
                        spec_name=spec["spec_name"],
                        spec_value=spec["spec_value"]
                    ))

                print(f"  [+] Created product: {product.name} (SKU: {product.sku})")

        # 3. Seed Coupons
        for coup in COUPONS:
            res = await db.execute(select(Coupon).where(Coupon.code == coup["code"]))
            existing = res.scalars().first()
            if not existing:
                coupon = Coupon(**coup)
                db.add(coupon)
                print(f"  [+] Created coupon: {coupon.code}")

        # 4. Seed Settings
        for key, val, desc in SETTINGS:
            res = await db.execute(select(StoreSetting).where(StoreSetting.setting_key == key))
            existing = res.scalars().first()
            if not existing:
                db.add(StoreSetting(setting_key=key, setting_value=val, description=desc))
                print(f"  [+] Seeded setting: {key} = {val}")

        await db.commit()
        print("[OK] Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
