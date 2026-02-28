import { supabase } from "./supabase.js";

const page = window.location.pathname.split("/").pop();
const employee = JSON.parse(localStorage.getItem("employee"));

if(page==="dashboard.html" && !employee)
  window.location.href="index.html";

if((page===""||page==="index.html") && employee)
  window.location.href="dashboard.html";

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

window.addEventListener("DOMContentLoaded",async()=>{
  if(!employee) return;

  document.getElementById("name").innerText=employee.full_name;
  document.getElementById("empid").innerText=employee.emp_id;

  await detectTodayAttendance();
  await loadHistory();
  syncOffline();
});

async function detectTodayAttendance(){
  const start=new Date();
  start.setHours(0,0,0,0);
  const end=new Date(start);
  end.setDate(start.getDate()+1);

  const {data}=await supabase
    .from("attendance_logs")
    .select("id")
    .eq("emp_id",employee.emp_id)
    .eq("status","IN")
    .gte("log_time",start.toISOString())
    .lt("log_time",end.toISOString())
    .limit(1);

  if(data && data.length>0) setActive();
}

function setActive(){
  const badge=document.getElementById("statusBadge");
  const btn=document.getElementById("clockBtn");

  badge.innerText="Active";
  badge.className="badge success";
  btn.disabled=true;
  btn.innerText="Already Clocked In";
}

window.clockIn=function(){
  const btn=document.getElementById("clockBtn");
  btn.disabled=true;
  btn.innerText="Processing...";

  navigator.geolocation.getCurrentPosition(async pos=>{
    const record={
      emp_id:employee.emp_id,
      log_time:new Date().toISOString(),
      device_id:"MOBILE_WEB",
      status:"IN",
      latitude:pos.coords.latitude,
      longitude:pos.coords.longitude,
      accuracy:pos.coords.accuracy
    };

    if(navigator.onLine) await upload(record);
    else{
      saveOffline(record);
      alert("Saved offline. Will auto-sync.");
    }

    setActive();
    loadHistory();

  },()=>{
    alert("Enable GPS");
    btn.disabled=false;
    btn.innerText="Clock In";
  },{enableHighAccuracy:true});
};

async function upload(record){
  const {error}=await supabase
    .from("attendance_logs")
    .insert(record);
  if(error) saveOffline(record);
}

function saveOffline(record){
  let logs=JSON.parse(localStorage.getItem("offlineLogs"))||[];
  logs.push(record);
  localStorage.setItem("offlineLogs",JSON.stringify(logs));
}

window.addEventListener("online",syncOffline);

async function syncOffline(){
  let logs=JSON.parse(localStorage.getItem("offlineLogs"))||[];
  for(const log of logs) await upload(log);
  localStorage.removeItem("offlineLogs");
}

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
    container.innerHTML="<p>No attendance records.</p>";
    return;
  }

  data.forEach(row=>{
    const d=new Date(row.log_time);
    container.innerHTML+=`
      <div class="history-item">
        <div>
          <strong>${d.toLocaleDateString()}</strong><br>
          <span class="time">${d.toLocaleTimeString()}</span><br>
          <span class="location">📍 ${row.latitude}, ${row.longitude}</span>
        </div>
        <div class="device-tag">Mobile</div>
      </div>`;
  });
}

window.logout=function(){
  localStorage.removeItem("employee");
  window.location="index.html";
};
