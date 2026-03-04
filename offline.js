
function saveOffline(data){
 let logs = JSON.parse(localStorage.getItem("offline_logs")||"[]");
 logs.push(data);
 localStorage.setItem("offline_logs", JSON.stringify(logs));
}

async function syncOffline(){

 if(!navigator.onLine) return;

 let logs = JSON.parse(localStorage.getItem("offline_logs")||"[]");
 if(logs.length===0) return;

 for(const log of logs){

   const today = new Date().toISOString().split("T")[0];

   const {data:existing} = await supabase
    .from("attendance_logs")
    .select("id")
    .eq("emp_id", log.emp_id)
    .gte("log_time", today);

   if(existing.length < 4){
     await supabase.from("attendance_logs").insert(log);
   }
 }

 localStorage.removeItem("offline_logs");
}

window.addEventListener("online", syncOffline);
