"use client";

import '@livekit/components-styles';
import {
  ControlBar,
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import { ConnectionState, Participant, Room, RoomEvent, Track, } from 'livekit-client';
import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from 'react';
import { MatrixClient } from 'matrix-js-sdk';
import { Box, Button } from '@mui/material';

interface CallProps {
  client: MutableRefObject<MatrixClient | null>;
  roomId: string;
  userId: string;
  setToken: Dispatch<SetStateAction<string>>;
  liveRoomId: MutableRefObject<string | null>;
  joinRoomId: string | null;
  setJoinRoomId: Dispatch<SetStateAction<string | null>>;
}
export default function Call({ client, roomId, userId, setToken, liveRoomId, joinRoomId, setJoinRoomId }: CallProps) {
  const [myToken, setMyToken] = useState('');
  const [room, setRoom] = useState(new Room());
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/get-participants?room=${roomId}`
        );
        const data = await res.json();
        console.log(data);
        setParticipants(data.participants ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId]);

  useEffect(() => {
    if (joinRoomId === null) return;

    if (joinRoomId === roomId) {
      if (!myToken) {
        handleJoin();
      }
      setJoinRoomId(null);
    }
    else {
      setMyToken('');
    }
  }, [joinRoomId])

  const handleJoin = async () => {
    console.log('Joining room: ', roomId);
    try {
      await client?.current?.joinRoom(roomId, { syncRoom: true });

      const res = await fetch(
        `/api/get-participant-token?room=${roomId}&username=${userId}`
      );
      const data = await res.json();
      room?.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token)
        .then(() => {
          console.log('Connected to room: ', roomId);
        })
        .catch((e) => {
          console.error('Failed to connect to room: ', roomId, e);
        })
      setMyToken(data.token);
    } catch (e) {
      console.error(e);
    }
  }

  const handleConnected = () => {
    liveRoomId.current = roomId;
    client?.current?.sendStateEvent(roomId, 'city.synchrono.room.call', { isLive: true });
    room.on(RoomEvent.ParticipantConnected, () => {
      console.log('Participant connected', room.numParticipants);
    });
    room.on(RoomEvent.ParticipantDisconnected, () => {
      console.log('Participant disconnected', room.numParticipants)
    });
  }

  const handleDisconnected = () => { 
    setMyToken('');
    setToken('');
    liveRoomId.current = null;

    console.log('Disconnected from room: ', roomId, room.numParticipants)
    if (room.numParticipants === 1) {
      client?.current?.sendStateEvent(roomId, 'city.synchrono.room.call', { isLive: false });
    }
  }

  if (!myToken) {
    return (        
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Button onClick={handleJoin}>Join</Button>

          {participants.map(p => (
            <Box key={p.identity}>
              {p.identity}
            </Box>
          ))}
      </Box>
    );
  }


  return (
    <LiveKitRoom
      token={myToken}
      audio={true}
      video={true}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      room={room}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
    >
      {/* Your custom component with basic video conferencing functionality. */}
      <MyVideoConference />
      {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
      <RoomAudioRenderer />
      {/* Controls for the user to start/stop audio, video, and screen
      share tracks and to leave the room. */}
      <ControlBar variation='minimal'/>
    </LiveKitRoom>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{  }}>
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}