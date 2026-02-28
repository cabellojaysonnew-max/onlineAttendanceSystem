import { supabase } from "./supabase.js";

/* SESSION GUARD */
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


/* DASHBOARD LOAD */
window.addEventListener("DOMContentLoaded",async()=>{

  if(!employee) return;

  document.getElementById("name").innerText=employee.full_name;
  document.getElementById("empid").innerText=employee.emp_id;

  await detectTodayAttendance();
  loadHistory();
});


/* FIXED STATUS DETECTION (refresh-safe) */
async function detectTodayAttendance(){

  const start=new Date();
  start.setHours(0,0,0,0);

  const {data}=await supabase
    .from("attendance_logs")
    .select("id")
    .eq("emp_id",employee.emp_id)
    .eq("status","IN")
    .gte("log_time",start.toISOString())
    .limit(1);

  if(data && data.length>0)
    setActive();
}


function setActive(){
  const badge=document.getElementById("statusBadge");
  const btn=document.getElementById("clockBtn");

  badge.innerText="Active";
  badge.className="badge success";

  btn.disabled=true;
  btn.innerText="Already Clocked In";
}


/* CLOCK IN */
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
      accuracy:pos.coords.accuracy,
      device_type:"MOBILE_WEB"
    };

    const {error}=await supabase
      .from("attendance_logs")
      .insert(record);

    if(error){
      alert(error.message);
      btn.disabled=false;
      btn.innerText="Clock In";
      return;
    }

    setActive();
    loadHistory();

  },()=>{
    alert("Enable GPS");
    btn.disabled=false;
    btn.innerText="Clock In";
  },{enableHighAccuracy:true});
};


/* HISTORY */
async function loadHistory(){

  const {data}=await supabase
    .from("attendance_logs")
    .select("*")
    .eq("emp_id",employee.emp_id)
    .order("log_time",{ascending:false})
    .limit(7);

  const container=document.getElementById("history");
  container.innerHTML="";

  if(!data) return;

  data.forEach(row=>{

    const d=new Date(row.log_time);

    container.innerHTML+=`
      <div class="history-item">
        <div>
          <strong>${d.toLocaleDateString()}</strong><br>
          ${d.toLocaleTimeString()}
        </div>
        <span class="badge success">IN</span>
      </div>`;
  });
}


/* LOGOUT */
window.logout=function(){
  localStorage.removeItem("employee");
  window.location="index.html";
};
