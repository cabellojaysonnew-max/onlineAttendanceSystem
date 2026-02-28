import { supabase } from "./supabase.js";

const API = "http://YOUR_PC_IP:8000/login";

window.login = async function () {

  const emp_id = document.getElementById("emp").value;
  const password = document.getElementById("pass").value;

  const res = await fetch(API,{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({emp_id,password})
  });

  const data = await res.json();

  if(data.success){
    localStorage.setItem("employee",
      JSON.stringify(data.employee));
    location="dashboard.html";
  }else{
    alert("Invalid login");
  }
};

window.clockIn = async function(){

  navigator.geolocation.getCurrentPosition(async (pos)=>{

    const employee =
      JSON.parse(localStorage.getItem("employee"));

    const record = {
      emp_id: employee.emp_id,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      log_time: new Date(),
      synced:false
    };

    if(navigator.onLine){
      await upload(record);
    }else{
      saveOffline(record);
    }

    document.getElementById("status").innerText =
      "Attendance Recorded";
  });
};

async function upload(data){
  const { error } = await supabase
    .from("attendance_logs")
    .insert(data);

  if(error){
    saveOffline(data);
  }
}

function saveOffline(log){
  let logs =
    JSON.parse(localStorage.getItem("offlineLogs")) || [];
  logs.push(log);
  localStorage.setItem("offlineLogs",
    JSON.stringify(logs));
}

window.addEventListener("online", syncOffline);

async function syncOffline(){
  let logs =
    JSON.parse(localStorage.getItem("offlineLogs")) || [];

  for(const log of logs){
    await upload(log);
  }

  localStorage.removeItem("offlineLogs");
}
