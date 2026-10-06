"use client";
import {useEffect,useRef,useState} from "react";
const display=v=>v?v.slice(5,7)+"/"+v.slice(8,10)+"/"+v.slice(0,4):"";
function parse(text){
 const digits=text.replace(/\D/g,"");
 const match=text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 const iso=match?text:digits.length===8?digits.slice(4)+"-"+digits.slice(0,2)+"-"+digits.slice(2,4):"";
 if(!iso)return "";
 const d=new Date(iso+"T00:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===iso&&Number(iso.slice(0,4))>=1900?iso:"";
}
export default function DateInput({value,onChange,min,max,label}){
 const [text,setText]=useState(display(value)),[error,setError]=useState("");const picker=useRef(null);
 useEffect(()=>{setText(display(value));setError("")},[value]);
 const valid=t=>{const iso=parse(t);return iso&&(!min||iso>=min)&&(!max||iso<=max)?iso:""};
 function change(t){setText(t);setError("");if(!t)onChange("");else{const iso=valid(t);if(iso)onChange(iso)}}
 function finish(){if(!text)return;const iso=valid(text);if(iso){setText(display(iso));setError("")}else setError(min?"Enter a valid date on or after "+display(min)+".":"Enter a valid date as MM/DD/YYYY.")}
 return <div className="easyDate"><input type="text" aria-label={label} placeholder="MM/DD/YYYY" inputMode="numeric" autoComplete="off" value={text} aria-invalid={!!error} onChange={e=>change(e.target.value)} onBlur={finish}/><button type="button" className="datePickerButton" aria-label={"Open calendar for "+label} title="Choose date from calendar" onClick={()=>picker.current?.showPicker?.()}>▦</button><input className="calendarInput" ref={picker} type="date" aria-label={label+" calendar"} tabIndex={-1} value={value} min={min} max={max} onChange={e=>{onChange(e.target.value);setText(display(e.target.value));setError("")}}/>{error&&<small className="dateError" role="alert">{error}</small>}</div>;
}
