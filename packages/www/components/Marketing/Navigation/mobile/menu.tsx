import {
  Box,
  Flex,
  Text,
  Container,
  Link as A,
  Button as StyledButton,
} from "@livepeer/design-system";
import { User } from "@livepeer.com/api";
import Link from "next/link";
import { BreadcrumbItem } from "../breadcrumb";
import { Cross1Icon } from "@radix-ui/react-icons";
import Button from "@components/Marketing/Button";
import ArrowLink from "@components/Marketing/ArrowLink";
import { StyledServerIcon } from "@components/Marketing/Navigation/base";

type Props = {
  links: any;
  breadcrumb?: BreadcrumbItem[];
  mobileMenuIsOpen: boolean;
  setMobileMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  token: string | undefined;
  user: User | undefined;
};

const StyledEcommerceIcon = ({ active = false, ...props }) => {
  return (
    <Box
      as="svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Box
        as="path"
        fill="currentColor"
        fillRule="evenodd"
        d="M5.43 6L5.1 7.22a3 3 0 0 0 5.8 1.56L11.64 6H15a1 1 0 0 1 0 2l-.9 7.11a1 1 0 0 1-1 .89H2.9a1 1 0 0 1-1-.89L1 8a1 1 0 1 1 0-2h4.43zM9.61.02l.97.26a.5.5 0 0 1 .35.6L9.57 6l-.6 2.26a1 1 0 0 1-1.94-.52l2-7.45a.5.5 0 0 1 .58-.27z"
      />
    </Box>
  );
};

const StyledPlatformsIcon = ({ ...props }) => (
  <Box
    as="svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <path
      d="M6.98 0a.52.52 0 0 0-.25.08L.24 4.03a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43L7.27.08a.52.52 0 0 0-.3-.08zm-5.5 6.82l-1.24.76A.5.5 0 0 0 0 8c0 .17.1.33.24.42l6.49 3.96c.17.1.37.1.54 0l6.49-3.96A.5.5 0 0 0 14 8a.5.5 0 0 0-.24-.42l-1.25-.76-4.7 2.86a1.58 1.58 0 0 1-1.62 0l-4.7-2.86zm0 3.54l-1.24.76a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43l-1.25-.76-4.7 2.87a1.58 1.58 0 0 1-1.62 0l-4.7-2.87z"
      fill="currentColor"
      fillRule="nonzero"></path>
  </Box>
);

const Menu = ({
  mobileMenuIsOpen,
  setMobileMenuIsOpen,
  token,
  user,
  links,
}: Props) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMobileMenuIsOpen(false);
  };

  return (
    <Box
      css={{
        position: "fixed",
        top: "$3",
        left: "$3",
        height: mobileMenuIsOpen ? "auto" : 0,
        transition: "height .2s",
        borderRadius: "$3",
        overflow: "hidden",
        width: "calc(100% - $space$3 * 2)",
        zIndex: 1,
        visibility: mobileMenuIsOpen ? "visible" : "hidden",
        background: mobileMenuIsOpen
          ? "linear-gradient(90deg,$colors$mauve4,$colors$mauve4 50%,transparent 0,transparent)"
          : "transparent",
        boxShadow: mobileMenuIsOpen
          ? "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.14)"
          : "none",
      }}
      onClick={handleClick}>
      <StyledButton
        ghost
        css={{
          top: "$3",
          position: "absolute",
          right: "$4",
          cursor: "pointer",
        }}
        onClick={() => setMobileMenuIsOpen(false)}>
        <Cross1Icon />
      </StyledButton>
      <Container
        css={{
          pt: "$6",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "$panel",
        }}>
        <Flex css={{ flexDirection: "column" }}>
          {links.map((link) => {
            return (
              <Link href={link.href} key={`menu-link-${link.href}`} passHref>
                <A
                  css={{
                    mb: "$4",
                    "&:last-of-type": {
                      mb: 0,
                    },
                  }}>
                  {link.children}
                </A>
              </Link>
            );
          })}
          <Box as="hr" css={{ my: "$3", visibility: "hidden" }} />
        </Flex>
      </Container>
      <Box
        css={{
          p: "$5",
          backgroundColor: "$panel",
          borderTop: "1px solid $mauve5",
        }}>
        <Text
          variant="gray"
          size="2"
          css={{ mb: "$4", textTransform: "uppercase", fontWeight: 600 }}>
          Products
        </Text>
        <Box css={{ mb: "$4" }}>
          <Flex>
            <StyledPlatformsIcon
              css={{ color: "$hiContrast", mt: "4px", mr: "$3" }}
            />
            <Box>
              <ArrowLink
                hideArrow
                href="/products/streaming-service"
                css={{ fontWeight: 600, mb: "$2" }}>
                Streaming Service
              </ArrowLink>
              <Box css={{ color: "$mauve5" }}>
                <ArrowLink
                  hideArrow
                  color="$mauve9"
                  href="/use-cases/creator-platforms">
                  <Text variant="gray" css={{ py: "$1" }}>
                    For creator apps
                  </Text>
                </ArrowLink>
                <ArrowLink
                  hideArrow
                  color="$mauve9"
                  href="/use-cases/game-streaming-platforms">
                  <Text variant="gray" css={{ py: "$1" }}>
                    For live gaming apps
                  </Text>
                </ArrowLink>
                <ArrowLink
                  hideArrow
                  color="$mauve9"
                  href="/use-cases/music-streaming-platforms">
                  <Text variant="gray" css={{ py: "$1" }}>
                    For live music apps
                  </Text>
                </ArrowLink>
                <ArrowLink
                  hideArrow
                  color="$mauve9"
                  href="/use-cases/24x7-channels">
                  <Text variant="gray" css={{ py: "$1" }}>
                    For 24x7 video apps
                  </Text>
                </ArrowLink>

                <ArrowLink
                  hideArrow
                  color="$mauve9"
                  href="/use-cases/ecommerce">
                  <Text variant="gray" css={{ py: "$1" }}>
                    For e-commerce apps
                  </Text>
                </ArrowLink>
              </Box>
            </Box>
          </Flex>
        </Box>
        <Box>
          <Flex>
            <StyledServerIcon
              css={{
                fill: "white",
                mt: "0px",
                mr: "$3",
                width: "16px",
              }}
            />
            <ArrowLink
              hideArrow
              href="/products/media-server"
              css={{ fontWeight: 600, fontSize: "$3" }}>
              Media Server
            </ArrowLink>
          </Flex>
        </Box>
      </Box>
      <Flex
        css={{
          p: "$3",
          ai: "center",
          justifyContent: "center",
          backgroundColor: "$panel",
          borderTop: "1px solid $mauve5",
        }}>
        {!!token ? (
          <>
            <Link href="dashboard" passHref>
              <Button arrow>Dashboard</Button>
            </Link>
            {user && user.admin && (
              <Link href="/app/admin" passHref>
                <A css={{ ml: "$3" }}>Admin</A>
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/register" passHref>
              <Button arrow css={{ mr: "$3" }}>
                Sign up
              </Button>
            </Link>
            <ArrowLink href="/login">Login</ArrowLink>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default Menu;
