
"use client";

import { MutableRefObject, createContext, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import * as matrix from "matrix-js-sdk";
import { createTheme, styled, AppBar as MuiAppBar, AppBarProps as MuiAppBarProps, Toolbar, IconButton, Typography, Divider, List, ListItem, ListItemButton, ListItemIcon, Drawer, ListItemText, useTheme, Box, Tooltip, Avatar, Menu, MenuItem } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import WelcomeModal from "../components/WelcomeModal";
import Map from "../components/Map";

import { Dispatch, SetStateAction } from "react";
import { parse } from "path";
import TopBar from "@/components/TopBar";
import MenuIcon from '@mui/icons-material/Menu';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Rooms from "@/components/Rooms";
import Messages from "@/components/Messages";

const spaceId = "!KTwhpffdswBcoBdIoj:matrix.org";

const drawerWidth = 300;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  height: '100%',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));


const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const LiveKitContext = createContext({
  token: '',
  setToken: ((token: string) => {}) as Dispatch<SetStateAction<string>>,
  liveRoomId: undefined as MutableRefObject<string | null> | undefined,
})

export const MatrixContext = createContext({
  client: (undefined as MutableRefObject<matrix.MatrixClient | null> | undefined),
  rooms: {} as Record<string, {latitude: number, longitude: number, name: string}>,
  setRooms: ((rooms: any) => {}) as Dispatch<SetStateAction<Record<string, {latitude: number, longitude: number, name: string}>>>,
  myRooms: [] as matrix.Room[],
  setMyRooms: ((rooms: matrix.Room[]) => {}) as Dispatch<SetStateAction<matrix.Room[]>>,
  spaceId,
})

export const AuthContext = createContext({
  userId: (undefined as string | null | undefined),
  accessToken: (undefined as string | null | undefined),
  deviceId: (undefined as string | null | undefined),
  setUserId: (userId: string | null) => {},
  setAccessToken: (accessToken: string | null) => {},
  setDeviceId: (deviceId: string | null) => {},
});

export default function Home() {
  const client = useRef<matrix.MatrixClient | null>(null);

  const [userId, setUserId] = useState<string | null>();
  const [accessToken, setAccessToken] = useState<string | null>();
  const [deviceId, setDeviceId] = useState<string | null>();

  const [rooms, setRooms] = useState<Record<string, {latitude: number, longitude: number, name: string}>>({});
  
  const [myRooms, setMyRooms] = useState<matrix.Room[]>([]);
  const [myRoomId, setMyRoomId] = useState<string | null>(null);

  const liveRoomId = useRef<string | null>(null);
  const [token, setToken] = useState('');

  const [open, setOpen] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    const userId1 = localStorage.getItem("userId");
    const accessToken1 = localStorage.getItem("accessToken");
    const deviceId1 = localStorage.getItem("deviceId");

    console.log("Load stored userId, accessToken, deviceId: ", userId1, accessToken1, deviceId1);

    setUserId(userId1);
    setAccessToken(accessToken1);
    setDeviceId(deviceId1);
  }, [])

  useEffect(() => {
    if (userId === undefined || accessToken === undefined || deviceId === undefined) return;
    if (client.current) return;
    
    if (userId && accessToken && deviceId) {
      client.current = matrix.createClient({
        baseUrl: "https://matrix.org",
        userId,
        accessToken,
        deviceId,
      });
      client.current.startClient();
      client.current.on(matrix.ClientEvent.Sync, async (state, prevState, res) => {
        console.log('sync', state, prevState, res);
        if (state === 'PREPARED') {
          console.log('Initial sync complete');

          const roomList = client.current!.getRooms();
          console.log('Rooms: ', roomList);
          roomList.sort((a, b) => {
            const aEvents = a.getLiveTimeline().getEvents();

            var aMsg = aEvents[aEvents.length - 1];
            if (!aMsg) {
                return -1;
            }

            const bEvents = b.getLiveTimeline().getEvents();
            var bMsg = bEvents[bEvents.length - 1];
            if (!bMsg) {
                return 1;
            }
            if (aMsg.getTs() > bMsg.getTs()) {
                return 1;
            } else if (aMsg.getTs() < bMsg.getTs()) {
                return -1;
            }
            return 0;
          });
          setMyRooms(roomList);
          // TODO setInterval, clearInterval?
          const hierarchy = await client.current!.getRoomHierarchy(spaceId);
          const idToRoom = hierarchy.rooms.reduce((acc, room) => {
            console.log('Room: ', room);
            const [longitude, latitude] = room.topic?.split(', ') ?? ['0', '0'];
            acc[room.room_id] = {
              latitude: parseFloat(latitude) + (0.01 * (Math.random() - 0.5)),
              longitude: parseFloat(longitude) + (0.01 * (Math.random() - 0.5)),
              name: room.name!,
            };
            return acc;
          }, {} as Record<string, {latitude: number, longitude: number, name: string}>);

          console.log('Rooms: ', idToRoom)
          setRooms(idToRoom);
        }
      })
    }
    else {
      client.current = matrix.createClient({
        baseUrl: "https://matrix.org",
      });
    }
  }, [userId, accessToken, deviceId]);

  // const initSpace = () => {
  //   client?.current?.createRoom({
  //     name: 'SYNCHRONO CITY',
  //     room_alias_name: 'synchrono_city',
  //     visibility: matrix.Visibility.Public,
  //     creation_content: {
  //       type: 'm.space',
  //     },
  //     initial_state: [
  //       {
  //         type: "m.room.power_levels",
  //         content: {
  //             users: {
  //                 "@yourusername:matrix.org": 100 // Set your user as the admin
  //             },
  //             users_default: 0,
  //             events: {
  //                 "m.room.name": 50, // Require PL 50 to change room name
  //                 "m.room.power_levels": 100, // Require PL 100 to change power levels
  //                 "m.room.history_visibility": 50, // Require PL 50 to change history visibility
  //                 "m.room.canonical_alias": 50, // Require PL 50 to change room alias
  //                 "m.room.avatar": 50 // Require PL 50 to change room avatar
  //             },
  //             events_default: 0,
  //             state_default: 0, // PL 0 required to change state, including adding rooms
  //             ban: 50, // Require PL 50 to ban users
  //             kick: 50, // Require PL 50 to kick users
  //             redact: 50, // Require PL 50 to redact messages
  //             invite: 0 // PL 0 required to invite others
  //         },
  //         state_key: ""
  //       }
  //     ],
  //   }).then(room => {
  //     console.log("Space created with ID:", room.room_id);
  //   }).catch(err => {
  //     console.error("Failed to create space:", err);
  //   });
  // }


  // const setPowerLevel = async () => {
  //   try {
  //     const powerLevels = await client.current?.getStateEvent(spaceId, 'm.room.power_levels', '');
  //     console.log('Power levels: ', powerLevels);
  //     if (!powerLevels) return;
  //     powerLevels.state_default = 0;

  //     try {
  //       await client.current?.sendStateEvent(spaceId, 'm.room.power_levels', powerLevels, "");
  //       console.log("Power levels updated to allow all users to add rooms.");
  //     } catch (error) {
  //         console.error("Failed to update power levels:", error);
  //     }
  //   }
  //   catch (e) {
  //     console.error("Failed to get power levels:", e);
  //   }
  // }

  const handleDrawerClose = () => {
    setOpen(false);
  };


  return (
    <MatrixContext.Provider value={{
      client,
      rooms,
      setRooms,
      spaceId,
      myRooms,
      setMyRooms,
    }}>
      <AuthContext.Provider value={{
        userId,
        accessToken,
        deviceId,
        setUserId,
        setAccessToken,
        setDeviceId,
      }}>
        <LiveKitContext.Provider value={{
          token,
          setToken,
          liveRoomId,
        }}>
          <TopBar open={open} setOpen={setOpen} drawerWidth={drawerWidth} />
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            variant="persistent"
            anchor="left"
            open={open}
          >
            <DrawerHeader>
              <IconButton onClick={handleDrawerClose}>
                {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </DrawerHeader>
            {
              myRoomId
                ? (
                  <Messages room={myRooms.find(r => r.roomId === myRoomId)}/>
                ) : (
                  <Rooms rooms={myRooms} setRoomId={setMyRoomId} />
                )
            }
          </Drawer>
          <Main open={open}>
            <DrawerHeader />
            <Map />
            <WelcomeModal />
          </Main>
        </LiveKitContext.Provider>
      </AuthContext.Provider>
    </MatrixContext.Provider>
  );
}
