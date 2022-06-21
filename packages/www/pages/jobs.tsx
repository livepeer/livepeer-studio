import { useRouter } from "next/router";
import Fade from "react-reveal/Fade";
import { Element } from "react-scroll";
import { Box } from "@livepeer/design-system";
import Hero from "@components/Site/Hero";
import Layout from "layouts/main";

import { Jobs as Content } from "content";
import JobsSection from "@components/Site/JobsSection";

const JobsPage = ({ allJobs }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout {...Content.metaData}>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  return (
    <Layout {...Content.metaData}>
      <Fade>
        <Element offset={-20} key="hero" id="hero" name="hero">
          <Hero
            heading="Work @ Livepeer, Inc."
            centered={true}
            skinny={true}
            description={null}
            ctas={[]}
            image={null}
            tagline={null}
          />
        </Element>
      </Fade>
      <Fade>
        <Element offset={-20} key="hero" id="hero" name="hero">
          <JobsSection jobs={allJobs} />
        </Element>
      </Fade>
    </Layout>
  );
};

export async function getStaticProps() {
  const jobsRes = await fetch(`https://livepeer.org/api/teamtailor/jobs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => response.json());

  return {
    props: {
      allJobs: jobsRes.data,
    },
    revalidate: 1,
  };
}

JobsPage.theme = "dark-theme-blue";
export default JobsPage;
