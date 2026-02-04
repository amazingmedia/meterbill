"use client";
import './globals.css';
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FastNetflixGallery() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [allBills, setAllBills] = useState([]);
  const [displayBills, setDisplayBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const getMonthName = (monthStr) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNum = parseInt(monthStr.split('-')[1]);
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

    // ပိုမြန်အောင် တိုက်ရိုက် Scan ဖတ်မည့် logic
    const scan = async (path = "") => {
      const { data } = await supabase.storage.from('bill').list(path, {
        limit: 100, // တစ်ခါတည်း အများကြီးဆွဲထုတ်မည်
        sortBy: { column: 'name', order: 'desc' }
      });
      
      if (data) {
        const folders = data.filter(item => !item.id);
        const files = data.filter(item => item.id);

        // ဖိုင်များကို အရင်ထည့်မည်
        files.forEach(file => {
          const { data: urlData } = supabase.storage.from('bill').getPublicUrl(path ? `${path}/${file.name}` : file.name);
          const parts = path.split('/');
          results.push({
            id: file.id,
            url: urlData.publicUrl,
            monthName: getMonthName(parts[1] || ""),
            year: parts[0] || "",
            sortKey: parts[1] || ""
          });
        });

        // Folder များရှိလျှင် ထပ်ဝင်မည်
        for (const folder of folders) {
          await scan(path ? `${path}/${folder.name}` : folder.name);
        }
      }
    };

    await scan();
    results.sort((a, b) => b.sortKey.localeCompare(a.sortKey, undefined, { numeric: true }));
    setAllBills(results);
    setDisplayBills(results.slice(0, itemsPerPage));
    setLoading(false);
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && !loading) {
      if (displayBills.length < allBills.length) {
        const nextPage = page + 1;
        setDisplayBills(allBills.slice(0, nextPage * itemsPerPage));
        setPage(nextPage);
      }
    }
  }, [displayBills, allBills, loading, page]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!isLogged) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141414] p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
            localStorage.setItem("bill_app_pass", password);
            setIsLogged(true);
            fetchBills();
          } else { alert("မှားနေပါတယ်"); }
        }} className="bg-[#1f1f1f] p-8 rounded w-full max-w-sm">
          <h1 className="text-[#E50914] text-4xl font-black text-center mb-8 italic">BILLFLIX</h1>
          <input type="password" className="w-full p-3 mb-6 bg-[#333] text-white rounded outline-none" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-[#E50914] text-white py-3 rounded font-bold">SIGN IN</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <nav className="p-4 flex justify-between items-center sticky top-0 bg-[#141414]/90 backdrop-blur-md z-50">
        <h1 className="text-[#E50914] text-2xl font-black italic tracking-tighter">BILLFLIX</h1>
        <button onClick={() => { localStorage.removeItem("bill_app_pass"); setIsLogged(false); }} className="text-[10px] text-gray-500 uppercase">Sign Out</button>
      </nav>

      <div className="p-4">
        {loading && displayBills.length === 0 ? (
          <div className="flex justify-center py-20 animate-pulse text-gray-500 italic">Bills loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
            {displayBills.map((bill) => (
              <div key={bill.id} className="group cursor-pointer" onClick={() => window.open(bill.url, '_blank')}>
                <div className="relative aspect-[2/3] overflow-hidden rounded bg-[#222] shadow-lg active:scale-95 transition-transform duration-200">
                  <img src={bill.url} className="object-cover w-full h-full opacity-90" alt="bill" loading="lazy" />
                </div>
                <div className="mt-3">
                  <h3 className="text-[14px] font-bold text-gray-100 truncate">{bill.monthName}</h3>
                  <div className="mt-1">
                    <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">
                      {bill.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
