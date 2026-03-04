
async function getLocation(){
 return new Promise((resolve,reject)=>{
  navigator.geolocation.getCurrentPosition(pos=>{
   resolve({
     latitude: pos.coords.latitude,
     longitude: pos.coords.longitude,
     address: "GPS Captured",
     place_name: "Field Location"
   });
  },()=>reject(),{enableHighAccuracy:true});
 });
}
