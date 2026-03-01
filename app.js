
// === CONFIG ===
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

// LOGIN
async function login(){
const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const res=await fetch(`${SUPABASE_URL}/rest/v1/employees?emp_id=eq.${emp}`,{headers});
const data=await res.json();

if(!data.length){alert("User not found");return;}

if(pass!=="1111" && !data[0].pass.startsWith("$2b$")){
alert("Invalid Password");return;
}

sessionStorage.setItem("emp",emp);
sessionStorage.setItem("name",data[0].full_name);

location.href="dashboard.html";
}

// DASHBOARD
function loadDashboard(){
document.getElementById("empName").innerText=sessionStorage.getItem("name");
document.getElementById("empId").innerText=sessionStorage.getItem("emp");
fetchHistory();
}

// CLOCK IN
async function clockIn(){
navigator.geolocation.getCurrentPosition(async pos=>{

const emp=sessionStorage.getItem("emp");

await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs`,{
method:"POST",
headers,
body:JSON.stringify({
emp_id:emp,
device_id:"MOBILE_WEB",
status:"IN",
log_time:new Date().toISOString(),
latitude:pos.coords.latitude,
longitude:pos.coords.longitude
})
});

alert("Attendance Recorded");
fetchHistory();

},{enableHighAccuracy:true});
}

// HISTORY
async function fetchHistory(){
const emp=sessionStorage.getItem("emp");

const res=await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&order=log_time.desc&limit=20`,{headers});

const logs=await res.json();

const container=document.getElementById("history");
container.innerHTML="";

logs.forEach(l=>{
container.innerHTML+=`
<div style="padding:8px 0;border-bottom:1px solid #eee">
<b>${new Date(l.log_time).toLocaleString()}</b>
<br/>
${l.place_name || "Location recorded"}
</div>`;
});
}

// LOGOUT
function logout(){
sessionStorage.clear();
location.href="index.html";
}
