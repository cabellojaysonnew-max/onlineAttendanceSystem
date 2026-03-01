import { supabase } from "./supabase.js";

const page = window.location.pathname.split("/").pop();
const employee = JSON.parse(localStorage.getItem("employee"));

if(page==="dashboard.html" && !employee)
  window.location.href="index.html";

if((page===""||page==="index.html") && employee)
  window.location.href="dashboard.html";

/* LOGIN */
window.login = async function(){
  const emp=document.getElementById("emp").value.trim();
  const pass=document.getElementById("pass").value.trim();

  const {data}=await supabase
    .from("employees")
    .select("*")
    .eq("emp_id",emp)
    .single();

  if(!data || pass!==data.pass){
    alert("Invalid login");
    return;
  }

  localStorage.setItem("employee",JSON.stringify(data));
  window.location="dashboard.html";
};

window.addEventListener("DOMContentLoaded", async ()=>{
  if(!employee) return;

  document.getElementById("name").innerText=employee.full_name;
  document.getElementById("empid").innerText=employee.emp_id;

  await detectTodayAttendance();
  await loadHistory();
});

/* CHECK TODAY */
async function detectTodayAttendance(){
  const start=new Date();
  start.setHours(0,0,0,0);
  const end=new Date(start);
  end.setDate(start.getDate()+1);

  const {data}=await supabase
    .from("attendance_logs")
    .select("id")
    .eq("emp_id",employee.emp_id)
    .eq("device_id","MOBILE_WEB")
    .gte("log_time",start.toISOString())
    .lt("log_time",end.toISOString());

  if(data && data.length>0){
    document.getElementById("statusBadge").innerText="Active";
    document.getElementById("statusBadge").className="badge success";

    const btn=document.getElementById("clockBtn");
    btn.disabled=true;
    btn.innerText="Already Clocked In";
  }
}

/* FORCE GPS REFRESH */
function getFreshLocation(){

  return new Promise((resolve,reject)=>{

    navigator.geolocation.getCurrentPosition(
      pos=>resolve(pos),
      err=>reject(err),
      {
        enableHighAccuracy:true,
        timeout:15000,
        maximumAge:0   // ⭐ FORCE NEW GPS FIX
      }
    );

  });
}

/* CLOCK IN */
window.clockIn = async function(){

  const btn=document.getElementById("clockBtn");
  btn.disabled=true;
  btn.innerText="Getting GPS...";

  try{

    // Request fresh GPS twice (fix slow devices)
    await getFreshLocation();
    const pos = await getFreshLocation();

    btn.innerText="Recording attendance...";

    const record={
      emp_id:employee.emp_id,
      log_time:new Date().toISOString(),
      device_id:"MOBILE_WEB",
      status:"IN",
      latitude:pos.coords.latitude,
      longitude:pos.coords.longitude,
      accuracy:pos.coords.accuracy
    };

    await supabase.from("attendance_logs").insert(record);

    location.reload();

  }catch(e){
    alert("Unable to get updated GPS. Please enable location.");
    btn.disabled=false;
    btn.innerText="Clock In";
  }
};

/* REVERSE GEOCODE */
async function getPlaceName(lat,lon){
 try{
  const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const d=await r.json();
  return d.display_name || "Unknown location";
 }catch{
  return "Location unavailable";
 }
}

/* LOAD HISTORY */
async function loadHistory(){

 const {data}=await supabase
  .from("attendance_logs")
  .select("*")
  .eq("emp_id",employee.emp_id)
  .eq("device_id","MOBILE_WEB")
  .order("log_time",{ascending:false})
  .limit(10);

 const container=document.getElementById("history");
 container.innerHTML="";

 if(!data || data.length===0){
  container.innerHTML="<p>No field attendance records.</p>";
  return;
 }

 for(const row of data){

  const d=new Date(row.log_time);
  let place="Loading location...";

  if(row.latitude && row.longitude)
    place=await getPlaceName(row.latitude,row.longitude);

  container.innerHTML+=`
   <div class="history-item">
     <div>
       <strong>${d.toLocaleDateString()}</strong><br>
       <span class="time">${d.toLocaleTimeString()}</span><br>
       <span class="location">📍 ${place}</span>
     </div>
     <div class="device-tag">FIELD</div>
   </div>`;
 }
}

window.logout=function(){
 localStorage.removeItem("employee");
 window.location="index.html";
};
