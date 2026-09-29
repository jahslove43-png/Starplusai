import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET,OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="GET") return json({error:"Method not allowed."},405);
  const url=new URL(req.url);
  const businessId=url.searchParams.get("business_id")?.trim();
  const requestedLimit=Number(url.searchParams.get("limit")??"10");
  const limit=Number.isInteger(requestedLimit)?Math.min(Math.max(requestedLimit,1),50):10;
  if(!businessId) return json({error:"business_id is required."},400);

  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:business,error:businessError}=await supabase.from("businesses").select("id,name").eq("id",businessId).maybeSingle();
  if(businessError) return json({error:"Could not load business."},500);
  if(!business) return json({error:"Business not found."},404);

  const {data:reviews,error:reviewsError}=await supabase.from("reviews").select("id,rating,comment,created_at,customers(name)").eq("business_id",businessId).eq("status","approved").order("created_at",{ascending:false}).limit(limit);
  if(reviewsError) return json({error:"Could not load reviews."},500);
  const safeReviews=(reviews??[]).map((review:any)=>({id:review.id,rating:review.rating,comment:review.comment,customer_name:review.customers?.name??"Customer",created_at:review.created_at}));

  const countResult=await supabase.from("reviews").select("id",{count:"exact",head:true}).eq("business_id",businessId).eq("status","approved");
  if(countResult.error) return json({error:"Could not count approved reviews."},500);
  const averageResult=await supabase.from("reviews").select("rating").eq("business_id",businessId).eq("status","approved");
  if(averageResult.error) return json({error:"Could not calculate review summary."},500);
  const ratings=averageResult.data??[];
  const average=ratings.length?ratings.reduce((sum:number,review:any)=>sum+review.rating,0)/ratings.length:0;
  return json({business:{id:business.id,name:business.name},summary:{count:countResult.count??0,average_rating:Number(average.toFixed(1))},reviews:safeReviews});
});
