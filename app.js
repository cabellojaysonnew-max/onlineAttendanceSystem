
const SUPABASE_URL = "https://ytfpiyfapvybihlngxks.supabase.co";
const SUPABASE_KEY = "sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- DEVICE ----------
function getDeviceId(){
 let id = localStorage.getItem("device_id");
 if(!id){
   id="DARMO-"+crypto.randomUUID();
   localStorage.setItem("device_id",id);
 }
 return id;
}

// ---------- OFFLINE DB ----------
function openDB(){
 return new Promise((resolve)=>{
   const req=indexedDB.open("DAR_OFFLINE_DB",1);
   req.onupgradeneeded=e=>{
     e.target.result.createObjectStore("logs",{autoIncrement:true});
   };
   req.onsuccess=e=>resolve(e.target.result);
 });
}

async function saveOffline(log){
 const db=await openDB();
 const tx=db.transaction("logs","readwrite");
 tx.objectStore("logs").add(log);
}

async function syncOfflineLogs(){
 if(!navigator.onLine) return;
 const db=await openDB();
 const tx=db.transaction("logs","readwrite");
 const store=tx.objectStore("logs");

 store.openCursor().onsuccess=async e=>{
   const cursor=e.target.result;
   if(cursor){
     await supabase.from("attendance_logs").insert(cursor.value);
     store.delete(cursor.key);
     cursor.continue();
   }
 };
}

window.addEventListener("online",syncOfflineLogs);

// ---------- LOGIN ----------
async function login(){
 document.getElementById("error").innerText="";
 const emp=document.getElementById("empId").value.trim();
 const pass=document.getElementById("password").value;

 const res = await supabase.rpc("verify_password",{
   emp_input:emp,
   pass_input:pass
 });

 if(res.error || !res.data){
   showError("Invalid login");
   return;
 }

 localStorage.setItem("session_emp",emp);
 showDashboard(emp);
}

function showDashboard(emp){
 document.getElementById("loginCard").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 document.getElementById("welcome").innerText="Welcome "+emp;
 loadLogs();
}


// ---------- CLOCK IN ----------
async function clockIn(){
 const emp=localStorage.getItem("session_emp");
 const device=getDeviceId();

 navigator.geolocation.getCurrentPosition(async pos=>{

   const payload={
     emp_id:emp,
     log_time:new Date().toISOString(),
     device_id:device,
     device_type:"MOBILE_WEB",
     latitude:pos.coords.latitude,
     longitude:pos.coords.longitude
   };

   if(navigator.onLine){
     const {error}=await supabase
       .from("attendance_logs")
       .insert(payload);

     if(error){
       await saveOffline(payload);
       alert("Saved offline (connection issue)");
     }else{
       alert("Attendance saved");
     }
   }else{
     await saveOffline(payload);
     alert("Offline saved ✔");
   }

   loadLogs();

 },()=>showError("GPS permission denied"),{enableHighAccuracy:true});
}

// ---------- FETCH ----------
async function loadLogs(){
 const emp=localStorage.getItem("session_emp");

 const {data,error}=await supabase
   .from("attendance_logs")
   .select("*")
   .eq("emp_id",emp)
   .eq("device_type","MOBILE_WEB")
   .order("log_time",{ascending:false})
   .limit(20);

 if(error){ showError(error.message); return; }

 const ul=document.getElementById("logs");
 ul.innerHTML="";
 data.forEach(r=>{
   const li=document.createElement("li");
   li.innerText=new Date(r.log_time).toLocaleString();
   ul.appendChild(li);
 });
}

// ---------- SESSION ----------
const session=localStorage.getItem("session_emp");
if(session){
 showDashboard(session);
}

// ---------- LOGOUT ----------
function logout(){
 localStorage.removeItem("session_emp");
 location.reload();
}

function showError(msg){
 document.getElementById("error").innerText=msg;
}
