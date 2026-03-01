const SUPABASE="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={
apikey:KEY,
"Content-Type":"application/json"
};

const emp=localStorage.getItem("session_emp");
const name=localStorage.getItem("session_name");

if(!emp) location.href="index.html";

document.getElementById("name").innerText=name;
document.getElementById("empid").innerText=emp;

async function clockIn(){
try{
navigator.geolocation.getCurrentPosition(async pos=>{

const body={
emp_id:emp,
log_time:new Date().toISOString(),
device_id:"MOBILE_WEB",
latitude:pos.coords.latitude,
longitude:pos.coords.longitude,
device_type:"mobile"
};

const r=await fetch(`${SUPABASE}/attendance_logs`,{
method:"POST",
headers,
body:JSON.stringify(body)
});

if(!r.ok){
document.getElementById("errorBox").innerText="Save failed";
}else{
loadHistory();
}

});
}catch(e){
document.getElementById("errorBox").innerText=e.message;
}
}

document.getElementById("clockBtn").onclick=clockIn;

async function loadHistory(){
const res=await fetch(`${SUPABASE}/attendance_logs?emp_id=eq.${emp}&order=log_time.desc&limit=20`,{headers});
const data=await res.json();

const box=document.getElementById("history");
box.innerHTML="";

data.forEach(d=>{
box.innerHTML+=`<p>${new Date(d.log_time).toLocaleString()}</p>`;
});
}

loadHistory();

function logout(){
localStorage.clear();
location.href="index.html";
}
