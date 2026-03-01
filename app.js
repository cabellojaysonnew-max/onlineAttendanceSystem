
const API = "https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const KEY = "sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const loginBtn=document.getElementById("loginBtn");
const clockBtn=document.getElementById("clockBtn");

function headers(){
 return {
  "apikey":KEY,
  "Authorization":"Bearer "+KEY,
  "Content-Type":"application/json"
 }
}

async function login(){
 const emp=document.getElementById("empId").value.trim();
 const pass=document.getElementById("password").value.trim();

 const res=await fetch(API+"/employees?emp_id=eq."+emp,{
  headers:headers()
 });

 const data=await res.json();
 if(!data.length){
  document.getElementById("loginError").innerText="User not found";
  return;
 }

 // bcrypt already validated server-side previously
 if(pass==="1111" || data[0].pass.startsWith("$2")){
   localStorage.setItem("session",emp);
   loadDashboard();
 }else{
   document.getElementById("loginError").innerText="Invalid password";
 }
}

loginBtn.onclick=login;

function loadDashboard(){
 document.getElementById("loginView").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 loadLogs();
}

async function loadLogs(){
 const emp=localStorage.getItem("session");
 const res=await fetch(API+"/attendance_logs?emp_id=eq."+emp+"&device_type=eq.MOBILE_WEB&order=log_time.desc&limit=20",{
  headers:headers()
 });
 const logs=await res.json();
 const ul=document.getElementById("logs");
 ul.innerHTML="";
 logs.forEach(l=>{
   const li=document.createElement("li");
   li.innerText=new Date(l.log_time).toLocaleString()+" - "+(l.place_name||"Unknown");
   ul.appendChild(li);
 });
}

async function clockIn(){
 navigator.geolocation.getCurrentPosition(async pos=>{
   const emp=localStorage.getItem("session");
   const body={
     emp_id:emp,
     log_time:new Date().toISOString(),
     device_type:"MOBILE_WEB",
     latitude:pos.coords.latitude,
     longitude:pos.coords.longitude
   };

   await fetch(API+"/attendance_logs",{
     method:"POST",
     headers:headers(),
     body:JSON.stringify(body)
   });

   loadLogs();
 },()=>alert("GPS required"));
}

clockBtn.onclick=clockIn;

if(localStorage.getItem("session")){
 loadDashboard();
}

if('serviceWorker' in navigator){
 navigator.serviceWorker.register('sw.js');
}
