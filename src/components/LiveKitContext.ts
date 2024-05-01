import { Dispatch, MutableRefObject, SetStateAction, createContext } from "react";

export const LiveKitContext = createContext({
  token: '',
  setToken: ((token: string) => {}) as Dispatch<SetStateAction<string>>,
  liveRoomId: undefined as MutableRefObject<string | null> | undefined,
})