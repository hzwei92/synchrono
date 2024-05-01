import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);

  try {
    const participants = await roomService.listParticipants(room);
    return NextResponse.json({ participants });
  }
  catch (e: any) {
    return NextResponse.json(
      { error: "Failed to get participants" },
      { status: 500 }
    );
  }

}