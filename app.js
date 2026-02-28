import { supabase } from "./supabase.js";

/* LOGIN */
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

  if (password !== data.pass) {
    alert("Invalid login");
    return;
  }

  localStorage.setItem("employee", JSON.stringify(data));
  window.location = "dashboard.html";
};


/* DASHBOARD LOAD */
window.addEventListener("DOMContentLoaded", async () => {

  const employee = JSON.parse(localStorage.getItem("employee"));
  if(!employee) return;

  document.getElementById("name").innerText = employee.full_name;
  document.getElementById("empid").innerText = employee.emp_id;

  const today = new Date().toLocaleDateString(undefined,
    { weekday:'long', year:'numeric', month:'long', day:'numeric'});

  document.getElementById("todayDate").innerText = today;

  loadHistory(employee.emp_id);
});


/* CLOCK IN WITH GPS + ADDRESS */
window.clockIn = async function(){

  const employee = JSON.parse(localStorage.getItem("employee"));

  navigator.geolocation.getCurrentPosition(async (pos)=>{

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    // Reverse geocode using OpenStreetMap
    let address = "Unknown location";

    try{
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const geo = await res.json();
      address = geo.display_name || address;
    }catch(e){
      console.log("Address lookup failed");
    }

    const record = {
      emp_id: employee.emp_id,
      log_time: new Date().toISOString(),
      device_id: "MOBILE_WEB",
      status: "IN",
      latitude: lat,
      longitude: lon,
      accuracy: accuracy,
      address: address,
      device_type: "MOBILE_WEB"
    };

    const { error } = await supabase
      .from("attendance_logs")
      .insert(record);

    if(error){
      alert(error.message);
      return;
    }

    document.getElementById("statusBadge").innerText="Active";
    document.getElementById("statusBadge").className="badge success";

    loadHistory(employee.emp_id);
  },
  ()=> alert("Please enable GPS location"),
  { enableHighAccuracy:true }
  );
};


/* LOAD HISTORY */
async function loadHistory(emp_id){

  const { data } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("emp_id", emp_id)
    .order("log_time",{ascending:false})
    .limit(3);

  const container = document.getElementById("history");
  container.innerHTML="";

  if(!data) return;

  data.forEach(row=>{

    const d = new Date(row.log_time);

    container.innerHTML += `
      <div class="history-item">
        <div>
          <strong>${d.toLocaleDateString()}</strong><br>
          Clock In ${d.toLocaleTimeString()}<br>
          <small>${row.address || ""}</small>
        </div>
        <span class="badge success">Active</span>
      </div>
    `;
  });
}
