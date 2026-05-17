import { useAppStore } from "@/store/appStore";
import type { ProjectTreeNode } from "@/lib/projectIndex";
import * as fileOps from "@/lib/fileOps";

function ProjectNode({ node, depth }: { node: ProjectTreeNode; depth: number }) {
  if (node.type === "file") {
    return (
      <button
        className="project-file"
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        title={node.relativePath}
        onClick={() => fileOps.openProjectFile(node.path)}
      >
        <span className="project-file-icon">#</span>
        <span className="project-file-name">{node.name}</span>
      </button>
    );
  }

  return (
    <div className="project-folder">
      {depth > 0 && (
        <div className="project-folder-name" style={{ paddingLeft: `${12 + depth * 12}px` }}>
          <span className="project-file-icon">/</span>
          <span>{node.name}</span>
        </div>
      )}
      {node.children.map((child) => (
        <ProjectNode key={child.id} node={child} depth={depth + (depth === 0 ? 0 : 1)} />
      ))}
    </div>
  );
}

export default function ProjectFiles() {
  const projectTree = useAppStore((s) => s.projectTree);
  if (!projectTree) return null;

  return (
    <section className="project-files" aria-label="Project files">
      <div className="project-header">
        <span>Project</span>
        <strong title={projectTree.path}>{projectTree.name}</strong>
      </div>
      <ProjectNode node={projectTree} depth={0} />
    </section>
  );
}
