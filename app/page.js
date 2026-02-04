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

  // ၁။ Password အမြဲမှတ်ထားရန် (Persistent Login)
  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchLatestThreeMonths();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      localStorage.setItem("bill_app_pass", password);
      setIsLogged(true);
      fetchLatestThreeMonths();
    } else {
      alert("Password မှားနေပါတယ်");
    }
  };

  const logout = () => {
    localStorage.removeItem("bill_app_pass");
    setIsLogged(false);
  };

  // ၂။ နောက်ဆုံး ၃ လစာပုံများကို Folder အလိုက် ဆွဲထုတ်ခြင်း
  async function fetchLatestThreeMonths() {
    setLoading(true);
    // သင့် Bucket ထဲက Folder စာရင်းကို အရင်ယူသည်
    const { data: folders, error } = await supabase.storage.from('bill').list('', {
      sortBy: { column: 'name', order: 'desc' }
    });

    if (folders) {
      // ပထမဆုံး ၃ ခု (နောက်ဆုံး ၃ လ သို့မဟုတ် ၃ နှစ်) ကို ရွေးသည်
      const latestThreeFolders = folders.filter(f => !f.id).slice(0, 3);
      const tempGrouped = {};

      for (const folder of latestThreeFolders) {
        const { data: files } = await supabase.storage.from('bill').list(folder.name);
        if (files) {
          tempGrouped[folder.name] = files
            .filter(file => file.id) // ဖိုင်ဖြစ်မှယူမည်
            .map(file => {
              const { data: urlData } = supabase.storage.from('bill').getPublicUrl(`${folder.name}/${file.name}`);
              return { name: file.name, url: urlData.publicUrl };
            });
        }
      }
      setGroupedImages(tempGrouped);
    }
    setLoading(false);
  }

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 font-sans p-4">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-2xl rounded-3xl w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Meter Bill Archive</h1>
          <input 
            type="password" 
            className="border w-full p-4 rounded-xl mb-4 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
            placeholder="စကားဝှက်ရိုက်ပါ"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">Recent Bills ⚡</h1>
          <button onClick={logout} className="text-sm font-semibold text-red-500 bg-red-50 px-4 py-2 rounded-full">Logout</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 mt-4">
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-pulse text-gray-400 font-medium">Checking folders...</div>
          </div>
        ) : (
          Object.keys(groupedImages).map((folderName) => (
            <div key={folderName} className="mb-10">
              {/* ၃။ တစ်လချင်းစီ ခေါင်းစဉ်တပ်ပြီး ပြခြင်း */}
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-bold text-gray-700 bg-white px-4 py-1 rounded-lg shadow-sm border">
                  📅 {folderName}
                </h2>
                <div className="flex-grow border-t ml-4 border-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupedImages[folderName].map((img, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border hover:shadow-md transition-all">
                    <img 
                      src={img.url} 
                      alt={img.name} 
                      className="w-full h-auto rounded-xl cursor-zoom-in"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    <p className="mt-2 text-xs text-gray-400 text-center font-medium">{img.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
