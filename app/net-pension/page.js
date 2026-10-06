"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {NetEstimate,TaxSettings} from "../net-estimate";
import {DEFAULT_TAX,estimatePensionNet} from "../pension-net.mjs";
import {addMonths,calculateScenario} from "../retirement-scenario.mjs";
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2,minimumFractionDigits:2}).format(n);
const service=n=>{const m=Math.max(0,Math.round(n*12));return Math.floor(m/12)+" years, "+m%12+" months"};
export default function PensionPage(){
 const [pension,setPension]=useState(null),[form,setForm]=useState(null),[loaded,setLoaded]=useState(false),[advanced,setAdvanced]=useState(false),[tax,setTax]=useState({...DEFAULT_TAX}),[dates,setDates]=useState(["","",""]);
 useEffect(()=>{try{
  const p=JSON.parse(sessionStorage.getItem("retirement-pension")||"null"),f=JSON.parse(sessionStorage.getItem("retirement-form")||"null");
  if(p&&f&&p.monthly>0&&p.date&&f.dob){setPension({...p,asOf:p.asOf||new Date().toISOString().slice(0,10)});setForm(f);setDates([p.date,addMonths(p.date,3),addMonths(p.date,6)]);}
 }catch{}setLoaded(true)},[]);
 const settings=advanced?tax:{...DEFAULT_TAX,filing:tax.filing};
 const results=form&&pension?dates.map(d=>calculateScenario(form,pension.asOf,d)):[null,null,null];
 const net=r=>r&&r.factor>0?estimatePensionNet(r.monthly,settings,{dob:form.dob,date:r.date,type:form.type}).net:null;
 const update=(i,d)=>setDates(old=>old.map((v,j)=>i===j?d:v));
 const shift=(i,m)=>{if(dates[i]){const d=addMonths(dates[i],m);update(i,d<pension.asOf?pension.asOf:d)}};
 return <main className="pensionPage">
  <header><Link className="brand" href="/"><span className="mark">NC</span><b>RETIREMENT COMPASS</b></Link><Link href="/#calculator">← Edit calculator</Link></header>
  <section className="pensionPageHero"><div className="sectionLabel">COMPARE YOUR RETIREMENT DATES</div><h1>Three dates.<br/><em>One clear comparison.</em></h1><p>Adjust each date to see your Maximum Allowance and estimated net pension side by side.</p></section>
  {!loaded?<section className="pensionEmpty">Loading your calculation…</section>:!pension||!form?<section className="pensionEmpty"><h2>Start with your retirement calculation</h2><p>Enter your information in the Basic or Advanced calculator, then continue to your pension breakdown.</p><Link className="primary" href="/#calculator">Open retirement calculator →</Link></section>:<>
   <section className="comparisonIntro"><div><div className="sectionLabel">YOUR DATE COMPARISON</div><h2>When does retirement work best for you?</h2><p>Start with your calculated date, three months later and six months later. Change any card independently.</p></div><button type="button" className="compareReset" onClick={()=>setDates([pension.date,addMonths(pension.date,3),addMonths(pension.date,6)])}>Reset dates</button></section>
   <section className="comparisonSettings">
    <label className="basicNetFiling"><span>Tax filing status · applies to all three cards</span><select value={tax.filing} onChange={e=>setTax({...tax,filing:e.target.value})}><option value="single">Single</option><option value="joint">Married filing jointly</option><option value="separate">Married filing separately</option><option value="head">Head of household</option></select></label>
    <div className="compareMode"><button type="button" className={!advanced?"active":""} onClick={()=>setAdvanced(false)}>Basic net estimate</button><button type="button" className={advanced?"active":""} onClick={()=>setAdvanced(true)}>Advanced net estimate</button></div>
    <p>{advanced?"All cards use the same household tax and deduction settings below.":"Basic net assumes the pension is your only taxable household income, standard deductions, and no insurance costs or optional exclusions."}</p>
   </section>
   <section className="retirementCards" aria-label="Three retirement date comparisons">
    {results.map((r,i)=><article className="retirementDateCard" key={i} aria-label={"Retirement option "+(i+1)}>
     <div className="dateCardHeader"><span>OPTION {i+1}</span>{i===0&&<small>Comparison baseline</small>}</div>
     <label className="compareDate"><span>Retirement date · Option {i+1}</span><input type="date" min={pension.asOf} value={dates[i]} onChange={e=>update(i,e.target.value)}/></label>
     <div className="dateNudges"><button type="button" onClick={()=>shift(i,-12)} disabled={!dates[i]}>−1 year</button><button type="button" onClick={()=>shift(i,-1)} disabled={!dates[i]}>−1 month</button><button type="button" onClick={()=>shift(i,1)} disabled={!dates[i]}>+1 month</button><button type="button" onClick={()=>shift(i,12)} disabled={!dates[i]}>+1 year</button></div>
     <button type="button" className="dateOriginal" onClick={()=>update(i,pension.date)}>Use calculated retirement date</button>
     {!r?<p className="compareInvalid">Choose a date on or after {pension.asOf}.</p>:<>
      <div className={"dateEligibility "+(r.factor===1?"full":r.factor>0?"reduced":"ineligible")}>{r.factor===1?"Unreduced retirement":r.factor>0?"Reduced retirement":"Not eligible on this date"}</div>
      <div className="cardGross"><span>MAXIMUM ALLOWANCE{r.factor>0&&r.factor<1?" · REDUCED":""}</span><strong>{r.factor>0?money(r.monthly):"Not available"}{r.factor>0&&<i>/mo</i>}</strong><p>{r.factor>0?money(r.annual)+" per year":"No pension payable at this date"}</p></div>
      <NetEstimate monthly={r.monthly} settings={settings} dob={form.dob} date={r.date} type={form.type}/>
      {r.factor===0&&<div className="netUnavailable">Net estimate available once you qualify to begin your pension.</div>}
      {i>0&&r.factor>0&&results[0]?.factor>0&&<div className="compareDifference"><b>{r.monthly-results[0].monthly>=0?"+":""}{money(r.monthly-results[0].monthly)}/mo gross</b><span>{net(r)-net(results[0])>=0?"+":""}{money(net(r)-net(results[0]))}/mo net versus Option 1</span></div>}
      <dl className="dateCardStats"><div><dt>Age at retirement</dt><dd>{service(r.age)}</dd></div><div><dt>Estimated AFC</dt><dd>{money(r.afc)}</dd></div><div><dt>Employment service</dt><dd>{service(r.cs+r.future)}</dd></div><div><dt>Sick-leave service credit</dt><dd>{r.sickMonths} months</dd></div><div><dt>Total creditable service</dt><dd>{service(r.service)}</dd></div><div><dt>Early-retirement reduction</dt><dd>{Math.round((1-r.factor)*100)}%{r.factor===0?" · not eligible":""}</dd></div></dl>
      <details className="cardFormula"><summary>Maximum Allowance breakdown</summary><p>{money(r.afc)} × 1.85% × {r.service.toFixed(4)} service years ÷ 12 = {money(r.formulaMonthly)}/mo before any early-retirement reduction.</p><p>Service today: {service(r.cs)}. Additional employment: {service(r.future)}. Sick credit: {r.sickMonths} months.</p></details>
     </>}
    </article>)}
   </section>
   {advanced&&<section className="compareAdvanced"><div className="sectionLabel">ADVANCED NET ASSUMPTIONS</div><h2>Customize all three net estimates</h2><TaxSettings settings={tax} onChange={setTax}/></section>}
   <section className="pensionPageNotice"><p>{form.mode==="basic"?"Basic retirement assumptions hold AFC constant and exclude sick leave.":"Advanced retirement assumptions project salary, sick leave and eligible vacation conversion separately for each date."} These cards assume continued LGERS employment until each selected date. Maximum Allowance pays for your lifetime with no ongoing survivor benefit. Taxes use a 2026 planning baseline and full-year payments; insurance and other income stay at your entered amounts. Actual pension effective dates are the first of a month; the date controls compare eligibility and service estimates.</p><a href="https://www.irs.gov/publications/p505" target="_blank" rel="noreferrer">IRS federal tax tables ↗</a><a href="https://www.ncdor.gov/documents/bulletins/2025-personal-taxes-bulletin" target="_blank" rel="noreferrer">NC tax rules ↗</a></section>
  </>}
 </main>;
}
