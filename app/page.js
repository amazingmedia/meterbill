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

    // Folder အားလုံးကို Scan ဖတ်မည်
    async function scan(path = "") {
      const { data } = await supabase.storage.from('bill').list(path, {
        sortBy: { column: 'name', order: 'desc' }
      });
      
      if (data) {
        for (const item of data) {
          const currentPath = path ? `${path}/${item.name}` : item.name;
          if (!item.id) {
            await scan(currentPath);
          } else {
            const { data: urlData } = supabase.storage.from('bill').getPublicUrl(currentPath);
            
            // Folder Path ကနေ Year နဲ့ Month ကို ခွဲထုတ်မယ်
            // ဥပမာ- "2025/2025-12/photo.jpg" ဆိုရင် parts က ["2025", "2025-12"]
            const parts = currentPath.split('/');
            const fileName = parts.pop();
            const monthFolder = parts.pop() || ""; // 2025-12
            const yearFolder = parts.pop() || "";  // 2025

            results.push({
              id: item.id,
              url: urlData.publicUrl,
              month: monthFolder, 
              year: yearFolder,
              fileName: fileName,
              fullPath: currentPath
            });
          }
        }
      }
    }

    await scan();
    
    // နောက်ဆုံးလတွေကို အပေါ်မှာပြဖို့ Sort လုပ်မယ်
    results.sort((a, b) => b.month.localeCompare(a.month));
    
    setAllBills(results);
    setLoading(false);
  }

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141414] p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-[#E50914] text-5xl font-black text-center mb-10 tracking-tighter italic">BILLFLIX</h1>
          <form onSubmit={handleLogin} className="bg-[#1f1f1f] p-10 rounded-lg shadow-2xl border border-white/5">
            <input 
              type="password" 
              className="w-full p-4 mb-6 bg-[#333] text-white border-none rounded-md focus:ring-2 focus:ring-[#E50914] outline-none transition-all" 
              placeholder="Enter Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#E50914] text-white py-4 rounded-md font-extrabold text-lg hover:bg-[#f40612] active:scale-95 transition-all">SIGN IN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-[#E50914]">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center sticky top-0 bg-[#141414]/95 backdrop-blur-xl z-50 border-b border-white/5">
        <h1 className="text-[#E50914] text-3xl font-black tracking-tighter italic">BILLFLIX</h1>
        <button 
          onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} 
          className="text-xs font-bold bg-white/10 hover:bg-white/20 px-5 py-2 rounded transition"
        >LOGOUT</button>
      </nav>

      <div className="px-6 md:px-16 py-10">
        <div className="flex items-center space-x-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-100">My Meter Archive</h2>
            <div className="h-[1px] flex-grow bg-white/10"></div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-6">
            {allBills.map((bill) => (
              <div key={bill.id} className="group relative">
                {/* Movie Poster Card */}
                <div 
                   className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-900 shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(229,9,20,0.4)]"
                   onClick={() => window.open(bill.url, '_blank')}
                >
                  <img 
                    src={bill.url} 
                    alt={bill.month} 
                    className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                     <span className="text-[10px] font-bold text-[#E50914] uppercase tracking-widest mb-1">View Full Receipt</span>
                  </div>
                </div>

                {/* Movie Titles (Month & Year) */}
                <div className="mt-4 space-y-1">
                  <h3 className="text-sm font-black text-gray-100 group-hover:text-[#E50914] transition-colors truncate">
                    {bill.month}
                  </h3>
                  <div className="flex items-center text-[10px] font-bold text-gray-500">
                    <span className="border border-gray-700 px-1.5 py-0.5 rounded text-[#00df82]">{bill.year}</span>
                    <span className="mx-2 opacity-30">|</span>
                    <span className="uppercase">{bill.fileName.split('.').pop()}</span>
                    <span className="ml-auto text-[#E50914]">4K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && allBills.length === 0 && (
          <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-gray-500 font-medium">No bills found in the archive folders.</p>
          </div>
        )}
      </div>
      
      {/* Footer Branding */}
      <footer className="text-center py-20 opacity-20">
         <p className="text-[10px] font-black tracking-[0.5em]">METER BILL ARCHIVE SYSTEM v2.0</p>
      </footer>
    </div>
  );
}
