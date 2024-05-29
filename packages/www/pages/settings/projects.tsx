import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { DashboardProjects as Content } from "content";
import {
  Box,
  Heading,
  Text,
  Grid,
  Button,
  Flex,
} from "@livepeer/design-system";
import ProjectTile from "components/Project/ProjectTile";
import { useQuery, useQueryClient } from "react-query";
import { PlusIcon } from "@radix-ui/react-icons";
import useProject from "hooks/use-project";
import { useState } from "react";
import CreateProjectDialog from "components/Project/createProjectDialog";

const WorkspaceProjects = () => {
  useLoggedIn();
  const { user, getProjects, createProject } = useApi();
  const [showCreateProjectAlert, setShowCreateProjectAlert] = useState(false);
  const { setCurrentProject } = useProject();

  const queryClient = useQueryClient();

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });

    setCurrentProject(project, false);
    setShowCreateProjectAlert(false);

    queryClient.invalidateQueries("projects");
  };

  const { data } = useQuery("projects", getProjects);

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="settings/projects"
      breadcrumbs={[{ title: "Projects" }]}
      {...Content.metaData}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <Box css={{ mb: "$7" }}>
          <Flex
            justify={"between"}
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$5",
              mb: "$5",
              width: "100%",
            }}>
            <Flex direction={"column"}>
              <Heading
                size="2"
                css={{
                  mr: "$3",
                  fontWeight: 600,
                  letterSpacing: "0",
                }}>
                Projects
              </Heading>
              <Text variant="neutral" size="3" css={{ mt: "$2" }}>
                Manage your projects
              </Text>
            </Flex>
            <Button
              onClick={() => setShowCreateProjectAlert(true)}
              css={{
                p: "$3",
                marginTop: "2rem",
              }}>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create Project
              </Box>
            </Button>
          </Flex>
        </Box>
        <Grid
          css={{
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "$5",
          }}>
          {data?.map((project, i) => (
            <ProjectTile
              key={`project-tile-${i}`}
              id={project.id}
              name={project.name}
            />
          ))}
        </Grid>
      </Box>

      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />
    </Layout>
  );
};

export default WorkspaceProjects;
