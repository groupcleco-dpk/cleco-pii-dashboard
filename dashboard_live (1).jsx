import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Wallet, Users, RefreshCw, Coffee, Database, AlertCircle, CheckCircle, Package, FileText } from "lucide-react";

const SB_URL = "https://rpogymhoemcwrjhollzq.supabase.co";
const SB_KEY = "sb_publishable_hNCXhJghmB5e5ih5s3L8cQ_78Q2-BKs";

const KAT_COLOR = {
  PEMASUKAN:"#C9A84C", BAHAN_BAR:"#2D9D9D", BAHAN_KITCHEN:"#3DAD8D",
  GAJI:"#E07B54", OPERASIONAL:"#7B5EA7", LISTRIK:"#5496E0",
  KEAMANAN:"#A07060", SEWA:"#E05454", INTERNET:"#54C1E0", LAIN_LAIN:"#808080"
};
const formatRp = v => !v && v!==0 ? "—" : "Rp "+Number(v).toLocaleString("id-ID");
const BEP = 20833100;

export default function Dashboard() {
  const [tab, setTab]         = useState("jurnal");
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);
  const [connOk, setConnOk]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [jurnal,   setJurnal]   = useState([]);
  const [karyawan, setKaryawan] = useState([]);
  const [gaji,     setGaji]     = useState([]);
  const [stok,     setStok]     = useState([]);
  const [opex,     setOpex]     = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const h = {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json"
      };
      const [jR,kR,gR,sR,oR] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/jurnal_harian?select=*&order=tanggal.desc&limit=200`, {headers:h}),
        fetch(`${SB_URL}/rest/v1/karyawan?select=*&order=nama.asc`,                   {headers:h}),
        fetch(`${SB_URL}/rest/v1/gaji?select=*&order=periode.desc`,                   {headers:h}),
        fetch(`${SB_URL}/rest/v1/stok_bahan?select=*&order=kategori.asc,nama_bahan.asc`, {headers:h}),
        fetch(`${SB_URL}/rest/v1/opex?select=*&order=kategori.asc`,                   {headers:h}),
      ]);
      if (!jR.ok) { const e = await jR.json(); throw new Error(e.message||"Gagal koneksi"); }
      const [j,k,g,s,o] = await Promise.all([jR.json(),kR.json(),gR.json(),sR.json(),oR.json()]);
      setJurnal(j); setKaryawan(k); setGaji(g); setStok(s); setOpex(o);
      setConnOk(true);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } catch(e) {
      setErr(e.message); setConnOk(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Calculations ──────────────────────────────────────────
  const totalMasuk  = jurnal.filter(j=>j.kategori==="PEMASUKAN").reduce((s,j)=>s+(j.debit||0),0);
  const totalKeluar = jurnal.filter(j=>j.kategori!=="PEMASUKAN").reduce((s,j)=>s+(j.kredit||0),0);
  const net         = totalMasuk - totalKeluar;
  const bepPct      = Math.min(Math.round(totalMasuk/BEP*100),100);
  const aktif       = karyawan.filter(k=>k.status==="aktif").length;

  const katData = Object.entries(
    jurnal.reduce((acc,j)=>{
      acc[j.kategori]=(acc[j.kategori]||0)+(j.kategori==="PEMASUKAN"?(j.debit||0):(j.kredit||0));
      return acc;
    },{})
  ).map(([n,v])=>({name:n.replace(/_/g," "),nilai:v,key:n}))
   .filter(d=>d.nilai>0).sort((a,b)=>b.nilai-a.nilai);

  const daily = Object.entries(
    jurnal.filter(j=>j.kategori==="PEMASUKAN")
      .reduce((acc,j)=>{acc[j.tanggal]=(acc[j.tanggal]||0)+(j.debit||0);return acc;},{})
  ).map(([t,v])=>({tgl:t.slice(5),nilai:v})).sort((a,b)=>a.tgl.localeCompare(b.tgl));

  const gajiRows = karyawan.map(k=>({...k,...(gaji.find(g=>g.karyawan_id===k.id)||{})}));
  const stokBar  = stok.filter(s=>s.kategori==="Bar");
  const stokKit  = stok.filter(s=>s.kategori==="Kitchen");

  const opexTotal = { anggaran: opex.reduce((s,o)=>s+(o.anggaran||0),0), aktual: opex.reduce((s,o)=>s+(o.aktual||0),0) };

  return (
    <div style={{fontFamily:"'Sora',sans-serif",background:"#071E1E",minHeight:"100vh",color:"#E8F4F4"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sora:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .card{background:#0F2E2Ecc;border:1px solid #1A5F5F33;border-radius:14px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeIn .4s ease}
        table{width:100%;border-collapse:collapse}
        th{background:#1A3A3A;color:#7AADAD;padding:9px 13px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:600;white-space:nowrap}
        td{padding:10px 13px;border-bottom:1px solid #1A3A3A22;font-size:12px;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#1A3A3A22}
        .tab{padding:7px 16px;border-radius:8px;border:none;cursor:pointer;font-weight:600;font-size:12px;font-family:'Sora',sans-serif;transition:all .2s;white-space:nowrap}
        .ton{background:linear-gradient(135deg,#C9A84C,#E8C96D);color:#071E1E}
        .toff{background:#1A3A3A;color:#7AADAD}
        .badge{padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#2D5555;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#0B2828EE",borderBottom:"1px solid #1A5F5F33",padding:"13px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"linear-gradient(135deg,#C9A84C,#E8C96D)",padding:8,borderRadius:10,display:"flex"}}>
            <Coffee size={18} color="#071E1E"/>
          </div>
          <div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:900,color:"#C9A84C",lineHeight:1}}>Cleco Pii</div>
            <div style={{fontSize:9,color:"#7AADAD",letterSpacing:".08em",marginTop:2}}>LIVE FINANCIAL DASHBOARD</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {lastUpdate && <span style={{fontSize:10,color:"#4A7A7A"}}>Update: {lastUpdate}</span>}
          {connOk===true  && <span style={{display:"flex",alignItems:"center",gap:4,color:"#4CAF50",fontSize:11,fontWeight:600}}><CheckCircle size={13}/>Live</span>}
          {connOk===false && <span style={{display:"flex",alignItems:"center",gap:4,color:"#FF6B6B",fontSize:11}}><AlertCircle size={13}/>Error</span>}
          <button onClick={fetchAll} style={{background:"#1A3A3A",border:"1px solid #2D5555",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#7AADAD",display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'Sora',sans-serif"}}>
            <RefreshCw size={13} className={loading?"spin":""}/> Refresh
          </button>
        </div>
      </div>

      {/* ERROR */}
      {err && (
        <div style={{background:"#3A1A1A",borderBottom:"1px solid #FF6B6B33",padding:"10px 20px",display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#FF6B6B"}}>
          <AlertCircle size={14}/> {err}
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div style={{padding:"40px 20px",textAlign:"center",color:"#7AADAD"}}>
          <RefreshCw size={28} color="#C9A84C" className="spin" style={{margin:"0 auto 12px",display:"block"}}/>
          <div style={{fontSize:13}}>Memuat data dari Supabase...</div>
        </div>
      )}

      {!loading && (
        <div style={{padding:"18px 20px",maxWidth:1200,margin:"0 auto"}} className="fade">

          {/* SUMMARY CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[
              {label:"Total Pemasukan",  val:formatRp(totalMasuk),  icon:<TrendingUp size={16}/>,  color:"#C9A84C", sub:`${jurnal.filter(j=>j.kategori==="PEMASUKAN").length} transaksi`},
              {label:"Total Pengeluaran",val:formatRp(totalKeluar), icon:<TrendingDown size={16}/>, color:"#E07B54", sub:`${jurnal.filter(j=>j.kategori!=="PEMASUKAN").length} transaksi`},
              {label:"Net Cash Flow",    val:formatRp(net),         icon:<Wallet size={16}/>,       color:net>=0?"#4CAF50":"#FF6B6B", sub:net>=0?"Surplus":"Defisit"},
              {label:"Karyawan Aktif",   val:aktif+" orang",        icon:<Users size={16}/>,        color:"#2D9DAD", sub:"Staff aktif periode ini"},
            ].map((c,i)=>(
              <div key={i} className="card" style={{padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:"#7AADAD",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>{c.label}</div>
                    <div style={{fontSize:16,fontWeight:700,color:c.color,fontFamily:"Playfair Display,serif",wordBreak:"break-word"}}>{c.val}</div>
                    <div style={{fontSize:10,color:"#4A7A7A",marginTop:3}}>{c.sub}</div>
                  </div>
                  <div style={{background:c.color+"22",padding:8,borderRadius:8,color:c.color,flexShrink:0,marginLeft:8}}>{c.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* BEP TRACKER */}
          <div className="card" style={{padding:"13px 18px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div style={{fontSize:11,color:"#7AADAD"}}>
                Progress BEP → <span style={{color:"#C9A84C",fontWeight:700}}>{formatRp(BEP)}</span>
                <span style={{fontSize:10,color:"#4A7A7A",marginLeft:8}}>Target periode 26 Mar–25 Apr 2026</span>
              </div>
              <span style={{fontSize:18,fontWeight:900,fontFamily:"Playfair Display,serif",color:bepPct>=100?"#4CAF50":"#C9A84C"}}>{bepPct}%</span>
            </div>
            <div style={{height:8,background:"#1A3A3A",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${bepPct}%`,background:"linear-gradient(90deg,#2D7D7D,#C9A84C)",borderRadius:4,transition:"width 1s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{fontSize:10,color:"#4A7A7A"}}>Tercapai: {formatRp(totalMasuk)}</span>
              <span style={{fontSize:10,color:"#E07B54"}}>Sisa: {formatRp(Math.max(0,BEP-totalMasuk))}</span>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div className="card" style={{padding:"15px 18px"}}>
              <div style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14,marginBottom:12}}>Breakdown Kategori</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={katData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3A3A55"/>
                  <XAxis dataKey="name" tick={{fill:"#7AADAD",fontSize:8}} interval={0} angle={-25} textAnchor="end" height={45}/>
                  <YAxis tickFormatter={v=>`${(v/1000000).toFixed(1)}M`} tick={{fill:"#7AADAD",fontSize:8}}/>
                  <Tooltip formatter={v=>formatRp(v)} contentStyle={{background:"#0F2E2E",border:"1px solid #1A5F5F55",borderRadius:8,color:"#E8F4F4",fontSize:11}}/>
                  <Bar dataKey="nilai" radius={[4,4,0,0]}>
                    {katData.map((d,i)=><Cell key={i} fill={KAT_COLOR[d.key]||"#2D7D7D"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{padding:"15px 18px"}}>
              <div style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14,marginBottom:12}}>Tren Penjualan Harian</div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3A3A55"/>
                  <XAxis dataKey="tgl" tick={{fill:"#7AADAD",fontSize:8}}/>
                  <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}K`} tick={{fill:"#7AADAD",fontSize:8}}/>
                  <Tooltip formatter={v=>formatRp(v)} contentStyle={{background:"#0F2E2E",border:"1px solid #1A5F5F55",borderRadius:8,color:"#E8F4F4",fontSize:11}}/>
                  <Line type="monotone" dataKey="nilai" stroke="#C9A84C" strokeWidth={2.5} dot={{fill:"#C9A84C",r:3}} activeDot={{r:5}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OPEX MINI CARDS */}
          {opex.length > 0 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
              {opex.map((o,i)=>{
                const pct = o.anggaran>0?Math.round(o.aktual/o.anggaran*100):0;
                const over = o.aktual > o.anggaran;
                return (
                  <div key={i} className="card" style={{padding:"10px 13px"}}>
                    <div style={{fontSize:9,color:"#7AADAD",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>{o.kategori}</div>
                    <div style={{fontSize:13,fontWeight:700,color:over?"#FF6B6B":"#E8F4F4"}}>{formatRp(o.aktual)}</div>
                    <div style={{fontSize:9,color:"#4A7A7A",marginTop:2}}>dari {formatRp(o.anggaran)}</div>
                    <div style={{height:3,background:"#1A3A3A",borderRadius:2,marginTop:6,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:over?"#FF6B6B":"#C9A84C",borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:9,color:over?"#FF6B6B":"#4CAF50",marginTop:3,fontWeight:600}}>{over?"⚠️ Over":"✅ OK"} {pct}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABS */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {[
              ["jurnal","📒 Jurnal"],
              ["karyawan","👥 Karyawan"],
              ["stok","📦 Stok Bar"],
              ["stok_kit","🍳 Stok Kitchen"],
            ].map(([k,l])=>(
              <button key={k} className={`tab ${tab===k?"ton":"toff"}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {/* TABLE JURNAL */}
          {tab==="jurnal" && (
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1A3A3A",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14}}>Jurnal Harian</span>
                <span style={{fontSize:11,color:"#7AADAD"}}>{jurnal.length} transaksi</span>
              </div>
              <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
                <table>
                  <thead><tr><th>Tanggal</th><th>No TRX</th><th>Keterangan</th><th>Kategori</th><th style={{textAlign:"right"}}>Debit</th><th style={{textAlign:"right"}}>Kredit</th></tr></thead>
                  <tbody>
                    {jurnal.map((r,i)=>(
                      <tr key={i}>
                        <td style={{color:"#7AADAD",whiteSpace:"nowrap"}}>{r.tanggal}</td>
                        <td style={{color:"#4A7A7A",fontSize:11}}>{r.no_trx}</td>
                        <td style={{fontWeight:500,maxWidth:200}}>{r.keterangan}</td>
                        <td><span className="badge" style={{background:(KAT_COLOR[r.kategori]||"#2D7D7D")+"22",color:KAT_COLOR[r.kategori]||"#2D7D7D"}}>{(r.kategori||"").replace(/_/g," ")}</span></td>
                        <td style={{textAlign:"right",color:"#C9A84C",fontWeight:r.debit>0?700:400,whiteSpace:"nowrap"}}>{r.debit>0?formatRp(r.debit):"—"}</td>
                        <td style={{textAlign:"right",color:"#E07B54",fontWeight:r.kredit>0?700:400,whiteSpace:"nowrap"}}>{r.kredit>0?formatRp(r.kredit):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE KARYAWAN */}
          {tab==="karyawan" && (
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1A3A3A"}}>
                <span style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14}}>Karyawan & Gaji — Periode 26 Mar–25 Apr 2026</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr><th>Nama</th><th>Jabatan</th><th>Status</th><th style={{textAlign:"right"}}>Gaji Pokok</th><th style={{textAlign:"right"}}>Uang Makan</th><th style={{textAlign:"right"}}>Total Gaji</th><th style={{textAlign:"right"}}>Kasbon</th><th style={{textAlign:"right"}}>Net Gaji</th></tr></thead>
                  <tbody>
                    {gajiRows.map((r,i)=>(
                      <tr key={i}>
                        <td style={{fontWeight:700}}>{r.nama}</td>
                        <td style={{color:"#7AADAD"}}>{r.jabatan}</td>
                        <td><span className="badge" style={r.status==="aktif"?{background:"#1A4A2A",color:"#4CAF50"}:{background:"#3A1A1A",color:"#FF6B6B"}}>{r.status}</span></td>
                        <td style={{textAlign:"right"}}>{r.gaji_pokok?formatRp(r.gaji_pokok):"—"}</td>
                        <td style={{textAlign:"right"}}>{r.uang_makan?formatRp(r.uang_makan):"—"}</td>
                        <td style={{textAlign:"right"}}>{r.total_gaji?formatRp(r.total_gaji):"—"}</td>
                        <td style={{textAlign:"right",color:"#E07B54"}}>{r.kasbon>0?formatRp(r.kasbon):"—"}</td>
                        <td style={{textAlign:"right",color:"#C9A84C",fontWeight:700}}>{r.net_gaji?formatRp(r.net_gaji):"—"}</td>
                      </tr>
                    ))}
                    <tr style={{background:"#1A3A3A"}}>
                      <td colSpan={5} style={{fontWeight:700,color:"#C9A84C"}}>TOTAL</td>
                      <td style={{textAlign:"right",fontWeight:700,color:"#C9A84C"}}>{formatRp(gajiRows.reduce((s,r)=>s+(r.total_gaji||0),0))}</td>
                      <td style={{textAlign:"right",color:"#E07B54",fontWeight:700}}>{formatRp(gajiRows.reduce((s,r)=>s+(r.kasbon||0),0))}</td>
                      <td style={{textAlign:"right",color:"#C9A84C",fontWeight:700}}>{formatRp(gajiRows.reduce((s,r)=>s+(r.net_gaji||0),0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE STOK BAR */}
          {tab==="stok" && (
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1A3A3A",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14}}>☕ Stok Bahan Bar</span>
                <span style={{fontSize:11,color:"#7AADAD"}}>{stokBar.length} item</span>
              </div>
              <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
                <table>
                  <thead><tr><th>Nama Bahan</th><th>Satuan</th><th style={{textAlign:"right"}}>Stok Awal</th><th style={{textAlign:"right"}}>Masuk</th><th style={{textAlign:"right"}}>Keluar</th><th style={{textAlign:"right"}}>Sisa Stok</th><th>Status</th></tr></thead>
                  <tbody>
                    {stokBar.map((r,i)=>{
                      const low = r.sisa_stok <= 0.5;
                      return (
                        <tr key={i}>
                          <td style={{fontWeight:500}}>{r.nama_bahan}</td>
                          <td style={{color:"#7AADAD"}}>{r.satuan}</td>
                          <td style={{textAlign:"right"}}>{r.stok_awal}</td>
                          <td style={{textAlign:"right",color:"#4CAF50"}}>{r.masuk>0?`+${r.masuk}`:"—"}</td>
                          <td style={{textAlign:"right",color:"#E07B54"}}>{r.keluar>0?`-${r.keluar}`:"—"}</td>
                          <td style={{textAlign:"right",fontWeight:700,color:low?"#FF6B6B":"#C9A84C"}}>{r.sisa_stok}</td>
                          <td><span className="badge" style={low?{background:"#3A1A1A",color:"#FF6B6B"}:{background:"#1A4A2A",color:"#4CAF50"}}>{low?"⚠️ Habis":"✅ Ada"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE STOK KITCHEN */}
          {tab==="stok_kit" && (
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1A3A3A",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:"Playfair Display,serif",color:"#C9A84C",fontSize:14}}>🍳 Stok Bahan Kitchen</span>
                <span style={{fontSize:11,color:"#7AADAD"}}>{stokKit.length} item</span>
              </div>
              <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
                <table>
                  <thead><tr><th>Nama Bahan</th><th>Satuan</th><th style={{textAlign:"right"}}>Stok Awal</th><th style={{textAlign:"right"}}>Masuk</th><th style={{textAlign:"right"}}>Keluar</th><th style={{textAlign:"right"}}>Sisa Stok</th><th>Status</th></tr></thead>
                  <tbody>
                    {stokKit.map((r,i)=>{
                      const low = r.sisa_stok <= 0;
                      return (
                        <tr key={i}>
                          <td style={{fontWeight:500}}>{r.nama_bahan}</td>
                          <td style={{color:"#7AADAD"}}>{r.satuan}</td>
                          <td style={{textAlign:"right"}}>{r.stok_awal}</td>
                          <td style={{textAlign:"right",color:"#4CAF50"}}>{r.masuk>0?`+${r.masuk}`:"—"}</td>
                          <td style={{textAlign:"right",color:"#E07B54"}}>{r.keluar>0?`-${r.keluar}`:"—"}</td>
                          <td style={{textAlign:"right",fontWeight:700,color:low?"#FF6B6B":"#C9A84C"}}>{r.sisa_stok}</td>
                          <td><span className="badge" style={low?{background:"#3A1A1A",color:"#FF6B6B"}:{background:"#1A4A2A",color:"#4CAF50"}}>{low?"⚠️ Habis":"✅ Ada"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div style={{textAlign:"center",marginTop:20,paddingTop:14,borderTop:"1px solid #1A3A3A",fontSize:10,color:"#4A7A7A"}}>
            <span style={{fontFamily:"Playfair Display,serif",color:"#C9A84C44",fontSize:14}}>Cleco Pii</span>
            {" · "}JL Nusantara Raya No 214 Beji, Depok{" · "}@cleco.pii
            <div style={{marginTop:4,color:"#2D5555",fontSize:9}}>Connected to Supabase · {jurnal.length} jurnal · {stok.length} stok items</div>
          </div>
        </div>
      )}
    </div>
  );
}
