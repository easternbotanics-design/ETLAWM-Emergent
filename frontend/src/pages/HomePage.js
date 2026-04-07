import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ArrowRight, Star, CheckCircle, Package, Truck, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Etlawm Herbal Oil",
      subtitle: "The ultimate solution for your hair and scalp health.",
      image: "https://easternbotanics-design.github.io/Etlawm.com/assets/Running%20banner%20images/Gemini_Generated_Image_ajafi0ajafi0ajaf.png",
      link: "/shop"
    },
    {
      title: "Botanical Rituals",
      subtitle: "Pure ingredients, centuries of herbal wisdom refined.",
      image: "https://easternbotanics-design.github.io/Etlawm.com/assets/Running%20banner%20images/Gemini_Generated_Image_qhhnniqhhnniqhhn.png",
      link: "/shop"
    }
  ];

  useEffect(() => {
    // Initialize Lenis
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

    // Initial Animations
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
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      });

      // Stat numbers animation
      gsap.utils.toArray('.stat-number').forEach((stat) => {
        const val = parseInt(stat.innerText);
        stat.innerText = '0%';
        gsap.to(stat, {
          innerText: val + '%',
          duration: 2,
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: stat,
            start: "top 90%",
            once: true
          }
        });
      });
    }, mainRef);

    fetchFeaturedProducts();

    return () => {
      lenis.destroy();
      ctx.revert();
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

  return (
    <div ref={mainRef} className="font-inter">
      {/* Scroll Progress */}
      <div ref={scrollProgressRef} className="scroll-progress-bar" style={{ transformOrigin: "left", transform: "scaleX(0)" }}></div>

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
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Hero Carousel */}
      <section className="hero-carousel-section">
        <div className="carousel-container">
          {heroSlides.map((slide, index) => (
            <div 
              key={index} 
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="container relative z-10 text-white">
                <div className="max-w-2xl slide-content">
                  <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-10 opacity-90 font-light animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {slide.subtitle}
                  </p>
                  <Link to={slide.link}>
                    <Button className="bg-white text-black hover:bg-white/90 rounded-full px-10 py-6 text-lg font-semibold animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                      Shop Collection <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
          <button onClick={prevSlide} className="carousel-btn prev" aria-label="Previous slide">
            <ChevronLeft />
          </button>
          <button onClick={nextSlide} className="carousel-btn next" aria-label="Next slide">
            <ChevronRight />
          </button>
          <div className="carousel-dots">
            {heroSlides.map((_, i) => (
              <button 
                key={i} 
                className={`dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Science & Ingredients */}
      <section className="section-replica science-section bg-offwhite py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The Science of Etlawm</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Combining traditional botanical knowledge with modern hair science for visible results.</p>
          </div>
          <div className="science-grid">
            <div className="science-card">
              <div className="mb-6"><Package className="w-10 h-10" /></div>
              <h3 className="text-xl font-bold mb-3">Pure Extraction</h3>
              <p className="text-gray-600">Our cold-press extraction process preserves the molecular integrity of every herb.</p>
            </div>
            <div className="science-card">
              <div className="mb-6"><Star className="w-10 h-10" /></div>
              <h3 className="text-xl font-bold mb-3">Premium Quality</h3>
              <p className="text-gray-600">Sourced from sustainably managed organic farms at the peak of their potency.</p>
            </div>
            <div className="science-card">
              <div className="mb-6"><ShieldCheck className="w-10 h-10" /></div>
              <h3 className="text-xl font-bold mb-3">Clinically Proven</h3>
              <p className="text-gray-600">Formulated to reduce hair fall and improve scalp health within 4 weeks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Parallax Wrapper */}
      <section className="stats-section section-replica py-32">
        <div className="container">
          <div className="stats-grid">
            <div className="space-y-24 text-right">
              <div>
                <div className="stat-number">92%</div>
                <h4 className="text-2xl font-bold mt-2">Denser Hair</h4>
                <p className="text-gray-500 mt-2">Users reported significant visible improvement in hair density.</p>
              </div>
              <div>
                <div className="stat-number">88%</div>
                <h4 className="text-2xl font-bold mt-2">Scalp Health</h4>
                <p className="text-gray-500 mt-2">Reduction in dryness and irritation within the first month.</p>
              </div>
            </div>
            
            <div className="flex justify-center items-center h-[600px] overflow-hidden">
               <img 
                src="https://easternbotanics-design.github.io/Etlawm.com/assets/ProductImages/Gemini_Generated_Image_lhdncylhdncylhdn.png" 
                alt="Product" 
                className="max-h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
               />
            </div>

            <div className="space-y-24">
              <div>
                <div className="stat-number">100%</div>
                <h4 className="text-2xl font-bold mt-2">Natural</h4>
                <p className="text-gray-500 mt-2">No synthetic fragrances, mineral oils, or harmful chemicals.</p>
              </div>
              <div>
                <div className="stat-number">45k+</div>
                <h4 className="text-2xl font-bold mt-2">Happy Users</h4>
                <p className="text-gray-500 mt-2">Trusted by hair enthusiasts across the country.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-replica py-24 bg-white">
        <div className="container">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Featured Products</h2>
              <p className="text-gray-500 text-lg">Our most loved essentials for your daily ritual.</p>
            </div>
            <Link to="/shop">
              <Button variant="outline" className="rounded-full px-8 py-6 uppercase tracking-wider text-xs font-bold border-black/10">
                View All Essentials
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Ethos */}
      <section className="section-replica py-32 bg-black text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-10">
                Less is more. <br />
                <span className="text-gray-500">Pure is better.</span>
              </h2>
              <div className="space-y-6 text-xl text-gray-400 font-light leading-relaxed">
                <p>Etlawm was founded on a simple belief: nature provides everything we need. No fillers, no complex chemical strings—just the raw power of earth's finest botanicals.</p>
                <p>Every bottle is a testament to our commitment to simplicity and effectiveness. We don't follow trends; we follow results.</p>
              </div>
            </div>
            <div className="footer-logo-large opacity-10 select-none pointer-events-none">
              ETLAWM.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;