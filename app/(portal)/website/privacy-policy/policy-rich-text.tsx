'use client'

import { useEffect, useRef } from 'react'
import type { JSONContent } from '@tiptap/core'
import { ListItem } from '@tiptap/extension-list'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, List, ListOrdered, Redo2, Undo2, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  editorDocFromText,
  textFromEditorDoc,
  type EditorNode,
} from '@/lib/domain/privacy-policy-editor-doc'
import { cn } from '@/lib/utils'

/**
 * The privacy policy's rich text editor (capability F10).
 *
 * TipTap, cut down to exactly what the stored text can hold (see
 * lib/domain/privacy-policy.ts): one heading size, paragraphs, bullet and
 * numbered lists, and bold. Everything else StarterKit brings — italic, links,
 * quotes, code, rules, line breaks — is switched off rather than dropped on
 * save, so the editor never shows formatting the website will not.
 *
 * **Controlled by text.** `value` is the stored format and `onChange` hands
 * the same format back, so the screen around it compares, checks and saves
 * text exactly as it did before there was an editor. A `value` that did not
 * come from typing — the template, *Discard changes* — replaces the document.
 *
 * **Pasting keeps what can be kept.** Word and Google Docs headings of any
 * level become the one heading size, lists and bold come across, and the rest
 * falls away to plain text.
 */

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2] },
    blockquote: false,
    code: false,
    codeBlock: false,
    hardBreak: false,
    horizontalRule: false,
    italic: false,
    link: false,
    strike: false,
    underline: false,
    listItem: false,
  }),
  // One paragraph per item, so Tab cannot nest a list: the stored text has no
  // nesting, and a schema that refuses one is honest where flattening it on
  // save would not be.
  ListItem.extend({ content: 'paragraph' }),
]

/**
 * The document drawn with the public page's tokens (PrivacyPolicyDocument), so
 * what staff write looks like what a guest reads. Descendant selectors, because
 * ProseMirror owns the elements inside.
 */
const CONTENT_CLASS = cn(
  'min-h-[420px] px-lg py-md text-body-md text-copy outline-none',
  '[&>*:first-child]:mt-0',
  '[&_h2]:mt-xl [&_h2]:text-display-xs [&_h2]:text-foreground',
  '[&_p]:mt-sm',
  '[&_ul]:mt-sm [&_ul]:list-disc [&_ul]:pl-lg',
  '[&_ol]:mt-sm [&_ol]:list-decimal [&_ol]:pl-lg',
  '[&_li]:mt-xs [&_li]:marker:text-muted-foreground [&_li_p]:mt-0',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
)

/** Headings of every level pasted in become the one heading the policy has. */
function oneHeadingSize(html: string): string {
  return html.replace(/<(\/?)h[1-6](?=[\s>])/gi, '<$1h2')
}

export function PolicyRichText({
  value,
  onChange,
  disabled = false,
  labelledBy,
  describedBy,
}: {
  value: string
  onChange: (text: string) => void
  disabled?: boolean
  labelledBy: string
  describedBy?: string
}) {
  const lastEmitted = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: editorDocFromText(value) as JSONContent,
    // Rendered on the client only: the server has no document to measure, and
    // rendering there would mismatch on hydration.
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: CONTENT_CLASS,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelledBy,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
      transformPastedHTML: oneHeadingSize,
    },
    onUpdate: ({ editor: current }) => {
      const text = textFromEditorDoc(current.getJSON() as EditorNode)

      lastEmitted.current = text
      onChangeRef.current(text)
    },
  })

  // A value the editor did not produce replaces the document.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) {
      return
    }

    lastEmitted.current = value
    editor.commands.setContent(editorDocFromText(value) as JSONContent, { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled, false)
  }, [editor, disabled])

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            heading: current.isActive('heading'),
            bold: current.isActive('bold'),
            bulletList: current.isActive('bulletList'),
            orderedList: current.isActive('orderedList'),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  })

  const isReady = editor !== null && !disabled

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card transition-[border-color,box-shadow]',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/10',
        disabled && 'opacity-50',
      )}
    >
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-xxs border-b border-divider p-xxs"
      >
        <ToolbarButton
          icon={Heading2}
          label="Heading"
          pressed={active?.heading ?? false}
          disabled={!isReady}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={Bold}
          label="Bold (Ctrl+B)"
          pressed={active?.bold ?? false}
          disabled={!isReady}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          pressed={active?.bulletList ?? false}
          disabled={!isReady}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          pressed={active?.orderedList ?? false}
          disabled={!isReady}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <span aria-hidden className="mx-xs h-5 w-px bg-divider" />
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          disabled={!isReady || !active?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          disabled={!isReady || !active?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} className="min-h-[420px]" />
    </div>
  )
}

/**
 * One toolbar control: an icon with its name for a screen reader and a
 * tooltip, pressed when its formatting is on where the cursor is. It keeps the
 * editor's focus on mouse-down, so clicking Bold does not lose the selection.
 */
function ToolbarButton({
  icon: Icon,
  label,
  pressed,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  /** Absent for an action rather than a formatting toggle. */
  pressed?: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      className="size-8 text-muted-foreground hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon aria-hidden />
    </Button>
  )
}
