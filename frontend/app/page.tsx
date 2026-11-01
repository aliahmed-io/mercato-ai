import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowDown, MoveUpRight, AudioLines } from "lucide-react";
import { DemandExperience } from "@/components/landing/DemandExperience";

const destinations = [
  { title: "See the shift.", text: "Turn sales history into a clearer picture of what comes next.", href: "/forecasting", label: "Explore forecasting", number: "01" },
  { title: "Find your balance.", text: "Know what to reorder, what to hold, and where your capital sits.", href: "/inventory", label: "Explore inventory", number: "02" },
  { title: "Make your move.", text: "Bring forecasts, stock decisions, and purchase orders into one workflow.", href: "/reports", label: "Explore reporting", number: "03" },
];

export default function LandingPage() {
  return (
    <div className={"mc-site"}>
      <a className={"mc-skip"} href="#main">Skip to content</a>
      <header className={"mc-header"}>
        <Link href="/" className={"mc-brand"} aria-label="Mercato home"><AudioLines size={28} strokeWidth={2} />mercato<span>®</span></Link>
        <nav aria-label="Main navigation"><a href="#experience">The experience</a><a href="#equilibrium">Equilibrium</a><a href="#workflow">How it works</a><Link href="/models">The science</Link></nav>
        <Link href="/overview" className={"mc-workspace"}>Open workspace <ArrowUpRight size={17} /></Link>
      </header>
      <main id="main">
        <section className={"mc-hero"} aria-labelledby="hero-title">
          <div className={"mc-heroArt"}><Image src="/images/demand-sculpture.webp" alt="" fill priority sizes="(max-width: 700px) 110vw, 70vw" /></div>
          <div className={"mc-heroCopy"}>
            <div className={"mc-eyebrow"}><span /> Intelligence for the next move</div>
            <h1 id="hero-title">Ahead<br />of the<br /><em>curve.</em></h1>
            <p>Demand moves. Stay one step ahead.<br />Forecast with clarity. Stock with intention.</p>
            <div className={"mc-heroActions"}><Link href="/forecasting" className={"mc-primary"}>Explore Mercato <ArrowUpRight size={20} /></Link><a href="#experience" className={"mc-play"}><span><ArrowDown size={17} /></span> Take a closer look</a></div>
          </div>
          <div className={"mc-artCaption"}><span className={"mc-captionLine"} /><span>A new perspective<br /><strong>on what comes next.</strong></span></div>
          <div className={"mc-heroBottom"}><span>Demand forecasting & inventory intelligence</span><a href="#experience">Scroll to discover <ArrowDown size={14} /></a></div>
        </section>
        <section className={"mc-manifesto"}>
          <span className={"mc-sectionLabel"}>Less guesswork. More possibility.</span>
          <h2>Good timing changes <em>everything.</em></h2>
          <p>The right product. The right quantity. The right moment.<br />Connect the dots between what sold yesterday and what you need tomorrow.</p>
          <div className={"mc-capabilities"}><span>Demand forecasting</span><i /><span>Inventory planning</span><i /><span>Smarter replenishment</span></div>
        </section>
        <DemandExperience />
        <section id="equilibrium" className={"mc-equilibrium"} aria-labelledby="equilibrium-title">
          <div className={"mc-equilibriumArt"}>
            <Image
              src="/images/equilibrium-sculpture.webp"
              alt="Sculptural abstract art representing dynamic inventory and demand equilibrium"
              fill
              sizes="(max-width: 1024px) 100vw, 1440px"
              className={"mc-equilibriumImg"}
            />
            <div className={"mc-artCaption mc-equilibriumCaption"}>
              <span className={"mc-captionLine"} />
              <span>Equilibrium in motion<br /><strong>Where forecast meets reality.</strong></span>
            </div>
          </div>
          <div className={"mc-equilibriumCopy"}>
            <div>
              <span className={"mc-sectionLabel"}>Dynamic Equilibrium</span>
              <h2 id="equilibrium-title">
                Balance is not static.<br />
                <em>It is a constant calibration.</em>
              </h2>
            </div>
            <p>
              Demand rises and recedes with seasonal cadence, promotions, and market shifts. 
              Mercato continuously recalibrates your safety buffers and reorder thresholds — 
              holding your business in effortless equilibrium without locking up capital in dormant stock.
            </p>
          </div>
        </section>
        <section id="workflow" className={"mc-workflow"}>
          <div className={"mc-sectionHeading"}><div><span className={"mc-sectionLabel"}>From insight to action</span><h2>One connected<br /><em>way forward.</em></h2></div><p>A clearer view of your business.<br />A better starting point for every decision.</p></div>
          <div className={"mc-steps"}>{destinations.map(item=><Link key={item.number} href={item.href} className={"mc-step"}><div className={"mc-stepTop"}><span>{item.number}</span><MoveUpRight size={26} /></div><h3>{item.title}</h3><p>{item.text}</p><span className={"mc-stepLink"}>{item.label}</span></Link>)}</div>
        </section>
        <section className={"mc-closing"}><div className={"mc-closingOrbit"} aria-hidden="true" /><span className={"mc-sectionLabel"}>Your next chapter starts here</span><h2>Make room for<br /><em>what’s next.</em></h2><Link href="/overview" className={"mc-primary"}>Enter your workspace <ArrowUpRight size={20} /></Link></section>
      </main>
      <footer className={"mc-footer"}><Link href="/" className={"mc-brand"}><AudioLines size={25} />mercato<span>®</span></Link><p>A clearer view. A smarter move.</p><nav aria-label="Footer"><Link href="/data">Your data</Link><Link href="/models">Methodology</Link><Link href="/reports">Reports</Link></nav><span>Mercato AI · 2026</span></footer>
    </div>
  );
}
