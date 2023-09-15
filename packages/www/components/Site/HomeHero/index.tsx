import { Button, Text, Flex, Container, Box } from "@livepeer/design-system";
import HeroVideo from "./Video";
import PhoneSvg from "./PhoneSvg";
import { useEffect } from "react";
import { useRef, useCallback } from "react";
import {
  getProportionalValue,
  breakpoints,
  maxScroll,
  getDynamicBreakpoints,
  getPhonePadding,
} from "./helpers";
import { notchZIndex } from "./PhoneSvg";
import Guides from "components/Site/Guides";
import Link from "next/link";
import ArrowLink from "components/Site/ArrowLink";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Typical from "react-typical";

const HomeHero = ({ backgroundColor = "$loContrast" }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!videoRef.current || !phoneRef.current || !videoContainerRef.current) {
      return;
    }
    const dynamicBreakpoints = getDynamicBreakpoints();
    const { scrollTop } = document.documentElement;
    const figure = videoRef.current.querySelector("figure") as HTMLElement;
    const gradient = videoRef.current.querySelector(
      "#background-gradient"
    ) as HTMLDivElement;

    // Some calculations to know when to remove `position: fixed` on the video
    const { offsetHeight } = phoneRef.current;
    const { top } = phoneRef.current.getBoundingClientRect();
    const isPlacedOnPhone = top + offsetHeight / 2 <= window.innerHeight / 2;
    if (isPlacedOnPhone) {
      // Animate bottom first phase
      videoContainerRef.current.style.position = "absolute";
      videoContainerRef.current.style.transform = "none";
      videoContainerRef.current.style.left = "unset";
      videoContainerRef.current.style.top = "unset";
      videoContainerRef.current.style.bottom = `${getPhonePadding()}px`;
    } else {
      videoContainerRef.current.style.position = "fixed";
      videoContainerRef.current.style.transform = "translate(-50%, -50%)";
      videoContainerRef.current.style.left = "50%";
      videoContainerRef.current.style.top = "50%";
    }

    // Animate transform
    videoRef.current.style.transform = getProportionalValue(
      scrollTop,
      breakpoints.rotateX
    );
    // Animate maxWidth
    videoRef.current.style.maxWidth = getProportionalValue(
      scrollTop,
      dynamicBreakpoints.maxWidth
    );
    // Animate opacity
    videoRef.current.style.opacity = getProportionalValue(
      scrollTop,
      breakpoints.opacity
    );
    // Animate linear gradient background's opacity
    gradient.style.opacity = getProportionalValue(
      scrollTop,
      breakpoints.gradientOpacity
    );
    // Animate figure's aspect ratio
    figure.style.paddingBottom = getProportionalValue(
      scrollTop,
      breakpoints.aspectRatio
    );
  }, [videoRef.current, phoneRef.current, videoContainerRef.current]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
      }}>
      <Guides backgroundColor={backgroundColor} />
      <Container>
        <Box
          css={{
            width: "100%",
            mb: "$4",
            maxWidth: 960,
            mx: "auto",
            pt: 48,
            textAlign: "center",
            "@bp2": {
              pt: 150,
            },
          }}>
          <Box
            css={{
              zIndex: notchZIndex + 1,
              position: "relative",
            }}>
            <Box
              as="h1"
              css={{
                color: "$hiContrast",
                fontSize: 40,
                lineHeight: 1.1,
                mb: "$5",
                mt: 0,
                mx: "auto",
                maxWidth: 700,
                fontWeight: 700,
                letterSpacing: "-2px",
                "@bp1": {
                  fontSize: 52,
                  lineHeight: 1.1,
                },
                "@bp2": {
                  fontSize: 72,
                  lineHeight: 1,
                },
              }}>
              Video development made{" "}
              <Typical
                steps={[
                  "easy",
                  3500,
                  "affordable",
                  3500,
                  "scalable",
                  3500,
                  "reliable",
                  3500,
                ]}
                loop={Infinity}
                wrapper="span"
              />
            </Box>
            <Text
              size="6"
              css={{
                lineHeight: 1.6,
                mb: "$5",
                maxWidth: 780,
                mx: "auto",
              }}>
              Livepeer Studio is a high-performance video streaming platform for
              developers. It's scalable, reliable, and delivers up to{" "}
              <strong>90% cost savings</strong>.
            </Text>
            <Flex align="center" css={{ justifyContent: "center" }}>
              <Link href="/register" passHref>
                <Button
                  size={4}
                  variant="green"
                  css={{
                    borderRadius: 16,
                    py: "$5",
                    fontSize: "$5",
                    width: 240,
                    mr: "$4",
                  }}>
                  Get started
                </Button>
              </Link>
              {/* <ArrowLink href="/contact">Get in touch</ArrowLink> */}
            </Flex>
          </Box>
          <svg className="svg-filters">
            <defs>
              <filter id="marker-shape">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0 0.15"
                  numOctaves="1"
                  result="warp"
                />
                <feDisplacementMap
                  xChannelSelector="R"
                  yChannelSelector="G"
                  scale="30"
                  in="SourceGraphic"
                  in2="warp"
                />
              </filter>
            </defs>
          </svg>
          <Box
            css={{
              mb: 120,
              mt: -40,
              position: "relative",
              height: maxScroll,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              display: "none",
              "@bp2": {
                mt: "$4",
                display: "flex",
              },
              "@bp3": {
                mt: null,
              },
              "@bp4": {
                mt: "$6",
              },
            }}>
            <Box
              ref={videoContainerRef}
              css={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100vw",
                zIndex: notchZIndex - 1,
              }}>
              <HeroVideo ref={videoRef} />
            </Box>
            <PhoneSvg ref={phoneRef} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
