import { useQuery, useQueryClient } from "react-query";
import useApi from "./use-api";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";

export const projectId =
  typeof window !== "undefined" && localStorage.getItem("currentProject");

export const PROJECT_ID_KEY = "selectedProject";

const useProject = () => {
  const {
    query: { projectId },
    push,
  } = useRouter();

  const appendProjectId = (path) => {
    return `/projects/${projectId}${path}`;
  };

  const setCurrentProject = (project, path?: string) => {
    localStorage.setItem(PROJECT_ID_KEY, project.id);
    push(`/projects/${project.id}${path ?? ""}`);
  };

  return {
    appendProjectId,
    activeProjectId:
      projectId ??
      (typeof window !== "undefined" && localStorage.getItem("currentProject")),
    setCurrentProject,
  };
};

export default useProject;
