
if(!localStorage.getItem("user")){
 location="index.html";
}

function logout(){
 localStorage.clear();
 location="index.html";
}

function getDeviceId(){
 let id = localStorage.getItem("device_id");
 if(!id){
   id = crypto.randomUUID();
   localStorage.setItem("device_id", id);
 }
 return id;
}

async function validateDevice(emp_id, device_id){
 const {data} = await supabase
  .from("employees")
  .select("device_id")
  .eq("emp_id", emp_id)
  .single();

 if(!data.device_id){
   await supabase.from("employees")
     .update({device_id})
     .eq("emp_id", emp_id);
   return true;
 }

 return data.device_id === device_id;
}

function getDistance(lat1, lon1, lat2, lon2){
 const R = 6371000;
 const dLat = (lat2-lat1) * Math.PI/180;
 const dLon = (lon2-lon1) * Math.PI/180;
 const a =
   Math.sin(dLat/2)*Math.sin(dLat/2)+
   Math.cos(lat1*Math.PI/180)*
   Math.cos(lat2*Math.PI/180)*
   Math.sin(dLon/2)*Math.sin(dLon/2);
 return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const OFFICE_LAT = 13.6218;   // REPLACE
const OFFICE_LON = 123.1948;  // REPLACE
const ALLOWED_RADIUS = 150;   // meters
const MAX_SPEED_KMH = 200;

async function clock(){

 const status = document.getElementById("status");
 const user = JSON.parse(localStorage.getItem("user"));
 const device_id = getDeviceId();
 const today = new Date().toISOString().split("T")[0];

 const allowedDevice = await validateDevice(user.emp_id, device_id);
 if(!allowedDevice){
   status.innerText = "Device not registered.";
   return;
 }

 const {data:logs} = await supabase
  .from("attendance_logs")
  .select("*")
  .eq("emp_id", user.emp_id)
  .gte("log_time", today);

 if(logs.length >= 4){
   status.innerText = "Maximum 4 logs reached today";
   return;
 }

 const types = ["CLOCK IN","BREAK OUT","BREAK IN","CLOCK OUT"];
 const currentType = types[logs.length];

 try{
   const gps = await getLocation();

   const officeDistance = getDistance(
     gps.latitude,
     gps.longitude,
     OFFICE_LAT,
     OFFICE_LON
   );

   if(officeDistance > ALLOWED_RADIUS){
     status.innerText = "Outside authorized location.";
     return;
   }

   if(logs.length > 0){
     const lastLog = logs[logs.length - 1];
     const lastDistance = getDistance(
       gps.latitude,
       gps.longitude,
       lastLog.latitude,
       lastLog.longitude
     );

     const hoursDiff = (new Date() - new Date(lastLog.log_time)) / 3600000;
     const speed = lastDistance / 1000 / hoursDiff;

     if(speed > MAX_SPEED_KMH){
       status.innerText = "Suspicious GPS movement detected.";
       return;
     }
   }

   const duplicate = logs.find(l => l.status === currentType);
   if(duplicate){
     status.innerText = "Duplicate log prevented.";
     return;
   }

   const payload = {
     emp_id: user.emp_id,
     device_id: device_id,
     latitude: gps.latitude,
     longitude: gps.longitude,
     address: gps.address,
     place_name: gps.place_name,
     status: currentType,
     device_type: "MOBILE_WEB"
   };

   if(!navigator.onLine){
     saveOffline(payload);
     status.innerText = currentType + " saved offline";
     return;
   }

   await supabase.from("attendance_logs").insert(payload);
   status.innerText = currentType + " recorded";

 } catch(err){
   status.innerText = "GPS required";
 }
}
