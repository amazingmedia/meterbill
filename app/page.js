"use client";
import './globals.css';
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NetflixStyleGallery() {
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
      fetchBills();
    }
  }, []);

  const fetchBills = async () => {
    setLoading(true);
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

        for (const folder of folders) {
          await scan(path ? `${path}/${folder.name}` : folder.name);
        }
      }
    };

    await scan();
    results.sort((a, b) => b.sortKey.localeCompare(a.sortKey, undefined, { numeric: true }));
    setAllBills(results);
    setLoading(false);
  };

  // Filter Logic
  const filteredBills = useMemo(() => {
    if (selectedYear === "All") return allBills;
    return allBills.filter(bill => bill.year === selectedYear);
  }, [allBills, selectedYear]);

  const displayBills = filteredBills.slice(0, displayCount);

  // Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        if (displayCount < filteredBills.length) {
          setDisplayCount(prev => prev + 6);
        }
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
          <h1 className="text-[#E50914] text-4xl font-black text-center mb-8 italic">BILLFLIX</h1>
          <input type="password" className="w-full p-4 mb-6 bg-[#333] text-white rounded-md outline-none border-none focus:ring-2 focus:ring-[#E50914]" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-[#E50914] text-white py-4 rounded-md font-bold text-lg active:scale-95 transition-all">SIGN IN</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Top Navbar */}
      <nav className="p-4 flex justify-between items-center sticky top-0 bg-[#141414]/95 backdrop-blur-md z-50">
        <h1 className="text-[#E50914] text-2xl font-black italic tracking-tighter">BILLFLIX</h1>
        <button onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-gray-800 px-3 py-1 rounded">Logout</button>
      </nav>

      {/* Year Filter Menu */}
      <div className="px-4 py-2 sticky top-[60px] bg-[#141414] z-40 flex overflow-x-auto no-scrollbar gap-3 mb-4">
        {["All", "2026", "2025", "2024", "2023"].map((year) => (
          <button
            key={year}
            onClick={() => { setSelectedYear(year); setDisplayCount(6); }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedYear === year 
              ? "bg-[#E50914] border-[#E50914] text-white scale-105" 
              : "bg-transparent border-white/20 text-gray-400 hover:border-white"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="p-4 md:px-10">
        <h2 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.2em]">Recently Added in {selectedYear}</h2>

        {loading && displayBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-600 text-xs font-bold animate-pulse uppercase tracking-widest">Fetching Archive...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
            {displayBills.map((bill) => (
              <div key={bill.id} className="group cursor-pointer" onClick={() => window.open(bill.url, '_blank')}>
                {/* Poster Box */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.5)] active:scale-95 transition-transform duration-200">
                  <img src={bill.url} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="bill" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>
                
                {/* Info Text */}
                <div className="mt-3 space-y-1">
                  <h3 className="text-[13px] font-extrabold text-gray-200 truncate">{bill.monthName}</h3>
                  <div>
                    <span className="text-[#E50914] text-[11px] font-black tracking-tighter">
                      {bill.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayBills.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 font-bold uppercase tracking-widest text-xs italic">No data found for {selectedYear}</p>
          </div>
        )}
      </div>
    </div>
  );
}
