import { Avatar, Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import * as matrix from 'matrix-js-sdk';
import { Dispatch, SetStateAction } from "react";

interface RoomsProps {
  rooms: matrix.Room[];
  setRoomId: Dispatch<SetStateAction<string | null>>;
}
export default function Rooms({ rooms, setRoomId }: RoomsProps) {
  const handleClick = (roomId: string) => () => {
    setRoomId(roomId);
  }
  return (
    <Box>
      <Typography variant="h4">Rooms</Typography>
      <Divider />
      <List>
        {
          rooms.map((room, index) => {
            const events = room.getLiveTimeline().getEvents();
            const lastEvent = events[events.length - 1];
            return (
              <ListItem key={room.roomId} disablePadding>
                <ListItemButton onClick={handleClick(room.roomId)}>
                  <ListItemIcon>
                    <Avatar alt={lastEvent.getContent().displayname}/>
                  </ListItemIcon>
                  <ListItemText primary={room.name} />
                </ListItemButton>
              </ListItem>
            )
          })
        }
      </List>
    </Box>
    )

}