"use client";
import './globals.css';
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CachedNetflixGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [allBills, setAllBills] = useState([]);
  const [selectedYear, setSelectedYear] = useState("All");
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);

  const getMonthName = (monthStr) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const part = monthStr.split('-')[1];
    const monthNum = parseInt(part);
    return months[monthNum - 1] || monthStr;
  };

  useEffect(() => {
    const savedPass = localStorage.getItem("bill_app_pass");
    if (savedPass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setIsLogged(true);
      
      // ၁။ Cache ရှိမရှိ အရင်စစ်မယ်
      const cachedData = localStorage.getItem("bill_cache_data");
      if (cachedData) {
        setAllBills(JSON.parse(cachedData));
        // Cache ရှိပေမဲ့ နောက်ကွယ်ကနေ အသစ်တွေရှိလား ထပ်ဆွဲထားမယ် (Background Refresh)
        refreshBills(); 
      } else {
        fetchBills();
      }
    }
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    await refreshBills();
    setLoading(false);
  };

  // ပုံအသစ်တွေကို ဆွဲယူပြီး Cache ထဲ ထည့်တဲ့ Function
  const refreshBills = async () => {
    let results = [];
    const scan = async (path = "") => {
      const { data } = await supabase.storage.from('bill').list(path, {
        sortBy: { column: 'name', order: 'desc' }
      });
      if (data) {
        const folders = data.filter(item => !item.id);
        const files = data.filter(item => item.id);
        files.forEach(file => {
          const { data: urlData } = supabase.storage.from('bill').getPublicUrl(path ? `${path}/${file.name}` : file.name);
          const parts = path.split('/');
          results.push({
            id: file.id,
            url: urlData.publicUrl,
            monthName: getMonthName(parts[1] || ""),
            year: parts[0] || "Other",
            sortKey: parts[1] || ""
          });
        });
        for (const folder of folders) { await scan(path ? `${path}/${folder.name}` : folder.name); }
      }
    };

    await scan();
    results.sort((a, b) => b.sortKey.localeCompare(a.sortKey, undefined, { numeric: true }));
    
    // ၂။ Cache ထဲမှာ သိမ်းလိုက်ပြီ
    setAllBills(results);
    localStorage.setItem("bill_cache_data", JSON.stringify(results));
  };

  const filteredBills = useMemo(() => {
    if (selectedYear === "All") return allBills;
    return allBills.filter(bill => bill.year === selectedYear);
  }, [allBills, selectedYear]);

  const displayBills = filteredBills.slice(0, displayCount);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        if (displayCount < filteredBills.length) { setDisplayCount(prev => prev + 6); }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, filteredBills.length]);

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141414] p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
            localStorage.setItem("bill_app_pass", password);
            setIsLogged(true);
            fetchBills();
          } else { alert("Password မှားနေပါတယ်"); }
        }} className="bg-[#1f1f1f] p-8 rounded w-full max-w-sm border border-white/5 shadow-2xl">
          <h1 className="text-[#E50914] text-4xl font-black text-center mb-8 italic tracking-tighter">BILLFLIX</h1>
          <input type="password" className="w-full p-4 mb-6 bg-[#333] text-white rounded-md outline-none" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-[#E50914] text-white py-4 rounded-md font-bold">SIGN IN</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <nav className="p-4 flex justify-between items-center sticky top-0 bg-[#141414]/95 backdrop-blur-md z-50">
        <h1 className="text-[#E50914] text-2xl font-black italic tracking-tighter">BILLFLIX</h1>
        <div className="flex gap-4 items-center">
            {/* Refresh Button */}
            <button onClick={fetchBills} className="text-gray-500 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                </svg>
            </button>
            <button onClick={() => { localStorage.clear(); setIsLogged(false); }} className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-gray-800 px-3 py-1 rounded">Logout</button>
        </div>
      </nav>

      {/* Year Filter Menu */}
      <div className="px-4 py-2 sticky top-[60px] bg-[#141414] z-40 flex overflow-x-auto no-scrollbar gap-3 mb-4 border-b border-white/5 pb-4">
        {["All", "2026", "2025", "2024", "2023"].map((year) => (
          <button key={year} onClick={() => { setSelectedYear(year); setDisplayCount(6); }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${selectedYear === year ? "bg-[#E50914] border-[#E50914] text-white" : "bg-transparent border-white/20 text-gray-400"}`}>
            {year}
          </button>
        ))}
      </div>

      <div className="p-4 md:px-10">
        {loading && allBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
            {displayBills.map((bill) => (
              <div key={bill.id} className="group cursor-pointer" onClick={() => window.open(bill.url, '_blank')}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#222] active:scale-95 transition-transform duration-200">
                  <img src={bill.url} className="object-cover w-full h-full opacity-90" alt="bill" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>
                <div className="mt-3">
                  <h3 className="text-[13px] font-bold text-gray-200 truncate">{bill.monthName}</h3>
                  <div className="text-[#E50914] text-[11px] font-black">{bill.year}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
