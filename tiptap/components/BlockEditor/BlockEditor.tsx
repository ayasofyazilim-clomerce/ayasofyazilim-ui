'use client';

import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import { useEffect, useRef } from 'react';

import { LinkMenu } from '@tiptap-location/components/menus';

import '@tiptap-location/styles/index.css';

import { ImageBlockMenu } from '@tiptap-location/extensions/ImageBlock/components/ImageBlockMenu';
import { ColumnsMenu } from '@tiptap-location/extensions/MultiColumn/menus';
import {
  TableColumnMenu,
  TableRowMenu,
} from '@tiptap-location/extensions/Table/menus';
import { ExtensionKit } from '@tiptap-location/extensions/extension-kit';
import { Content } from 'tippy.js';
import { ContentItemMenu } from '../menus/ContentItemMenu';
import { TextMenu } from '../menus/TextMenu';
import { cn } from '@/lib/utils';

let timeout: NodeJS.Timeout;
export interface IBlockEditorProps {
  editable: boolean;
  editorContent: JSONContent | undefined;
  setEditorContent?: React.Dispatch<React.SetStateAction<JSONContent>>;
  setWordCount?: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
}
export const BlockEditor = ({
  setEditorContent,
  setWordCount,
  editorContent,
  editable,
  className,
}: IBlockEditorProps) => {
  const menuContainerRef = useRef(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editor = useEditor(
    {
      autofocus: false,
      extensions: [...ExtensionKit()],
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full outline-none',
        },
      },
      content: editorContent,
      editable: editable,

      onUpdate: ({ editor }) => {
        if (setEditorContent) {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            const json = editor.getJSON();
            setEditorContent(json);
            const wordCount = editor.storage.characterCount.words();
            if (setWordCount && wordCount) {
              setWordCount(wordCount);
            }
          }, 1000);
        }
      },
      onCreate: ({ editor }) => {
        const wordCount = editor.storage.characterCount.words();
        if (setWordCount && wordCount) {
          setWordCount(wordCount);
        }
      },
    },
    []
  );

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor?.commands.setContent(editorContent as Content);
      editor.setEditable(editable);
    }
  }, [editable]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('flex size-full', className)} ref={menuContainerRef}>
      <div
        className={
          'relative flex flex-col flex-1 size-full ' +
          (editable ? 'edit-mode' : 'preview-mode')
        }
      >
        <EditorContent
          editor={editor}
          ref={editorRef}
          className={cn('h-full', editable ? '[&>div]:!p-4' : '[&>div]:!p-0')}
        />
        {editable && (
          <div>
            <ContentItemMenu editor={editor} />
            <LinkMenu editor={editor} appendTo={menuContainerRef} />
            <TextMenu editor={editor} />
            <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
            <TableRowMenu editor={editor} appendTo={menuContainerRef} />
            <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
            <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
          </div>
        )}
      </div>
    </div>
  );
};
