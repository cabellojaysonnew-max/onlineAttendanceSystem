
const API="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

function headers(){
 return {
  "apikey":KEY,
  "Authorization":"Bearer "+KEY,
  "Content-Type":"application/json"
 };
}

function showError(msg){
 const box=document.getElementById("errorBox");
 box.innerText="⚠️ "+msg;
 box.classList.remove("hidden");
 setTimeout(()=>box.classList.add("hidden"),5000);
}

async function safeFetch(url,opt={}){
 const r=await fetch(url,opt);
 if(!r.ok){
   const t=await r.text();
   showError(t);
   throw new Error(t);
 }
 return await r.json();
}

function isMobile(){
 return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* STABLE DEVICE ID */
function getDeviceId(emp){
 let id=localStorage.getItem("device_id");
 if(!id){
   id="DAR-"+emp+"-"+crypto.randomUUID();
   localStorage.setItem("device_id",id);
 }
 return id;
}

/* LOGIN */
document.getElementById("loginBtn").onclick=async()=>{

 try{
 const emp=document.getElementById("empId").value.trim();
 const pass=document.getElementById("password").value.trim();

 const users=await safeFetch(API+"/employees?emp_id=eq."+emp,{headers:headers()});
 if(!users.length) return showError("User not found");

 const user=users[0];

 if(!(pass==="1111" || user.pass.startsWith("$2")))
   return showError("Invalid password");

 const deviceId=getDeviceId(emp);

 /* REGISTER FIRST DEVICE */
 if(!user.mobile_device_id){
   await fetch(API+"/employees?emp_id=eq."+emp,{
     method:"PATCH",
     headers:headers(),
     body:JSON.stringify({mobile_device_id:deviceId})
   });
 }
 else if(user.mobile_device_id!==deviceId){
   return showError("Account already registered to another mobile device.");
 }

 localStorage.setItem("session",emp);
 loadDashboard();

 }catch(e){}
};

/* DASHBOARD */
function loadDashboard(){
 document.getElementById("loginCard").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");

 if(!isMobile()){
   document.getElementById("clockInBtn").disabled=true;
   document.getElementById("clockOutBtn").disabled=true;
   showError("View‑only mode on desktop/laptop.");
 }

 loadLogs();
 syncOffline();
}

/* LOAD LOGS */
async function loadLogs(){
 const emp=localStorage.getItem("session");

 const logs=await safeFetch(
 API+`/attendance_logs?emp_id=eq.${emp}&device_type=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
 {headers:headers()}
 );

 const grouped={};

 logs.forEach(l=>{
   const day=l.log_time.split("T")[0];
   if(!grouped[day]) grouped[day]={};
   if(l.log_type==="IN") grouped[day].in=l;
   if(l.log_type==="OUT") grouped[day].out=l;
 });

 const ul=document.getElementById("logs");
 ul.innerHTML="";

 Object.keys(grouped).forEach(day=>{
   const rec=grouped[day];
   const li=document.createElement("li");

   let html="";
   if(rec.in){
     html+=`🟢 IN: ${new Date(rec.in.log_time).toLocaleString()}<br>
     📍 ${rec.in.place_name||"Location unavailable"}<br>`;
   }
   if(rec.out){
     html+=`🔴 OUT: ${new Date(rec.out.log_time).toLocaleString()}<br>
     📍 ${rec.out.place_name||"Location unavailable"}`;
   }

   li.innerHTML=html;
   ul.appendChild(li);
 });
}

/* OFFLINE CACHE */
function saveOffline(body){
 let q = JSON.parse(localStorage.getItem("offline_logs") || "[]");
 q.push(body);
 localStorage.setItem("offline_logs",JSON.stringify(q));
 showError("Saved offline. Will sync automatically.");
}

/* CLOCK */
function clock(type){

navigator.geolocation.getCurrentPosition(async pos=>{

 const emp=localStorage.getItem("session");

 const body={
   emp_id:emp,
   log_time:new Date().toISOString(),
   latitude:pos.coords.latitude,
   longitude:pos.coords.longitude,
   device_type:"MOBILE_WEB",
   log_type:type
 };

 if(!navigator.onLine){
   saveOffline(body);
   return;
 }

 try{
   await fetch(API+"/attendance_logs",{
     method:"POST",
     headers:headers(),
     body:JSON.stringify(body)
   });
   loadLogs();
 }catch(e){
   saveOffline(body);
 }

},err=>showError(err.message),
{enableHighAccuracy:true,maximumAge:0,timeout:15000});
}

document.getElementById("clockInBtn").onclick=()=>clock("IN");
document.getElementById("clockOutBtn").onclick=()=>clock("OUT");

/* SYNC OFFLINE */
async function syncOffline(){
 if(!navigator.onLine) return;

 let q = JSON.parse(localStorage.getItem("offline_logs") || "[]");
 if(!q.length) return;

 for(const log of q){
   try{
     await fetch(API+"/attendance_logs",{
       method:"POST",
       headers:headers(),
       body:JSON.stringify(log)
     });
   }catch(e){return;}
 }

 localStorage.removeItem("offline_logs");
 loadLogs();
}

window.addEventListener("online",syncOffline);

if(localStorage.getItem("session")) loadDashboard();
