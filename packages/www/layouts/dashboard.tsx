import { ThemeProvider } from "next-themes";
import {
  global,
  darkTheme,
  lightTheme,
  DesignSystemProvider,
  Box,
  SnackbarProvider,
} from "@livepeer.com/design-system";
import Sidebar from "@components/Dashboard/Sidebar";
import Header from "@components/Dashboard/Header";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../lib/utils";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect } from "react";
import { DashboardRedirect } from "hooks/use-api";
import { hotjar } from "react-hotjar";
import Head from "next/head";
import { NextSeo } from "next-seo";

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  ReactGA.initialize("test", { testMode: true });
}

// Track client-side page views with Segment & HubSpot
if (process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics.page();
    var _hsq = (window["hsq"] = window["hsq"] || []);
    _hsq.push(["setPath", url]);
    _hsq.push(["trackPageView"]);
  });
}

const globalStyles = global({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    fontFamily: "$untitled",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

  "body, button": {
    fontFamily: "$untitled",
  },

  svg: { display: "block" },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },

  "#hubspot-messages-iframe-container iframe": {
    colorScheme: "auto",
  },
});

type Breadcrumb = {
  title: string;
  href?: string;
};
interface Props {
  children?: JSX.Element[] | JSX.Element;
  breadcrumbs?: Breadcrumb[];
  id?: string;
  requireLoggedIn?: boolean;
  title?: string;
  description?: string;
  noindex?: boolean;
  image?: any;
  url?: string;
  canonical?: string;
}

function ContextProviders({ children }) {
  return (
    <Elements stripe={getStripe()}>
      <DesignSystemProvider>
        <ThemeProvider
          disableTransitionOnChange
          attribute="class"
          defaultTheme="system"
          value={{ dark: darkTheme.className, light: lightTheme.className }}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </ThemeProvider>
      </DesignSystemProvider>
    </Elements>
  );
}

function DashboardLayout({
  id,
  children,
  breadcrumbs,
  title,
  description,
  noindex = true,
  image,
  url,
  canonical,
  requireLoggedIn = true,
}: Props) {
  useEffect(() => {
    if (window.location.hostname === "livepeer.com") {
      ReactGA.pageview(window.location.pathname + window.location.search);
      hotjar.initialize(2525106, 6);
    }
  }, []);

  globalStyles();

  let seo = {
    title,
    description,
    noindex,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image ? image.url : "https://livepeer.com/img/OG.png",
          alt: image ? image.alt : "Livepeer.com",
          width: 1200,
          height: 642,
        },
      ],
    },
  };

  if (canonical) {
    seo["canonical"] = canonical;
  }

  return (
    <>
      {requireLoggedIn && <DashboardRedirect />}
      <ContextProviders>
        <Head>
          <meta name="viewport" content="width=1023" />
        </Head>
        <NextSeo {...seo} />
        <Sidebar id={id} />
        <Box css={{ pl: 270, width: "100%" }}>
          <Header breadcrumbs={breadcrumbs} />
          <Box
            css={{
              margin: "0 auto",
              maxWidth: "1520px",
            }}>
            {children}
          </Box>
        </Box>
      </ContextProviders>
    </>
  );
}

export default DashboardLayout;
