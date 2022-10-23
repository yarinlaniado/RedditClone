import { atom } from "recoil";
import { v1 } from "uuid";

export interface AuthModalState {
  open: boolean;
  view: ModalView;
}

export type ModalView = "login" | "signup" | "resetPassword";

const defaultModalState: AuthModalState = {
  open: false,
  view: "login",
};

export const authModalState = atom<AuthModalState>({
  key: `authModalState/${v1()}`,
  default: defaultModalState,
});
