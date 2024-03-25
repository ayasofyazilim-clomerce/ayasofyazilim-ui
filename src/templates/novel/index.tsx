'use client';

import {
  EditorBubble,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorContent,
  EditorRoot,
  JSONContent,
} from 'novel';
import { ImageResizer, handleCommandNavigation } from 'novel/extensions';
import { handleImageDrop, handleImagePaste } from 'novel/plugins';

import './prosemirror.css';

import React from 'react';
import { extensions, suggestionItems } from '../../organisms/novel/extensions';
import { uploadFn } from '../../organisms/novel/image-upload';
import { ColorSelector } from '../../organisms/novel/selectors/color-selector';
import { LinkSelector } from '../../organisms/novel/selectors/link-selector';
import { NodeSelector } from '../../organisms/novel/selectors/node-selector';
import { TextButtons } from '../../organisms/novel/selectors/text-buttons';

export default function CustomNovelEditor() {
  const [content, setContent] = React.useState<JSONContent>();
  const [openNode, setOpenNode] = React.useState(false);
  const [openLink, setOpenLink] = React.useState(false);
  const [openColor, setOpenColor] = React.useState(false);
  return (
    <EditorRoot>
      <EditorContent
        initialContent={content}
        onUpdate={({ editor }) => {
          const json = editor.getJSON();
          setContent(json);
        }}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) =>
            handleImageDrop(view, event, moved, uploadFn),
          attributes: {
            class: `min-h-screen prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-5`,
          },
        }}
        slotAfter={<ImageResizer />}
        extensions={extensions}
      >
        <EditorCommand className="z-50 h-auto max-h-[330px]  w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground">
            No results
          </EditorCommandEmpty>
          {suggestionItems.map((item) => (
            <EditorCommandItem
              value={item.title}
              onCommand={(val) => item.command && item.command(val)}
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent `}
              key={item.title}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                {item.icon}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </EditorCommandItem>
          ))}
        </EditorCommand>
        <EditorBubble className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-muted bg-background shadow-xl">
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
          <TextButtons />
          <ColorSelector open={openColor} onOpenChange={setOpenColor} />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
}
