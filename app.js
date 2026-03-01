import bcrypt from "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/+esm";
import { supabase } from "./supabase.js";

function isMobile(){
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getDeviceId(){
  let id = localStorage.getItem("device_id");
  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  if(loginBtn){
    loginBtn.addEventListener("click", login);
  }

  const employee = JSON.parse(localStorage.getItem("employee"));
  if(employee){
    initDashboard(employee);
  }
});

async function login(){

  const emp=document.getElementById("emp").value.trim();
  const pass=document.getElementById("pass").value;

  const { data,error }=await supabase
    .from("employees")
    .select("*")
    .eq("emp_id",emp)
    .single();

  if(error||!data){ alert("Invalid Employee ID"); return; }

  const valid=bcrypt.compareSync(pass,data.pass);
  if(!valid){ alert("Invalid Password"); return; }

  const deviceId=getDeviceId();

  if(isMobile()){
    if(!data.mobile_device_id){
      await supabase.from("employees")
        .update({mobile_device_id:deviceId})
        .eq("emp_id",emp);
    } else if(data.mobile_device_id!==deviceId){
      alert("Account already registered to another device.");
      return;
    }
  }

  localStorage.setItem("employee",JSON.stringify({
    emp_id:data.emp_id,
    full_name:data.full_name
  }));

  window.location="dashboard.html";
}

async function initDashboard(employee){

  const nameEl=document.getElementById("name");
  if(!nameEl) return;

  document.getElementById("name").innerText=employee.full_name;
  document.getElementById("empid").innerText=employee.emp_id;

  const clockBtn=document.getElementById("clockBtn");
  const logoutBtn=document.getElementById("logoutBtn");
  const notice=document.getElementById("deviceNotice");

  logoutBtn.addEventListener("click",logout);

  if(!isMobile()){
    clockBtn.disabled=true;
    clockBtn.innerText="Laptop View-Only Mode";
    notice.innerText="Clock-in allowed only on registered mobile device.";
  }else{
    clockBtn.addEventListener("click",clockIn);
  }

  await loadHistory(employee);
}

async function clockIn(){

  const employee=JSON.parse(localStorage.getItem("employee"));

  const pos=await new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(resolve,reject,{
      enableHighAccuracy:true,maximumAge:0,timeout:15000
    });
  });

  await supabase.from("attendance_logs").insert({
    emp_id:employee.emp_id,
    log_time:new Date().toISOString(),
    device_id:"MOBILE_WEB",
    status:"IN",
    latitude:pos.coords.latitude,
    longitude:pos.coords.longitude,
    accuracy:pos.coords.accuracy
  });

  location.reload();
}

async function getPlaceName(lat,lon){

  const key=`place_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached=localStorage.getItem(key);
  if(cached) return cached;

  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data=await res.json();
    const place=data.display_name||"Location unavailable";
    localStorage.setItem(key,place);
    return place;
  }catch{
    return "Location unavailable";
  }
}

async function loadHistory(employee){

  const container=document.getElementById("history");
  if(!container) return;

  const { data }=await supabase
    .from("attendance_logs")
    .select("*")
    .eq("emp_id",employee.emp_id)
    .eq("device_id","MOBILE_WEB")
    .order("log_time",{ascending:false})
    .limit(20);

  container.innerHTML="";

  if(!data||data.length===0){
    container.innerHTML="<p>No attendance records.</p>";
    return;
  }

  for(const row of data){
    const d=new Date(row.log_time);
    const place=await getPlaceName(row.latitude,row.longitude);

    container.innerHTML+=`
    <div class="history-item">
      <div>
        <div class="history-date">${d.toLocaleDateString()}</div>
        <div class="history-time">${d.toLocaleTimeString()}</div>
        <div class="history-location">📍 ${place}</div>
      </div>
      <div class="device-tag">FIELD</div>
    </div>`;
  }
}

function logout(){
  localStorage.removeItem("employee");
  window.location="index.html";
}
