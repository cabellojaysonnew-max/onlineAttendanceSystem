
async function login(){
 const emp_id = document.getElementById("emp_id").value.trim();
 const password = document.getElementById("password").value.trim();
 const msg = document.getElementById("msg");

 if(!emp_id || !password){
   msg.innerText = "Enter credentials";
   return;
 }

 const {data, error} = await supabase
  .from("employees")
  .select("*")
  .eq("emp_id", emp_id)
  .eq("pass", password)
  .single();

 if(error || !data){
   msg.innerText = "Invalid login";
   return;
 }

 localStorage.setItem("user", JSON.stringify(data));

 if(/Android|iPhone/i.test(navigator.userAgent)){
   location = "dashboard.html";
 } else {
   location = "admin.html";
 }
}
