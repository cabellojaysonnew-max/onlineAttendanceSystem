import bcrypt from "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/+esm";
import { supabase } from "./supabase.js";

/* SESSION MANAGEMENT */
function saveSession(user){
    const session={
        emp_id:user.emp_id,
        full_name:user.full_name,
        login_time:Date.now()
    };
    localStorage.setItem("dar_session",JSON.stringify(session));
}

function getSession(){
    const s=localStorage.getItem("dar_session");
    return s?JSON.parse(s):null;
}

function requireLogin(){
    const session=getSession();
    if(!session && location.pathname.includes("dashboard")){
        window.location="index.html";
    }
    return session;
}

/* LOGIN */
document.addEventListener("DOMContentLoaded",()=>{

const loginBtn=document.getElementById("loginBtn");

if(loginBtn){
loginBtn.addEventListener("click",login);
}

const session=requireLogin();
if(session){
initDashboard(session);
}
});

async function login(){

const emp=document.getElementById("emp").value.trim();
const pass=document.getElementById("pass").value.trim();

const {data,error}=await supabase
.from("employees")
.select("*")
.eq("emp_id",emp)
.single();

if(error||!data){
alert("Invalid Employee ID");
return;
}

const stored=(data.pass||"").trim();
let valid=false;

if(stored.startsWith("$2")){
valid=bcrypt.compareSync(pass,stored);
}else{
valid=pass===stored;
}

if(!valid){
alert("Invalid Password");
return;
}

saveSession(data);

await new Promise(r=>setTimeout(r,150));
window.location="dashboard.html";
}

/* DASHBOARD */
async function initDashboard(session){

if(!document.getElementById("name")) return;

document.getElementById("name").innerText=session.full_name;
document.getElementById("empid").innerText=session.emp_id;

document.getElementById("logoutBtn").onclick=()=>{
localStorage.removeItem("dar_session");
window.location="index.html";
};

loadHistory(session.emp_id);
}

async function loadHistory(emp_id){

const container=document.getElementById("history");
if(!container) return;

const {data}=await supabase
.from("attendance_logs")
.select("*")
.eq("emp_id",emp_id)
.order("log_time",{ascending:false})
.limit(10);

container.innerHTML="";

if(!data||data.length===0){
container.innerHTML="<p>No records</p>";
return;
}

data.forEach(r=>{
const d=new Date(r.log_time);

container.innerHTML+=`
<div style="padding:10px 0;border-bottom:1px solid #eee">
<b>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</b><br>
📍 ${r.latitude}, ${r.longitude}
</div>`;
});
}
