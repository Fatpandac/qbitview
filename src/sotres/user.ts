import { create } from "zustand";

type UserStore = {
  authInfo: {
    username: string;
    password: string;
  };
  setAuthInfo: (newAuthInfo: { username: string; password: string }) => void;
};

const useUser = create<UserStore>((set) => ({
  authInfo: {
    password: "",
    username: "",
  },
  setAuthInfo: (newAuthInfo: { username: string; password: string }) =>
    set({ authInfo: newAuthInfo }),
}));

export default useUser;
