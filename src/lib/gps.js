
export function getGPS(){
 return new Promise((resolve,reject)=>{
   navigator.geolocation.getCurrentPosition(
     pos=>resolve(pos.coords),
     reject,
     {
       enableHighAccuracy:true,
       timeout:10000,
       maximumAge:0
     }
   );
 });
}
