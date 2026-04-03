import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area, Cell } from "recharts";

// ── Production Data (single-call only, dev multi-call excluded) ──
const PROD_DATA = [
  { cost:0.0050255, cacheHit:false, promptTokens:16442 },
  { cost:0.00451925, cacheHit:false, promptTokens:14747 },
  { cost:0.006604, cacheHit:true, promptTokens:22472 },
  { cost:0.006783, cacheHit:false, promptTokens:23116 },
  { cost:0.007789, cacheHit:true, promptTokens:27110 },
  { cost:0.00402875, cacheHit:true, promptTokens:15149 },
  { cost:0.008654, cacheHit:true, promptTokens:29920 },
  { cost:0.008254, cacheHit:false, promptTokens:30869 },
  { cost:0.008724, cacheHit:false, promptTokens:30518 },
  { cost:0.008037, cacheHit:true, promptTokens:29452 },
  { cost:0.007617, cacheHit:true, promptTokens:23363 },
];
const DEFAULT_COST_CENT = (PROD_DATA.reduce((s,d)=>s+d.cost,0) / PROD_DATA.length * 100); // ~0.69¢

// ── Plan defaults ──
const PLAN_DEFAULTS = [
  { key:"free",       name:"Free",       price:0,    credits:500,   branches:1,  overage:0,     color:"#94A3B8", tag:"Demo" },
  { key:"starter",    name:"Starter",    price:199,  credits:6000,  branches:1,  overage:0.040, color:"#3B82F6", tag:"Tek Şube" },
  { key:"growth",     name:"Growth",     price:549,  credits:18000, branches:3,  overage:0.035, color:"#8B5CF6", tag:"Büyüyen Zincir" },
  { key:"enterprise", name:"Enterprise", price:1499, credits:52000, branches:10, overage:0.035, color:"#F59E0B", tag:"Büyük Operasyon" },
];

const PACKS = [
  { name:"S", credits:1000, price:34.99 },
  { name:"M", credits:3000, price:94.99 },
  { name:"L", credits:5000, price:149.99 },
  { name:"XL", credits:10000, price:279.99 },
];

const C = {
  bg:"#0B0F1A", card:"#111827", border:"#1E293B",
  cyan:"#22D3EE", cyanDim:"rgba(34,211,238,0.12)",
  green:"#34D399", greenDim:"rgba(52,211,153,0.12)",
  amber:"#FBBF24", amberDim:"rgba(251,191,36,0.12)",
  red:"#F87171", redDim:"rgba(248,113,113,0.12)",
  purple:"#A78BFA",
  blue:"#3B82F6", blueDim:"rgba(59,130,246,0.12)",
  text:"#E2E8F0", dim:"#64748B", muted:"#475569",
};
const ttip={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.text};

function Metric({label,value,sub,color=C.cyan,small}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:small?"14px 16px":"18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}}/>
      <div style={{color:C.dim,fontSize:small?10:11,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:small?4:6}}>{label}</div>
      <div style={{color:C.text,fontSize:small?20:26,fontWeight:700,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{value}</div>
      {sub&&<div style={{color:C.dim,fontSize:small?10:11,marginTop:2}}>{sub}</div>}
    </div>
  );
}
function Sl({label,value,onChange,min,max,step,unit,color=C.cyan}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{color:C.dim,fontSize:12,minWidth:155,fontWeight:500}}>{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:color,height:6}}/>
      <div style={{color,fontWeight:700,fontFamily:"monospace",fontSize:16,minWidth:56,textAlign:"right"}}>{value}{unit||""}</div>
    </div>
  );
}
function Badge({children,color}){return <span style={{background:color+"22",color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,whiteSpace:"nowrap"}}>{children}</span>;}
function Section({title,sub,children}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:20}}>
      {title&&<div style={{marginBottom:16}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{title}</h3>
        {sub&&<p style={{color:C.dim,fontSize:12,margin:"3px 0 0",lineHeight:1.5}}>{sub}</p>}
      </div>}
      {children}
    </div>
  );
}
function TabBtn({active,onClick,children}){
  return <button onClick={onClick} style={{
    background:active?C.cyanDim:"transparent",color:active?C.cyan:C.dim,
    border:`1px solid ${active?C.cyan:C.border}`,borderRadius:8,
    padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
  }}>{children}</button>;
}

export default function GustuPricing(){
  const [tab,setTab]=useState("scenario");
  const [costCent,setCostCent]=useState(+DEFAULT_COST_CENT.toFixed(2));
  const COST = costCent / 100;
  const [tables,setTables]=useState(20);
  const [adoption,setAdoption]=useState(50);
  const [tps,setTps]=useState(5);
  const [wdL,setWdL]=useState(1.5);
  const [wdD,setWdD]=useState(1.5);
  const [weL,setWeL]=useState(2.5);
  const [weD,setWeD]=useState(2.5);
  const [numBranches,setNumBranches]=useState(1);

  // Plan pricing state
  const [starterPrice,setStarterPrice]=useState(199);
  const [starterCredits,setStarterCredits]=useState(6000);
  const [growthPrice,setGrowthPrice]=useState(549);
  const [growthCredits,setGrowthCredits]=useState(18000);
  const [entPrice,setEntPrice]=useState(1499);
  const [entCredits,setEntCredits]=useState(52000);

  const PLANS = useMemo(()=>[
    { ...PLAN_DEFAULTS[0] },
    { ...PLAN_DEFAULTS[1], price:starterPrice, credits:starterCredits },
    { ...PLAN_DEFAULTS[2], price:growthPrice, credits:growthCredits },
    { ...PLAN_DEFAULTS[3], price:entPrice, credits:entCredits },
  ],[starterPrice,starterCredits,growthPrice,growthCredits,entPrice,entCredits]);

  const calc=useMemo(()=>{
    const a=adoption/100;
    const wdT=wdL+wdD, weT=weL+weD;
    const wdG=tables*wdT, weG=tables*weT;
    const wdSe=Math.round(wdG*a), weSe=Math.round(weG*a);
    const wdCr=Math.round(wdSe*tps), weCr=Math.round(weSe*tps);
    const mWd=wdCr*22, mWe=weCr*8;
    const perBranch=mWd+mWe;
    const mTotal=perBranch*numBranches;
    const mSessions=(wdSe*22+weSe*8)*numBranches;
    const mLLM=mTotal*COST;

    const plans=PLANS.map(p=>{
      const branchOk=numBranches<=p.branches;
      const ov=branchOk?Math.max(0,mTotal-p.credits):0;
      const rev=branchOk?p.price+ov*p.overage:0;
      const profit=branchOk?rev-mLLM:0;
      const margin=rev>0?(profit/rev*100):-100;
      const usage=p.credits>0?(mTotal/p.credits*100):999;
      return{...p,branchOk,ov,rev:+rev.toFixed(2),profit:+profit.toFixed(2),margin:+margin.toFixed(1),usage:+usage.toFixed(0)};
    });

    const rec=plans.filter(p=>p.key!=="free"&&p.branchOk&&p.usage<=110).sort((a,b)=>a.price-b.price)[0]||plans.find(p=>p.key==="enterprise");

    return{wdT,weT,wdG,weG,wdSe,weSe,wdCr,weCr,mWd,mWe,perBranch,mTotal,mSessions,mLLM,plans,rec};
  },[tables,adoption,tps,wdL,wdD,weL,weD,numBranches,COST,PLANS]);

  const weeklyData=useMemo(()=>
    ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((d,i)=>{
      const we=i>=5;
      return{day:d,credits:(we?calc.weCr:calc.wdCr)*numBranches,cost:+((we?calc.weCr:calc.wdCr)*numBranches*COST).toFixed(2)};
    }),[calc,numBranches,COST]);

  // ── TAB: Restoran Senaryosu ──
  const renderScenario=()=>(
    <>
      <Section title="Restoran Parametreleri" sub={`${tables} masa × ${numBranches} şube · %${adoption} adoption · ${tps} turn/session`}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <div style={{color:C.cyan,fontSize:11,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>Genel Ayarlar</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Sl label="Masa Sayısı" value={tables} onChange={setTables} min={5} max={60} step={1}/>
              <Sl label="Şube Sayısı" value={numBranches} onChange={setNumBranches} min={1} max={10} step={1} color={C.purple}/>
              <Sl label="Chatbot Kullanım Oranı" value={adoption} onChange={setAdoption} min={10} max={90} step={5} unit="%" color={C.green}/>
              <Sl label="Session Başı Ort. Turn" value={tps} onChange={setTps} min={1} max={8} step={0.5} color={C.amber}/>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <div style={{color:C.blue,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                Hafta İçi <Badge color={C.blue}>22 gün/ay</Badge>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Sl label="Öğle Masa Devir Hızı" value={wdL} onChange={setWdL} min={0.5} max={4} step={0.5} unit="x" color={C.blue}/>
                <Sl label="Akşam Masa Devir Hızı" value={wdD} onChange={setWdD} min={0.5} max={4} step={0.5} unit="x" color={C.blue}/>
              </div>
            </div>
            <div>
              <div style={{color:C.amber,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                Hafta Sonu <Badge color={C.amber}>8 gün/ay</Badge>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Sl label="Öğle Masa Devir Hızı" value={weL} onChange={setWeL} min={0.5} max={5} step={0.5} unit="x" color={C.amber}/>
                <Sl label="Akşam Masa Devir Hızı" value={weD} onChange={setWeD} min={0.5} max={5} step={0.5} unit="x" color={C.amber}/>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Daily cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {[
          {label:"Hafta İçi",sub:"Pzt-Cum",color:C.blue,t:calc.wdT,g:calc.wdG,s:calc.wdSe,cr:calc.wdCr},
          {label:"Hafta Sonu",sub:"Cmt-Paz",color:C.amber,t:calc.weT,g:calc.weG,s:calc.weSe,cr:calc.weCr},
        ].map(d=>(
          <div key={d.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{color:d.color,fontSize:14,fontWeight:700}}>{d.label} (Günlük/Şube)</div><div style={{color:C.dim,fontSize:11}}>{d.sub}</div></div>
              <Badge color={d.color}>{d.t}x devir</Badge>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[
                {l:"Müşteri Grubu",v:d.g,i:`${tables}×${d.t}`,c:C.text},
                {l:"Chatbot Session",v:d.s,i:`%${adoption}`,c:C.green},
                {l:"Credit/Gün",v:d.cr,i:`${d.s}×${tps}`,c:C.cyan},
              ].map(m=>(
                <div key={m.l} style={{background:C.bg,borderRadius:8,padding:12,textAlign:"center"}}>
                  <div style={{color:C.dim,fontSize:10,marginBottom:2}}>{m.l}</div>
                  <div style={{color:m.c,fontSize:22,fontWeight:700,fontFamily:"monospace"}}>{m.v}</div>
                  <div style={{color:C.dim,fontSize:10}}>{m.i}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <Metric label="Credit / Şube / Ay" value={calc.perBranch.toLocaleString()} sub={`hİ: ${calc.mWd.toLocaleString()} + hS: ${calc.mWe.toLocaleString()}`} color={C.cyan} small/>
        <Metric label="Toplam Credit / Ay" value={calc.mTotal.toLocaleString()} sub={`${numBranches} şube × ${calc.perBranch.toLocaleString()}`} color={C.purple} small/>
        <Metric label="Toplam Session / Ay" value={calc.mSessions.toLocaleString()} color={C.green} small/>
        <Metric label="LLM Maliyet / Ay" value={`$${calc.mLLM.toFixed(2)}`} sub={`${costCent.toFixed(2)}¢ ($${(COST).toFixed(4)})/turn`} color={C.red} small/>
        <Metric label="Önerilen Plan" value={calc.rec?.name||"—"} sub={calc.rec?`$${calc.rec.price}/ay · %${calc.rec.margin} marjin`:""} color={calc.rec?.color||C.dim} small/>
      </div>

      {/* Weekly chart */}
      <Section title="Haftalık Dağılım" sub={`${numBranches} şube toplam — hafta sonu farkı belirgin`}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{top:5,right:20,bottom:5,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="day" tick={{fill:C.dim,fontSize:12,fontWeight:600}}/>
            <YAxis tick={{fill:C.dim,fontSize:11}}/>
            <Tooltip contentStyle={ttip}/>
            <Bar dataKey="credits" name="Credit" radius={[4,4,0,0]}>
              {weeklyData.map((d,i)=><Cell key={i} fill={i>=5?C.amber:C.cyan} opacity={0.85}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </>
  );

  // ── TAB: Plan Uyumu ──
  const renderPlans=()=>(
    <>
      {/* Recommendation */}
      {calc.rec&&(
        <div style={{background:calc.rec.color+"18",border:`1px solid ${calc.rec.color}44`,borderRadius:12,padding:"16px 24px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{background:calc.rec.color,color:C.bg,width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16}}>✓</div>
            <div>
              <div style={{color:calc.rec.color,fontSize:15,fontWeight:700}}>Önerilen: {calc.rec.name} — ${calc.rec.price}/ay</div>
              <div style={{color:C.dim,fontSize:12}}>{numBranches} şube · {calc.mTotal.toLocaleString()} credit ihtiyacı · {calc.rec.credits.toLocaleString()} dahil · max {calc.rec.branches} şube</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:C.text,fontSize:24,fontWeight:700,fontFamily:"monospace"}}>${calc.rec.price}</div>
            <div style={{color:C.green,fontSize:12,fontWeight:600}}>%{calc.rec.margin} marjin</div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {calc.plans.map(p=>{
          const isRec=calc.rec?.key===p.key;
          const over=p.usage>100;
          return(
            <div key={p.key} style={{background:C.card,border:`1px solid ${isRec?p.color:C.border}`,borderRadius:12,padding:20,position:"relative",overflow:"hidden",opacity:!p.branchOk?0.35:p.key==="free"?0.5:1}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:p.color}}/>
              {isRec&&<div style={{position:"absolute",top:10,right:10}}><Badge color={p.color}>ÖNERİLEN</Badge></div>}

              <div style={{color:p.color,fontSize:13,fontWeight:700,marginBottom:2}}>{p.name}</div>
              <div style={{color:C.dim,fontSize:10,marginBottom:8}}>{p.tag}</div>
              <div style={{color:C.text,fontSize:24,fontWeight:700,fontFamily:"monospace"}}>${p.price}<span style={{fontSize:12,color:C.dim}}>/ay</span></div>

              {/* Key specs */}
              <div style={{margin:"12px 0",padding:"10px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:11}}>
                <div>
                  <div style={{color:C.dim,fontSize:9}}>Credit</div>
                  <div style={{color:C.text,fontFamily:"monospace",fontWeight:600}}>{p.credits.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{color:C.dim,fontSize:9}}>Max Şube</div>
                  <div style={{color:numBranches>p.branches?C.red:C.text,fontFamily:"monospace",fontWeight:600}}>
                    {p.branches} {!p.branchOk&&"❌"}
                  </div>
                </div>
                <div>
                  <div style={{color:C.dim,fontSize:9}}>¢/Credit</div>
                  <div style={{color:C.green,fontFamily:"monospace",fontWeight:600}}>{p.price>0?(p.price/p.credits*100).toFixed(1):"—"}¢</div>
                </div>
              </div>

              {!p.branchOk?(
                <div style={{background:C.redDim,borderRadius:6,padding:"8px 10px",fontSize:10,color:C.red,textAlign:"center"}}>
                  {numBranches} şube için yetersiz (max {p.branches})
                </div>
              ):(
                <>
                  {/* Usage bar */}
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4}}>
                      <span style={{color:C.dim}}>Kullanım</span>
                      <span style={{color:over?C.red:C.text,fontWeight:600}}>{Math.min(p.usage,999)}%</span>
                    </div>
                    <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(p.usage,100)}%`,borderRadius:3,background:over?C.red:p.usage>80?C.amber:C.green}}/>
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
                    <div><div style={{color:C.dim,fontSize:9}}>Gelir</div><div style={{color:C.text,fontFamily:"monospace",fontWeight:600}}>${p.rev}</div></div>
                    <div><div style={{color:C.dim,fontSize:9}}>LLM Maliyet</div><div style={{color:C.red,fontFamily:"monospace",fontWeight:600}}>${calc.mLLM.toFixed(2)}</div></div>
                    <div><div style={{color:C.dim,fontSize:9}}>Kâr</div><div style={{color:p.profit>0?C.green:C.red,fontFamily:"monospace",fontWeight:600}}>${p.profit}</div></div>
                    <div><div style={{color:C.dim,fontSize:9}}>Marjin</div><div style={{color:p.margin>50?C.green:p.margin>20?C.amber:C.red,fontFamily:"monospace",fontWeight:700}}>%{p.margin}</div></div>
                  </div>

                  {p.ov>0&&p.key!=="free"&&(
                    <div style={{marginTop:10,background:C.amberDim,borderRadius:6,padding:"6px 10px",fontSize:10,color:C.amber}}>
                      ⚠ {p.ov.toLocaleString()} aşım → overage ${p.overage}/cr
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Packs */}
      <Section title="Credit Pack'ler" sub="Dahil credit yetmezse ek paket satın alma">
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {PACKS.map(pk=>{
            const llm=pk.credits*COST;
            const margin=((pk.price-llm)/pk.price*100);
            return(
              <div key={pk.name} style={{background:C.bg,borderRadius:10,padding:16,textAlign:"center"}}>
                <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:4}}>{pk.credits.toLocaleString()} Credit</div>
                <div style={{color:C.cyan,fontSize:22,fontWeight:700,fontFamily:"monospace"}}>${pk.price}</div>
                <div style={{color:C.dim,fontSize:10,marginBottom:10}}>{(pk.price/pk.credits*100).toFixed(1)}¢/credit</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
                  <span style={{color:C.dim}}>LLM</span><span style={{color:C.text,fontFamily:"monospace"}}>${llm.toFixed(2)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:6}}>
                  <span style={{color:C.dim}}>Marjin</span><span style={{color:margin>55?C.green:C.amber,fontWeight:700,fontFamily:"monospace"}}>%{margin.toFixed(0)}</span>
                </div>
                <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(margin,100)}%`,borderRadius:2,background:margin>55?C.green:C.amber}}/>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Archetype fit */}
      <Section title="Restoran Tipi × Plan Uyumu" sub="Farklı restoran büyüklükleri hangi plana uyuyor?">
        <div style={{fontSize:11}}>
          <div style={{display:"grid",gridTemplateColumns:"140px 70px 80px repeat(3,1fr)",gap:4,padding:"8px 0",borderBottom:`1px solid ${C.border}`,color:C.dim,fontWeight:700}}>
            <span>Restoran Tipi</span><span>Cr/Ay</span><span>LLM</span>
            {PLANS.filter(p=>p.key!=="free").map(p=><span key={p.key} style={{textAlign:"center",color:p.color}}>{p.name}</span>)}
          </div>
          {[
            {name:"Küçük cafe",tables:10,adopt:40,tps:3.0},
            {name:"Orta restoran",tables:15,adopt:45,tps:3.5},
            {name:"Standart",tables:20,adopt:50,tps:3.5},
            {name:"Büyük",tables:30,adopt:50,tps:4.0},
            {name:"Çok yoğun",tables:40,adopt:55,tps:4.0},
          ].map(arch=>{
            const wd=Math.round(arch.tables*(wdL+wdD)*(arch.adopt/100)*arch.tps);
            const we=Math.round(arch.tables*(weL+weD)*(arch.adopt/100)*arch.tps);
            const cr=wd*22+we*8;
            const llm=cr*COST;
            return(
              <div key={arch.name} style={{display:"grid",gridTemplateColumns:"140px 70px 80px repeat(3,1fr)",gap:4,padding:"10px 0",borderBottom:`1px solid ${C.border}11`,alignItems:"center"}}>
                <span style={{color:C.text,fontWeight:600}}>{arch.name} <span style={{color:C.dim,fontWeight:400}}>({arch.tables}m)</span></span>
                <span style={{color:C.cyan,fontFamily:"monospace"}}>{cr.toLocaleString()}</span>
                <span style={{color:C.red,fontFamily:"monospace"}}>${llm.toFixed(0)}</span>
                {PLANS.filter(p=>p.key!=="free").map(plan=>{
                  const fits=cr<=plan.credits;
                  const margin=plan.price>0?((plan.price-llm)/plan.price*100):0;
                  return(
                    <div key={plan.key} style={{display:"flex",justifyContent:"center",gap:8}}>
                      <span style={{fontFamily:"monospace",color:fits?C.green:C.amber,fontWeight:600}}>{fits?"✓":"⚠"}</span>
                      <span style={{fontFamily:"monospace",color:margin>50?C.green:margin>20?C.amber:C.red}}>%{margin.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );

  // ── TAB: Scale Senaryoları (restoran bazlı, interaktif) ──
  const renderScale=()=>{
    const tableScale=[5,10,15,20,25,30,40,50].map(t=>{
      const a=adoption/100;
      const wdCr=Math.round(t*(wdL+wdD)*a*tps);
      const weCr=Math.round(t*(weL+weD)*a*tps);
      const m=wdCr*22+weCr*8;
      const llm=m*COST;
      const results={tables:t,credits:m,llm:+llm.toFixed(2)};
      PLANS.filter(p=>p.key!=="free").forEach(p=>{
        const ov=Math.max(0,m-p.credits);
        const rev=p.price+ov*p.overage;
        const margin=rev>0?((rev-llm)/rev*100):-100;
        results[`m_${p.key}`]=+margin.toFixed(1);
        results[`r_${p.key}`]=+rev.toFixed(2);
      });
      return results;
    });

    return(
      <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          <Metric label="Credit / Şube / Ay" value={calc.perBranch.toLocaleString()} color={C.cyan} small/>
          <Metric label="LLM Maliyet / Şube" value={`$${(calc.perBranch*COST).toFixed(2)}`} color={C.red} small/>
          <Metric label="LLM Maliyet / Turn" value={`${costCent.toFixed(2)}¢`} sub={`$${COST.toFixed(4)} · ${PROD_DATA.length} prod entry`} color={C.amber} small/>
          <Metric label="Önerilen" value={calc.rec?.name||"—"} sub={`$${calc.rec?.price}/ay`} color={calc.rec?.color} small/>
        </div>

        {/* Margin by table count */}
        <Section title="Masa Sayısına Göre Plan Marjinleri" sub={`1 şube · %${adoption} adoption · ${tps} turn/session`}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={tableScale} margin={{top:5,right:30,bottom:20,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="tables" tick={{fill:C.dim,fontSize:11}} label={{value:"Masa Sayısı",position:"bottom",fill:C.dim,fontSize:11,dy:10}}/>
              <YAxis tick={{fill:C.dim,fontSize:11}} domain={[0,100]} label={{value:"Marjin %",angle:-90,position:"insideLeft",fill:C.dim,fontSize:10}}/>
              <Tooltip contentStyle={ttip}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="m_starter" name={`Starter ($${PLANS[1].price})`} stroke="#3B82F6" strokeWidth={2.5} dot={{r:4}}/>
              <Line type="monotone" dataKey="m_growth" name={`Growth ($${PLANS[2].price})`} stroke="#8B5CF6" strokeWidth={2.5} dot={{r:4}}/>
              <Line type="monotone" dataKey="m_enterprise" name={`Enterprise ($${PLANS[3].price})`} stroke="#F59E0B" strokeWidth={2.5} dot={{r:4}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        {/* Revenue vs Cost */}
        <Section title="Gelir vs LLM Maliyet" sub="Masa sayısı arttıkça plan geliri ve maliyet karşılaştırması">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tableScale} margin={{top:5,right:30,bottom:20,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="tables" tick={{fill:C.dim,fontSize:11}} label={{value:"Masa",position:"bottom",fill:C.dim,fontSize:11,dy:10}}/>
              <YAxis tick={{fill:C.dim,fontSize:11}}/>
              <Tooltip contentStyle={ttip} formatter={v=>`$${v}`}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="llm" name="LLM Maliyet" fill={C.red} opacity={0.5} radius={[4,4,0,0]}/>
              <Bar dataKey="r_starter" name="Starter Gelir" fill="#3B82F6" opacity={0.6} radius={[4,4,0,0]}/>
              <Bar dataKey="r_growth" name="Growth Gelir" fill="#8B5CF6" opacity={0.6} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Multi-branch matrix */}
        <Section title="Çoklu Şube Matrisi" sub={`Her şube: ${tables} masa, ${calc.perBranch.toLocaleString()} credit/ay`}>
          <div style={{fontSize:11}}>
            <div style={{display:"grid",gridTemplateColumns:"50px repeat(3,1fr)",gap:4,padding:"8px 0",borderBottom:`1px solid ${C.border}`,color:C.dim,fontWeight:700}}>
              <span>Şube</span>
              {PLANS.filter(p=>p.key!=="free").map(p=>(
                <span key={p.key} style={{textAlign:"center",color:p.color}}>{p.name} <span style={{fontWeight:400}}>(max {p.branches})</span></span>
              ))}
            </div>
            {[1,2,3,4,5,6,8,10].map(b=>{
              const totalCr=calc.perBranch*b;
              const totalLLM=totalCr*COST;
              return(
                <div key={b} style={{display:"grid",gridTemplateColumns:"50px repeat(3,1fr)",gap:4,padding:"10px 0",borderBottom:`1px solid ${C.border}11`,alignItems:"center"}}>
                  <span style={{color:C.text,fontWeight:700,fontFamily:"monospace"}}>{b}</span>
                  {PLANS.filter(p=>p.key!=="free").map(plan=>{
                    if(b>plan.branches) return <div key={plan.key} style={{textAlign:"center",color:C.muted,fontSize:10}}>max {plan.branches} şube</div>;
                    const ov=Math.max(0,totalCr-plan.credits);
                    const rev=plan.price+ov*plan.overage;
                    const margin=rev>0?((rev-totalLLM)/rev*100):-100;
                    const fits=totalCr<=plan.credits;
                    return(
                      <div key={plan.key} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",textAlign:"center",gap:4}}>
                        <div><div style={{fontFamily:"monospace",fontWeight:600,color:C.text}}>${rev.toFixed(0)}</div><div style={{fontSize:9,color:C.dim}}>gelir</div></div>
                        <div><div style={{fontFamily:"monospace",fontWeight:700,color:margin>50?C.green:margin>20?C.amber:C.red}}>%{margin.toFixed(0)}</div><div style={{fontSize:9,color:C.dim}}>marjin</div></div>
                        <div><div style={{fontFamily:"monospace",fontSize:10,color:fits?C.green:C.amber}}>{fits?"✓":"⚠"}</div><div style={{fontSize:9,color:C.dim}}>{fits?"OK":"aşım"}</div></div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Section>
      </>
    );
  };

  // ── TAB: Mart-Aralık 2026 Projeksiyon (dinamik — plan fiyatları ve LLM cost'a bağlı) ──
  const renderProjection=()=>{
    const M = ["Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    // Fixed: restaurant counts and mix (growth model doesn't change with pricing)
    const nStarter =  [0,2,4,6,10,13,15,18,19,20];
    const nGrowth =   [0,0,1,3,3,5,7,8,8,10];
    const nEnt =      [0,1,1,1,1,1,1,1,2,2];
    const branchArr = [0,6,10,17,21,29,36,41,48,54];
    const turnsArr =  [0,9450,21150,39825,55125,76050,95400,114300,132975,153000];
    const infraArr =  [89,120,120,200,200,200,350,350,350,500];
    const mktArr =    [400,550,700,850,1000,1150,1300,1450,1600,1750];

    let cumProfit = 0;
    const proj = M.map((m,i)=>{
      const restaurants = nStarter[i] + nGrowth[i] + nEnt[i];
      const branches = branchArr[i];
      const turns = turnsArr[i];

      // Revenue from current plan prices
      const sRev = nStarter[i] * starterPrice;
      const gRev = nGrowth[i] * growthPrice;
      const eRev = nEnt[i] * entPrice;
      const mrr = sRev + gRev + eRev;

      // Costs
      const infra = infraArr[i];
      const llm = Math.round(turns * COST);
      const marketing = mktArr[i];
      const totalCost = infra + llm + marketing;

      // Profit
      const ebit = mrr - totalCost;
      const tax = Math.round(Math.max(0, ebit) * 0.20);
      const netProfit = ebit - tax;
      cumProfit += netProfit;

      const grossMargin = mrr > 0 ? (mrr - llm - infra) / mrr : 0;
      const netMargin = mrr > 0 ? netProfit / mrr : 0;
      const arpu = restaurants > 0 ? Math.round(mrr / restaurants) : 0;

      return {
        month:m, m:i+1, restaurants, branches, turns,
        starterRev:sRev, growthRev:gRev, entRev:eRev, mrr,
        infra, selfHost:0, llm, marketing, sales:0,
        totalCost, netProfit, cumProfit,
        grossMargin:+(grossMargin*100).toFixed(1),
        netMargin:+(netMargin*100).toFixed(1),
        arpu,
        operatingCost:infra, variableCost:llm, gtm:marketing,
      };
    });

    // Unit economics — also dynamic
    const ueData = [
      { plan:"Starter", price:starterPrice, credits:starterCredits, branches:1, avgBr:1, cac:250, color:"#3B82F6" },
      { plan:"Growth", price:growthPrice, credits:growthCredits, branches:3, avgBr:2.5, cac:400, color:"#8B5CF6" },
      { plan:"Enterprise", price:entPrice, credits:entCredits, branches:10, avgBr:7, cac:800, color:"#F59E0B" },
    ];
    const unitEcon = ueData.map(u=>{
      const llm = Math.round(u.credits * 0.70 * COST);
      const infraShare = Math.round(7.4 * u.avgBr);
      const totalCost = llm + infraShare;
      const grossProfit = u.price - totalCost;
      const grossMargin = u.price > 0 ? +(grossProfit / u.price * 100).toFixed(1) : 0;
      const ltv = grossProfit > 0 ? Math.round(grossProfit / 0.05) : 0;
      const ltvCac = u.cac > 0 ? +(ltv / u.cac).toFixed(1) : 0;
      return { ...u, arpu:u.price, llm, infraShare, totalCost, grossProfit, grossMargin, churn:5, ltv, ltvCac };
    });

    const criticalPoints = [
      { month:1, label:"Mart", desc:"Ücretsiz pilot: 4 şubeli arkadaş (bar) — veri toplama, feedback", color:C.cyan },
      { month:2, label:"Nisan", desc:"İlk gelir: pilot ödemeye geçiyor (Enterprise) + 2 referans", color:C.green },
      { month:5, label:"Temmuz", desc:"Turist sezonu peak — çok dilli AI asistanın en yüksek değer yarattığı dönem", color:C.amber },
      { month:9, label:"Kasım", desc:"İlk otel grubu (6 şube Enterprise) — segment genişlemesi", color:C.green },
    ];

    return(
      <>
        {/* Summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
          <Metric label="Ara 2026 MRR" value={`$${(proj[9].mrr/1000).toFixed(1)}K`} sub={`ARR: $${(proj[9].mrr*12/1000).toFixed(0)}K`} color={C.green} small/>
          <Metric label="Restoran" value={`${proj[9].restaurants}`} sub={`${proj[9].branches} şube`} color={C.cyan} small/>
          <Metric label="Net Kâr (Ara)" value={`$${(proj[9].netProfit/1000).toFixed(1)}K`} sub={`%${proj[9].netMargin} net marjin`} color={C.green} small/>
          <Metric label="Küm. 10-Ay Kâr" value={`$${(proj[9].cumProfit/1000).toFixed(1)}K`} sub="vergi sonrası" color={C.amber} small/>
          <Metric label="ARPU" value={`$${proj[9].arpu}`} sub="restoran başı" color={C.purple} small/>
          <Metric label="LTV/CAC" value={unitEcon.length>0?`${unitEcon[0].ltvCac}-${unitEcon[2].ltvCac}x`:""} sub="plana göre" color={C.blue} small/>
        </div>

        {/* Source note */}
        <div style={{background:C.blueDim,border:`1px solid ${C.blue}33`,borderRadius:10,padding:"10px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:14}}>📋</span>
          <div style={{color:C.dim,fontSize:11,lineHeight:1.5}}>
            <strong style={{color:C.blue}}>Dinamik:</strong> Plan fiyatları ve LLM maliyeti değiştiğinde tüm hesaplamalar güncellenir.
            Restoran sayıları ve mix sabit (büyüme modeli). Yatırımlı senaryo ayrı model.
          </div>
        </div>

        {/* Revenue vs Cost + Margin */}
        <Section title="Gelir vs Maliyet & Marjin Evrimi" sub="Mart-Aralık 2026 — Mart ücretsiz pilot, Nisan'dan itibaren gelir">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={proj} margin={{top:10,right:30,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
              <YAxis yAxisId="money" tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <YAxis yAxisId="pct" orientation="right" tick={{fill:C.dim,fontSize:10}} domain={[-100,80]} tickFormatter={v=>`${v}%`}/>
              <Tooltip contentStyle={ttip} formatter={(v,name)=>name.includes('%')?`${v}%`:`$${Number(v).toLocaleString()}`}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Area yAxisId="money" type="monotone" dataKey="mrr" name="MRR (Gelir)" fill={C.greenDim} stroke={C.green} strokeWidth={2.5}/>
              <Area yAxisId="money" type="monotone" dataKey="totalCost" name="Toplam Maliyet" fill={C.redDim} stroke={C.red} strokeWidth={2}/>
              <Line yAxisId="pct" type="monotone" dataKey="netMargin" name="Net Marjin %" stroke={C.amber} strokeWidth={2.5} dot={{r:4}}/>
              <Line yAxisId="pct" type="monotone" dataKey="grossMargin" name="Brüt Marjin %" stroke={C.cyan} strokeWidth={1.5} strokeDasharray="5 5" dot={{r:3}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        {/* Stacked cost breakdown */}
        <Section title="Maliyet Bileşenleri" sub="Altyapı + Self-host GPU + LLM API + Pazarlama (satış gideri yok — founder-led)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={proj} margin={{top:5,right:30,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
              <YAxis tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={ttip} formatter={v=>`$${Number(v).toLocaleString()}`}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="operatingCost" name="Altyapı + GPU" stackId="c" fill="#64748B" opacity={0.7}/>
              <Bar dataKey="variableCost" name="LLM API" stackId="c" fill={C.red} opacity={0.6}/>
              <Bar dataKey="gtm" name="Pazarlama (founder-led)" stackId="c" fill={C.purple} opacity={0.6} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          {/* Revenue by plan */}
          <Section title="Gelir Dağılımı (Plan Bazlı)" sub="Starter → Growth → Enterprise evrimi">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={proj} margin={{top:5,right:20,bottom:5,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
                <YAxis tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <Tooltip contentStyle={ttip} formatter={v=>`$${Number(v).toLocaleString()}`}/>
                <Legend wrapperStyle={{fontSize:10}}/>
                <Bar dataKey="starterRev" name="Starter" stackId="r" fill="#3B82F6" opacity={0.7}/>
                <Bar dataKey="growthRev" name="Growth" stackId="r" fill="#8B5CF6" opacity={0.7}/>
                <Bar dataKey="entRev" name="Enterprise" stackId="r" fill="#F59E0B" opacity={0.7} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Cumulative profit */}
          <Section title="Kümülatif Net Kâr" sub={`Toplam birikmiş kâr — ${(()=>{const f=proj.find(p=>p.cumProfit>0);return f?f.month+"'da pozitife geçiyor":"henüz pozitif değil"})()}`}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={proj} margin={{top:5,right:20,bottom:5,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
                <YAxis tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <Tooltip contentStyle={ttip} formatter={v=>`$${Number(v).toLocaleString()}`}/>
                <Area type="monotone" dataKey="cumProfit" name="Kümülatif Kâr" fill={C.greenDim} stroke={C.green} strokeWidth={2.5}/>
                <Bar dataKey="netProfit" name="Aylık Net Kâr" fill={C.cyan} opacity={0.4} radius={[4,4,0,0]}/>
              </ComposedChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Restaurant & branch growth */}
        <Section title="Restoran & Şube Büyümesi" sub="3 restorandan 104'e — ort. şube çarpanı büyüyor">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={proj} margin={{top:5,right:30,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
              <YAxis tick={{fill:C.dim,fontSize:10}}/>
              <Tooltip contentStyle={ttip}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="restaurants" name="Restoran" fill={C.cyan} opacity={0.5} radius={[4,4,0,0]}/>
              <Line type="monotone" dataKey="branches" name="Şube" stroke={C.amber} strokeWidth={2.5} dot={{r:4}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        {/* Critical transition points */}
        <Section title="Kritik Geçiş Noktaları" sub="Altyapı plan geçişleri ve maliyet atlama noktaları">
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {criticalPoints.map((cp,i)=>(
              <div key={i} style={{background:cp.color+"12",border:`1px solid ${cp.color}33`,borderRadius:10,padding:14}}>
                <div style={{color:cp.color,fontSize:13,fontWeight:700,marginBottom:4}}>{cp.label}</div>
                <div style={{color:C.dim,fontSize:11,lineHeight:1.6}}>{cp.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Unit Economics */}
        <Section title="Unit Economics (Plan Bazlı)" sub="LTV/CAC, brüt marjin, müşteri ömrü — LLM + altyapı dahil">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {unitEcon.map(u=>(
              <div key={u.plan} style={{background:C.bg,borderRadius:12,padding:20,border:`1px solid ${u.color}33`}}>
                <div style={{color:u.color,fontSize:15,fontWeight:700,marginBottom:12}}>{u.plan}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:11,marginBottom:14}}>
                  <div><div style={{color:C.dim,fontSize:9}}>ARPU</div><div style={{color:C.text,fontFamily:"monospace",fontWeight:700,fontSize:16}}>${u.arpu}</div></div>
                  <div><div style={{color:C.dim,fontSize:9}}>Brüt Kâr</div><div style={{color:C.green,fontFamily:"monospace",fontWeight:700,fontSize:16}}>${u.grossProfit}</div></div>
                </div>
                <div style={{background:C.card,borderRadius:8,padding:10,marginBottom:12}}>
                  {[
                    {l:"LLM maliyet",v:`$${u.llm}`,c:C.red},
                    {l:"Altyapı payı",v:`$${u.infraShare}`,c:C.muted},
                    {l:"Toplam maliyet",v:`$${u.totalCost}`,c:C.red},
                    {l:"Brüt marjin",v:`%${u.grossMargin}`,c:u.grossMargin>50?C.green:C.amber},
                  ].map(r=>(
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                      <span style={{color:C.dim}}>{r.l}</span><span style={{color:r.c,fontFamily:"monospace",fontWeight:600}}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                  <div style={{background:C.card,borderRadius:8,padding:8}}>
                    <div style={{color:C.dim,fontSize:8}}>LTV</div>
                    <div style={{color:C.green,fontFamily:"monospace",fontWeight:700,fontSize:13}}>${(u.ltv/1000).toFixed(1)}K</div>
                  </div>
                  <div style={{background:C.card,borderRadius:8,padding:8}}>
                    <div style={{color:C.dim,fontSize:8}}>CAC</div>
                    <div style={{color:C.amber,fontFamily:"monospace",fontWeight:700,fontSize:13}}>${u.cac}</div>
                  </div>
                  <div style={{background:u.ltvCac>3?C.greenDim:C.redDim,borderRadius:8,padding:8}}>
                    <div style={{color:C.dim,fontSize:8}}>LTV/CAC</div>
                    <div style={{color:u.ltvCac>3?C.green:C.red,fontFamily:"monospace",fontWeight:700,fontSize:13}}>{u.ltvCac}x</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 12-month detail table */}
        <Section title="Aylık Detay Tablosu" sub="Tüm kalemler — restoran, şube, gelir, maliyet, kâr">
          <div style={{fontSize:10,overflowX:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"55px repeat(12,1fr)",gap:2,padding:"6px 0",borderBottom:`1px solid ${C.border}`,color:C.dim,fontWeight:700}}>
              <span></span>{M.map(m=><span key={m} style={{textAlign:"right"}}>Ay {m}</span>)}
            </div>
            {[
              {label:"Restoran",key:"restaurants",c:C.text},
              {label:"Şube",key:"branches",c:C.cyan},
              {label:"Turn",key:"turns",c:C.dim,fmt:v=>(v/1000).toFixed(0)+"K"},
              {label:"MRR",key:"mrr",c:C.green,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
              {label:"LLM",key:"variableCost",c:C.red,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
              {label:"Altyapı+GPU",key:"operatingCost",c:C.muted,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
              {label:"Pazarlama",key:"gtm",c:C.purple,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
              {label:"Net Kâr",key:"netProfit",c:null,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v<=-1000?(v/1000).toFixed(1)+"K":v)},
              {label:"Net Marj",key:"netMargin",c:null,fmt:v=>v+"%"},
              {label:"Küm. Kâr",key:"cumProfit",c:null,fmt:v=>"$"+(Math.abs(v)>=1000?((v/1000).toFixed(1))+"K":v)},
            ].map(row=>(
              <div key={row.label} style={{display:"grid",gridTemplateColumns:"55px repeat(12,1fr)",gap:2,padding:"5px 0",borderBottom:`1px solid ${C.border}11`,alignItems:"center"}}>
                <span style={{color:C.dim,fontWeight:600,fontSize:9}}>{row.label}</span>
                {proj.map((p,i)=>{
                  const v = p[row.key];
                  const color = row.c || (v>=0?C.green:C.red);
                  return <span key={i} style={{textAlign:"right",fontFamily:"monospace",color,fontWeight:row.key==="netProfit"||row.key==="mrr"?700:400}}>
                    {row.fmt?row.fmt(v):v}
                  </span>;
                })}
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ YATIRIMLI SENARYO ═══ */}
        {(()=>{
          const USD_TL = 38;
          const MONTHLY_RATE = 0.40 / 12;
          // Fixed: restaurant mix per month (growth model)
          const invStarter = [0,8,19,32,43,56,69,84,99,114];
          const invGrowth =  [0,0,0,3,9,17,25,34,44,55];
          const invEnt =     [0,1,1,1,1,1,1,1,2,2];
          const invBr =      [0,12,23,42,68,101,134,171,217,259];
          const invNSales =  [0,3,3,4,4,5,5,6,6,6];
          const invTurns =   [0,18900,44100,88200,142800,212625,282375,359625,456750,545625];
          const invMkt =     [15000,20000,25000,30000,35000,40000,45000,50000,55000,60000];
          const invSales =   [0,150000,150000,200000,200000,250000,250000,300000,300000,300000];
          const FOUNDER_TL = 200000;

          let bank = 5000000;
          const inv = ["Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"].map((m,i)=>{
            const rest = invStarter[i] + invGrowth[i] + invEnt[i];
            const br = invBr[i];
            const nSales = invNSales[i];

            // Revenue from current plan prices → TL
            const mrrUsd = invStarter[i]*starterPrice + invGrowth[i]*growthPrice + invEnt[i]*entPrice;
            const mrrTl = Math.round(mrrUsd * USD_TL);

            // Interest on current bank balance
            const interestTl = Math.round(bank * MONTHLY_RATE);
            bank += interestTl;

            // Costs in TL
            const founderTl = FOUNDER_TL;
            const salesTl = invSales[i];
            const llmTl = Math.round(invTurns[i] * COST * USD_TL);
            const infraUsd = br<=10?120:br<=25?200:br<=50?350:br<=100?600:br<=200?900:1200;
            const infraTl = Math.round(infraUsd * USD_TL);
            const mktTl = invMkt[i];
            const costTl = founderTl + salesTl + infraTl + llmTl + mktTl;

            // Profit
            const bizProfit = mrrTl - costTl;
            const taxTl = Math.round(Math.max(0, bizProfit) * 0.20);
            const netBiz = bizProfit - taxTl;
            bank += netBiz;

            const netTl = interestTl + netBiz;
            const capital = bank;

            return {month:m,rest,br,nSales,mrrTl,founderTl,interestTl,salesTl,infraTl,llmTl,mktTl,costTl,bizProfit,taxTl,netBiz,netTl,capital};
          });
          return(
            <>
              <div style={{marginTop:32,marginBottom:8,padding:"14px 20px",background:C.amberDim,border:`1px solid ${C.amber}44`,borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22}}>💰</span>
                <div>
                  <div style={{color:C.amber,fontSize:15,fontWeight:700}}>Yatırımlı Senaryo: 5M TL + %40 Faiz + Satış Ekibi + Founder Maaş</div>
                  <div style={{color:C.dim,fontSize:11}}>2 founder × 100K TL/ay + Satışçı 50K TL/ay · İşe alım: Nis 3, Haz +1, Ağu +1, Eki +1 (max 6) · %40 yıllık faiz (%3.33/ay)</div>
                </div>
              </div>

              {/* Investment summary cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
                <Metric label="Ara MRR" value={`${(inv[9].mrrTl/1000).toFixed(0)}K TL`} sub={`$${(inv[9].mrrTl/USD_TL/1000).toFixed(1)}K · ARR $${(inv[9].mrrTl/USD_TL*12/1000).toFixed(0)}K`} color={C.green} small/>
                <Metric label="Restoran" value={`${inv[9].rest}`} sub={`${inv[9].br} şube`} color={C.cyan} small/>
                <Metric label="Banka" value={`${(inv[9].capital/1_000_000).toFixed(1)}M TL`} sub={`dip: ${(Math.min(...inv.map(d=>d.capital))/1_000_000).toFixed(1)}M`} color={C.amber} small/>
                <Metric label="Personel/Ay" value={`${((inv[9].founderTl+inv[9].salesTl)/1000).toFixed(0)}K TL`} sub={`2 founder + ${inv[9].nSales} satışçı`} color={C.purple} small/>
                <Metric label="Faiz Geliri" value={`${(inv.reduce((s,d)=>s+d.interestTl,0)/1_000_000).toFixed(1)}M TL`} sub="10 ay toplam" color={C.green} small/>
                <Metric label="Vergi" value={`${(inv.reduce((s,d)=>s+d.taxTl,0)/1000).toFixed(0)}K TL`} sub="10 ay toplam (%20)" color={C.red} small/>
              </div>

              {/* Capital + MRR chart */}
              <Section title="Banka & MRR Evrimi" sub="Banka ilk 3 ay düşüyor (burn), Temmuz'da toparlanıyor. Faiz bakiye üzerinden hesaplanıyor.">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={inv} margin={{top:10,right:30,bottom:5,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
                    <YAxis yAxisId="capital" tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`${(v/1_000_000).toFixed(1)}M`}/>
                    <YAxis yAxisId="mrr" orientation="right" tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                    <Tooltip contentStyle={ttip} formatter={v=>`${Number(v).toLocaleString()} TL`}/>
                    <Legend wrapperStyle={{fontSize:10}}/>
                    <Area yAxisId="capital" type="monotone" dataKey="capital" name="Banka Bakiyesi (TL)" fill={C.amberDim} stroke={C.amber} strokeWidth={2.5}/>
                    <Line yAxisId="mrr" type="monotone" dataKey="mrrTl" name="MRR (TL)" stroke={C.green} strokeWidth={2.5} dot={{r:4}}/>
                    <Line yAxisId="mrr" type="monotone" dataKey="interestTl" name="Faiz Geliri (TL)" stroke={C.cyan} strokeWidth={1.5} strokeDasharray="5 5" dot={{r:3}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </Section>

              {/* Cost breakdown stacked */}
              <Section title="Gider Bileşenleri (TL)" sub="Founder maaş + satış ekibi + LLM + altyapı + pazarlama + vergi">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inv} margin={{top:5,right:30,bottom:5,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="month" tick={{fill:C.dim,fontSize:10}}/>
                    <YAxis tick={{fill:C.dim,fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                    <Tooltip contentStyle={ttip} formatter={v=>`${Number(v).toLocaleString()} TL`}/>
                    <Legend wrapperStyle={{fontSize:10}}/>
                    <Bar dataKey="founderTl" name="Founder (2×100K)" stackId="c" fill={C.cyan} opacity={0.7}/>
                    <Bar dataKey="salesTl" name="Satış Ekibi" stackId="c" fill={C.purple} opacity={0.7}/>
                    <Bar dataKey="llmTl" name="LLM" stackId="c" fill={C.red} opacity={0.6}/>
                    <Bar dataKey="infraTl" name="Altyapı" stackId="c" fill="#64748B" opacity={0.6}/>
                    <Bar dataKey="mktTl" name="Pazarlama" stackId="c" fill={C.blue} opacity={0.5}/>
                    <Bar dataKey="taxTl" name="Vergi (%20)" stackId="c" fill={C.amber} opacity={0.5} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              {/* Comparison table: No investment vs Investment */}
              <Section title="Karşılaştırma: Yatırımsız vs Yatırımlı" sub="Aynı ürün, aynı fiyat — fark sadece satış ekibi ve büyüme hızı">
                <div style={{fontSize:11}}>
                  <div style={{display:"grid",gridTemplateColumns:"80px repeat(10,1fr)",gap:2,padding:"6px 0",borderBottom:`1px solid ${C.border}`,color:C.dim,fontWeight:700}}>
                    <span></span>{inv.map(d=><span key={d.month} style={{textAlign:"right",fontSize:9}}>{d.month}</span>)}
                  </div>
                  {[
                    {label:"Yatırımsız Rest.",data:proj.map(p=>p.restaurants),c:C.dim},
                    {label:"Yatırımlı Rest.",data:inv.map(d=>d.rest),c:C.cyan},
                    {label:"Yatırımsız MRR",data:proj.map(p=>p.mrr),c:C.dim,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
                    {label:"Yatırımlı MRR",data:inv.map(d=>Math.round(d.mrrTl/USD_TL)),c:C.green,fmt:v=>"$"+(v>=1000?(v/1000).toFixed(1)+"K":v)},
                    {label:"Satışçı",data:inv.map(d=>d.nSales),c:C.purple},
                    {label:"Founder (TL)",data:inv.map(d=>d.founderTl),c:C.cyan,fmt:v=>(v/1000).toFixed(0)+"K"},
                    {label:"İş Kârı (TL)",data:inv.map(d=>d.bizProfit),c:null,fmt:v=>v<0?"-"+(Math.abs(v)/1000).toFixed(0)+"K":(v/1000).toFixed(0)+"K"},
                    {label:"Vergi (TL)",data:inv.map(d=>d.taxTl),c:C.amber,fmt:v=>v>0?(v/1000).toFixed(0)+"K":"0"},
                    {label:"Faiz (TL)",data:inv.map(d=>d.interestTl),c:C.green,fmt:v=>(v/1000).toFixed(0)+"K"},
                    {label:"Banka (TL)",data:inv.map(d=>d.capital),c:C.amber,fmt:v=>(v/1_000_000).toFixed(1)+"M"},
                  ].map(row=>(
                    <div key={row.label} style={{display:"grid",gridTemplateColumns:"80px repeat(10,1fr)",gap:2,padding:"5px 0",borderBottom:`1px solid ${C.border}11`}}>
                      <span style={{color:C.dim,fontWeight:600,fontSize:9}}>{row.label}</span>
                      {row.data.map((v,j)=><span key={j} style={{textAlign:"right",fontFamily:"monospace",color:row.c,fontSize:10,fontWeight:row.label.includes("Yatırımlı")?700:400}}>{row.fmt?row.fmt(v):v}</span>)}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Key insight */}
              <div style={{background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>🎯</span>
                <div style={{color:C.dim,fontSize:11,lineHeight:1.7}}>
                  <strong style={{color:C.green}}>Kritik insight:</strong> Banka dip noktası: {(Math.min(...inv.map(d=>d.capital))/1_000_000).toFixed(2)}M TL
                  ({(()=>{const dipIdx=inv.findIndex(d=>d.capital===Math.min(...inv.map(x=>x.capital)));return inv[dipIdx]?.month||"?"})()}).
                  {(()=>{const kazaIdx=inv.findIndex(d=>d.bizProfit>0);return kazaIdx>=0?` İş kâra geçiş: ${inv[kazaIdx].month}.`:""})()}
                  {` 10 ayda personel: ${(inv.reduce((s,d)=>s+d.founderTl+d.salesTl,0)/1_000_000).toFixed(1)}M TL. `}
                  Faiz ({(inv.reduce((s,d)=>s+d.interestTl,0)/1_000_000).toFixed(1)}M TL) + iş kârı → banka 5M → <strong style={{color:C.amber}}>{(inv[9].capital/1_000_000).toFixed(1)}M TL</strong>.
                  {` ${inv[9].rest} restoran, $${(inv[9].mrrTl/USD_TL/1000).toFixed(1)}K MRR. Vergi: ${(inv.reduce((s,d)=>s+d.taxTl,0)/1000).toFixed(0)}K TL.`}
                </div>
              </div>
            </>
          );
        })()}

        {/* Terimler Sözlüğü */}
        <Section title="Terimler Sözlüğü" sub="Dashboard'da kullanılan kısaltmalar ve açıklamaları">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            {[
              {term:"MRR",full:"Monthly Recurring Revenue",desc:"Aylık tekrarlayan gelir — tüm aktif aboneliklerin aylık toplamı"},
              {term:"ARR",full:"Annual Recurring Revenue",desc:"Yıllık tekrarlayan gelir — MRR × 12. Şirket değerlemesinde temel metrik"},
              {term:"ARPU",full:"Average Revenue Per User",desc:"Kullanıcı başı ortalama gelir — toplam gelir ÷ müşteri sayısı"},
              {term:"LTV",full:"Lifetime Value",desc:"Müşteri yaşam boyu değeri — bir müşterinin ortalama ömrü boyunca getirdiği brüt kâr"},
              {term:"CAC",full:"Customer Acquisition Cost",desc:"Müşteri edinme maliyeti — bir yeni müşteri kazanmak için harcanan pazarlama + satış gideri"},
              {term:"LTV/CAC",full:"LTV ÷ CAC Oranı",desc:"Müşteri kârlılık oranı — 3x üstü sağlıklı, 5x+ çok iyi. 1x altı = müşteri başına zarar"},
              {term:"GTM",full:"Go-to-Market",desc:"Pazara giriş giderleri — ilk yıl sadece pazarlama/reklam. Satış founder-led, ayrı gider yok"},
              {term:"Churn",full:"Churn Rate",desc:"Müşteri kayıp oranı — her ay iptal eden müşteri yüzdesi. %6 = ort. 17 ay müşteri ömrü"},
              {term:"Brüt Marjin",full:"Gross Margin",desc:"Brüt kâr marjı — (Gelir − Doğrudan maliyetler) ÷ Gelir. LLM + altyapı dahil, GTM hariç"},
              {term:"Net Marjin",full:"Net Margin",desc:"Net kâr marjı — tüm giderler (LLM, altyapı, GTM, vergi) düşüldükten sonra kalan ÷ gelir"},
              {term:"Contribution",full:"Contribution Margin",desc:"Katkı payı — plan fiyatı − değişken maliyetler (LLM + Stripe). Sabit giderleri karşılamaya katkı"},
              {term:"EBIT",full:"Earnings Before Interest & Tax",desc:"Faiz ve vergi öncesi kâr — operasyonel kârlılığın temel göstergesi"},
            ].map((item,i)=>(
              <div key={i} style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}22`,display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{minWidth:90}}>
                  <span style={{color:C.cyan,fontFamily:"monospace",fontWeight:700,fontSize:12}}>{item.term}</span>
                  <div style={{color:C.muted,fontSize:9,marginTop:1}}>{item.full}</div>
                </div>
                <div style={{color:C.dim,fontSize:11,lineHeight:1.6}}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  };

  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"20px 28px",fontFamily:"'DM Sans',-apple-system,sans-serif",color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <h1 style={{margin:0,fontSize:24,fontWeight:700,letterSpacing:"-0.03em"}}>Gustu <span style={{color:C.cyan}}>Pricing Simülatör</span></h1>
            <Badge color={C.green}>1 TURN = 1 CREDIT</Badge>
            <Badge color={C.purple}>VALUE-BASED ~3.3¢/CR</Badge>
          </div>
          <p style={{margin:0,color:C.dim,fontSize:12}}>
            {PROD_DATA.length} production log · Gemini Flash Lite · <span style={{color:"#F87171",fontWeight:600}}>{costCent.toFixed(2)}¢ (${(costCent/100).toFixed(4)})/turn</span> · Flat credit: token bağımsız
          </p>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[
            {key:"scenario",label:"Restoran Senaryosu"},
            {key:"plans",label:"Plan Uyumu & Marjin"},
            {key:"scale",label:"Scale Senaryoları"},
            {key:"projection",label:"2026 Projeksiyon"},
          ].map(t=><TabBtn key={t.key} active={tab===t.key} onClick={()=>setTab(t.key)}>{t.label}</TabBtn>)}
        </div>
      </div>

      {/* Plan Pricing Controls */}
      <div style={{marginBottom:16,padding:"10px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",gap:20,fontSize:11}}>
        <span style={{color:C.dim,fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>PLAN FİYATLARI:</span>
        {[
          {label:"Starter",color:"#3B82F6",price:starterPrice,setPrice:setStarterPrice,credits:starterCredits,setCredits:setStarterCredits},
          {label:"Growth",color:"#8B5CF6",price:growthPrice,setPrice:setGrowthPrice,credits:growthCredits,setCredits:setGrowthCredits},
          {label:"Enterprise",color:"#F59E0B",price:entPrice,setPrice:setEntPrice,credits:entCredits,setCredits:setEntCredits},
        ].map(p=>(
          <div key={p.label} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:p.color,fontWeight:700,fontSize:11,minWidth:65}}>{p.label}</span>
            <span style={{color:C.dim,fontSize:9}}>$</span>
            <input type="number" min={0} step={1} value={p.price} onChange={e=>{const v=+e.target.value;if(v>=0)p.setPrice(v)}}
              style={{width:56,background:C.bg,border:`1px solid ${p.color}44`,borderRadius:4,color:p.color,fontFamily:"monospace",fontWeight:700,fontSize:12,padding:"3px 4px",textAlign:"right"}}/>
            <span style={{color:C.dim,fontSize:9}}>/ay</span>
            <span style={{color:C.muted,fontSize:9,marginLeft:4}}>cr:</span>
            <input type="number" min={0} step={500} value={p.credits} onChange={e=>{const v=+e.target.value;if(v>=0)p.setCredits(v)}}
              style={{width:60,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:"monospace",fontSize:11,padding:"3px 4px",textAlign:"right"}}/>
            <span style={{color:C.muted,fontFamily:"monospace",fontSize:9}}>{p.price>0&&p.credits>0?`${(p.price/p.credits*100).toFixed(1)}¢`:""}</span>
          </div>
        ))}
      </div>

      {tab==="scenario"&&renderScenario()}
      {tab==="plans"&&renderPlans()}
      {tab==="scale"&&renderScale()}
      {tab==="projection"&&renderProjection()}

      <div style={{marginTop:12,padding:"12px 20px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,gap:16}}>
        <div style={{color:C.dim,whiteSpace:"nowrap"}}>
          {tables}m × {numBranches}ş · %{adoption} · {tps}t/s ·
          <span style={{color:C.cyan}}> {calc.mTotal.toLocaleString()} cr/ay</span> ·
          <span style={{color:C.red}}> ${calc.mLLM.toFixed(2)} LLM</span> ·
          <span style={{color:calc.rec?.color}}> → {calc.rec?.name} ${calc.rec?.price}/ay (%{calc.rec?.margin})</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:360}}>
          <span style={{color:C.dim,fontSize:10,whiteSpace:"nowrap"}}>Turn Maliyet:</span>
          <input type="range" min={0.10} max={5.00} step={0.01} value={costCent} onChange={e=>setCostCent(+e.target.value)} style={{flex:1,accentColor:C.red,height:5}}/>
          <input type="number" min={0.01} max={5} step={0.01} value={costCent} onChange={e=>{const v=+e.target.value;if(v>=0.01&&v<=5)setCostCent(v)}} style={{width:52,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.red,fontFamily:"monospace",fontWeight:700,fontSize:12,padding:"2px 4px",textAlign:"right"}}/>
          <span style={{color:C.dim,fontSize:10}}>¢</span>
          <span style={{color:C.muted,fontFamily:"monospace",fontSize:10,whiteSpace:"nowrap"}}>(${(costCent/100).toFixed(4)})</span>
        </div>
        <div style={{color:C.muted,whiteSpace:"nowrap"}}>Gustu AI · Pricing Intelligence v2</div>
      </div>
    </div>
  );
}
