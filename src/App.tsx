import { LapisContent, LapisProvider, useLapisContext } from "./lapis";

const DEFAULT_CONTENT: LapisContent = {
  root: {
    id: "root",
    type: "root",
    children: [{ type: "node", value: "quas" }],
  },
  quas: {
    id: "quas",
    type: "header",
    children: [
      { type: "text", value: "Quas " },
      { type: "node", value: "wex" },
    ],
  },
  wex: {
    id: "wex",
    type: "span",
    children: [
      { type: "text", value: "Wex " },
      { type: "node", value: "exort" },
    ],
  },
  exort: {
    id: "exort",
    type: "italic",
    children: [{ type: "text", value: "the quick brown fox jumps over" }],
  },
};

function Container() {
  const { getContainerProps, getContent } = useLapisContext();
  return (
    <div {...getContainerProps()} tabIndex={0}>
      <h1>Hello application!</h1>
      {getContent()}
    </div>
  );
}

function App() {
  return (
    <LapisProvider
      contentRootId="root"
      defaultContent={DEFAULT_CONTENT}
      onRender={(type, props) => {
        switch (type) {
          case "text":
            return <p {...props} />;
          case "span":
            return <span {...props} />;
          case "bold":
            return <b {...props} />;
          case "italic":
            return <i {...props} />;
          case "header":
            return <h1 {...props} />;
          default:
            return null;
        }
      }}
      onSelection={(content, selection) => {
        console.log("geo-selection", content, selection);
      }}
      onKeyDown={(evt, content, selection) => {
        console.log(evt.key, content, selection);
      }}
    >
      <Container />
    </LapisProvider>
  );
}

export default App;
