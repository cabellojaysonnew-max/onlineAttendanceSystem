// Minimal interaction demo
document.addEventListener("DOMContentLoaded",()=>{
    const btn=document.getElementById("loginBtn");
    if(btn){
        btn.addEventListener("click",()=>{
            window.location.href="dashboard.html";
        });
    }
});
