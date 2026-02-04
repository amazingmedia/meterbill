"use client";
import './globals.css';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MovieStyleGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [allBills, setAllBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchBills();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      localStorage.setItem("bill_app_pass", password);
      setIsLogged(true);
      fetchBills();
    } else {
      alert("Password မှားနေပါတယ်");
    }
  };

  async function fetchBills() {
    setLoading(true);
    let results = [];

    async function scan(path = "") {
      const { data } = await supabase.storage.from('bill').list(path);
      if (data) {
        for (const item of data) {
          const currentPath = path ? `${path}/${item.name}` : item.name;
          if (!item.id) {
            await scan(currentPath);
          } else {
            const { data: urlData } = supabase.storage.from('bill').getPublicUrl(currentPath);
            
            // Folder Path ထဲကနေ Year နဲ့ Month ကို ခွဲထုတ်ခြင်း
            // ဥပမာ path က "2025/Dec" ဆိုရင် parts က ["2025", "Dec"] ဖြစ်မယ်
            const parts = currentPath.split('/');
            const fileName = parts.pop();
            const folderInfo = parts.join(' ') || "Unsorted";

            results.push({
              id: item.id,
              name: fileName,
              url: urlData.publicUrl,
              info: folderInfo, // 2025 Dec လို့ ပေါ်လာမယ်
              date: item.created_at
            });
          }
        }
      }
    }

    await scan();
    // နောက်ဆုံးတင်တဲ့ပုံကို အရင်ပြရန် စီမည်
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    // နောက်ဆုံး ၃ လစာခန့် (သို့မဟုတ် ပုံ ၈ ပုံခန့်) ကို ဥပမာပြမည်။ 
    // ပုံအားလုံးပြချင်ရင် .slice() ကို ဖြုတ်လိုက်ပါ
    setAllBills(results.slice(0, 12)); 
    setLoading(false);
  }

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141414] p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-[#E50914] text-4xl font-black text-center mb-8 tracking-tighter">BILLFLIX</h1>
          <form onSubmit={handleLogin} className="bg-[#1f1f1f] p-8 rounded-md shadow-2xl">
            <input 
              type="password" 
              className="w-full p-3 mb-4 bg-[#333] text-white border-none rounded focus:ring-2 focus:ring-gray-500 outline-none" 
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#E50914] text-white py-3 rounded font-bold hover:bg-[#f40612] transition">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans">
      {/* Navbar Style */}
      <nav className="p-5 flex justify-between items-center sticky top-0 bg-[#141414]/90 backdrop-blur-md z-50">
        <h1 className="text-[#E50914] text-2xl font-extrabold tracking-tighter">BILLFLIX</h1>
        <button onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} className="text-sm text-gray-400 hover:text-white transition">Sign Out</button>
      </nav>

      <div className="px-6 md:px-12 py-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-200">Recent Meter Bills</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-[#2f2f2f] animate-pulse rounded-md"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10 gap-x-4">
            {allBills.map((bill) => (
              <div key={bill.id} className="group cursor-pointer">
                {/* Poster Image */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105 group-hover:ring-4 ring-gray-500">
                  <img 
                    src={bill.url} 
                    alt={bill.name} 
                    className="object-cover w-full h-full"
                    onClick={() => window.open(bill.url, '_blank')}
                  />
                </div>
                {/* Movie Info Style */}
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-gray-100 group-hover:text-white truncate">{bill.info}</h3>
                  <div className="flex items-center text-[11px] text-gray-500 mt-1 font-medium">
                    <span className="border border-gray-600 px-1 rounded-sm mr-2 text-[9px]">HD</span>
                    <span>{new Date(bill.date).getFullYear()}</span>
                    <span className="mx-2">•</span>
                    <span>{bill.name.split('.').pop().toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && allBills.length === 0 && (
        <div className="text-center py-20 text-gray-500">No bills found in the archive.</div>
      )}
    </div>
  );
}
