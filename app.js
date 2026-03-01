import { supabase } from "./supabase.js";

const employee = JSON.parse(localStorage.getItem("employee"));

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

window.login = async function(){

  const emp = document.getElementById("emp").value.trim();
  const pass = document.getElementById("pass").value;

  const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("emp_id", emp)
      .single();

  if(!data){
      alert("Invalid Employee ID");
      return;
  }

  const valid = bcrypt.compareSync(pass, data.pass);

  if(!valid){
      alert("Invalid Password");
      return;
  }

  const deviceId = getDeviceId();

  if(isMobile()){

      const { data: used } = await supabase
          .from("employees")
          .select("emp_id")
          .eq("mobile_device_id", deviceId);

      if(used.length > 0 && used[0].emp_id !== emp){
          alert("This mobile device is already registered to another employee.");
          return;
      }

      if(!data.mobile_device_id){
          await supabase.from("employees")
              .update({ mobile_device_id: deviceId })
              .eq("emp_id", emp);
      }
      else if(data.mobile_device_id !== deviceId){
          alert("Account already linked to another mobile device.");
          return;
      }
  }

  localStorage.setItem("employee", JSON.stringify({
      emp_id:data.emp_id,
      full_name:data.full_name
  }));

  window.location="dashboard.html";
};

if(employee){
  window.addEventListener("DOMContentLoaded", initDashboard);
}

async function initDashboard(){

  document.getElementById("name").innerText = employee.full_name;
  document.getElementById("empid").innerText = employee.emp_id;

  const btn = document.getElementById("clockBtn");
  const notice = document.getElementById("deviceNotice");

  if(!isMobile()){
      btn.disabled = true;
      btn.innerText = "Laptop View‑Only Mode";
      notice.innerText = "Clock‑in allowed only on registered mobile device.";
  }else{
      btn.onclick = clockIn;
  }

  await loadHistory();
}

async function clockIn(){

  const pos = await new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(resolve,reject,{
          enableHighAccuracy:true,
          maximumAge:0,
          timeout:15000
      });
  });

  await supabase.from("attendance_logs").insert({
      emp_id: employee.emp_id,
      log_time: new Date().toISOString(),
      device_id: "MOBILE_WEB",
      status: "IN",
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
  });

  location.reload();
}

async function loadHistory(){

  const { data } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("emp_id", employee.emp_id)
      .eq("device_id","MOBILE_WEB")
      .order("log_time",{ascending:false})
      .limit(10);

  const container = document.getElementById("history");
  container.innerHTML = "";

  if(!data || data.length===0){
      container.innerHTML="<p>No field attendance records.</p>";
      return;
  }

  data.forEach(row=>{
      const d=new Date(row.log_time);
      container.innerHTML+=`
      <div class="history-item">
          <div>
              <strong>${d.toLocaleDateString()}</strong><br>
              <span class="time">${d.toLocaleTimeString()}</span>
          </div>
          <div class="device-tag">FIELD</div>
      </div>`;
  });
}

window.logout=function(){
  localStorage.removeItem("employee");
  window.location="index.html";
};
