import { doc, getDoc } from "firebase/firestore";
import { GetServerSidePropsContext } from "next";
import React, { useEffect } from "react";
import { Community, communityState } from "../../../atoms/communitiesAtom";
import { firestore } from "../../../firebase/clientApp";
import safeJsonStringify from "safe-json-stringify";
import CommunityNotFound from "../../../components/Community/CommunityNotFound";
import Header from "../../../components/Community/Header";
import PageContent from "../../../components/Layout/PageContent";
import CreatePostLink from "../../../components/Community/CreatePostLink";
import Posts from "../../../components/Posts/Posts";
import { useSetRecoilState } from "recoil";
import About from "../../../components/Community/About";

type CommunityPageProps = {
  communityData: Community;
};

const CommunityPage: React.FC<CommunityPageProps> = ({ communityData }) => {
  const setCommunityStateValue = useSetRecoilState(communityState);
  useEffect(() => {
    setCommunityStateValue((prev) => ({
      ...prev,
      currentCommunity: communityData,
    }));
  }, [communityData]);
  if (!communityData) {
    return <CommunityNotFound />;
  }
  return (
    <>
      <Header communityData={communityData} />
      <PageContent>
        <>
          <CreatePostLink />
          <Posts communityData={communityData} />
        </>
        <>
          <About communityData={communityData} />
        </>
      </PageContent>
    </>
  );
};

//doing ssr and backend ops - getting data and passing it to CommunityPage component
export async function getServerSideProps(context: GetServerSidePropsContext) {
  //get community data and pass it to the componenent
  try {
    const communityDocRef = doc(
      firestore,
      "communities",
      context.query.communityId as string
    );
    const communityDoc = await getDoc(communityDocRef); //found community

    return {
      props: {
        communityData: communityDoc.exists()
          ? JSON.parse(
              safeJsonStringify({ id: communityDoc.id, ...communityDoc.data() })
            )
          : "",
      },
    };
  } catch (error) {
    console.log("getServerSideProps error", error);
  }
}
export default CommunityPage;
