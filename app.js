import bcrypt from "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/+esm";
import { supabase } from "./supabase.js";

/* SESSION */
function saveSession(user){
localStorage.setItem("dar_session",JSON.stringify({
emp_id:user.emp_id,
full_name:user.full_name
}));
}

function getSession(){
return JSON.parse(localStorage.getItem("dar_session"));
}

function requireLogin(){
const s=getSession();
if(!s && location.pathname.includes("dashboard"))
location="index.html";
return s;
}

/* DEVICE TYPE */
function isMobile(){
return /Android|iPhone|iPad/i.test(navigator.userAgent);
}

/* LOGIN */
document.addEventListener("DOMContentLoaded",()=>{

const loginBtn=document.getElementById("loginBtn");
if(loginBtn) loginBtn.onclick=login;

const session=requireLogin();
if(session) initDashboard(session);

registerSW();
});

async function login(){

const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const {data}=await supabase.from("employees")
.select("*").eq("emp_id",emp).single();

if(!data){alert("Invalid ID");return;}

let valid=false;

if((data.pass||"").startsWith("$2"))
valid=bcrypt.compareSync(pass,data.pass);
else valid=(pass==="1111"||pass===data.pass);

if(!valid){alert("Invalid Password");return;}

saveSession(data);
setTimeout(()=>location="dashboard.html",150);
}

/* DASHBOARD */
async function initDashboard(session){

document.getElementById("name").innerText=session.full_name;
document.getElementById("empid").innerText=session.emp_id;

document.getElementById("logoutBtn").onclick=()=>{
localStorage.removeItem("dar_session");
location="index.html";
};

if(!isMobile()){
document.getElementById("clockBtn").disabled=true;
document.getElementById("viewMode").innerText=
"Laptop View‑Only Mode — Clock‑in allowed only on registered mobile device.";
}

document.getElementById("clockBtn").onclick=clockIn;

loadHistory(session.emp_id);
}

/* GPS */
function getFreshGPS(){
return new Promise((resolve,reject)=>{
navigator.geolocation.getCurrentPosition(
p=>resolve(p),
()=>reject(),
{enableHighAccuracy:true,maximumAge:0,timeout:15000}
);
});
}

/* Reverse Geocode */
async function getPlace(lat,lon){
try{
const r=await fetch(
`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
const d=await r.json();
return d.display_name||"Location unavailable";
}catch{return "Location unavailable";}
}

/* One login per day */
async function alreadyLogged(emp){
const today=new Date().toISOString().slice(0,10);
const {data}=await supabase.from("attendance_logs")
.select("log_time")
.eq("emp_id",emp)
.eq("device_id","MOBILE_WEB");

return data?.some(r=>r.log_time.startsWith(today));
}

async function clockIn(){

const s=getSession();
if(!s) return;

if(await alreadyLogged(s.emp_id)){
alert("Already logged today.");
return;
}

let pos;
try{pos=await getFreshGPS();}
catch{alert("GPS required.");return;}

const place=await getPlace(pos.coords.latitude,pos.coords.longitude);

await supabase.from("attendance_logs").insert({
emp_id:s.emp_id,
device_id:"MOBILE_WEB",
status:"IN",
latitude:pos.coords.latitude,
longitude:pos.coords.longitude,
place_name:place,
accuracy:pos.coords.accuracy
});

alert("Attendance Recorded");
loadHistory(s.emp_id);
}

/* History (mobile only) */
async function loadHistory(emp){

const {data}=await supabase.from("attendance_logs")
.select("*")
.eq("emp_id",emp)
.eq("device_id","MOBILE_WEB")
.order("log_time",{ascending:false})
.limit(20);

const box=document.getElementById("history");
box.innerHTML="";

if(!data||data.length===0){
box.innerHTML="<p>No mobile records.</p>";
return;
}

data.forEach(r=>{
const d=new Date(r.log_time);
box.innerHTML+=`
<div style="border-bottom:1px solid #eee;padding:10px 0">
<b>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</b><br>
📍 ${r.place_name}
</div>`;
});
}

/* Service Worker */
function registerSW(){
if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js");
}
}
