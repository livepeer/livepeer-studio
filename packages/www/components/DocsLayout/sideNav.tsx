/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState, useEffect } from "react";
import { Download } from "./icons";
import Collapsible from "react-collapsible";
import { useRouter } from "next/router";
import { TiArrowSortedDown } from "react-icons/ti";
import Link from "next/link";
import Marked from "./Marked";
import { Box } from "@theme-ui/components";

type SideNavProps = {
  hideTopNav: boolean;
  hideSideBar: boolean;
  setHideSideBar: React.Dispatch<React.SetStateAction<boolean>>;
};

type Child = {
  title: string;
  description: string;
  slug: string;
  hide: boolean;
  children: {
    title: string;
    description: string;
    slug: string;
  }[];
};

type MenuProps = {
  menu: {
    title: string;
    description: string;
    slug: string;
    children: Child[];
  }[];
};

type MobileSideNavProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type TriggerProps = {
  label: string;
  isOpen: boolean;
  isSelected: boolean;
};

const Trigger = ({ label, isOpen, isSelected }: TriggerProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        cursor: "pointer",
        background: "white",
        minHeight: "fit-content",
        pl: "24px",
        position: "relative",
      }}>
      <Box
        sx={{
          position: "absolute",
          left: "0",
          width: "4px",
          height: "100%",
          transition: "all 0.2s",
          background: isSelected ? "#6e56cf" : "transparent",
          borderRadius: " 0 2px 2px 0",
        }}
      />
      <Box
        sx={{
          fontWeight: isSelected ? "600" : "400",
          transition: "all 0.2s",
          mr: "8px",
          fontSize: "14px",
          letterSpacing: "-0.02em",
          color: "#3C3C3C",
          ":hover": {
            color: "#000000",
          },
        }}>
        <Marked>{label}</Marked>
      </Box>
      <Box
        as="i"
        sx={{
          transform: isOpen ? "rotate(-90deg)" : "",
          transition: "all 0.1s",
          mt: "6px",
        }}>
        <TiArrowSortedDown color="#AFAFAF" size={12} />
      </Box>
    </Box>
  );
};

const CollapsibleMenuItem = ({ route }: { route: Child }) => {
  const router = useRouter();
  const currentPath = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 5)
    .join("/");
  const currentPathSection = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 4)
    .join("/");

  const [isOpen, setIsOpen] = useState(currentPathSection === `/${route.slug}`);

  return (
    <Collapsible
      handleTriggerClick={() => setIsOpen((p) => !p)}
      open={isOpen}
      transitionTime={200}
      sx={{ background: "none", mt: "16px" }}
      trigger={
        <Trigger
          isOpen={isOpen}
          label={route.title}
          isSelected={currentPathSection === `/${route.slug}`}
        />
      }>
      {route.children.map((child, idx2) => (
        <Link href={`/${child.slug}`} key={idx2} passHref>
          <Box
            as="a"
            sx={{
              fontSize: "14px",
              letterSpacing: "-0.02em",
              color: currentPath === `/${child.slug}` ? "#6e56cf" : "#777777",
              ml: "48px !important",
              mt: "16px !important",
              transition: "all 0.2s",
              cursor: "pointer",
              ":hover": {
                color: "#000000",
              },
            }}>
            <Marked>{child.title}</Marked>
          </Box>
        </Link>
      ))}
    </Collapsible>
  );
};

const Menu = ({ menu }: MenuProps) => {
  const router = useRouter();
  const currentPath = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 5)
    .join("/");

  return (
    <Box
      sx={{
        mt: "8px",
        display: "flex",
        flexDirection: "column",
      }}>
      {menu[0]?.children.map((route, idx) =>
        route.children.length > 0 ? (
          <CollapsibleMenuItem route={route} key={idx} />
        ) : (
          !route.hide && (
            <Link href={`/${route.slug}`} key={idx} passHref>
              <Box
                as="a"
                sx={{
                  fontSize: "14px",
                  letterSpacing: "-0.02em",
                  color: "#3C3C3C",
                  mt: "16px !important",
                  cursor: "pointer",
                  position: "relative",
                  fontWeight: currentPath === `/${route.slug}` ? "600" : "400",
                  pl: "24px",
                }}>
                <Box
                  sx={{
                    position: "absolute",
                    left: "0",
                    width: "4px",
                    height: "100%",
                    transition: "all 0.2s",
                    background:
                      currentPath === `/${route.slug}`
                        ? "#6e56cf"
                        : "transparent",
                    borderRadius: " 0 2px 2px 0",
                  }}
                />
                <Box
                  as="span"
                  sx={{
                    color: "#3C3C3C",
                    ":hover": {
                      color: "#000000",
                    },
                  }}>
                  <Marked>{route.title}</Marked>
                </Box>
              </Box>
            </Link>
          )
        )
      )}
    </Box>
  );
};

const SideNav = ({
  hideTopNav,
  hideSideBar,
  setHideSideBar,
  menu,
}: SideNavProps & MenuProps) => {
  const [iconHover, setIconHover] = useState(false);
  return (
    <Box
      sx={{
        height: `calc(100vh - ${hideTopNav ? "76px" : "136px"})`,
        overflowY: "auto",
        display: ["none", "none", "flex", "flex"],
        justifyContent: "space-between",
        position: "sticky",
        marginTop: hideTopNav ? "-60px" : "",
        marginLeft: hideSideBar ? "-233px" : "0px",
        transition: "all 0.2s",
        background: "white",
        top: hideTopNav ? 76 : 136,
      }}>
      <Box
        sx={{
          width: "233px",
          minWidth: "233px",
          maxWidth: "233px",
          padding: "24px 0",
        }}>
        <Box
          as="p"
          sx={{
            fontSize: "10px",
            color: "#4F4F4F",
            letterSpacing: "0.08em",
            fontWeight: "bold",
            ml: "24px",
            mt: "8px",
          }}>
          CONTENT
        </Box>
        <Menu menu={menu} />
      </Box>
      <Box
        sx={{
          borderRight: "1px solid #E6E6E6",
          height: "100%",
          pt: "24px",
          transition: "all 0.2s",
          width: "60px",
          minWidth: "60px",
          display: "flex",
          justifyContent: "center",
        }}>
        <Box
          as="i"
          onClick={() => setHideSideBar(!hideSideBar)}
          onMouseOver={() => setIconHover(true)}
          onMouseOut={() => setIconHover(false)}
          sx={{
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxHeight: "22px",
            height: "22px",
            width: "22px",
            transform: hideSideBar ? "rotate(-270deg)" : "rotate(-90deg)",
          }}>
          <Download hovered={iconHover} />
        </Box>
      </Box>
    </Box>
  );
};

export const MobileSideNav = ({
  menu,
  isOpen,
  setIsOpen,
}: MobileSideNavProps & MenuProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }
  }, [isOpen]);

  return (
    <Box
      sx={{
        display: ["flex", "flex", "none", "none"],
        height: "100vh",
        width: isOpen ? "100vw" : "0px",
        overflowX: "hidden",
        transition: "all 0.2s",
        position: "fixed",
        zIndex: 100,
        top: 0,
        left: 0,
      }}>
      <Box
        onClick={() => setIsOpen(false)}
        sx={{
          position: "fixed",
          background: "rgba(0, 0, 0, 0.32)",
          height: "100vh",
          width: "100vw",
          transition: "all 0.2s",
          top: 0,
          zIndex: 1,
          right: 0,
          opacity: isOpen ? "1" : "0",
          visibility: isOpen ? "visible" : "hidden",
        }}
      />
      <Box
        sx={{
          padding: "24px 38px 24px 0",
          maxWidth: "100%",
          background: "white",
          paddingBottom: "120px",
          overflow: "auto",
          zIndex: 100,
        }}>
        <Box
          as="p"
          sx={{
            fontSize: "10px",
            color: "#4F4F4F",
            letterSpacing: "0.08em",
            fontWeight: "bold",
            ml: "24px",
            mt: "8px",
          }}>
          CONTENT
        </Box>
        <Menu menu={menu} />
      </Box>
    </Box>
  );
};

export default SideNav;
