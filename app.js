
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
 alert("⚠️ "+msg);
}

async function safeFetch(url,opt={}){
 const r=await fetch(url,opt);
 if(!r.ok){
   const t=await r.text();
   throw new Error(t);
 }
 return await r.json();
}

// DEVICE ID
function getDeviceId(emp){
 let id=localStorage.getItem("device_id");
 if(!id){
   id="DARMO-"+emp+"-"+Math.random().toString(36).substring(2,10);
   localStorage.setItem("device_id",id);
 }
 return id;
}

// LOGIN
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

 // register first device
 if(!user.mobile_device_id){
   await fetch(API+"/employees?emp_id=eq."+emp,{
     method:"PATCH",
     headers:headers(),
     body:JSON.stringify({mobile_device_id:deviceId})
   });
 }else if(user.mobile_device_id!==deviceId){
   return showError("Account registered to another mobile device");
 }

 localStorage.setItem("session",emp);
 loadDashboard();

 }catch(e){showError(e.message)}
};

// DASHBOARD
function loadDashboard(){
 document.getElementById("loginCard").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 loadLogs();
 syncOffline();
}

// LOAD MOBILE LOGS ONLY
async function loadLogs(){
 const emp=localStorage.getItem("session");

 const logs=await safeFetch(
 API+`/attendance_logs?emp_id=eq.${emp}&device_type=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
 {headers:headers()});

 const ul=document.getElementById("logs");
 ul.innerHTML="";

 logs.forEach(l=>{
   const li=document.createElement("li");
   li.innerHTML=`
     <strong>${new Date(l.log_time).toLocaleString()}</strong><br>
     📍 ${l.place_name||"Location unavailable"}
   `;
   ul.appendChild(li);
 });
}

// OFFLINE QUEUE
function saveOffline(body){
 let q=JSON.parse(localStorage.getItem("offline_logs")||"[]");
 q.push(body);
 localStorage.setItem("offline_logs",JSON.stringify(q));
 alert("Saved offline. Will sync automatically.");
}

// CLOCK IN
document.getElementById("clockBtn").onclick=()=>{

navigator.geolocation.getCurrentPosition(async pos=>{

 const emp=localStorage.getItem("session");
 const body={
   emp_id:emp,
   log_time:new Date().toISOString(),
   latitude:pos.coords.latitude,
   longitude:pos.coords.longitude,
   device_type:"MOBILE_WEB"
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

},()=>showError("GPS required"),
{enableHighAccuracy:true,maximumAge:0,timeout:15000});

};

// SYNC OFFLINE
async function syncOffline(){
 if(!navigator.onLine) return;

 let q=JSON.parse(localStorage.getItem("offline_logs")||"[]");
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

if('serviceWorker' in navigator){
 navigator.serviceWorker.register('sw.js');
}
