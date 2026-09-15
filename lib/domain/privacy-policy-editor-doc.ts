import {
  parsePrivacyPolicy,
  privacyPolicyText,
  trimRuns,
  type PrivacyPolicyBlock,
  type PrivacyPolicyRun,
} from './privacy-policy'

/**
 * The privacy policy between its stored text and the rich text editor
 * (capability F10).
 *
 * TipTap edits a ProseMirror document, which it hands over as JSON. These two
 * functions translate that JSON to the blocks lib/domain/privacy-policy.ts
 * reads and writes, and back — pure, and typed against the JSON shape alone,
 * so they are tested without an editor or a browser.
 *
 * The editor's schema allows only what the text format can hold: one heading
 * level, paragraphs, bullet and numbered lists of single paragraphs, and bold.
 * `blocksFromEditorDoc` still reads defensively — a node the schema should
 * have refused is kept as words rather than dropped, because losing a
 * sentence of somebody's privacy policy on save would be worse than a
 * formatting slip.
 */

/** The ProseMirror JSON TipTap produces and accepts, as far as this reads it. */
export interface EditorNode {
  type: string
  attrs?: Record<string, unknown>
  content?: EditorNode[]
  text?: string
  marks?: readonly { type: string }[]
}

/* ── Text → editor ────────────────────────────────────────────────────────── */

export function editorDocFromText(text: string): EditorNode {
  return editorDocFromBlocks(parsePrivacyPolicy(text))
}

export function editorDocFromBlocks(blocks: readonly PrivacyPolicyBlock[]): EditorNode {
  const content = blocks.map((block): EditorNode => {
    switch (block.kind) {
      case 'heading':
        return withContent({ type: 'heading', attrs: { level: 2 } }, textNodes(block.runs))
      case 'paragraph':
        return withContent({ type: 'paragraph' }, textNodes(block.runs))
      case 'list':
        return {
          type: block.ordered ? 'orderedList' : 'bulletList',
          content: block.items.map((runs) => ({
            type: 'listItem',
            content: [withContent({ type: 'paragraph' }, textNodes(runs))],
          })),
        }
    }
  })

  // An empty document still needs somewhere to put the cursor.
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] }
}

function textNodes(runs: readonly PrivacyPolicyRun[]): EditorNode[] {
  return runs.map((run) =>
    run.bold
      ? { type: 'text', text: run.text, marks: [{ type: 'bold' }] }
      : { type: 'text', text: run.text },
  )
}

/** ProseMirror refuses an empty `content` array on a text block; omit it. */
function withContent(node: EditorNode, content: EditorNode[]): EditorNode {
  return content.length > 0 ? { ...node, content } : node
}

/* ── Editor → text ────────────────────────────────────────────────────────── */

export function textFromEditorDoc(doc: EditorNode): string {
  return privacyPolicyText(blocksFromEditorDoc(doc))
}

export function blocksFromEditorDoc(doc: EditorNode): PrivacyPolicyBlock[] {
  return (doc.content ?? []).flatMap((node) => blocksFromNode(node))
}

function blocksFromNode(node: EditorNode): PrivacyPolicyBlock[] {
  switch (node.type) {
    case 'heading':
    case 'paragraph': {
      const runs = trimRuns(inlineRuns(node))

      return runs.length > 0
        ? [{ kind: node.type === 'heading' ? 'heading' : 'paragraph', runs }]
        : []
    }
    case 'bulletList':
    case 'orderedList': {
      const items = listItems(node).filter((runs) => runs.length > 0)

      return items.length > 0 ? [{ kind: 'list', ordered: node.type === 'orderedList', items }] : []
    }
    default:
      // Anything else — a wrapper the schema should not allow — gives up its
      // contents as the blocks they are.
      return (node.content ?? []).flatMap((child) =>
        child.type === 'text' ? [] : blocksFromNode(child),
      )
  }
}

/**
 * Each list item's words as one line. A nested list, which the schema refuses,
 * would come out as further items of the same list rather than vanish.
 */
function listItems(list: EditorNode): PrivacyPolicyRun[][] {
  return (list.content ?? []).flatMap((item) => {
    const own: PrivacyPolicyRun[] = []
    const nested: PrivacyPolicyRun[][] = []

    for (const child of item.content ?? []) {
      if (child.type === 'bulletList' || child.type === 'orderedList') {
        nested.push(...listItems(child))
      } else {
        if (own.length > 0) {
          own.push({ text: ' ', bold: false })
        }

        own.push(...inlineRuns(child))
      }
    }

    return [trimRuns(own), ...nested]
  })
}

function inlineRuns(node: EditorNode): PrivacyPolicyRun[] {
  return (node.content ?? []).flatMap((child): PrivacyPolicyRun[] => {
    if (child.type === 'text') {
      return [
        {
          // A line is a paragraph in the stored text, so a line break inside
          // one — which the schema refuses — is kept as a space.
          text: (child.text ?? '').replace(/\n/g, ' '),
          bold: child.marks?.some((mark) => mark.type === 'bold') ?? false,
        },
      ]
    }

    return child.type === 'hardBreak' ? [{ text: ' ', bold: false }] : inlineRuns(child)
  })
}
