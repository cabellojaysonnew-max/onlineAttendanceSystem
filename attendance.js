
if(!localStorage.getItem("user")) location="index.html";

function logout(){
 localStorage.clear();
 location="index.html";
}

function getLocalDate(){
 const d = new Date();
 return d.getFullYear()+"-"+
  String(d.getMonth()+1).padStart(2,'0')+"-"+
  String(d.getDate()).padStart(2,'0');
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
  .maybeSingle();

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

const OFFICE_LAT = 13.6218;  // CHANGE
const OFFICE_LON = 123.1948; // CHANGE
const ALLOWED_RADIUS = 150;

async function clock(){

 const btn = document.getElementById("clockBtn");
 btn.disabled = true;

 const status = document.getElementById("status");
 const user = JSON.parse(localStorage.getItem("user"));
 const device_id = getDeviceId();
 const today = getLocalDate();

 const allowed = await validateDevice(user.emp_id, device_id);
 if(!allowed){
   status.innerText = "Device not registered.";
   btn.disabled = false;
   return;
 }

 const {data:logs} = await supabase
  .from("attendance_logs")
  .select("*")
  .eq("emp_id", user.emp_id)
  .gte("log_time", today)
  .order("log_time",{ascending:true});

 if(logs.length >= 4){
   status.innerText = "Maximum 4 logs reached.";
   btn.disabled = false;
   return;
 }

 const types = ["CLOCK IN","BREAK OUT","BREAK IN","CLOCK OUT"];
 const currentType = types[logs.length];

 try{

   const gps = await getLocation();

   const distance = getDistance(
     gps.latitude, gps.longitude,
     OFFICE_LAT, OFFICE_LON
   );

   if(distance > ALLOWED_RADIUS){
     status.innerText = "Outside authorized location.";
     btn.disabled = false;
     return;
   }

   const payload = {
     emp_id: user.emp_id,
     device_id: device_id,
     latitude: gps.latitude,
     longitude: gps.longitude,
     address: gps.address,
     place_name: gps.place_name,
     status: currentType
   };

   if(!navigator.onLine){
     saveOffline(payload);
     status.innerText = currentType + " saved offline.";
     btn.disabled = false;
     return;
   }

   await supabase.from("attendance_logs").insert(payload);
   status.innerText = currentType + " recorded.";
   btn.disabled = false;

 } catch(e){
   status.innerText = "GPS required.";
   btn.disabled = false;
 }
}
