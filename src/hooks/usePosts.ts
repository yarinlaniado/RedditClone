import { preventOverflow } from "@popperjs/core";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/authModalAtom";
import { communityState } from "../atoms/communitiesAtom";
import { Post, postState, PostVote } from "../atoms/postAtom";
import { auth, firestore, storage } from "../firebase/clientApp";

const usePosts = () => {
  const router = useRouter();
  const [postStateValue, setPostStateValue] = useRecoilState(postState);
  const currentCommunity = useRecoilValue(communityState).currentCommunity;
  //check for a user
  const [user] = useAuthState(auth);
  const setAuthModalState = useSetRecoilState(authModalState);

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => {
    event.stopPropagation();
    if (!user?.uid) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }
    try {
      const { voteStatus } = post; // 1 / -1
      console.log("voteStatus", voteStatus);
      const existingVote = postStateValue.postVotes.find(
        (vote) => vote.postId === post.id
      );

      const batch = writeBatch(firestore);
      const updatePost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      let updatePostVotes = [...postStateValue.postVotes];
      let voteChange = vote;

      //NEW VOTE
      if (!existingVote) {
        const postVoteRef = doc(
          collection(firestore, "users", `${user?.uid}/postVotes`)
        );

        const newVote: PostVote = {
          id: postVoteRef.id,
          postId: post.id!,
          communityId,
          voteValue: vote, //1 or -1
        };

        //create a new postvote doc
        batch.set(postVoteRef, newVote);

        //add or remove from vote count
        updatePost.voteStatus = voteStatus + vote;
        updatePostVotes = [...updatePostVotes, newVote];
      }
      //EXISTING VOTE
      else {
        const postVoteRef = doc(
          firestore,
          "users",
          `${user?.uid}/postVotes/${existingVote.id}`
        );
        //removing the vote
        // UP -> NETRUAL +or+ DOWN->NEAUTRAL
        if (existingVote.voteValue === vote) {
          updatePost.voteStatus = voteStatus - vote;
          updatePostVotes = updatePostVotes.filter(
            (item) => item.id !== existingVote.id
          );
          // DELETE
          batch.delete(postVoteRef);
          voteChange *= -1;
        }
        //FLIPPING THE VOTE -> UP GOES DOWN AND SO
        else {
          updatePost.voteStatus = voteStatus + 2 * vote;
          const voteIndex = postStateValue.postVotes.findIndex(
            (item) => item.id === existingVote.id
          );
          updatePostVotes[voteIndex] = {
            ...existingVote,
            voteValue: vote,
          };

          batch.update(postVoteRef, { voteValue: vote });
          voteChange = 2 * vote;
        }
      }
      //update out post document - all the stuff ive been putting in the batch!
      // Update database
      // const postRef = doc(firestore, "posts", post.id);
      const postRef = doc(firestore, "posts", post.id!);
      batch.update(postRef, { voteStatus: voteStatus + voteChange });
      await batch.commit();

      //update recoil state
      //POSTVOTES NOT UPDATING!
      const postIndex = postStateValue.posts.findIndex(
        (item) => item.id === post.id
      );

      updatedPosts[postIndex] = updatePost;
      setPostStateValue((prev) => ({
        ...prev,
        posts: updatedPosts,
        postVotes: updatePostVotes,
      }));

      if (postStateValue.selectedPost) {
        setPostStateValue((prev) => ({
          ...prev,
          selectedPost: updatePost,
        }));
      }
    } catch (error: any) {
      console.log("onVote error", error);
    }
  };
  const onSelectPost = (post: Post) => {
    setPostStateValue((prev) => ({
      ...prev,
      selectedPost: post,
    }));
    router.push(`/r/${post.communityId}/comments/${post.id}`);
  };
  const onDeletePost = async (post: Post): Promise<boolean> => {
    try {
      //check if there is an image if so delete as well
      if (post.imageURL) {
        const imageRef = ref(storage, `posts/${post.id}/image`);
        await deleteObject(imageRef);
      }
      //delete post
      const postDocRef = doc(firestore, "posts", post.id!);
      await deleteDoc(postDocRef);
      //update recoil state
      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item.id !== post.id!),
      }));
      return true;
    } catch (error: any) {
      return false;
    }
  };
  const getCommunityPostVotes = async (communityId: string) => {
    const postVotesQuery = query(
      collection(firestore, `users/${user?.uid}/postVotes`),
      where("communityId", "==", communityId)
    );
    const postVotesDocs = await getDocs(postVotesQuery);
    const postVotes = postVotesDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPostStateValue((prev) => ({
      ...prev,
      postVotes: postVotes as PostVote[],
    }));
    console.log("PostsVotes", currentCommunity);
  };

  useEffect(() => {
    if (!user || !currentCommunity?.id) return;
    console.log("getting old votes...");
    getCommunityPostVotes(currentCommunity?.id);
  }, [user, currentCommunity]);
  useEffect(() => {
    if (!user) {
      //clear user post votes
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    }
  }, [user]);
  return {
    postStateValue,
    setPostStateValue,
    onVote,
    onSelectPost,
    onDeletePost,
  };
};
export default usePosts;
