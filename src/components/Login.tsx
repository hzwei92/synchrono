import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useContext, useState } from 'react';
import { AuthContext, MatrixContext } from '../app/page';
import * as matrix from 'matrix-js-sdk';

export default function Login() {
  const { client, setRooms, spaceId } = useContext(MatrixContext);
  const { setUserId, setAccessToken, setDeviceId } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    client?.current?.login('m.login.password', {
      user: username,
      password: password,
    }).then(res => {
      console.log('Logged in', res);
      localStorage.setItem('userId', res.user_id);
      localStorage.setItem('accessToken', res.access_token);
      localStorage.setItem('deviceId', res.device_id);
      setUserId(res.user_id);
      setAccessToken(res.access_token);
      setDeviceId(res.device_id);

      client.current?.startClient();

      client.current?.on(matrix.ClientEvent.Sync, async (state, prevState, res) => {
        console.log('sync', state, prevState, res);
        if (state === 'PREPARED') {
          console.log('Initial sync complete');
          const space = await client.current!.joinRoom(spaceId);

          const hierarchy = await client.current!.getRoomHierarchy(spaceId);
          const idToRoom = hierarchy.rooms.reduce((acc, room) => {
            const [longitude, latitude] = room.topic?.split(', ') || ['0', '0'];
            acc[room.room_id] = {
              latitude: parseFloat(latitude) + (0.01 * (Math.random() - 0.5)),
              longitude: parseFloat(longitude) + (0.01 * (Math.random() - 0.5)),
              name: room.name!,
            };
            return acc;
          }, {} as Record<string, {latitude: number, longitude: number, name: string}>);

          setRooms(idToRoom);
        }
      });
    }).catch(err => {
      if (err.data.errcode === 'M_FORBIDDEN') {
        setError('Invalid username or password');
      }
      else {
        setError('An error occurred');
        console.error(err);
      }
    });
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      marginTop: 2,
    }}>
      <TextField 
        label='Username' 
        variant='outlined'
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <TextField 
        label='Password' 
        variant='outlined'
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <Button variant='contained' onClick={handleLogin}>Login</Button>
      {error && <Box sx={{color: 'red', marginTop: 2,}}>{error}</Box>}
    </Box>
  );
}