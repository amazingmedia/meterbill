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
  const [displayBills, setDisplayBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 4; // စဖွင့်ချင်း ပြမည့် ပုံအရေအတွက်

  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      fetchBills();
    }
  }, []);

  // ၁။ နံပါတ်ကို လအမည်သို့ ပြောင်းသည့် function
  const getMonthName = (monthStr) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    // 2025-12 ထဲက 12 ကို ယူသည်
    const monthNum = parseInt(monthStr.split('-')[1]);
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
            const parts = currentPath.split('/');
            const fileName = parts.pop();
            const monthFolder = parts.pop() || ""; 
            const yearFolder = parts.pop() || "";

            results.push({
              id: item.id,
              url: urlData.publicUrl,
              monthName: getMonthName(monthFolder),
              year: yearFolder,
              sortKey: monthFolder // 2025-12 ဆိုတာကို sorting အတွက် သုံးမယ်
            });
          }
        }
      }
    }

    await scan();
    
    // ၂။ ပုံများကို အများမှ အနည်းသို့ စီခြင်း (Descending Order)
    results.sort((a, b) => b.sortKey.localeCompare(a.sortKey, undefined, {numeric: true}));
    
    setAllBills(results);
    setDisplayBills(results.slice(0, itemsPerPage)); // စစချင်း ပုံအနည်းငယ်ပဲပြမယ်
    setLoading(false);
  }

  // ၃။ အပေါ်ဆွဲတင်လျှင် ပုံများ ထပ်တိုးပြခြင်း (Scroll logic)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !loading) {
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
          <h1 className="text-[#E50914] text-5xl font-black text-center mb-10 italic">BILLFLIX</h1>
          <form onSubmit={handleLogin} className="bg-[#1f1f1f] p-10 rounded-lg shadow-2xl">
            <input 
              type="password" 
              className="w-full p-4 mb-6 bg-[#333] text-white border-none rounded-md outline-none" 
              placeholder="Enter Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#E50914] text-white py-4 rounded-md font-extrabold">SIGN IN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <nav className="p-5 flex justify-between items-center sticky top-0 bg-[#141414]/95 backdrop-blur-md z-50 border-b border-white/5">
        <h1 className="text-[#E50914] text-2xl font-black italic">BILLFLIX</h1>
        <button onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} className="text-xs font-bold opacity-50">LOGOUT</button>
      </nav>

      <div className="px-4 py-6">
        {loading ? (
          <div className="text-center py-20 opacity-50">Loading Bills...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {displayBills.map((bill) => (
              <div key={bill.id} className="group flex flex-col items-center">
                <div 
                   className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl border border-white/10"
                   onClick={() => window.open(bill.url, '_blank')}
                >
                  <img src={bill.url} className="object-cover w-full h-full" alt="bill" />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-bold text-gray-100">{bill.year} {bill.monthName}</h3>
                  <p className="text-[#E50914] text-[10px] font-black tracking-widest mt-1 uppercase">Meter Bill • 4K</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {displayBills.length < allBills.length && (
           <div className="text-center py-10 text-xs text-gray-600 font-bold animate-pulse">
             SCROLL FOR MORE
           </div>
        )}
      </div>
    </div>
  );
}
