
export function getDeviceId(){
 let id = localStorage.device_id;
 if(!id){
   id = crypto.randomUUID();
   localStorage.device_id = id;
 }
 return id;
}
