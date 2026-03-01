
import { getDeviceId } from "./lib/device.js";
import { getGPS } from "./lib/gps.js";

window.logAttendance = async function(){
 document.getElementById("status").innerText="Getting GPS...";

 const gps = await getGPS();

 const res = await fetch(
   "https://ytfpiyfapvybihlngxks.functions.supabase.co/log-attendance",
   {
     method:"POST",
     headers:{ "Content-Type":"application/json" },
     body: JSON.stringify({
       emp_id: localStorage.emp_id || "EMP001",
       device_id: getDeviceId(),
       latitude: gps.latitude,
       longitude: gps.longitude,
       accuracy: gps.accuracy
     })
   }
 );

 const data = await res.text();
 document.getElementById("status").innerText=data;
}
