
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const body = await req.json();
  const { emp_id, device_id, latitude, longitude, accuracy } = body;

  const { data: emp } = await supabase
    .from("employees")
    .select("*")
    .eq("emp_id", emp_id)
    .single();

  if (!emp)
    return new Response("Invalid employee", { status: 401 });

  if (!emp.mobile_device) {
    await supabase
      .from("employees")
      .update({ mobile_device: device_id })
      .eq("emp_id", emp_id);
  } else if (emp.mobile_device !== device_id) {
    return new Response("Device not registered", { status: 403 });
  }

  const today = new Date().toISOString().slice(0,10);

  const { count } = await supabase
    .from("attendance_logs")
    .select("*", { count: "exact", head: true })
    .eq("emp_id", emp_id)
    .gte("log_time", today);

  if ((count ?? 0) >= 4)
    return new Response("Daily logs completed", { status: 403 });

  if (!latitude || !longitude || accuracy > 80)
    return new Response("GPS invalid", { status: 400 });

  let spoof = false;
  if (accuracy > 50) spoof = true;

  await supabase.from("attendance_logs").insert({
    emp_id,
    device_id,
    latitude,
    longitude,
    accuracy,
    device_type: "MOBILE_WEB",
    spoof_flag: spoof
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
