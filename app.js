// PREMIUM UI INTERACTION DEMO

document.addEventListener("DOMContentLoaded",()=>{

const btn=document.getElementById("loginBtn");

if(btn){
btn.addEventListener("click",()=>{

const spinner=btn.querySelector(".spinner");
const text=btn.querySelector(".btn-text");

spinner.classList.remove("hidden");
text.innerText="Signing in...";

setTimeout(()=>{
spinner.classList.add("hidden");
text.innerText="Login Successful";
},1500);

});
}

});
