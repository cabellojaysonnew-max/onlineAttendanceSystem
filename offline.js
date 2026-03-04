
function saveOffline(data){
 let logs = JSON.parse(localStorage.getItem("offline_logs") || "[]");
 logs.push(data);
 localStorage.setItem("offline_logs", JSON.stringify(logs));
}

async function syncOffline(){
 if(!navigator.onLine) return;

 let logs = JSON.parse(localStorage.getItem("offline_logs") || "[]");
 if(logs.length === 0) return;

 for(const log of logs){
   await supabase.from("attendance_logs").insert(log);
 }

 localStorage.removeItem("offline_logs");
}

window.addEventListener("online", syncOffline);
