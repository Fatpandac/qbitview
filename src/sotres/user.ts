import { create } from "zustand";

type UserStore = {
  authorized: boolean;
  setAuthorized: (auth: boolean) => void;
};

const useUser = create<UserStore>((set) => ({
  authorized: false,
  setAuthorized: (auth: boolean) => set({ authorized: auth }),
}));

export default useUser;
