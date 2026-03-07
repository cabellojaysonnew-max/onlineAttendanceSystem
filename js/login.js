
import { supabaseClient } from "./supabase.js"

async function login(){

const emp_id=document.getElementById("emp_id").value
const pass=document.getElementById("pass").value

const {data}=await supabaseClient
.from("employees")
.select("*")
.eq("emp_id",emp_id)
.single()

if(!data){
alert("Invalid login")
return
}

if(pass===data.pass){

localStorage.setItem("emp_id",data.emp_id)
localStorage.setItem("emp_name",data.full_name)
localStorage.setItem("emp_position",data.position)

location.href="dashboard.html"

}else{

alert("Invalid password")

}

}

window.login=login
