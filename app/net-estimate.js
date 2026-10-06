"use client";
import {estimatePensionNet,TAX_YEAR} from "./pension-net.mjs";
const dollars=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const whole=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
export function NetEstimate({monthly,settings,dob,date,type,compact=false}){
 const n=estimatePensionNet(monthly,settings,{dob,date,type});
 if(!(monthly>0))return null;
 const withholding=settings.mode==="withholding";
 const breakdown=<dl className="netBreakdown">
  <div><dt>Gross monthly pension</dt><dd>{dollars(n.gross)}</dd></div>
  <div><dt>{withholding?"Federal withholding":"Estimated federal tax"}</dt><dd>−{dollars(n.federal)}</dd></div>
  <div><dt>{settings.bailey?"NC income tax · Bailey exempt":withholding?"NC withholding":"Estimated NC tax"}</dt><dd>−{dollars(n.state)}</dd></div>
  <div><dt>Social Security + Medicare payroll tax</dt><dd>{dollars(0)}</dd></div>
  <div><dt>Required LGERS retirement contribution</dt><dd>{dollars(0)}</dd></div>
  <div><dt>Insurance / Medicare premiums</dt><dd>−{dollars(n.insurance)}</dd></div>
  {n.otherDeductions>0&&<div><dt>Other monthly deductions</dt><dd>−{dollars(n.otherDeductions)}</dd></div>}
  {n.savings>0&&<div><dt>Optional savings set aside</dt><dd>−{dollars(n.savings)}</dd></div>}
 </dl>;
 return <div className={"netEstimate"+(compact?" netCompact":"")}>
  <span className="netLabel">{withholding?"ESTIMATED DEPOSIT AFTER WITHHOLDING":"ESTIMATED NET AFTER TAXES"}</span>
  <strong className="netValue">{compact?whole(n.net):dollars(n.net)}<i>/mo</i></strong>
  {!compact&&<small className="netAnnual">{dollars(n.annualNet)} annualized</small>}
  <details><summary>View deductions</summary>{breakdown}</details>
  {!compact&&<p className="netFootnote">{withholding?"Uses your entered withholding percentages. Actual tax owed may differ; HELPS is claimed on your return.":"Tax budget, not an ORBIT withholding quote. Uses the added household tax attributable to this pension."} {TAX_YEAR} tax rules; full-year payments. {n.net<0?"Entered deductions exceed this pension.":""}</p>}
 </div>;
}
function TaxNumber({label,value,onChange,hint,suffix="$",max}){
 return <label className="taxField"><span>{label}</span><div><span>{suffix}</span><input type="number" min="0" max={max} step="0.01" value={value} onChange={e=>onChange(e.target.value)} /></div>{hint&&<small>{hint}</small>}</label>;
}
export function TaxSettings({settings,onChange}){
 const set=(key,value)=>onChange({...settings,[key]:value});
 const num=(key,label,hint,suffix,max)=><TaxNumber key={key} label={label} value={settings[key]} onChange={v=>set(key,v)} hint={hint} suffix={suffix} max={max}/>;
 return <details className="taxSettings" open>
  <summary><b>Net pension estimator</b><span>Set taxes and deductions once for all results · 2026 baseline</span></summary>
  <div className="taxSettingsBody">
   <p className="taxExplain">Pensions have <b>no FICA payroll tax and no required 6% LGERS contribution</b>. Federal and NC income tax may apply. Health coverage, Medicare premiums and optional deductions depend on your elections.</p>
   <div className="taxGrid">
    <label className="taxField"><span>Tax filing status</span><select value={settings.filing} onChange={e=>set("filing",e.target.value)}><option value="single">Single</option><option value="joint">Married filing jointly</option><option value="separate">Married filing separately</option><option value="head">Head of household</option></select></label>
    <label className="taxField"><span>Estimate method</span><select value={settings.mode} onChange={e=>set("mode",e.target.value)}><option value="estimate">Estimate income tax from brackets</option><option value="withholding">Use my withholding percentages</option></select></label>
    {settings.mode==="estimate"?num("otherIncome","Other household ordinary income / year","Exclude this pension. Include spouse's wages, taxable rental profit and traditional retirement withdrawals after applicable adjustments."):num("federalRate","Federal withholding","Percent of taxable pension, before any HELPS exclusion.","%",100)}
    {settings.mode==="withholding"&&num("ncRate","NC withholding","Enter your elected rate; this is not automatically the 3.99% tax rate.","%",100)}
    {num("insurance","Insurance / Medicare premiums / month","Your out-of-pocket cost only. Include spouse coverage if applicable; exclude employer-paid amounts.")}
    {num("otherDeductions","Other deductions / month","For example dental, vision, life insurance, or optional death-benefit premiums. Do not count insurance twice.")}
    {num("savings","Optional savings / month","A spending set-aside, not a required pension contribution or an assumed tax deduction.")}
   </div>
   <details className="taxMore"><summary>Exemptions and tax adjustments</summary>
    <div className="taxGrid">
     {num("taxFreeMonthly","Tax-free pension basis / month","Use the tax-free recovery of after-tax contributions from your official estimate or 1099-R. Otherwise leave zero.")}
     {settings.mode==="estimate"&&<>{num("federalExtraDeduction","Additional federal deductions / year","Beyond the standard deduction. Include only eligible amounts; for itemizing enter the excess over the standard deduction.")}
     {num("ncExtraDeduction","Additional NC deductions / year","Beyond NC's standard deduction, including applicable NC child deductions. State and federal deductions differ.")}
     {num("federalCredits","Federal nonrefundable credits / year","Enter credits you qualify for in the retirement scenario. No credits are assumed automatically.")}
     {num("ncCredits","NC nonrefundable credits / year","Enter applicable state credits.")}
     {settings.filing==="joint"&&<label className="taxField"><span>Spouse date of birth (optional)</span><input type="date" value={settings.spouseDob} onChange={e=>set("spouseDob",e.target.value)}/><small>Used for age-65 federal deductions in each scenario.</small></label>}</>}
    </div>
    <label className="taxCheck"><input type="checkbox" checked={settings.bailey} onChange={e=>set("bailey",e.target.checked)}/><span>My LGERS pension qualifies for the NC Bailey exemption<small>Generally requires five years of qualifying retirement service by August 12, 1989. Confirm eligibility before selecting.</small></span></label>
    <label className="taxCheck"><input type="checkbox" checked={settings.publicSafety} onChange={e=>set("publicSafety",e.target.checked)}/><span>I qualify for the retired public safety officer insurance exclusion (HELPS)<small>Retired due to disability or at normal retirement age from an eligible public safety employer. Excludes up to $3,000 annually of eligible pension income used for qualifying premiums; this is not a $3,000 tax credit.</small></span></label>
    {settings.publicSafety&&num("eligiblePremiums","Qualifying premiums paid / year","For you, spouse or dependents; employer-paid premiums do not qualify. Enter the annual amount already included in your monthly insurance costs. No duplicate medical deduction.")}
   </details>
   <p className="taxScope">The bracket estimate assumes full-year ordinary income, a North Carolina resident, and standard deductions. It adds only the pension's incremental household income tax; other income is not added to the net pension. Age-65 deductions use age at year-end; the temporary federal senior deduction is applied only to scenarios through 2028. Other income and costs stay at the entered amounts across scenarios. Future tax brackets and NC rates may change. Social Security taxation, capital-gains rates, AMT, income-sensitive credits, part-year retirement and lump-sum withdrawals are not modeled. Withholding percentages can be used for those planning cases.</p>
   <div className="taxSources"><span>Sources:</span><a href="https://www.irs.gov/publications/p505" target="_blank" rel="noreferrer">IRS tax tables</a><a href="https://www.irs.gov/publications/p575" target="_blank" rel="noreferrer">Pension taxation / HELPS</a><a href="https://www.ssa.gov/planners/retire/annuities.html" target="_blank" rel="noreferrer">Pensions and FICA</a><a href="https://www.ncdor.gov/documents/bulletins/2025-personal-taxes-bulletin" target="_blank" rel="noreferrer">NC tax rules</a><a href="https://www.myncretirement.gov/retirees/income-tax-withholding" target="_blank" rel="noreferrer">ORBIT withholding</a></div>
  </div>
 </details>;
}
