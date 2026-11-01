"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, Minus } from "lucide-react";
const scenarios = [
  {name:"Steady demand", demand:168, stock:210, points:"M360 145 C400 140 420 155 460 132 S530 125 570 110 S640 119 700 92", area:"M360 125 C460 100 560 78 700 55 L700 130 C560 155 460 162 360 165Z", message:"A little breathing room.", detail:"Stock covers expected demand, with room for the unexpected."},
  {name:"Seasonal lift", demand:264, stock:210, points:"M360 145 C400 130 420 138 460 100 S530 105 570 65 S640 70 700 35", area:"M360 125 C460 65 560 30 700 10 L700 72 C560 115 460 148 360 165Z", message:"Catch the next wave.", detail:"A seasonal rise can outpace available stock. Plan ahead for the gap."},
  {name:"Slower sales", demand:126, stock:210, points:"M360 145 C400 150 420 143 460 160 S530 162 570 175 S640 170 700 190", area:"M360 125 C460 130 560 140 700 160 L700 220 C560 210 460 190 360 165Z", message:"Give your stock space.", detail:"Softer demand leaves more stock on hand. Review your next order."},
];
export function DemandExperience(){
 const [selected,setSelected]=useState(0);
 const scenario=scenarios[selected]!;
 const gap=scenario.stock-scenario.demand;
 return <section className={"mc-experience"} id="experience" aria-labelledby="experience-title">
  <div className={"mc-sectionHeading"}><div><span className={"mc-sectionLabel"}>A feel for the future</span><h2 id="experience-title">What if you could<br /><em>see it coming?</em></h2></div><p>Explore how a change in demand<br />changes your next move.</p></div>
  <div className={"mc-demo"}>
   <div className={"mc-demoHeader"}><div><span className={"mc-demoDot"}/> Demand studio <span className={"mc-demoBadge"}>Illustrative demo</span></div><span>Next 28 days</span></div>
   <div className={"mc-demoBody"}>
    <div className={"mc-demoControls"}><span className={"mc-sectionLabel"}>Change the outlook</span><div className={"mc-scenarios"} role="group" aria-label="Demand scenario">{scenarios.map((item,i)=><button key={item.name} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{item.name}{selected===i?<Minus size={16}/>:<Plus size={16}/>}</button>)}</div><div className={"mc-scenarioCopy"} aria-live="polite"><h3>{scenario.message}</h3><p>{scenario.detail}</p></div><Link href="/forecasting">Try your own data <ArrowUpRight size={16}/></Link></div>
    <div className={"mc-chartPanel"}><div className={"mc-chartHeading"}><span>Demand outlook <small>Units / day</small></span><div><span className={"mc-actualKey"}/> Historical <span className={"mc-forecastKey"}/> Forecast</div></div>
     <svg className={"mc-chart"} viewBox="0 0 740 260" role="img" aria-label={`${scenario.name}: ${scenario.demand} forecast units over 28 days. Illustrative scenario, not a live prediction.`}>
      <defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#D4FF24" stopOpacity=".2"/><stop offset="1" stopColor="#D4FF24" stopOpacity=".01"/></linearGradient></defs>
      {[50,100,150,200].map((y,i)=><g key={y}><line x1="35" x2="710" y1={y} y2={y} stroke="#ffffff" strokeOpacity=".07"/><text x="8" y={y+4} fill="#858a95" fontSize="11">{12-i*3}</text></g>)}
      <path d="M35 195 C70 195 75 140 110 155 S165 195 195 140 S240 175 280 120 S325 170 360 145" stroke="#6892FF" strokeWidth="3" fill="none"/>
      <path d={scenario.area} fill="url(#forecastFill)"/>
      <line x1="360" x2="360" y1="15" y2="220" stroke="#777" strokeDasharray="3 6"/><text x="360" y="248" fill="#e5e6ea" textAnchor="middle" fontSize="11">Today</text>
      <path d={scenario.points} stroke="#D4FF24" strokeWidth="3" fill="none" strokeLinecap="round"/><circle cx="360" cy="145" r="5" fill="#D4FF24" stroke="#0b0e14" strokeWidth="3"/>
      <text x="35" y="248" fill="#858a95" fontSize="11">28 days ago</text><text x="700" y="248" fill="#858a95" textAnchor="end" fontSize="11">28 days ahead</text>
     </svg><div className={"mc-chartStats"} aria-live="polite"><div><span>Forecast demand</span><strong>{scenario.demand}<small> units</small></strong></div><div><span>Available stock</span><strong>{scenario.stock}<small> units</small></strong></div><div><span>{gap>=0?"Projected remaining":"Projected shortfall"}</span><strong className={gap<0?"mc-warning":"mc-lime"}>{Math.abs(gap)}<small> units</small></strong></div></div>
    </div>
   </div>
  </div>
 </section>;
}
