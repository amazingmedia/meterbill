"use client";
import './globals.css';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BillGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchAllImages();
    } else {
      alert("Password မှားနေပါတယ်");
    }
  };

  // Folder အားလုံးထဲက ပုံတွေကို ဆွဲထုတ်မည့် Function
  async function fetchAllImages() {
    setLoading(true);
    let allFiles = [];

    async function getFilesFromFolder(path = "") {
      const { data, error } = await supabase.storage.from('bill').list(path);
      
      if (data) {
        for (const item of data) {
          if (!item.id) { 
            // folder ဖြစ်လျှင် ထပ်ဝင်ရှာမည်
            await getFilesFromFolder(path ? `${path}/${item.name}` : item.name);
          } else {
            // ဖိုင်ဖြစ်လျှင် URL ယူမည်
            const filePath = path ? `${path}/${item.name}` : item.name;
            const { data: urlData } = supabase.storage.from('bill').getPublicUrl(filePath);
            allFiles.push({ name: item.name, url: urlData.publicUrl, fullPath: filePath });
          }
        }
      }
    }

    await getFilesFromFolder();
    setImages(allFiles);
    setLoading(false);
  }

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900 font-sans">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-80 border">
          <h1 className="text-xl font-bold mb-6 text-center">Meter Bills Login</h1>
          <input 
            type="password" 
            className="border w-full p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-semibold transition">ဝင်မည်</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-extrabold text-blue-900">My Bill Gallery ⚡</h1>
          <button onClick={() => setIsLogged(false)} className="text-red-500 font-medium">Logout</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">မီတာဘေလ်များ ရှာဖွေနေသည်...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.length > 0 ? images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200">
                <div className="relative aspect-[3/4]">
                   <img 
                    src={img.url} 
                    alt={img.name} 
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(img.url, '_blank')}
                  />
                </div>
                <div className="p-3 bg-gray-50 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{img.fullPath.split('/')[0]}</p>
                  <p className="text-xs font-semibold text-gray-700 truncate">{img.name}</p>
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center text-gray-400 py-20 italic">ပုံများမရှိသေးပါ။</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
