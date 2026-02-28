import { supabase } from "./supabase.js";

/* LOGIN USING SUPABASE AUTH */
window.login = async function () {

  const emp = document.getElementById("emp").value;
  const password = document.getElementById("pass").value;

  const email = emp + "@lgu.local";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert("Invalid login");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data.user));
  window.location = "dashboard.html";
};


/* CLOCK IN WITH GPS */
window.clockIn = async function(){

  navigator.geolocation.getCurrentPosition(async (pos)=>{

    const user = JSON.parse(localStorage.getItem("user"));

    const record = {
      emp_id: user.email.split("@")[0],
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
