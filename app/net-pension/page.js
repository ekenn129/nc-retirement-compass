"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {NetEstimate,TaxSettings} from "../net-estimate";
import {DEFAULT_TAX} from "../pension-net.mjs";
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2,minimumFractionDigits:2}).format(n);
const service=n=>{const m=Math.round(n*12);return Math.floor(m/12)+" years, "+m%12+" months"};
const nice=d=>new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
export default function PensionPage(){
 const [pension,setPension]=useState(null),[loaded,setLoaded]=useState(false),[advanced,setAdvanced]=useState(false),[tax,setTax]=useState({...DEFAULT_TAX});
 useEffect(()=>{try{const p=JSON.parse(sessionStorage.getItem("retirement-pension")||"null");if(p&&p.monthly>0&&p.afc>0&&p.service>0&&p.date&&p.dob)setPension(p);}catch{}setLoaded(true)},[]);
 const basicTax={...DEFAULT_TAX,filing:tax.filing};
 return <main className="pensionPage">
  <header><Link className="brand" href="/"><span className="mark">NC</span><b>RETIREMENT COMPASS</b></Link><Link href="/#calculator">← Edit calculator</Link></header>
  <section className="pensionPageHero"><div className="sectionLabel">YOUR RETIREMENT BREAKDOWN</div><h1>From your pension<br/>to your <em>take-home estimate.</em></h1><p>Review your Maximum Allowance, then see what could remain after taxes and your selected costs.</p></section>
  {!loaded?<section className="pensionEmpty">Loading your calculation…</section>:!pension?<section className="pensionEmpty"><h2>Start with your retirement calculation</h2><p>Enter your information in the Basic or Advanced calculator and select “Continue to pension breakdown &amp; net estimate.”</p><Link className="primary" href="/#calculator">Open retirement calculator →</Link></section>:<>
   <section className="pensionDetailGrid">
    <div className="pensionBreakdown"><div className="sectionLabel">01 / MAXIMUM ALLOWANCE</div><h2>Your gross pension</h2><p>{pension.mode==="basic"?"From your Basic calculator's earliest unreduced retirement.":"From your Advanced calculator's unreduced retirement calculation."}</p><dl>
     <div><dt>Retirement eligibility date</dt><dd>{nice(pension.date)}</dd></div>
     <div><dt>Age at retirement</dt><dd>{service(pension.age)}</dd></div>
     <div><dt>Average Final Compensation</dt><dd>{money(pension.afc)}</dd></div>
     <div><dt>Service entered today</dt><dd>{service(pension.currentService)}</dd></div>
     <div><dt>Additional employment service</dt><dd>{service(Math.max(0,pension.service-pension.currentService-pension.sickMonths/12))}</dd></div>
     <div><dt>Sick-leave service credit</dt><dd>{pension.sickMonths} months</dd></div>
     <div><dt>Total creditable service</dt><dd>{service(pension.service)}</dd></div>
     <div><dt>LGERS multiplier</dt><dd>1.85%</dd></div>
     <div><dt>Early-retirement reduction</dt><dd>None · unreduced</dd></div>
    </dl><div className="pensionFormula">AFC × 1.85% × service ÷ 12</div><p className="pensionReason">{pension.reason}</p><p className="pensionMethod">Maximum Allowance is the highest lifetime payment, with no continuing monthly survivor benefit. Survivor options require an official personalized factor.</p></div>
    <aside className="pensionGross"><span>MAXIMUM ALLOWANCE · BEFORE DEDUCTIONS</span><strong>{money(pension.monthly)}<i>/mo</i></strong><p>{money(pension.monthly*12)} per year</p><Link href="/#calculator">← Adjust retirement assumptions</Link></aside>
   </section>
   <section className="pensionNetSection"><div className="sectionLabel">02 / BASIC ESTIMATED NET</div><h2>A starting estimate after income taxes</h2><p>Assumes this pension is your only taxable household income, no insurance or other deductions, and no Bailey or public safety exclusions. Uses 2026 brackets and standard deductions.</p>
    <label className="basicNetFiling"><span>Tax filing status</span><select value={tax.filing} onChange={e=>setTax({...tax,filing:e.target.value})}><option value="single">Single</option><option value="joint">Married filing jointly</option><option value="separate">Married filing separately</option><option value="head">Head of household</option></select></label>
    <NetEstimate monthly={pension.monthly} settings={basicTax} dob={pension.dob} date={pension.date} type={pension.type}/>
    <p className="pensionMethod">Pension payments have no Social Security or Medicare payroll tax and no required LGERS employee contribution. Medicare insurance premiums are separate costs. This is a full-year tax estimate, not your actual ORBIT withholding.</p>
   </section>
   <section className="pensionNetSection"><div className="sectionLabel">03 / ADVANCED ESTIMATED NET</div><h2>Make the estimate fit your household</h2><p>Add other income, insurance, voluntary deductions and eligible tax adjustments, or enter your withholding percentages.</p><button className="pensionContinue" type="button" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}>{advanced?"Hide advanced net estimate":"Customize advanced net estimate →"}</button>
    {advanced&&<><TaxSettings settings={tax} onChange={setTax}/><NetEstimate monthly={pension.monthly} settings={tax} dob={pension.dob} date={pension.date} type={pension.type}/></>}
   </section>
   <section className="pensionPageNotice"><p>Tax rules are a 2026 planning baseline; actual taxes in your retirement year may differ. For another state of residence or a complex tax return, use the advanced withholding inputs based on your tax plan.</p><a href="https://www.irs.gov/publications/p505" target="_blank" rel="noreferrer">IRS federal tax tables ↗</a><a href="https://www.ncdor.gov/documents/bulletins/2025-personal-taxes-bulletin" target="_blank" rel="noreferrer">NC tax rules ↗</a></section>
  </>}
 </main>;
}
