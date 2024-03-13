import {
  KeyboardEvent,
  KeyboardEventHandler,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Id = string;

export type LapisNodeChild = {
  type: "text" | "node";
  // Value of the text or the ID of the Node in the content tree
  value: string;
};

export type LapisNode = {
  id: Id;
  type: string;
  children: LapisNodeChild[] | null;
};

type DataAttributeProp = `data-${string}`;

export type LapisContainerProps = Record<DataAttributeProp, Id> & {
  onKeyUp: KeyboardEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  children: ReactNode;
};

export type LapisContent = Record<Id, LapisNode>;

export type LapisSelectionNode = {
  id: Id | null;
  offset: number | null;
  element: HTMLElement | null;
};

export type LapisSelection = {
  startNode: LapisSelectionNode;
  endNode: LapisSelectionNode;
  parentNode: Omit<LapisSelectionNode, "offset">;
};

export type LapisContext = {
  content: LapisContent;
  selection: LapisSelection;
  getContent: () => ReactNode;
  getContainerProps: () => LapisContainerProps;
};

const DEFAULT_SELECTION = {
  startNode: { id: null, element: null, offset: null },
  endNode: { id: null, element: null, offset: null },
  parentNode: { id: null, element: null },
};

const DEFAULT_DATA_ATTR_ID = "data-lapis";

const LapisContext = createContext<LapisContext>({
  content: {},
  selection: DEFAULT_SELECTION,
  getContent: () => null,
  getContainerProps: () => ({
    [DEFAULT_DATA_ATTR_ID]: "",
    onKeyUp: () => null,
    onKeyDown: () => null,
    children: null,
  }),
});

export type LapisProvider = {
  contentRootId: Id;
  dataAttributeName?: DataAttributeProp;
  defaultContent?: LapisContent;
  children: ReactNode;
  onRender: (
    type: string,
    props: { key: Id; children: ReactNode } & Record<DataAttributeProp, Id>,
  ) => ReactNode;
  onKeyUp?: (
    event: KeyboardEvent<HTMLElement>,
    content: LapisContent,
    selection: LapisSelection,
  ) => LapisContent | null | undefined | void;
  onKeyDown?: (
    event: KeyboardEvent<HTMLElement>,
    content: LapisContent,
    selection: LapisSelection,
  ) => LapisContent | null | undefined | void;
  onSelection?: (content: LapisContent, selection: LapisSelection) => void;
};

export const useLapisContext = () => useContext(LapisContext);

export function LapisProvider(props: LapisProvider) {
  const {
    dataAttributeName,
    children,
    defaultContent,
    contentRootId,
    onKeyUp,
    onKeyDown,
    onRender,
    onSelection,
  } = props;

  const _dataAttributeName = dataAttributeName ?? DEFAULT_DATA_ATTR_ID;
  const [, setUpdateCounter] = useState(0);
  const content = useRef<LapisContent>(defaultContent ?? {});
  const selection = useRef<LapisSelection>(DEFAULT_SELECTION);

  const handler = useCallback(() => {
    const docSelection = document.getSelection();
    if (!docSelection) return;
    const docRange = docSelection.getRangeAt(0);
    selection.current = {
      startNode: {
        id:
          docRange.startContainer.parentElement?.getAttribute(
            _dataAttributeName,
          ) ?? null,
        offset: docRange.startOffset,
        element: docRange.startContainer.parentElement,
      },
      endNode: {
        id:
          docRange.endContainer.parentElement?.getAttribute(
            _dataAttributeName,
          ) ?? null,
        offset: docRange.endOffset,
        element: docRange.endContainer.parentElement,
      },
      parentNode: {
        id:
          docRange.commonAncestorContainer.parentElement?.getAttribute(
            _dataAttributeName,
          ) ?? null,
        element: docRange.commonAncestorContainer.parentElement,
      },
    };

    if (typeof onSelection === "function") {
      onSelection(content.current, selection.current);
    }
    setUpdateCounter((updateCounter) => updateCounter + 1);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
    };
  }, []);

  const buildContent = (nodeId: Id, node: LapisNode): ReactNode => {
    if (node.id === contentRootId) {
      return node.children?.map((childNode) =>
        childNode.type === "node"
          ? buildContent(childNode.value, content.current[childNode.value])
          : childNode.value,
      );
    }

    // @ts-ignore
    return onRender(node.type, {
      [_dataAttributeName]: nodeId,
      key: nodeId,
      children: node.children?.map((childNode) =>
        childNode.type === "node"
          ? buildContent(childNode.value, content.current[childNode.value])
          : childNode.value,
      ),
    });
  };

  return (
    <LapisContext.Provider
      value={{
        content: content.current,
        selection: selection.current,
        getContent: () =>
          buildContent(contentRootId, content.current[contentRootId]),
        // @ts-ignore
        getContainerProps: () => ({
          [_dataAttributeName]: contentRootId,
          onKeyUp(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (typeof onKeyUp === "function") {
              const newContent = onKeyUp(
                evt,
                content.current,
                selection.current,
              );

              if (newContent) {
                content.current = newContent;
                setUpdateCounter((updateCounter) => updateCounter + 1);
              }
            }
          },
          onKeyDown(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (typeof onKeyDown === "function") {
              const newContent = onKeyDown(
                evt,
                content.current,
                selection.current,
              );

              if (newContent) {
                content.current = newContent;
                setUpdateCounter((updateCounter) => updateCounter + 1);
              }
            }
          },
        }),
      }}
    >
      {children}
    </LapisContext.Provider>
  );
}
