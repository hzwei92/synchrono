import { Box, Button, TextField } from "@mui/material";
import { MatrixClient, Visibility } from "matrix-js-sdk";
import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";

interface CreateRoomProps {
  longitude: number;
  latitude: number;
  client: MutableRefObject<MatrixClient | null>;
  spaceId: string;
  userId: string;
  setJoinRoomId: Dispatch<SetStateAction<string | null>>;
  setRooms: Dispatch<SetStateAction<Record<string, {latitude: number, longitude: number, name: string}>>>;
}
export default function CreateRoom({ client, userId, longitude, latitude, spaceId, setJoinRoomId, setRooms }: CreateRoomProps) {
  const [name, setName] = useState('');
  const handleCreate = () => {
    console.log('Creating room');
    client.current?.createRoom({
      name,
      topic: `${longitude}, ${latitude}`,
      visibility: Visibility.Public,
    }).then((res) => {
      console.log('Created room: ', res.room_id);
      setRooms(prev => ({
        ...prev,
        [res.room_id]: {
          latitude,
          longitude,
          name,
        }
      }))
      client.current?.sendStateEvent(spaceId, 'm.space.child', { 
        via: ['matrix.org'],
      }, res.room_id).then(res1 => {
        console.log('Added room to space: ', res1);
        setJoinRoomId(res.room_id);
      }).catch(e => {
        console.error('Failed to add room to space: ', e);
      });
    }).catch((e) => {
      console.error('Failed to create room: ', e);
    });
  };
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      <TextField 
        placeholder="Room Name" 
        variant="outlined"
        value={name} 
        onChange={e => setName(e.target.value)}
      />
      <Button onClick={handleCreate}>Create Room</Button>
    </Box>
  )
}