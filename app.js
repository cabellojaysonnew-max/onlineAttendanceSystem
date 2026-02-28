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


/* LOAD DASHBOARD */
window.addEventListener("DOMContentLoaded", async () => {

  const employee = JSON.parse(localStorage.getItem("employee"));
  if (!employee) return;

  document.getElementById("name").innerText = employee.full_name;
  document.getElementById("empid").innerText = employee.emp_id;

  const today = new Date().toLocaleDateString(undefined,
    { weekday:'long', year:'numeric', month:'long', day:'numeric'});

  document.getElementById("todayDate").innerText = today;

  loadHistory(employee.emp_id);
});


/* CLOCK IN */
window.clockIn = async function(){

  navigator.geolocation.getCurrentPosition(async (pos)=>{

    const employee =
      JSON.parse(localStorage.getItem("employee"));

    const record = {
      emp_id: employee.emp_id,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      log_time: new Date()
    };

    await supabase.from("attendance_logs").insert(record);

    document.getElementById("statusBadge").innerText = "Active";
    document.getElementById("statusBadge").className="badge success";
  });
};


async function loadHistory(emp_id){

  const { data } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("emp_id", emp_id)
    .order("log_time",{ascending:false})
    .limit(3);

  const container = document.getElementById("historyList");

  if(!data) return;

  container.innerHTML="";

  data.forEach(row=>{

    const d = new Date(row.log_time);

    container.innerHTML += `
      <div class="history-item">
        <div>
          <strong>${d.toLocaleDateString()}</strong><br>
          Clock In ${d.toLocaleTimeString()}
        </div>
        <span class="badge success">Active</span>
      </div>
    `;
  });
}
