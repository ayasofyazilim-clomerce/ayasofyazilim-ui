import { JsonEditor, JsonEditorProps, githubLightTheme } from "json-edit-react";

export function JSONEditor({ config }: { config: JsonEditorProps }) {
  return (
    <JsonEditor
      {...{
        showCollectionCount: false,
        indent: 4,
        showArrayIndices: false,
        restrictNewKey: true,
        restrictEdit: true,
        restrictDelete: true,
        restrictAdd: true,
        restrictTypeSelection: true,
        restrictDrag: true,
        keySort: true,
        theme: githubLightTheme,
        ...config,
      }}
    />
  );
}
