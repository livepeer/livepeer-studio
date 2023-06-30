import { Box, Flex, Link as A, Container } from "@livepeer/design-system";
import { useApi } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import Menu from "./mobile/menu";
import { useRouter } from "next/router";
import NavigationBreadcrumb, { BreadcrumbItem } from "./breadcrumb";
import Link from "next/link";
import CutOut from "components/Site/CutOut";
import RegionSelector from "components/Site/RegionSelector";

const sidesWidth = "250px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

export const StyledServerIcon = ({ ...props }) => (
  <Box as="svg" viewBox="0 0 24 24" {...props}>
    <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
  </Box>
);

type Props = {
  links;
  breadcrumb?: BreadcrumbItem[];
  withShadow?: boolean;
  navBackgroundColor?: string;
  css?: any;
};

const NavigationBase = ({
  links,
  breadcrumb,
  navBackgroundColor = "transparent",
  css,
}: Props) => {
  const { pathname } = useRouter();
  const [_hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/dashboard/");

  const handleScroll = useCallback(() => {
    const { scrollTop } = document.documentElement;
    if (scrollTop > 0) setHasScrolled(true);
    else setHasScrolled(false);
  }, []);

  useEffect(() => {
    handleScroll();
    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [token]);

  return (
    <Box css={{ mx: "$3" }}>
      <Container
        size="5"
        css={{ width: "100%", padding: 0, position: "relative", zIndex: 11 }}>
        <Box
          css={{
            position: "relative",
            mt: navBackgroundColor === "transparent" ? 0 : "$3",
            borderRadius: 40,
            "@bp1": {
              mt: "$3",
            },
            ...css,
          }}>
          <CutOut backgroundColor={navBackgroundColor} />
          <Box
            css={{
              mx: "$3",
            }}>
            <Flex
              css={{
                pt: "$4",
                justifyContent: "space-between",
                ai: "center",
              }}>
              <Box>
                <NavigationBreadcrumb
                  navBackgroundColor={navBackgroundColor}
                  breadcrumb={breadcrumb}
                />
              </Box>
              <Flex align="center" css={{ mt: -6 }}>
                <Flex
                  css={{
                    display: "none",
                    "@bp2": {
                      display: "flex",
                    },
                    ai: "center",
                    justifyContent: "flex-end",
                    minWidth: sidesWidth,
                    lineHeight: 1,
                    mr: 42,
                  }}>
                  {links.map((link, i) => {
                    return (
                      <Link
                        href={link.href}
                        key={`nav-link-${i}`}
                        passHref
                        legacyBehavior>
                        <A
                          target={link.isExternal ? "_blank" : null}
                          css={{
                            display: "block",
                            fontSize: "$4",
                            fontWeight: 500,
                            textDecoration: "none",
                            mx: "$3",
                            lineHeight: 1,
                            color:
                              navBackgroundColor === "transparent"
                                ? "$hiContrast"
                                : "$loContrast",
                            textTransform: "uppercase",
                          }}>
                          {link.children}
                        </A>
                      </Link>
                    );
                  })}
                  <Box css={{ mx: "$3" }}>
                    <RegionSelector navBackgroundColor={navBackgroundColor} />
                  </Box>
                </Flex>

                <Flex>
                  {!loggedIn && (
                    <>
                      <Link href="/" passHref legacyBehavior>
                        <A
                          css={{
                            fontSize: "$4",
                            fontWeight: 500,
                            textDecoration: "none",
                            textTransform: "uppercase",
                            display: "none",
                            position: "relative",
                            "@bp2": {
                              display: "block",
                            },
                            "&:hover": {
                              textDecoration: "none",
                            },
                            "&:after": {
                              content: '""',
                              position: "absolute",
                              left: -14,
                              borderTopLeftRadius: 10,
                              borderTopRightRadius: 12,
                              borderBottomLeftRadius: 4,
                              borderBottomRightRadius: 4,
                              zIndex: 1,
                              top: -14,
                              bc: "#fff",
                              height: 48,
                              width: 80,
                              transform: "skew(35deg)",
                              display:
                                navBackgroundColor === "transparent"
                                  ? "block"
                                  : "none",
                            },
                            "&:before": {
                              content: '""',
                              position: "absolute",
                              left: 22,
                              borderTopLeftRadius: 10,
                              borderTopRightRadius: 12,
                              borderBottomLeftRadius: 4,
                              borderBottomRightRadius: 4,
                              zIndex: 1,
                              top: -14,
                              bc: "#fff",
                              height: 48,
                              width: 110,
                              display:
                                navBackgroundColor === "transparent"
                                  ? "block"
                                  : "none",
                            },
                          }}>
                          <Box
                            css={{
                              color:
                                navBackgroundColor === "transparent"
                                  ? "$loContrast"
                                  : "$hiContrast",
                              position: "relative",
                              zIndex: 2,
                              width: 122,
                              textAlign: "center",
                            }}>
                            Let's go
                          </Box>
                        </A>
                      </Link>
                    </>
                  )}
                  {loggedIn && (
                    <Box
                      css={{
                        display: "none",
                        "@bp2": {
                          display: "block",
                        },
                      }}>
                      {isDashboard && (
                        <Link
                          href="https://docs.livepeer.studio"
                          passHref
                          legacyBehavior>
                          <A target="_blank">Docs</A>
                        </Link>
                      )}
                      {isDashboard && (
                        <Link href="/contact" passHref legacyBehavior>
                          <A>Contact</A>
                        </Link>
                      )}

                      {!isDashboard && (
                        <Link href="/dashboard" passHref legacyBehavior>
                          <A
                            css={{
                              fontSize: "$4",
                              fontWeight: 500,
                              textDecoration: "none",
                              textTransform: "uppercase",
                              display: "none",
                              position: "relative",
                              "@bp2": {
                                display: "block",
                              },
                              "&:hover": {
                                textDecoration: "none",
                              },
                              "&:after": {
                                content: '""',
                                position: "absolute",
                                left: -14,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                                zIndex: 1,
                                top: -14,
                                bc: "#fff",
                                height: 48,
                                width: 80,
                                transform: "skew(35deg)",
                                display:
                                  navBackgroundColor === "transparent"
                                    ? "block"
                                    : "none",
                              },
                              "&:before": {
                                content: '""',
                                position: "absolute",
                                left: 22,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                                zIndex: 1,
                                top: -14,
                                bc: "#fff",
                                height: 48,
                                width: 110,
                                display:
                                  navBackgroundColor === "transparent"
                                    ? "block"
                                    : "none",
                              },
                            }}>
                            <Box
                              css={{
                                color:
                                  navBackgroundColor === "transparent"
                                    ? "$loContrast"
                                    : "$hiContrast",
                                position: "relative",
                                zIndex: 2,
                                width: 122,
                                textAlign: "center",
                              }}>
                              Dashboard
                            </Box>
                          </A>
                        </Link>
                      )}
                    </Box>
                  )}
                </Flex>
                <Flex
                  css={{
                    textTransform: "uppercase",
                    cursor: "pointer",
                    "@bp2": {
                      display: "none",
                    },
                  }}
                  onClick={() => setMobileMenuIsOpen(true)}>
                  Menu
                </Flex>
              </Flex>
            </Flex>
          </Box>
          <Menu
            mobileMenuIsOpen={mobileMenuIsOpen}
            setMobileMenuIsOpen={setMobileMenuIsOpen}
            user={user}
            token={token}
            links={links}
            breadcrumb={breadcrumb}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default NavigationBase;
