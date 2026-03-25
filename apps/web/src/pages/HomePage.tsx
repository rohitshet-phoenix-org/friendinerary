import { Link } from "react-router-dom";
import { MapPin, Users, Map, Bot, Calendar, DollarSign, ArrowRight, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <MapPin className="w-7 h-7 text-brand-500" />
          <span className="text-xl font-bold text-gray-900">Friendinerary</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link to="/signup" className="btn-primary text-sm">Start planning free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Plan trips with friends,<br />
          <span className="text-brand-500">not spreadsheets.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Friendinerary is the collaborative travel planner with real-time co-editing, interactive maps, AI suggestions, and everything you need in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/signup" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            Start planning free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/explore" className="btn-secondary text-base px-8 py-3">Browse destinations</Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Free forever. No credit card required.</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need to plan a perfect trip</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Map className="w-6 h-6" />, title: "Interactive Map", desc: "See all your planned places on a live map with color-coded pins and route lines." },
              { icon: <Users className="w-6 h-6" />, title: "Real-time Collaboration", desc: "Invite friends and plan together with Google Docs-style live editing." },
              { icon: <Bot className="w-6 h-6" />, title: "AI Trip Assistant", desc: "Generate full itineraries in seconds and get local tips from our AI." },
              { icon: <Calendar className="w-6 h-6" />, title: "Day-by-Day Planner", desc: "Organize places into days with drag-and-drop scheduling." },
              { icon: <DollarSign className="w-6 h-6" />, title: "Budget & Expenses", desc: "Track spending, split costs, and see who owes what." },
              { icon: <Star className="w-6 h-6" />, title: "Curated Guides", desc: "Discover the best spots from expert travel guides and other travelers." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready for your next adventure?</h2>
        <p className="text-gray-500 mb-8">Join thousands of travelers planning smarter with Friendinerary.</p>
        <Link to="/signup" className="btn-primary text-base px-10 py-3">
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Friendinerary. All rights reserved.</p>
      </footer>
    </div>
  );
}
