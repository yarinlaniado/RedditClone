import React from "react";
import { Flex, Image, Link } from "@chakra-ui/react";
import SearchInput from "./SearchInput";
import RightContent from "./RightContent/RightContent";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/clientApp";
import Directory from "./Directory/Directory";
import useDirectory from "../../hooks/useDirectory";
import { defaultMenuItem } from "../../atoms/directoryMenuAtom";

interface NavbarProps {
  props: {};
}

const Navbar: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const { onSelectMenuItem } = useDirectory();
  return (
    <Flex
      bg="white"
      height="44px"
      padding="6px 12px"
      justify={{ md: "space-between" }}
    >
      <Flex
        align="center"
        width={{ base: "40px", md: "auto" }}
        mr={{ base: 0, md: 2 }}
      >
        <Image
          cursor={"pointer"}
          onClick={() => onSelectMenuItem(defaultMenuItem)}
          src="/images/redditFace.svg"
          height="30px"
        />
        <Image
          cursor={"pointer"}
          onClick={() => onSelectMenuItem(defaultMenuItem)}
          src="/images/redditText.svg"
          height="46px"
          display={{ base: "none", md: "unset" }}
        />
      </Flex>
      {user && <Directory />}
      <SearchInput user={user} />
      <RightContent user={user} />
    </Flex>
  );
};
export default Navbar;
