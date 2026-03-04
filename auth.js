
async function login(){

 const btn = document.getElementById("loginBtn");
 btn.disabled = true;

 const emp_id = document.getElementById("emp_id").value.trim();
 const password = document.getElementById("password").value.trim();
 const msg = document.getElementById("msg");

 if(!emp_id || !password){
   msg.innerText = "Enter credentials";
   btn.disabled = false;
   return;
 }

 const {data, error} = await supabase
  .from("employees")
  .select("*")
  .eq("emp_id", emp_id)
  .eq("pass", password)
  .maybeSingle();

 if(error){
   msg.innerText = error.message;
   btn.disabled = false;
   return;
 }

 if(!data){
   msg.innerText = "Invalid login";
   btn.disabled = false;
   return;
 }

 localStorage.setItem("user", JSON.stringify(data));
 location = "dashboard.html";
}
