export const projectId =
  typeof window !== "undefined" && localStorage.getItem("currentProject");

export default function useProject() {
  const setCurrentProject = (project, shouldReload = true) => {
    localStorage.setItem("currentProject", project.id);
    if (shouldReload) {
      window.location.reload();
    }
  };

  return {
    setCurrentProject,
    currentProject: projectId,
  };
}
