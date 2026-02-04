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
  const [groupedImages, setGroupedImages] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchDeepImages();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      localStorage.setItem("bill_app_pass", password);
      setIsLogged(true);
      fetchDeepImages();
    } else {
      alert("Password မှားနေပါတယ်");
    }
  };

  const logout = () => {
    localStorage.removeItem("bill_app_pass");
    setIsLogged(false);
  };

  async function fetchDeepImages() {
    setLoading(true);
    let allMedia = [];

    // Folder အဆင့်ဆင့်ထဲက ဖိုင်အားလုံးကို ရှာမည့် function
    async function scanFolder(path = "") {
      const { data, error } = await supabase.storage.from('bill').list(path, {
        sortBy: { column: 'name', order: 'desc' }
      });

      if (data) {
        for (const item of data) {
          const currentPath = path ? `${path}/${item.name}` : item.name;
          if (!item.id) {
            // Folder ဖြစ်လျှင် ထပ်ဝင်မည်
            await scanFolder(currentPath);
          } else {
            // ဖိုင်ဖြစ်လျှင် သိမ်းမည်
            const { data: urlData } = supabase.storage.from('bill').getPublicUrl(currentPath);
            // Folder အမည်ကို ခေါင်းစဉ်တပ်ရန် ယူခြင်း (ဥပမာ- Dec 2023 သို့မဟုတ် 2025/Dec)
            const folderLabel = path || "General";
            allMedia.push({ 
              name: item.name, 
              url: urlData.publicUrl, 
              folder: folderLabel,
              createdAt: item.created_at 
            });
          }
        }
      }
    }

    await scanFolder();

    // ပုံတွေကို အချိန်အလိုက် နောက်ဆုံးတင်တာ အရင်ပြရန် စီမည်
    allMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ပုံတွေထဲက နောက်ဆုံး ၃ လစာ (Unique Folders) ကိုပဲ ယူမည်
    const folders = [...new Set(allMedia.map(m => m.folder))].slice(0, 3);
    const finalGroups = {};
    folders.forEach(f => {
      finalGroups[f] = allMedia.filter(m => m.folder === f);
    });

    setGroupedImages(finalGroups);
    setLoading(false);
  }

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-2xl rounded-3xl w-full max-w-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Meter Bill Archive</h1>
          <input 
            type="password" 
            className="border w-full p-4 rounded-2xl mb-4 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
            placeholder="စကားဝှက်ရိုက်ပါ"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-2xl font-bold text-lg shadow-lg">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b">
        <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tight">RECENT BILLS</h1>
          <button onClick={logout} className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full border border-red-100">LOGOUT</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center mt-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Scanning folders...</p>
          </div>
        ) : (
          Object.keys(groupedImages).length > 0 ? Object.keys(groupedImages).map((folderName) => (
            <div key={folderName} className="mb-12">
              <div className="flex items-center mb-6">
                <span className="text-sm font-black bg-blue-600 text-white px-3 py-1 rounded-md shadow-md mr-3">
                  {folderName.includes('/') ? folderName.split('/').pop() : folderName}
                </span>
                <div className="h-[1px] flex-grow bg-gray-200"></div>
                <span className="ml-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">{folderName.split('/')[0]}</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {groupedImages[folderName].map((img, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.name} 
                      className="w-full h-auto rounded-2xl cursor-zoom-in active:scale-95 transition-transform"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    <div className="p-3 flex justify-between items-center">
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{img.name}</p>
                      <a href={img.url} download className="text-[10px] font-bold text-blue-500">VIEW FULL</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center mt-20 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-3xl py-20">
              ပုံများရှာမတွေ့ပါ။ Folder အမည်များ မှန်ကန်ပါသလား?
            </div>
          )
        )}
      </div>
    </div>
  );
}
