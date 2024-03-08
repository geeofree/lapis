import { ReactNode, useCallback, useEffect, useState } from "react";

type ChildNode = {
  type: "primitive" | "node";
  value: string | number;
};

type Nodes = {
  type: string;
  children: ChildNode[];
};

const DEFAULT_CONTENT: Record<string, Nodes> = {
  root: {
    type: "root",
    children: [
      { type: "node", value: "foo" },
      { type: "node", value: "bar" },
    ],
  },
  foo: {
    type: "header",
    children: [
      { type: "primitive", value: "Woah! " },
      { type: "primitive", value: "Hi there baby." },
    ],
  },
  bar: {
    type: "text",
    children: [{ type: "primitive", value: "Hey daddy." }],
  },
};

type Selection = {
  startId: string | null;
  endId: string | null;
  parentId: string | null;
  startOffset: number | null;
  endOffset: number | null;
  collapsed: boolean;
};

const DEFAULT_SELECTION: Selection = {
  startId: null,
  endId: null,
  parentId: null,
  startOffset: null,
  endOffset: null,
  collapsed: false,
};

function App() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);

  const handler = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    console.log(selection, range);
    setSelection((prevSelection) => ({
      ...prevSelection,
      startId:
        range.startContainer.parentElement?.dataset?.["lapisRteId"] ?? null,
      endId: range.endContainer.parentElement?.dataset?.["lapisRteId"] ?? null,
      parentId:
        (range.commonAncestorContainer as HTMLElement).dataset?.[
        "lapisRteId"
        ] ?? null,
      startOffset: range.startOffset,
      endOffset: range.endOffset - 1,
      collapsed: range.collapsed,
    }));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
    };
  }, []);

  const renderContent = (node: Nodes, nodeId?: string): ReactNode => {
    const commonProps = {
      key: nodeId,
      "data-lapis-rte-id": nodeId,
    };

    switch (node.type) {
      case "header":
        return (
          <h1 {...commonProps}>
            {node.children.map((childNode, i) =>
              childNode.type === "node" ? (
                renderContent(
                  content[childNode.value],
                  childNode.value as string,
                )
              ) : (
                <span
                  key={`${nodeId}.${i}`}
                  data-lapis-rte-id={`${nodeId}.${i}`}
                >
                  {childNode.value}
                </span>
              ),
            )}
          </h1>
        );
      case "text":
        return (
          <p {...commonProps}>
            {node.children.map((childNode, i) =>
              childNode.type === "node" ? (
                renderContent(
                  content[childNode.value],
                  childNode.value as string,
                )
              ) : (
                <span
                  key={`${nodeId}.${i}`}
                  data-lapis-rte-id={`${nodeId}.${i}`}
                >
                  {childNode.value}
                </span>
              ),
            )}
          </p>
        );
      case "root":
        return node.children.map((childNode, i) =>
          childNode.type === "node" ? (
            renderContent(content[childNode.value], childNode.value as string)
          ) : (
            <span key={`${nodeId}.${i}`} data-lapis-rte-id={`${nodeId}.${i}`}>
              {childNode.value}
            </span>
          ),
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{ minHeight: "36px" }}
      tabIndex={0}
      onKeyDown={(evt) => {
        evt.preventDefault();
        if (evt.key.length === 1) {
          setContent((currentContent) => {
            const [startId, startIdIndex] = selection.startId?.split(".") ?? [];
            const [endId, endIdIndex] = selection.endId?.split(".") ?? [];

            const startNode =
              currentContent[startId].children[Number(startIdIndex)];
            const endNode = currentContent[endId].children[Number(endIdIndex)];
            /**
             * TODO
             * Implement the content update logic
             **/
            console.log(startNode, endNode, selection, evt.key);
            return currentContent;
          });
        }
      }}
      onKeyUp={(evt) => {
        evt.preventDefault();
        console.log("up", evt.key);
      }}
      data-rte-id="root"
    >
      {renderContent(content.root, "root")}
    </div>
  );
}

export default App;
