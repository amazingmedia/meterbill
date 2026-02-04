"use client";
import './globals.css';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NetflixStyleGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [allBills, setAllBills] = useState([]);
  const [displayBills, setDisplayBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6; // Mobile မှာ စစဖွင့်ချင်း ပုံ ၆ ပုံပဲ အရင်ပြမယ်

  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchBills();
    }
  }, []);

  // ၁။ လနံပါတ်ကို အမည်ပြောင်းခြင်း (2025-1 -> January)
  const getMonthName = (monthStr) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const parts = monthStr.split('-');
    const monthNum = parseInt(parts[1]); 
    return months[monthNum - 1] || monthStr;
  };

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
            const pathParts = currentPath.split('/');
            const fileName = pathParts.pop();
            const monthFolder = pathParts.pop() || ""; 
            const yearFolder = pathParts.pop() || "";

            results.push({
              id: item.id,
              url: urlData.publicUrl,
              monthName: getMonthName(monthFolder),
              year: yearFolder,
              sortKey: monthFolder // "2025-12" ကို sorting အတွက်သုံးမည်
            });
          }
        }
      }
    }

    await scan();
    
    // ၂။ အများမှ အနည်းသို့ စီခြင်း (Descending)
    results.sort((a, b) => b.sortKey.localeCompare(a.sortKey, undefined, {numeric: true}));
    
    setAllBills(results);
    setDisplayBills(results.slice(0, itemsPerPage));
    setLoading(false);
  }

  // ၃။ Infinite Scroll (အပေါ်ဆွဲတင်လျှင် ပုံများထပ်တိုးခြင်း)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !loading) {
        if (displayBills.length < allBills.length) {
          const nextPage = page + 1;
          setDisplayBills(allBills.slice(0, nextPage * itemsPerPage));
          setPage(nextPage);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayBills, allBills, loading, page]);

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141414] p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-[#E50914] text-5xl font-black text-center mb-10 italic tracking-tighter">BILLFLIX</h1>
          <form onSubmit={handleLogin} className="bg-[#1f1f1f] p-8 rounded shadow-2xl">
            <input 
              type="password" 
              className="w-full p-3 mb-6 bg-[#333] text-white border-none rounded outline-none focus:ring-2 focus:ring-[#E50914]" 
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#E50914] text-white py-3 rounded font-extrabold hover:bg-[#f40612]">SIGN IN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans">
      <nav className="p-4 flex justify-between items-center sticky top-0 bg-[#141414]/90 backdrop-blur-md z-50 border-b border-white/5">
        <h1 className="text-[#E50914] text-2xl font-black italic tracking-tighter">BILLFLIX</h1>
        <button onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} className="text-[10px] font-bold text-gray-500 uppercase">Sign Out</button>
      </nav>

      <div className="p-4 md:px-12">
        <h2 className="text-sm font-bold mb-6 text-gray-400 uppercase tracking-widest">My Meter Collection</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-[#2f2f2f] animate-pulse rounded"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {displayBills.map((bill) => (
              <div key={bill.id} className="group cursor-pointer">
                {/* Netflix Style Poster */}
                <div 
                   className="relative aspect-[2/3] overflow-hidden rounded shadow-lg transition-transform duration-300 active:scale-95 md:group-hover:scale-110 z-0 md:group-hover:z-10"
                   onClick={() => window.open(bill.url, '_blank')}
                >
                  <img src={bill.url} className="object-cover w-full h-full" alt="bill" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                
                {/* Poster Info */}
                <div className="mt-3 px-1">
                  <h3 className="text-[13px] font-bold text-gray-200 truncate leading-tight">{bill.monthName}</h3>
                  <div className="flex items-center text-[10px] text-gray-500 mt-1">
                    <span className="text-[#E50914] font-black mr-2">New</span>
                    <span>{bill.year}</span>
                    <span className="mx-1.5">•</span>
                    <span className="border border-gray-700 px-1 rounded-[2px] text-[8px]">4K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {displayBills.length < allBills.length && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
