
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL="YOUR_SUPABASE_URL";
const SUPABASE_KEY="YOUR_SUPABASE_KEY";

const db=createClient(SUPABASE_URL,SUPABASE_KEY);
const app=document.getElementById("app");

function deviceID(){
let id=localStorage.device_id;
if(!id){
id="DAR-"+crypto.randomUUID();
localStorage.device_id=id;
}
return id;
}

let user=JSON.parse(localStorage.user||"null");

if(user) dashboard();
else loginUI();

function loginUI(){
app.innerHTML=`
<div class="card">
<img src="dar_logo.png" class="logo">
<h1>DAR CAMARINES SUR 1</h1>
<div class="subtitle">Field Attendance Monitoring System</div>

<input id="emp" placeholder="Employee ID">
<input id="pass" type="password" placeholder="Password">

<button id="loginBtn">Login</button>
<div id="msg"></div>
</div>`;

document.getElementById("loginBtn").onclick=login;
}

async function login(){

try{

const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const {data,error}=await db
.from("employees")
.select("*")
.eq("emp_id",emp)
.single();

if(error||!data) throw Error("User not found");
if(data.pass!==pass) throw Error("Invalid password");

if(!data.mobile_device_id){
await db.from("employees")
.update({mobile_device_id:deviceID()})
.eq("emp_id",emp);
}
else if(data.mobile_device_id!==deviceID()){
throw Error("Registered to another device");
}

localStorage.user=JSON.stringify(data);
user=data;

dashboard();

}catch(e){
document.getElementById("msg").innerText=e.message;
}
}

function dashboard(){
app.innerHTML=`
<div class="card">
<img src="dar_logo.png" class="logo">
<h1>Field Attendance</h1>

<button id="inBtn">Clock In</button>
<button id="outBtn" class="gold">Clock Out</button>

<h3>Last 20 Mobile Logs</h3>
<div id="logs"></div>
</div>`;

document.getElementById("inBtn").onclick=()=>clock("IN");
document.getElementById("outBtn").onclick=()=>clock("OUT");

loadLogs();
}

async function loadLogs(){

const {data,error}=await db
.from("attendance_logs")
.select("*")
.eq("emp_id",user.emp_id)
.eq("device_type","MOBILE_WEB")
.order("log_time",{ascending:false})
.limit(20);

if(error) return alert(error.message);

const logs=document.getElementById("logs");

logs.innerHTML=data.map(l=>`
<div class="log">
<b>${new Date(l.log_time).toLocaleString()}</b><br>
📍 ${l.place_name || "Location unavailable"}
</div>`).join("");
}

async function clock(type){

if(!navigator.geolocation){
alert("GPS not supported");
return;
}

navigator.geolocation.getCurrentPosition(async pos=>{

try{

const lat=pos.coords.latitude;
const lng=pos.coords.longitude;
const acc=pos.coords.accuracy;

if(acc>50) throw Error("GPS accuracy too low");

const geo=await fetch(
`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
);

const g=await geo.json();

const {error}=await db
.from("attendance_logs")
.insert({
emp_id:user.emp_id,
status:type,
device_id:deviceID(),
latitude:lat,
longitude:lng,
accuracy:acc,
place_name:g.display_name,
device_type:"MOBILE_WEB"
});

if(error) throw error;

alert("Attendance saved");
loadLogs();

}catch(e){
alert("ERROR: "+e.message);
}

},{
enableHighAccuracy:true,
maximumAge:0,
timeout:15000
});
}
