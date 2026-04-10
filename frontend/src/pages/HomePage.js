import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ArrowRight, Star, Package, Truck, ShieldCheck, ChevronLeft, ChevronRight, Leaf, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const bottleRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      eyebrow: "Bestseller",
      title: "Etlawm\nHerbal Oil",
      subtitle: "The ultimate solution for hair & scalp health.",
      image: "/assets/etlawm-hair-oil.png",
      link: "/shop",
      cta: "Shop Now"
    },
    {
      eyebrow: "New Collection",
      title: "Botanical\nRituals",
      subtitle: "Pure ingredients, centuries of herbal wisdom refined.",
      image: "/assets/etlawm-hair-oil.png",
      link: "/shop",
      cta: "Explore Collection"
    }
  ];

  const testimonials = [
    { name: "Priya M.", text: "Visible difference in 3 weeks. My hair fall reduced dramatically.", rating: 5, tag: "Verified Buyer" },
    { name: "Ankit S.", text: "Best herbal oil I've ever used. The scent is divine and results are real.", rating: 5, tag: "Verified Buyer" },
    { name: "Reshma K.", text: "My scalp feels nourished and healthy for the first time in years.", rating: 5, tag: "Verified Buyer" },
  ];

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      // Scroll Progress Bar
      gsap.to(scrollProgressRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3
        }
      });

      // Section Fade-ups
      gsap.utils.toArray('.section-replica').forEach((section) => {
        gsap.fromTo(section,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              toggleActions: "play none none none"
            }
          }
        );
      });

      // Stat numbers animation
      gsap.utils.toArray('.stat-number').forEach((stat) => {
        const original = stat.innerText;
        const isPercent = original.includes('%');
        const hasPlus = original.includes('+');
        const val = parseInt(original);
        stat.innerText = '0' + (isPercent ? '%' : hasPlus ? 'k+' : '');
        gsap.to(stat, {
          innerText: val + (isPercent ? '%' : hasPlus ? 'k+' : ''),
          duration: 2.2,
          ease: "power2.out",
          snap: { innerText: 1 },
          scrollTrigger: { trigger: stat, start: "top 90%", once: true }
        });
      });
    }, mainRef);

    // ── Bottle Antigravity: RAF + lerp ──────────────────────────────────
    // y: 100 (section enters) → y: -100 (section exits), lerped for silky feel
    const lerp = (a, b, t) => a + (b - a) * t;
    let currentY = 100;
    let targetY  = 100;
    let bottleRaf;

    const tickBottle = () => {
      const bottle  = bottleRef.current;
      const section = document.querySelector('.stats-section');
      if (bottle && section) {
        const rect     = section.getBoundingClientRect();
        const vh       = window.innerHeight;
        // progress 0 → section top at viewport bottom; 1 → section bottom at viewport top
        const progress = 1 - rect.bottom / (vh + rect.height);
        const clamped  = Math.max(0, Math.min(1, progress));
        targetY = 100 + clamped * -200;           // maps 0–1 → 100 → -100

        currentY = lerp(currentY, targetY, 0.08); // 0.08 = smooth but responsive
        bottle.style.transform = `translateY(${currentY.toFixed(2)}px)`;
        bottle.style.willChange = 'transform';
      }
      bottleRaf = requestAnimationFrame(tickBottle);
    };
    bottleRaf = requestAnimationFrame(tickBottle);
    // ─────────────────────────────────────────────────────────────────────

    fetchFeaturedProducts();

    return () => {
      lenis.destroy();
      ctx.revert();
      cancelAnimationFrame(bottleRaf);
    };
  }, []);


  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products?featured=true`);
      if (Array.isArray(response.data)) {
        setFeaturedProducts(response.data.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={mainRef} className="font-inter">
      {/* Scroll Progress */}
      <div ref={scrollProgressRef} className="scroll-progress-bar" />

      {/* Marquee */}
      <div className="marquee-container">
        <div className="marquee-track">
          {[1, 2, 3].map(i => (
            <React.Fragment key={i}>
              <span>FREE SHIPPING ON ALL ORDERS ABOVE ₹999</span>
              <span className="dot">•</span>
              <span>100% ORGANIC HERBAL BLEND</span>
              <span className="dot">•</span>
              <span>DERMATOLOGICALLY TESTED</span>
              <span className="dot">•</span>
              <span>CRUELTY FREE • MADE IN INDIA</span>
              <span className="dot">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* =========================================
          HERO CAROUSEL
      ========================================= */}
      <section className="hero-carousel-section">
        <div className="carousel-container">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Gradient overlay */}
              <div className="hero-gradient-overlay" />

              <div className="container relative z-10 text-white h-full flex items-center">
                <div className="max-w-xl slide-content">
                  {/* Eyebrow */}
                  <div className="flex items-center gap-3 mb-6 opacity-0 animate-in fade-in duration-700 delay-100">
                    <div className="w-8 h-px bg-white/60" />
                    <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-white/80">
                      {slide.eyebrow}
                    </span>
                  </div>

                  {/* Title */}
                  <h1
                    className="font-bold mb-6 tracking-tight leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
                    style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', whiteSpace: 'pre-line' }}
                  >
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg md:text-xl mb-10 opacity-80 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 max-w-sm">
                    {slide.subtitle}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                    <Link to={slide.link}>
                      <Button className="bg-white text-black hover:bg-white/90 rounded-full px-10 py-6 text-sm font-bold uppercase tracking-[0.1em] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-black/10">
                        {slide.cta} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/shop" className="text-white/70 hover:text-white text-sm font-semibold underline underline-offset-4 transition-colors">
                      See all products
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <button onClick={prevSlide} className="carousel-btn prev" aria-label="Previous slide">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextSlide} className="carousel-btn next" aria-label="Next slide">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="carousel-dots">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator hidden md:flex">
            <div className="scroll-indicator-line" />
            <span>Scroll</span>
          </div>
        </div>
      </section>

      {/* =========================================
          TRUST BAR
      ========================================= */}
      <div className="trust-bar">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-black/8">
            {[
              { icon: <Leaf className="w-5 h-5 text-sage" />, label: "100% Natural", sub: "No synthetics" },
              { icon: <ShieldCheck className="w-5 h-5 text-sage" />, label: "Derm. Tested", sub: "Clinically proven" },
              { icon: <Truck className="w-5 h-5 text-sage" />, label: "Free Shipping", sub: "Orders above ₹999" },
              { icon: <CheckCircle className="w-5 h-5 text-sage" />, label: "7-Day Returns", sub: "Easy & free" },
            ].map((item, i) => (
              <div key={i} className="trust-bar-item justify-center text-center flex-col md:flex-row py-4 md:py-0">
                {item.icon}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-gray-900">{item.label}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{item.sub}</p>
                </div>
                <div className="text-center md:hidden">
                  <p className="text-xs font-bold text-gray-900 mt-2">{item.label}</p>
                  <p className="text-[10px] text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================
          SCIENCE SECTION
      ========================================= */}
      <section className="section-replica science-section bg-offwhite py-24">
        <div className="container">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="eyebrow justify-center mb-6">Our Approach</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              The Science of Etlawm
            </h2>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Combining traditional botanical knowledge with modern hair science for visible results.
            </p>
          </div>
          <div className="science-grid">
            <div className="science-card group">
              <div className="mb-8 w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto group-hover:bg-black group-hover:text-white transition-colors duration-500">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-center">Pure Extraction</h3>
              <p className="text-gray-500 leading-relaxed text-center">Our cold-press extraction preserves the molecular integrity of every herb — from root to bottle.</p>
            </div>
            <div className="science-card group">
              <div className="mb-8 w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto group-hover:bg-black group-hover:text-white transition-colors duration-500">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-center">Premium Quality</h3>
              <p className="text-gray-500 leading-relaxed text-center">Sourced from sustainably managed organic farms at peak potency. Never diluted, never compromised.</p>
            </div>
            <div className="science-card group">
              <div className="mb-8 w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto group-hover:bg-black group-hover:text-white transition-colors duration-500">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-center">Clinically Proven</h3>
              <p className="text-gray-500 leading-relaxed text-center">Formulated to reduce hair fall and improve scalp health within 4 weeks of consistent use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          STATS SECTION WITH PARALLAX
      ========================================= */}
      <section className="stats-section section-replica py-32">
        <div className="container">
          <div className="stats-grid">
            {/* Left stats */}
            <div className="space-y-16 text-right">
              <div>
                <div className="stat-number">92%</div>
                <h4 className="text-xl font-bold mt-3 tracking-tight">Denser Hair</h4>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xs ml-auto">Significant visible improvement in hair density reported.</p>
              </div>
              <div>
                <div className="stat-number">88%</div>
                <h4 className="text-xl font-bold mt-3 tracking-tight">Scalp Health</h4>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xs ml-auto">Reduction in dryness and irritation within the first month.</p>
              </div>
            </div>

            {/* Center — Product bottle with parallax */}
            <div className="flex justify-center items-center h-[560px] overflow-visible">
              <img
                ref={bottleRef}
                src="/assets/etlawm-hair-oil-without-bg.png"
                alt="Etlawm Herbal Oil"
                className="max-h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 relative z-10"
                style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.15))' }}
              />
            </div>

            {/* Right stats */}
            <div className="space-y-16">
              <div>
                <div className="stat-number">100%</div>
                <h4 className="text-xl font-bold mt-3 tracking-tight">Natural</h4>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xs">No synthetic fragrances, mineral oils, or harmful chemicals.</p>
              </div>
              <div>
                <div className="stat-number">45k+</div>
                <h4 className="text-xl font-bold mt-3 tracking-tight">Happy Users</h4>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xs">Trusted by hair enthusiasts across India and beyond.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          FEATURED PRODUCTS
      ========================================= */}
      <section className="section-replica py-24 bg-white">
        <div className="container">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <div className="eyebrow justify-center mb-6">Our Collection</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Curated Essentials
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Experience the pure power of nature with our hand-picked botanical blends.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded-3xl animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No products found</div>
          )}
          
          {!loading && featuredProducts.length > 0 && (
            <div className="mt-20 text-center">
              <Link to="/shop">
                <Button variant="outline" className="rounded-full px-12 py-6 uppercase tracking-wider text-xs font-bold border-black/15 hover:border-black transition-all hover:-translate-y-0.5 hover:bg-black hover:text-white">
                  Explore Full Catalog <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          TESTIMONIALS STRIP
      ========================================= */}
      <section className="section-replica py-20 bg-offwhite">
        <div className="container">
          <div className="text-center mb-12">
            <div className="eyebrow justify-center mb-3">Real Results</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What Our Community Says</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-black" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm font-medium">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-gray-900">{t.name}</p>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{t.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          BRAND ETHOS
      ========================================= */}
      <section className="section-replica py-32 bg-black text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <div className="eyebrow mb-8" style={{ color: 'rgba(200,169,122,0.8)' }}>Our Philosophy</div>
              <h2 className="font-bold tracking-tighter leading-tight mb-10" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
                Less is more.{' '}
                <span className="text-gray-600">Pure is better.</span>
              </h2>
              <div className="space-y-5 text-base text-gray-400 font-light leading-relaxed">
                <p>Etlawm was founded on a simple belief: nature provides everything we need. No fillers, no complex chemical strings—just the raw power of earth's finest botanicals.</p>
                <p>Every bottle is a testament to our commitment to simplicity and effectiveness. We don't follow trends; we follow results.</p>
              </div>
              <Link to="/shop" className="mt-10 inline-flex items-center gap-3 text-white font-bold text-sm border border-white/20 hover:border-white/50 rounded-full px-8 py-4 transition-all hover:-translate-y-0.5">
                Explore the Collection <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="footer-logo-large select-none pointer-events-none text-right">
              ETLAWM.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;