// 2026 federal ordinary-income brackets: IRS Rev. Proc. 2025-32 / Publication 505.
// NC rate and deductions: NCDOR 2025 Personal Taxes Bulletin (law as of Jan 1, 2026).
export const TAX_YEAR = 2026;
export const DEFAULT_TAX = {
 filing: "single", mode: "estimate", otherIncome: "0", insurance: "0", otherDeductions: "0",
 savings: "0", taxFreeMonthly: "0", federalExtraDeduction: "0", ncExtraDeduction: "0",
 federalCredits: "0", ncCredits: "0", federalRate: "0", ncRate: "0",
 bailey: false, publicSafety: false, eligiblePremiums: "0", spouseDob: ""
};
const TABLES = {
 single: { federal:16100,nc:12750,limits:[12400,50400,105700,201775,256225,640600] },
 joint: { federal:32200,nc:25500,limits:[24800,100800,211400,403550,512450,768700] },
 separate: { federal:16100,nc:12750,limits:[12400,50400,105700,201775,256225,384350] },
 head: { federal:24150,nc:19125,limits:[17700,67450,105700,201750,256200,640600] }
};
const rates=[.10,.12,.22,.24,.32,.35,.37];
const number=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
const cents=v=>Math.round(v*100)/100;
export function bracketTax(taxable,filing="single"){
 const limits=TABLES[filing]?.limits||TABLES.single.limits;
 let tax=0,lower=0;taxable=number(taxable);
 for(let i=0;i<rates.length;i++){const upper=limits[i]??Infinity;tax+=Math.max(0,Math.min(taxable,upper)-lower)*rates[i];lower=upper;if(taxable<=upper)break}
 return tax;
}
function seniorCount(dob,date){return dob&&date&&Number(date.slice(0,4))-Number(dob.slice(0,4))>=65?1:0}
export function estimatePensionNet(monthly,settings={},context={}){
 const s={...DEFAULT_TAX,...settings},table=TABLES[s.filing]||TABLES.single,filing=TABLES[s.filing]?s.filing:"single";
 const gross=cents(number(monthly)),annual=gross*12,other=number(s.otherIncome);
 const basis=Math.min(annual,number(s.taxFreeMonthly)*12);
 // HELPS: optional election, qualifying premiums only, normal-retirement/disability eligibility.
 const helps=s.publicSafety&&context.type!=="general"?Math.min(3000,number(s.eligiblePremiums),annual-basis):0;
 const taxablePension=Math.max(0,annual-basis-helps),date=context.date||"2026-01-01";
 const seniors=seniorCount(context.dob,date)+(filing==="joint"?seniorCount(s.spouseDob,date):0);
 const standard=table.federal+seniors*(filing==="single"||filing==="head"?2050:1650);
 const federalTax=income=>{
  // Temporary senior deduction applies through 2028; not projected indefinitely.
  const bonus=Number(date.slice(0,4))<=2028&&filing!=="separate"
    ?seniors*Math.max(0,6000-.06*Math.max(0,income-(filing==="joint"?150000:75000))):0;
  return Math.max(0,bracketTax(Math.max(0,income-standard-bonus-number(s.federalExtraDeduction)),filing)-number(s.federalCredits));
 };
 const ncTax=income=>Math.max(0,Math.max(0,income-table.nc-number(s.ncExtraDeduction))*.0399-number(s.ncCredits));
 // Incremental tax attributable to pension: household tax with pension minus without.
 let federal=cents(Math.max(0,federalTax(other+taxablePension)-federalTax(other))/12);
 let state=cents(Math.max(0,ncTax(other+(s.bailey?0:taxablePension))-ncTax(other))/12);
 if(s.mode==="withholding"){
  federal=cents((gross-basis/12)*Math.min(100,number(s.federalRate))/100);
  state=s.bailey?0:cents((gross-basis/12)*Math.min(100,number(s.ncRate))/100);
 }
 const insurance=gross>0?cents(number(s.insurance)):0,otherDeductions=gross>0?cents(number(s.otherDeductions)):0,savings=gross>0?cents(number(s.savings)):0;
 const net=cents(gross-federal-state-insurance-otherDeductions-savings);
 return{gross,federal,state,insurance,otherDeductions,savings,net,annualNet:cents(net*12),fica:0,lgers:0};
}
