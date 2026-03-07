
import { supabaseClient } from "./supabase.js"

const emp_name=localStorage.getItem("emp_name")
const emp_position=localStorage.getItem("emp_position")

document.getElementById("empName").innerText =
emp_name.toUpperCase()+", "+emp_position

const today=new Date()

document.getElementById("todayDate").innerText=
"Today is "+today.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})

window.loadPage = async function(page){

const res = await fetch(page)
const html = await res.text()

document.getElementById("content").innerHTML = html

}
