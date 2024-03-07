import { ReactNode, useCallback, useEffect, useState } from "react";

type Content = {
  type: string;
  children: string | string[];
};

const content: Record<string, Content> = {
  root: {
    type: "root",
    children: ["foo", "bar"],
  },
  foo: {
    type: "header",
    children: "hi there baby",
  },
  bar: {
    type: "text",
    children: "hello daddy",
  },
};

type Selection = {
  startId: string | null;
  endId: string | null;
  parentId: string | null;
  startOffset: number | null;
  endOffset: number | null;
};

const DEFAULT_SELECTION: Selection = {
  startId: null,
  endId: null,
  parentId: null,
  startOffset: null,
  endOffset: null,
};

function App() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);

  const handler = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    setSelection((prevSelection) => ({
      ...prevSelection,
      startId: range.startContainer.parentElement?.dataset?.["rteId"] ?? null,
      endId: range.endContainer.parentElement?.dataset?.["rteId"] ?? null,
      parentId:
        (range.commonAncestorContainer as HTMLElement).dataset?.["rteId"] ??
        null,
      startOffset: range.startOffset,
      endOffset: range.endOffset - 1,
    }));
  }, []);

  console.log(selection);

  useEffect(() => {
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
    };
  }, []);

  const renderContent = (node: Content, nodeId?: string): ReactNode => {
    if (typeof node.children !== "string") {
      return node.children.map((nodeId) =>
        renderContent(content[nodeId], nodeId),
      );
    }

    const commonProps = { key: nodeId, "data-rte-id": nodeId };
    switch (node.type) {
      case "header":
        return <h1 {...commonProps}>{node.children}</h1>;
      case "text":
        return <p {...commonProps}>{node.children}</p>;
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
        console.log("down", evt.key);
      }}
      onKeyUp={(evt) => {
        evt.preventDefault();
        console.log("up", evt.key);
      }}
      data-rte-id="root"
    >
      {renderContent(content.root)}
    </div>
  );
}

export default App;
