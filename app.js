
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

let user=null;

function saveSession(u){
 localStorage.setItem("dar_session",JSON.stringify(u));
}

function loadSession(){
 const s=localStorage.getItem("dar_session");
 if(s){
   user=JSON.parse(s);
   showDashboard();
 }
}

async function login(){
 const id=document.getElementById("empId").value.trim();
 const pass=document.getElementById("password").value.trim();

 const res=await fetch(SUPABASE_URL+"/rest/v1/employees?emp_id=eq."+id,{
   headers:{
     apikey:SUPABASE_KEY,
     Authorization:"Bearer "+SUPABASE_KEY
   }
 });

 const data=await res.json();
 if(!data.length){ alert("User not found"); return; }

 if(pass!==data[0].pass){
   alert("Invalid password");
   return;
 }

 user=data[0];
 saveSession(user);
 showDashboard();
}

function showDashboard(){
 document.getElementById("loginView").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 document.getElementById("userName").innerText=user.full_name;
 getLocation();
 loadLogs();
}

function getLocation(){
 navigator.geolocation.getCurrentPosition(async pos=>{
   const lat=pos.coords.latitude;
   const lon=pos.coords.longitude;

   localStorage.setItem("gps",JSON.stringify({lat,lon}));

   document.getElementById("location").innerText=
     "Lat:"+lat+" Lon:"+lon;

 },()=>alert("GPS required"),{enableHighAccuracy:true});
}

function offlineQueue(log){
 let q=JSON.parse(localStorage.getItem("offline_logs")||"[]");
 q.push(log);
 localStorage.setItem("offline_logs",JSON.stringify(q));
}

async function syncOffline(){
 if(!navigator.onLine) return;

 let q=JSON.parse(localStorage.getItem("offline_logs")||"[]");
 for(const log of q){
   await sendLog(log);
 }
 localStorage.removeItem("offline_logs");
}

async function sendLog(log){
 await fetch(SUPABASE_URL+"/rest/v1/attendance_logs",{
   method:"POST",
   headers:{
     apikey:SUPABASE_KEY,
     Authorization:"Bearer "+SUPABASE_KEY,
     "Content-Type":"application/json"
   },
   body:JSON.stringify(log)
 });
}

async function clock(type){

 const gps=JSON.parse(localStorage.getItem("gps")||"{}");

 if(!gps.lat){
   alert("Location not ready");
   return;
 }

 const log={
   emp_id:user.emp_id,
   log_time:new Date().toISOString(),
   device_id:"mobile_in",
   status:type,
   latitude:gps.lat,
   longitude:gps.lon,
   device_type:"MOBILE_WEB"
 };

 if(navigator.onLine){
   await sendLog(log);
 }else{
   offlineQueue(log);
 }

 loadLogs();
}

async function loadLogs(){

 const res=await fetch(
   SUPABASE_URL+"/rest/v1/attendance_logs?emp_id=eq."+user.emp_id+"&device_id=eq.mobile_in",
   {headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}}
 );

 const data=await res.json();
 const ul=document.getElementById("logs");
 ul.innerHTML="";
 data.slice(-4).forEach(l=>{
   const li=document.createElement("li");
   li.innerText=l.status+" "+new Date(l.log_time).toLocaleTimeString();
   ul.appendChild(li);
 });
}

window.addEventListener("online",syncOffline);
loadSession();
