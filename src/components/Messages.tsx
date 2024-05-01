import { Box } from "@mui/material";
import * as matrix from 'matrix-js-sdk';

interface MessagesProps {
  room?: matrix.Room;
}

export default function Messages({ room }: MessagesProps) {
  const events = room?.getLiveTimeline().getEvents();
  if (!room) return null;
  return (
    <Box>
      
    </Box>
  )
}