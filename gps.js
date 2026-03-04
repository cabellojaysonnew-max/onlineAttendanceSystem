
async function getLocation(){
 return new Promise((resolve,reject)=>{
  navigator.geolocation.getCurrentPosition(async pos=>{
   const lat = pos.coords.latitude;
   const lon = pos.coords.longitude;

   const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
   );
   const geo = await res.json();

   resolve({
     latitude: lat,
     longitude: lon,
     address: geo.display_name,
     place_name: geo.name || geo.display_name
   });
  }, ()=> reject(), {enableHighAccuracy:true});
 });
}
