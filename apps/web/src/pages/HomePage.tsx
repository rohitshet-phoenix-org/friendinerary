import { Link } from "react-router-dom";
import { MapPin, Users, Map, Bot, Calendar, DollarSign, ArrowRight, Star } from "lucide-react";

const heroImages = [
  { src: "/images/hero/tokyo.jpg", alt: "Tokyo, Japan", label: "Tokyo" },
  { src: "/images/hero/bali.jpg", alt: "Bali, Indonesia", label: "Bali" },
  { src: "/images/hero/santorini.jpg", alt: "Santorini, Greece", label: "Santorini" },
  { src: "/images/hero/singapore.jpg", alt: "Singapore", label: "Singapore" },
  { src: "/images/hero/kyoto.jpg", alt: "Kyoto, Japan", label: "Kyoto" },
  { src: "/images/hero/maldives.jpg", alt: "Maldives", label: "Maldives" },
  { src: "/images/hero/paris.jpg", alt: "Paris, France", label: "Paris" },
  { src: "/images/hero/switzerland.jpg", alt: "Switzerland", label: "Switzerland" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav — transparent over hero */}
      <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-7 h-7 text-white" />
            <span className="text-xl font-bold text-white">Friendinerary</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-white/90 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="bg-white text-brand-500 hover:bg-orange-50 font-medium text-sm px-4 py-2 rounded-lg transition-colors">
              Start planning free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with photo collage background */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Photo collage grid background */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-1">
          {heroImages.map((img) => (
            <div key={img.label} className="relative overflow-hidden">
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover scale-105"
                loading="eager"
              />
              {/* Destination label */}
              <span className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {img.label}
              </span>
            </div>
          ))}
        </div>

        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />

        {/* Hero content */}
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-full mb-8 border border-white/20">
            <MapPin className="w-4 h-4" />
            Your next adventure starts here
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Plan trips with friends,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500">
              not spreadsheets.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Friendinerary is the collaborative travel planner with real-time co-editing,
            interactive maps, AI suggestions, and everything you need in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:scale-[1.02]"
            >
              Start planning free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/explore"
              className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-base px-8 py-3.5 rounded-xl border border-white/30 transition-all"
            >
              Browse destinations
            </Link>
          </div>
          <p className="text-sm text-white/50 mt-5">Free forever. No credit card required.</p>
        </div>

        {/* Bottom fade into white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-20" />
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Everything you need to plan a perfect trip
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-2xl mx-auto">
            From itinerary planning to budget tracking, we've got every part of your journey covered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Map className="w-6 h-6" />, title: "Interactive Map", desc: "See all your planned places on a live map with color-coded pins and route lines." },
              { icon: <Users className="w-6 h-6" />, title: "Real-time Collaboration", desc: "Invite friends and plan together with Google Docs-style live editing." },
              { icon: <Bot className="w-6 h-6" />, title: "AI Trip Assistant", desc: "Generate full itineraries in seconds and get local tips from our AI." },
              { icon: <Calendar className="w-6 h-6" />, title: "Day-by-Day Planner", desc: "Organize places into days with drag-and-drop scheduling." },
              { icon: <DollarSign className="w-6 h-6" />, title: "Budget & Expenses", desc: "Track spending, split costs, and see who owes what." },
              { icon: <Star className="w-6 h-6" />, title: "Curated Guides", desc: "Discover the best spots from expert travel guides and other travelers." },
            ].map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-brand-500 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with collage background */}
      <section className="relative py-28 overflow-hidden">
        {/* Background collage — reuse 4 images */}
        <div className="absolute inset-0 grid grid-cols-4 gap-1">
          {heroImages.slice(0, 4).map((img) => (
            <div key={img.label + "-cta"} className="overflow-hidden">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/65 to-black/75" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready for your next adventure?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Join thousands of travelers planning smarter with Friendinerary.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base px-10 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:scale-[1.02]"
          >
            Create your free account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-brand-500" />
          <span className="text-white font-semibold">Friendinerary</span>
        </div>
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Friendinerary. All rights reserved.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Photos by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Unsplash</a>
        </p>
      </footer>
    </div>
  );
}
