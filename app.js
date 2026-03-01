const SUPABASE="https://ytfpiyfapvybihlngxks.supabase.co/rest/v1";
const KEY="sb_publishable_poSZUQ9HI4wcY9poEo5b1w_Z-pAJbKo";

const headers={
apikey:KEY,
"Content-Type":"application/json"
};

function showError(msg){
document.getElementById("errorBox").innerText=msg;
}

document.addEventListener("DOMContentLoaded",()=>{
document.getElementById("loginBtn").addEventListener("click",login);
});

async function login(){
try{
const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value;

const res=await fetch(`${SUPABASE}/employees?emp_id=eq.${emp}`,{headers});
const data=await res.json();

if(!data.length){showError("Employee not found");return;}

const user=data[0];

let valid=false;

if(user.pass.startsWith("$2")){
valid=bcrypt.compareSync(pass,user.pass);
}else{
valid=(pass===user.pass);
}

if(!valid){showError("Invalid password");return;}

localStorage.setItem("session_emp",user.emp_id);
localStorage.setItem("session_name",user.full_name);

location.href="dashboard.html";

}catch(e){showError(e.message);}
}
