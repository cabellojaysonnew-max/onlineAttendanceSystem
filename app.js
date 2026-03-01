const SUPABASE_URL="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const API_KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={
apikey:API_KEY,
"Content-Type":"application/json"
};

function showError(msg){
const el=document.getElementById("error");
if(el) el.innerText=msg;
}

async function login(){

const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value;

if(!emp||!pass){
showError("Enter Employee ID and Password");
return;
}

const res=await fetch(`${SUPABASE_URL}/employees?emp_id=eq.${emp}`,{headers});
const data=await res.json();

if(!data.length){showError("Employee not found");return;}

const user=data[0];

let valid=false;

if(user.pass && user.pass.startsWith("$2")){
valid=bcrypt.compareSync(pass,user.pass);
}else{
valid=(pass===user.pass);
}

if(!valid){showError("Invalid password");return;}

localStorage.setItem("session_emp",user.emp_id);
localStorage.setItem("session_name",user.full_name);

location.href="dashboard.html";
}

async function loadDashboard(){

const emp=localStorage.getItem("session_emp");
if(!emp){location.href="index.html";return;}

document.getElementById("empName").innerText=localStorage.getItem("session_name");
document.getElementById("empId").innerText=emp;

loadHistory(emp);
checkToday(emp);
}

async function checkToday(emp){

const today=new Date().toISOString().split("T")[0];

const res=await fetch(
`${SUPABASE_URL}/attendance_logs?emp_id=eq.${emp}&log_time=gte.${today}T00:00:00`,
{headers}
);

const data=await res.json();

if(data.length){
document.getElementById("status").innerText="Already Clocked In";
document.getElementById("clockBtn").disabled=true;
}
}

function getGPS(){
return new Promise((resolve,reject)=>{
navigator.geolocation.getCurrentPosition(
pos=>resolve(pos.coords),
err=>reject(err),
{enableHighAccuracy:true,timeout:15000}
);
});
}

async function clockIn(){

const emp=localStorage.getItem("session_emp");

try{

const gps=await getGPS();

await fetch(`${SUPABASE_URL}/attendance_logs`,{
method:"POST",
headers:{...headers,Prefer:"return=minimal"},
body:JSON.stringify({
emp_id:emp,
log_time:new Date().toISOString(),
device_id:"MOBILE_WEB",
latitude:gps.latitude,
longitude:gps.longitude,
status:"IN"
})
});

alert("Attendance Recorded");
location.reload();

}catch(e){
alert("GPS or save failed");
}
}

async function loadHistory(emp){

const res=await fetch(
`${SUPABASE_URL}/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
{headers}
);

const data=await res.json();

const div=document.getElementById("history");
div.innerHTML="";

data.forEach(r=>{
div.innerHTML+=`
<p><b>${new Date(r.log_time).toLocaleString()}</b><br>
📍 ${r.address||"Location recorded"}</p><hr>`;
});
}

/* SAFE INITIALIZATION */
document.addEventListener("DOMContentLoaded",()=>{

const loginBtn=document.getElementById("loginBtn");
if(loginBtn) loginBtn.addEventListener("click",login);

const clockBtn=document.getElementById("clockBtn");
if(clockBtn){
clockBtn.addEventListener("click",clockIn);
loadDashboard();
}

});
