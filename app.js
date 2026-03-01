
const SUPABASE_URL="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const API_KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={apikey:API_KEY,"Content-Type":"application/json"};

function getDeviceId(){
 let id=localStorage.getItem("dar_device_id");
 if(!id){
   id=crypto.randomUUID();
   localStorage.setItem("dar_device_id",id);
 }
 return id;
}

async function login(){
 try{
 const emp=document.getElementById("emp").value.trim();
 const pass=document.getElementById("pass").value.trim();

 const res=await fetch(`${SUPABASE_URL}/employees?emp_id=eq.${emp}`,{headers});
 const data=await res.json();

 if(!data.length) throw "Employee not found";

 const user=data[0];

 if(!bcrypt.compareSync(pass,user.pass))
   throw "Invalid password";

 const deviceId=getDeviceId();

 if(user.mobile_device_id && user.mobile_device_id!==deviceId)
   throw "Registered to another device";

 if(!user.mobile_device_id){
   await fetch(`${SUPABASE_URL}/employees?emp_id=eq.${emp}`,{
     method:"PATCH",
     headers,
     body:JSON.stringify({mobile_device_id:deviceId})
   });
 }

 localStorage.setItem("session_emp",emp);
 localStorage.setItem("session_name",user.full_name);

 location.href="dashboard.html";

 }catch(e){
 document.getElementById("error").innerText=e;
 }
}

function logout(){
 localStorage.clear();
 location.href="index.html";
}

async function clockIn(){
 const emp=localStorage.getItem("session_emp");
 if(!emp) return;

 const btn=document.getElementById("clockBtn");
 btn.disabled=true;

 try{

 const today=new Date().toISOString().split("T")[0];

 const check=await fetch(
 `${SUPABASE_URL}/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&log_time=gte.${today}T00:00:00`,
 {headers});

 const exist=await check.json();
 if(exist.length>0) throw "Already clocked in today";

 const pos=await new Promise((res,rej)=>{
 navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true});
 });

 const payload={
   emp_id:emp,
   device_id:"MOBILE_WEB",
   status:"IN",
   log_time:new Date().toISOString(),
   latitude:pos.coords.latitude,
   longitude:pos.coords.longitude
 };

 const save=await fetch(`${SUPABASE_URL}/attendance_logs`,{
   method:"POST",
   headers:{...headers,Prefer:"return=minimal"},
   body:JSON.stringify(payload)
 });

 if(!save.ok) throw "Database save failed";

 document.getElementById("status").innerText="Attendance recorded";
 loadHistory();

 }catch(e){
 document.getElementById("status").innerText=e;
 }

 btn.disabled=false;
}

async function loadHistory(){
 const emp=localStorage.getItem("session_emp");
 if(!emp) return;

 const res=await fetch(
 `${SUPABASE_URL}/attendance_logs?emp_id=eq.${emp}&device_id=eq.MOBILE_WEB&order=log_time.desc&limit=20`,
 {headers});

 const logs=await res.json();

 const div=document.getElementById("history");
 if(!div) return;

 div.innerHTML=logs.map(l=>`
 <div style="text-align:left;padding:8px 0;border-bottom:1px solid #eee">
 <b>${new Date(l.log_time).toLocaleString()}</b>
 </div>`).join("");
}

if(location.pathname.includes("dashboard")){
 const emp=localStorage.getItem("session_emp");
 if(!emp) location.href="index.html";
 else{
   document.addEventListener("DOMContentLoaded",()=>{
     document.getElementById("name").innerText=localStorage.getItem("session_name");
     document.getElementById("empid").innerText=emp;
     loadHistory();
   });
 }
}
