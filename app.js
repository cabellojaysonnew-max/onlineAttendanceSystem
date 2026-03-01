
const SUPABASE_URL="https://ytfpiyfapvybihlngxks.supabase.co";
const SUPABASE_KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={
"apikey":SUPABASE_KEY,
"Authorization":"Bearer "+SUPABASE_KEY,
"Content-Type":"application/json"
};

// DEVICE ID (first login binds device)
function getDeviceId(){
let id=localStorage.getItem("dar_device_id");
if(!id){
id=crypto.randomUUID();
localStorage.setItem("dar_device_id",id);
}
return id;
}

// SESSION CHECK
if(location.pathname.includes("dashboard")){
const emp=sessionStorage.getItem("emp");
if(!emp) location.href="index.html";
else initDashboard();
}

// LOGIN
async function login(){
try{
const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const res=await fetch(`${SUPABASE_URL}/rest/v1/employees?emp_id=eq.${emp}`,{headers});
const data=await res.json();

if(!data.length) throw "Employee not found";

const deviceId=getDeviceId();

// Register first device
if(!data[0].mobile_device_id){
await fetch(`${SUPABASE_URL}/rest/v1/employees?emp_id=eq.${emp}`,{
method:"PATCH",
headers,
body:JSON.stringify({mobile_device_id:deviceId})
});
}else if(data[0].mobile_device_id!==deviceId){
throw "Account registered to another mobile device";
}

sessionStorage.setItem("emp",emp);
sessionStorage.setItem("name",data[0].full_name);

location.href="dashboard.html";

}catch(err){
document.getElementById("loginError").innerText=err;
}
}

// DASHBOARD
function initDashboard(){
document.getElementById("name").innerText=sessionStorage.getItem("name");
document.getElementById("empid").innerText=sessionStorage.getItem("emp");
detectLocation();
fetchHistory();
}

// Reverse geocode
async function reverseGeocode(lat,lon){
const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
const d=await r.json();
return d.display_name || "Location detected";
}

// GPS detect
function detectLocation(){
navigator.geolocation.getCurrentPosition(async pos=>{
const place=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
document.getElementById("location").innerText=place;
},{enableHighAccuracy:true,maximumAge:0});
}

// CLOCK IN
async function clockIn(){

const btn=document.getElementById("clockBtn");
btn.disabled=true;

try{

const emp=sessionStorage.getItem("emp");
if(!emp) throw "Session expired";

const today=new Date().toISOString().split("T")[0];

// Prevent multiple entry
const check=await fetch(
`${SUPABASE_URL}/rest/v1/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&log_time=gte.${today}T00:00:00`,
{headers});

const exist=await check.json();
if(exist.length>0) throw "Already clocked in today";

const pos=await new Promise((resolve,reject)=>{
navigator.geolocation.getCurrentPosition(resolve,reject,
{enableHighAccuracy:true,maximumAge:0,timeout:15000});
});

const place=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
document.getElementById("location").innerText=place;

const now=new Date().toISOString();

const payload={
emp_id:emp,
log_time:now,
created_at:now,
device_id:"MOBILE_WEB",
status:"IN",
latitude:pos.coords.latitude,
longitude:pos.coords.longitude,
place_name:place,
address:place
};

const save=await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs`,{
method:"POST",
headers:{...headers,"Prefer":"return=representation"},
body:JSON.stringify(payload)
});

const result=await save.json();
if(!save.ok) throw JSON.stringify(result);

alert("✅ Attendance Recorded");
fetchHistory();

}catch(err){
document.getElementById("clockError").innerText=err;
console.error(err);
}

btn.disabled=false;
}

// HISTORY
async function fetchHistory(){
const emp=sessionStorage.getItem("emp");

const res=await fetch(
`${SUPABASE_URL}/rest/v1/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
{headers});

const logs=await res.json();

const div=document.getElementById("history");
div.innerHTML="";

logs.forEach(l=>{
div.innerHTML+=`
<div style="padding:10px 0;border-bottom:1px solid #eee">
<b>${new Date(l.log_time).toLocaleString()}</b><br>
📍 ${l.place_name || "Location recorded"}
</div>`;
});
}

function logout(){
sessionStorage.clear();
location.href="index.html";
}
