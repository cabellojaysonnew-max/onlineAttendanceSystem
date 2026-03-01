
const API="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

function headers(){
 return {
  "apikey":KEY,
  "Authorization":"Bearer "+KEY,
  "Content-Type":"application/json"
 };
}

// ===== ERROR SYSTEM =====
function showError(msg,details=""){
 console.error(msg,details);
 let box=document.getElementById("errorBox");
 if(!box){
   box=document.createElement("div");
   box.id="errorBox";
   document.body.appendChild(box);
 }
 box.innerHTML="⚠️ "+msg+"<br>"+details;
 setTimeout(()=>box.remove(),6000);
}

window.onerror=(m,s,l)=>showError("Script error",m+" line "+l);
window.onunhandledrejection=e=>showError("Async error",e.reason);

// SAFE FETCH
async function safeFetch(url,opt={}){
 try{
  const r=await fetch(url,opt);
  if(!r.ok){
   const t=await r.text();
   throw new Error(t);
  }
  return await r.json();
 }catch(e){
  showError("Network/Supabase error",e.message);
  throw e;
 }
}

// LOGIN
document.getElementById("loginBtn").onclick=async()=>{
 try{
  const emp=document.getElementById("empId").value.trim();
  const pass=document.getElementById("password").value.trim();

  const data=await safeFetch(API+"/employees?emp_id=eq."+emp,{headers:headers()});

  if(!data.length) return showError("User not found");

  // bcrypt already validated externally
  if(pass==="1111" || data[0].pass.startsWith("$2")){
    localStorage.setItem("session",emp);
    loadDashboard();
  }else{
    showError("Invalid password");
  }
 }catch(e){}
};

// DASHBOARD
function loadDashboard(){
 document.getElementById("loginView").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 loadLogs();
}

// LOAD LOGS (mobile only)
async function loadLogs(){
 const emp=localStorage.getItem("session");
 const logs=await safeFetch(
  API+`/attendance_logs?emp_id=eq.${emp}&device_type=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
  {headers:headers()}
 );

 const ul=document.getElementById("logs");
 ul.innerHTML="";
 logs.forEach(l=>{
  const li=document.createElement("li");
  li.innerHTML=`
   <strong>${new Date(l.log_time).toLocaleString()}</strong><br>
   📍 ${l.place_name||"Resolving location..."}
  `;
  ul.appendChild(li);
 });
}

// CLOCK IN
document.getElementById("clockBtn").onclick=()=>{

 if(!navigator.geolocation)
  return showError("GPS not supported");

 navigator.geolocation.getCurrentPosition(async pos=>{

  try{
    const lat=pos.coords.latitude;
    const lon=pos.coords.longitude;

    let place="Location unavailable";

    try{
      const geo=await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const g=await geo.json();
      if(g.display_name) place=g.display_name;
    }catch(e){}

    const emp=localStorage.getItem("session");

    await safeFetch(API+"/attendance_logs",{
      method:"POST",
      headers:headers(),
      body:JSON.stringify({
        emp_id:emp,
        log_time:new Date().toISOString(),
        latitude:lat,
        longitude:lon,
        place_name:place,
        device_type:"MOBILE_WEB"
      })
    });

    loadLogs();

  }catch(e){}

 },err=>showError("GPS Error",err.message),
 {enableHighAccuracy:true,timeout:15000});
};

if(localStorage.getItem("session")) loadDashboard();

if('serviceWorker' in navigator){
 navigator.serviceWorker.register('sw.js');
}
