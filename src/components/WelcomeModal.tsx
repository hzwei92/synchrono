import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import Login from './Login';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../app/page';

export default function WelcomeModal() {
  const { userId, accessToken, deviceId } = useContext(AuthContext);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (userId && accessToken && deviceId) {
      setOpen(false);
    }
    else {
      setOpen(true);
    }
  }, [userId]);

  return (
    <Modal open={open}>
      <Card sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: 2,
        textAlign: 'center',
      }}>
        <Typography variant="h3" sx={{
          fontSize: 24,
          fontWeight: 'bold',
        }}>
          SYCHRONO.CITY
        </Typography>
        <Typography sx={{ mt: 3 }}>
          A <a href="https://matrix.org">Matrix</a> powered communications app.
        </Typography>
        <Typography sx={{mt: 2}}>
          Drop a pin anywhere on the map to start a voice/video call there.
        </Typography>
        <Typography sx={{mt: 2}}>
          Please login to continue.
        </Typography>
        <Login/>
      </Card>
    </Modal>
  );
}