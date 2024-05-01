import { MutableRefObject, createContext } from "react";
import * as matrix from 'matrix-js-sdk';
import { Dispatch, SetStateAction } from "react";

export const spaceId = "!KTwhpffdswBcoBdIoj:matrix.org";

export const MatrixContext = createContext({
  client: (undefined as MutableRefObject<matrix.MatrixClient | null> | undefined),
  rooms: {} as Record<string, {latitude: number, longitude: number, name: string}>,
  setRooms: ((rooms: any) => {}) as Dispatch<SetStateAction<Record<string, {latitude: number, longitude: number, name: string}>>>,
  myRooms: [] as matrix.Room[],
  setMyRooms: ((rooms: matrix.Room[]) => {}) as Dispatch<SetStateAction<matrix.Room[]>>,
  spaceId,
})
