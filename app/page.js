"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Vercel Environment Variables ကနေ လှမ်းယူမယ်
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BillGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Login စစ်ဆေးခြင်း
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchImages();
    } else {
      alert("Password မှားနေပါတယ်");
    }
  };

  // Supabase ထဲက ပုံတွေ ဆွဲထုတ်ခြင်း
  async function fetchImages() {
    setLoading(true);
    // 'bill' ဆိုတဲ့ bucket ထဲက ပုံတွေကို ယူမယ်
    const { data, error } = await supabase.storage.from('bill').list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'desc' },
    });

    if (data) {
      const urls = data.map(file => {
        const { data: urlData } = supabase.storage.from('bill').getPublicUrl(file.name);
        return { name: file.name, url: urlData.publicUrl };
      });
      setImages(urls);
    }
    setLoading(false);
  }

  // --- Login Form UI ---
  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-80 border">
          <h1 className="text-xl font-bold mb-6 text-center">Meter Bills Login</h1>
          <input 
            type="password" 
            className="border w-full p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Password ရိုက်ပါ"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-semibold transition">ဝင်မည်</button>
        </form>
      </div>
    );
  }

  // --- Gallery UI ---
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-blue-900">My Bill Gallery ⚡</h1>
          <button onClick={() => setIsLogged(false)} className="text-gray-500 hover:text-red-500 font-medium">Logout</button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">ပုံများ ဆွဲယူနေသည်...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all">
                <div className="relative aspect-[3/4]">
                   <img 
                    src={img.url} 
                    alt={img.name} 
                    className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                    onClick={() => window.open(img.url, '_blank')}
                  />
                </div>
                <div className="p-3 bg-white border-t">
                  <p className="text-sm font-medium text-gray-700 truncate text-center">{img.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
