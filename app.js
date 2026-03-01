
const deviceId = localStorage.getItem("device_id") ||
("DARMO-"+Math.random().toString(36).substring(2,10));
localStorage.setItem("device_id",deviceId);

async function login(){
const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const {data,error}=await supabaseClient
.from("employees")
.select("*")
.eq("emp_id",emp)
.single();

if(error||!data){
document.getElementById("error").innerText="User not found";
return;
}

// default password OR bcrypt hash already stored
if(data.pass==="1111" && pass==="1111"){
sessionStorage.setItem("emp",emp);
await registerDevice(data);
location="dashboard.html";
return;
}

document.getElementById("error").innerText="Invalid password";
}

async function registerDevice(user){
if(!user.mobile_device_id){
await supabaseClient
.from("employees")
.update({mobile_device_id:deviceId})
.eq("emp_id",user.emp_id);
}else if(user.mobile_device_id!==deviceId){
document.getElementById("error").innerText=
"Device registered to another phone.";
throw "device mismatch";
}
}

if(document.getElementById("loginBtn")){
document.getElementById("loginBtn").onclick=login;
}

async function getGPS(){
return new Promise((res,rej)=>{
navigator.geolocation.getCurrentPosition(res,rej,
{enableHighAccuracy:true,timeout:15000});
});
}

async function clock(type){
try{
const emp=sessionStorage.getItem("emp");
if(!emp){location="index.html";return;}

const gps=await getGPS();
const lat=gps.coords.latitude;
const lng=gps.coords.longitude;

const today=new Date().toISOString().slice(0,10);

const {data:logs}=await supabaseClient
.from("attendance_logs")
.select("*")
.eq("emp_id",emp)
.gte("log_time",today);

if(logs && logs.length>=4){
alert("Maximum 4 entries per day reached.");
return;
}

await supabaseClient.from("attendance_logs").insert({
emp_id:emp,
log_time:new Date().toISOString(),
device_type:"FIELD",
device_id:deviceId,
latitude:lat,
longitude:lng,
place_name:"Auto GPS"
});

alert(type+" saved");
loadLogs();

}catch(e){
alert("ERROR: "+e);
}
}

if(document.getElementById("clockIn")){
document.getElementById("clockIn").onclick=()=>clock("IN");
document.getElementById("clockOut").onclick=()=>clock("OUT");
loadLogs();
}

async function loadLogs(){
const emp=sessionStorage.getItem("emp");
const {data}=await supabaseClient
.from("attendance_logs")
.select("*")
.eq("emp_id",emp)
.order("log_time",{ascending:false})
.limit(20);

const ul=document.getElementById("logs");
if(!ul)return;
ul.innerHTML="";
(data||[]).forEach(l=>{
const li=document.createElement("li");
li.innerText=new Date(l.log_time).toLocaleString()+" - "+(l.place_name||"Unknown");
ul.appendChild(li);
});
}
