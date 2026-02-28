import { supabase } from "./supabase.js";

/* ================= LOGIN ================= */
window.login = async function () {

  const emp_id = document.getElementById("emp").value;
  const password = document.getElementById("pass").value;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("emp_id", emp_id)
    .single();

  if (error || !data) {
    alert("Employee not found");
    return;
  }

  // SIMPLE PASSWORD CHECK (matches existing table)
  if (password !== data.pass) {
    alert("Invalid password");
    return;
  }

  localStorage.setItem("employee", JSON.stringify(data));
  window.location = "dashboard.html";
};


/* ================= CLOCK IN ================= */
window.clockIn = async function(){

  navigator.geolocation.getCurrentPosition(async (pos)=>{

    const employee =
      JSON.parse(localStorage.getItem("employee"));

    const record = {
      emp_id: employee.emp_id,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      log_time: new Date(),
      synced: false
    };

    if (navigator.onLine) {
      await upload(record);
    } else {
      saveOffline(record);
    }

    document.getElementById("status").innerText =
      "Attendance Recorded";
  });
};


/* ================= UPLOAD ================= */
async function upload(data){

  const { error } = await supabase
    .from("attendance_logs")
    .insert(data);

  if (error) {
    saveOffline(data);
  }
}


/* ================= OFFLINE STORAGE ================= */
function saveOffline(log){

  let logs =
    JSON.parse(localStorage.getItem("offlineLogs")) || [];

  logs.push(log);

  localStorage.setItem("offlineLogs",
    JSON.stringify(logs));
}


/* ================= AUTO SYNC ================= */
window.addEventListener("online", syncOffline);

async function syncOffline(){

  let logs =
    JSON.parse(localStorage.getItem("offlineLogs")) || [];

  for (const log of logs){
    await upload(log);
  }

  localStorage.removeItem("offlineLogs");
}
