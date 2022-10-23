import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect } from "react";
import PageContentLayout from "../../../../components/Layout/PageContent";
import PostItem from "../../../../components/Posts/PostItem";
import { auth, firestore } from "../../../../firebase/clientApp";
import usePosts from "../../../../hooks/usePosts";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { Post } from "../../../../atoms/postAtom";
import About from "../../../../components/Community/About";
import useCommunityData from "../../../../hooks/useCommunityData";
import Comments from "../../../../components/Posts/Comments/Comments";

const PostPage: React.FC = () => {
  const { postStateValue, setPostStateValue, onDeletePost, onVote } =
    usePosts();
  const fetchPost = async (postId: string) => {
    try {
      const postDocRef = doc(firestore, "posts", postId);
      const postDoc = await getDoc(postDocRef);
      setPostStateValue((prev) => ({
        ...prev,
        selectedPost: { id: postDoc.id, ...postDoc.data() } as Post,
      }));
    } catch (error: any) {
      console.log("fetchPost error", error.message);
    }
  };
  const { communityStateValue } = useCommunityData();
  const [user] = useAuthState(auth);
  const router = useRouter();
  useEffect(() => {
    const { pid } = router.query;
    if (pid && !postStateValue.selectedPost) fetchPost(pid as string);
  }, [router.query, postStateValue.selectedPost]);
  return (
    <PageContentLayout>
      <>
        {/* SelectedPost */}
        {postStateValue.selectedPost && (
          <PostItem
            post={postStateValue.selectedPost}
            onVote={onVote}
            onDeletePost={onDeletePost}
            userVoteValue={
              postStateValue.postVotes.find(
                (item) => item.postId === postStateValue.selectedPost?.id
              )?.voteValue
            }
            userIsCreator={user?.uid === postStateValue.selectedPost?.creatorId}
          />
        )}
        {/* //check this */}
        <Comments
          user={user as User}
          selectedPost={postStateValue.selectedPost as Post}
          communityId={communityStateValue.currentCommunity?.id as string}
        />
      </>
      <>
        {communityStateValue.currentCommunity && (
          <About communityData={communityStateValue.currentCommunity} />
        )}
      </>
    </PageContentLayout>
  );
};
export default PostPage;
