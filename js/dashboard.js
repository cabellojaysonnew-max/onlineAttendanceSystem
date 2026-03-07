
const name=localStorage.getItem("emp_name")
const pos=localStorage.getItem("emp_position")

document.getElementById("empName").innerText=name.toUpperCase()
document.getElementById("empPosition").innerText=pos

const today=new Date()
document.getElementById("todayDate").innerText=
today.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})

window.loadPage=async function(page){

const r=await fetch(page)
const html=await r.text()

document.getElementById("content").innerHTML=html

}
