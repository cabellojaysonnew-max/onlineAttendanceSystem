
if(!localStorage.getItem("user")){
 location="index.html";
}

function logout(){
 localStorage.clear();
 location="index.html";
}

async function loadLogs(){

 const date = document.getElementById("filterDate").value;

 let query = supabase
  .from("attendance_logs")
  .select("emp_id,place_name,status,log_time")
  .order("log_time",{ascending:false});

 if(date){
   query = query.gte("log_time", date)
                .lt("log_time", date + "T23:59:59");
 }

 const {data} = await query.limit(100);

 const container = document.getElementById("logs");
 container.innerHTML = data.map(l =>
  `<p>
   <b>${l.emp_id}</b><br>
   ${l.status}<br>
   ${l.place_name}<br>
   ${new Date(l.log_time).toLocaleString()}
  </p>`
 ).join("");
}

loadLogs();
