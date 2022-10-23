import { Timestamp } from "@google-cloud/firestore";
import { atom } from "recoil";
import { v1 } from "uuid";
export interface Community {
  id: string;
  creatorId: string;
  numberOfMembers: number;
  privacyType: "public" | "restrictied" | "private";
  createdAt?: Timestamp;
  imageURL?: string;
}
export interface CommunitySnippet {
  communityId: string;
  isModerator?: boolean;
  imageURL?: string;
}

interface CommunityState {
  mySnippets: CommunitySnippet[];
  currentCommunity?: Community;
  snippetsFetched: boolean;
}
const defaultCommunityState: CommunityState = {
  mySnippets: [],
  snippetsFetched: false,
};
export const communityState = atom<CommunityState>({
  key: `communitiesState/${v1()}`,
  default: defaultCommunityState,
});
