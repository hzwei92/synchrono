import { createContext } from "react";

export const AuthContext = createContext({
  userId: (undefined as string | null | undefined),
  accessToken: (undefined as string | null | undefined),
  deviceId: (undefined as string | null | undefined),
  setUserId: (userId: string | null) => {},
  setAccessToken: (accessToken: string | null) => {},
  setDeviceId: (deviceId: string | null) => {},
});