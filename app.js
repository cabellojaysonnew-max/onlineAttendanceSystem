
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

function showError(msg){
  document.getElementById("loginError").innerText = msg;
}

function deviceId(){
  let id = localStorage.getItem("device_id");
  if(!id){
    id = "MOBILE-" + Math.random().toString(36).substring(2,10);
    localStorage.setItem("device_id",id);
  }
  return id;
}

async function login(){
  const emp = document.getElementById("empId").value.trim();
  const pass = document.getElementById("password").value.trim();

  if(!emp || !pass){ showError("Missing credentials"); return; }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?emp_id=eq.${emp}&select=*`,{headers});
  const data = await res.json();

  if(!data.length){ showError("User not found"); return; }

  if(data[0].pass !== pass){
    showError("Invalid password");
    return;
  }

  localStorage.setItem("session_emp", emp);

  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("welcome").innerText = data[0].full_name;

  loadLogs();
}

function logout(){
  localStorage.removeItem("session_emp");
  location.reload();
}

async function getLocation(){
  return new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(
      pos=>resolve(pos.coords),
      err=>reject(err),
      {enableHighAccuracy:true,timeout:15000}
    );
  });
}

async function clockIn(){
  try{
    const emp = localStorage.getItem("session_emp");
    if(!emp){ alert("Not logged in"); return; }

    const coords = await getLocation();

    const body = {
      emp_id: emp,
      device_id: deviceId(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      device_type: "MOBILE_WEB"
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs`,{
      method:"POST",
      headers,
      body: JSON.stringify(body)
    });

    if(!r.ok){
      const t = await r.text();
      alert("Save failed: "+t);
      return;
    }

    alert("Attendance saved");
    loadLogs();

  }catch(e){
    alert("Error: "+e.message);
  }
}

async function loadLogs(){
  const emp = localStorage.getItem("session_emp");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_logs?emp_id=eq.${emp}&device_type=eq.MOBILE_WEB&order=log_time.desc&limit=20`,{headers});
  const logs = await res.json();

  const ul = document.getElementById("logs");
  ul.innerHTML = "";

  logs.forEach(l=>{
    const li = document.createElement("li");
    li.innerText = new Date(l.log_time).toLocaleString();
    ul.appendChild(li);
  });
}

window.onload=()=>{
  const emp = localStorage.getItem("session_emp");
  if(emp){
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    loadLogs();
  }
};
