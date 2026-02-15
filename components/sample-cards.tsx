const samples = [
  { title: "Paris Romance", desc: "Eiffel Tower, Louvre, Seine cruise", image: "https://images.unsplash.com/photo-1499856871958-5ba14780f2e9", link: "https://en.parisinfo.com" },
  { title: "Bali Bliss", desc: "Temples, beaches, rice terraces", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4", link: "https://www.indonesia.travel" },
  { title: "Tokyo Adventure", desc: "Shibuya crossing, temples, ramen", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf", link: "https://www.gotokyo.org" },
  { title: "New York Energy", desc: "Times Square, Central Park, Statue of Liberty", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9", link: "https://www.nycgo.com" },
  { title: "Rome Eternal", desc: "Colosseum, Vatican, pasta", image: "https://images.unsplash.com/photo-1531572753322-c991f604dd5c", link: "https://www.turismoroma.it" },
  { title: "Dubai Luxury", desc: "Burj Khalifa, deserts, malls", image: "https://images.unsplash.com/photo-1512453979798-5ea6edaea005", link: "https://www.visitdubai.com" },
  { title: "London Classic", desc: "Big Ben, Buckingham, Thames", image: "https://images.unsplash.com/photo-1513635265356-6f7e50425d64", link: "https://www.visitlondon.com" },
  { title: "Sydney Vibes", desc: "Opera House, Bondi Beach, Harbour Bridge", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", link: "https://www.sydney.com" },
];

export default function SampleCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {samples.map((s) => (
        <div key={s.title} className="group cursor-pointer overflow-hidden rounded-xl shadow-lg">
          <div className="aspect-video overflow-hidden">
            <img src={s.image} alt={s.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
          </div>
          <div className="p-4 bg-white">
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="text-sm text-gray-600">{s.desc}</p>
            <a href={s.link} target="_blank" className="text-blue-600 text-sm mt-2 inline-block">Official site →</a>
          </div>
        </div>
      ))}
    </div>
  );
}