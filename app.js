
const SUPABASE_URL="https://ytfpiyfapvybihlngxks.supabase.co";
const SUPABASE_KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={
"apikey":SUPABASE_KEY,
"Authorization":"Bearer "+SUPABASE_KEY,
"Content-Type":"application/json"
};

// SESSION CHECK
if(location.pathname.includes("dashboard")){
    const emp=sessionStorage.getItem("emp");
    if(!emp) location.href="index.html";
    else loadDashboard();
}

// LOGIN WITH ERROR DETECTION
async function login(){
try{
const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const res=await fetch(`${SUPABASE_URL}/rest/v1/employees?emp_id=eq.${emp}`,{headers});
const data=await res.json();

if(!data.length) throw "Employee not found";

// default password rule
if(pass!=="1111" && !data[0].pass.startsWith("$2b$"))
    throw "Invalid password";

sessionStorage.setItem("emp",emp);
sessionStorage.setItem("name",data[0].full_name);

location.href="dashboard.html";

}catch(err){
document.getElementById("loginError").innerText=err;
}
}

// DASHBOARD LOAD
function loadDashboard(){
document.getElementById("name").innerText=sessionStorage.getItem("name");
document.getElementById("empid").innerText=sessionStorage.getItem("emp");
fetchHistory();
}

// CLOCK IN WITH FULL ERROR CHECK
async function clockIn(){

const btn=document.getElementById("clockBtn");
btn.disabled=true;

try{

const emp=sessionStorage.getItem("emp");
if(!emp) throw "Session expired";

// CHECK TODAY ENTRY
const today=new Date().toISOString().split("T")[0];

const check=await fetch(
`${SUPABASE_URL}/rest/v1/attendance_logs?emp_id=eq.${emp}&log_time=gte.${today}T00:00:00&device_id=eq.MOBILE_WEB`,
{headers});

const existing=await check.json();

if(existing.length>0)
    throw "Already clocked in today";

// GPS
const pos=await new Promise((resolve,reject)=>{
navigator.geolocation.getCurrentPosition(resolve,reject,
{enableHighAccuracy:true,maximumAge:0,timeout:15000});
});

const now=new Date().toISOString();

const payload={
emp_id:emp,
log_time:now,
created_at:now,
device_id:"MOBILE_WEB",
status:"IN",
latitude:pos.coords.latitude,
longitude:pos.coords.longitude
};

const save=await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs`,{
method:"POST",
headers:{...headers,"Prefer":"return=representation"},
body:JSON.stringify(payload)
});

const result=await save.json();

if(!save.ok)
    throw JSON.stringify(result);

alert("Attendance recorded");
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
<div style="padding:8px 0;border-bottom:1px solid #eee">
<b>${new Date(l.log_time).toLocaleString()}</b><br>
${l.place_name || "Location recorded"}
</div>`;
});
}

function logout(){
sessionStorage.clear();
location.href="index.html";
}
