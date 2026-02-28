import { supabase } from "./supabase.js";

/* LOGIN USING EMPLOYEES TABLE */
window.login = async function () {

  const emp = document.getElementById("emp").value.trim();
  const password = document.getElementById("pass").value.trim();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("emp_id", emp)
    .single();

  if (error || !data) {
    alert("Employee not found");
    return;
  }

  // Default password check (1111)
  if (password !== data.pass) {
    alert("Invalid login");
    return;
  }

  localStorage.setItem("employee", JSON.stringify(data));
  window.location = "dashboard.html";
};


/* CLOCK IN WITH GPS */
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
