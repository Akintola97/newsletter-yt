import { inngest } from "@/inngest/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


export async function POST(req: Request){
    const {getUser} = getKindeServerSession();
    const u = await getUser();

    if(!u?.id){
        return NextResponse.json({error: "Unauthorized"},{status:401});
    }
    const body = await req.json().catch(()=> ({}));
    const topicsInline = typeof body.topics === "string" ? body.topics : "";

    const sent = await inngest.send({
        name: "scheduled.newsletter",
        data: {kindeId: u.id, topicsInline},
    });
const eventId = (sent && sent.ids?.[0]) || null;
return NextResponse.json({ok:true, eventId}, {status:200});
}