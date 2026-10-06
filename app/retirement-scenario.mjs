const yrs=(y,m)=>Number(y||0)+Number(m||0)/12;
const ym=v=>{const total=Math.max(0,Math.round(Number(v||0)*12)),y=Math.floor(total/12),m=total%12;return (y?y+" year"+(y===1?"":"s"):"")+(y&&m?", ":"")+(m?m+" month"+(m===1?"":"s"):y?"":"0 months")};
const ageYM=v=>ym(v);
const untilYM=(a,b)=>ym(between(a,b));
const ageOn=(dob,date)=>between(dob,date);
const between=(a,b)=>{
 if(!a||!b||b<a)return 0;
 const start=new Date(a+"T00:00:00Z"),end=new Date(b+"T00:00:00Z");
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return 0;
 let months=(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth();
 let anchor=addMonths(a,months);if(anchor>b)anchor=addMonths(a,--months);
 const next=addMonths(a,months+1),fraction=(end-new Date(anchor+"T00:00:00Z"))/(new Date(next+"T00:00:00Z")-new Date(anchor+"T00:00:00Z"));
 return Math.max(0,(months+fraction)/12);
};
function addYears(date,y){const d=new Date(date+"T00:00:00Z");d.setUTCFullYear(d.getUTCFullYear()+y);return d.toISOString().slice(0,10)}
function addMonths(date,m){const d=new Date(date+"T00:00:00Z"),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+m);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString().slice(0,10)}
// Approximate the highest 48-month average by replacing historical months with future salary.
// The entered AFC remains authoritative at zero future service.
function projectAfc(current,salary,raise,future){
 const afc=Math.max(0,Number(current||0)),pay=Math.max(0,Number(salary||0)),months=Math.max(0,future*12),g=Number(raise||0)/100;
 if(!months||!pay)return afc;
 const start=Math.max(0,months-48);let total=afc*Math.max(0,48-months);
 for(let t=start;t<months;){const end=Math.min(months,Math.floor(t+1e-8)+1);total+=pay*Math.pow(1+g,t/12)*(end-t);t=end}
 return Math.max(afc,total/48);
}
const niceDate=d=>d?new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—";
function dateAtAge(dob,targetAge,today){if(!dob)return today;const b=new Date(dob+"T00:00:00Z");if(Number.isNaN(b.getTime()))return today;const d=new Date(Date.UTC(b.getUTCFullYear()+targetAge,b.getUTCMonth(),b.getUTCDate()));const iso=d.toISOString().slice(0,10);return iso<today?today:iso}
function sickCreditFromHours(hours,monthlyAccrual){if(!(hours>0)||!(monthlyAccrual>0))return{days:0,months:0,years:0};const days=hours/monthlyAccrual,months=Math.ceil(days/20);return{days,months,years:months/12}}
function fireRed(age,s){if(s>=30||(age>=65&&s>=5)||(age>=60&&s>=25))return 1;if(age>=60&&s>=5)return Math.min(1,.85+(age-60)*.03);if(age>=55&&s>=5){if(s>=29)return .95;if(s>=28)return .90;if(s>=27)return .85;if(s>=26)return .80;if(s>=25)return .75;if(s>=24)return .70;if(s>=23)return .65;return .60}return 0}
function genRed(age,s){if(s>=30||(age>=65&&s>=5)||(age>=60&&s>=25))return 1;if(age>=60&&s>=5)return Math.min(1,.85+(age-60)*.03);if(age>=50&&s>=20){if(s>=29)return .95;if(s>=28)return .90;if(s>=27)return .85;if(s>=26)return .80;if(s>=25)return .75;if(s>=24)return .70;if(s>=23)return .65;return .60}return 0}
function leoRed(age,s,l){if(s>=30||(age>=55&&l>=5))return 1;if((age>=50&&l>=15)||(s>=25&&l>=15)){if(age>=54)return .96;if(age>=53)return s>=29?.95:.92;if(age>=52)return s>=29?.95:s>=28?.90:.88;if(age>=51)return s>=29?.95:s>=28?.90:s>=27?.85:.84;if(age>=50)return s>=29?.95:s>=28?.90:s>=27?.85:.80}return 0}
const red=(t,a,s,l)=>t==="leo"?leoRed(a,s,l):t==="fire"?fireRed(a,s):genRed(a,s);
const label=r=>r===1?"Unreduced retirement":r>0?"Reduced retirement":"Not yet eligible to begin benefit";

export {addMonths};
export function calculateScenario(form,today,date){
 if(!date||date<today||!form.dob)return null;
 const future=between(today,date),futureMonths=Math.round(future*12),basic=form.mode==="basic",cs=yrs(form.sy,form.sm),age=ageOn(form.dob,date),accrual=Math.max(0,Number(form.sickMonthly||0));
 const retained=1-Math.min(100,Math.max(0,Number(form.sickUsePct||0)))/100,vacRetained=1-Math.min(100,Math.max(0,Number(form.vacUsePct||0)))/100;
 const futureSick=!basic&&form.projectSick?futureMonths*accrual*retained:0;
 const futureVac=!basic&&form.projectSick&&form.vacToSick?future*Number(form.vacEarnAnnual||0)*vacRetained*Number(form.vacConvertPct||0)/100:0;
 const sickHours=!basic?Math.max(0,Number(form.sick||0)+futureSick+futureVac):0;
 const sickMonths=!basic&&form.useSick?sickCreditFromHours(sickHours,accrual).months:0;
 const service=cs+future+sickMonths/12,leoService=form.type==="leo"?Number(form.leoY||0)+future:0;
 const afc=basic?Number(form.afc||0):projectAfc(form.afc,form.salary,form.raise,future);
 const factor=red(form.type,age,service,leoService),formulaMonthly=afc*.0185*service/12,monthly=formulaMonthly*factor;
 return{date,age,service,cs,future,sickMonths,sickHours,afc,factor,formulaMonthly,monthly,annual:monthly*12};
}
