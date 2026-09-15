import { describe, expect, test } from 'vitest'

import type { PropertyContact } from './contact'
import { normalisePrivacyPolicy } from './privacy-policy'
import { editorDocFromText, textFromEditorDoc, type EditorNode } from './privacy-policy-editor-doc'
import { privacyPolicyTemplate } from './privacy-policy-template'

/**
 * The privacy policy between its stored text and the editor's document
 * (capability F10).
 *
 * The promise worth proving is that the editor loses nothing: text opened in
 * it and saved straight back is the text it was, and whatever the editor's
 * document holds — including shapes its schema should have refused — comes out
 * as words rather than vanishing.
 */

const CONTACT: PropertyContact = {
  phones: [{ display: '+673 1111111', whatsappUrl: 'https://wa.me/6731111111' }],
  whatsappUrl: 'https://wa.me/6731111111',
  instagramHandle: '@example',
  instagramUrl: 'https://instagram.com/example',
  tiktokHandle: '@example',
  tiktokUrl: 'https://tiktok.com/@example',
  mapsUrl: 'https://maps.example',
}

function text(value: string, bold = false): EditorNode {
  return bold
    ? { type: 'text', text: value, marks: [{ type: 'bold' }] }
    : { type: 'text', text: value }
}

function paragraph(...content: EditorNode[]): EditorNode {
  return { type: 'paragraph', content }
}

describe('editorDocFromText', () => {
  test('builds the editor document the text describes', () => {
    expect(editorDocFromText('## Title\nWe are **Palm Villa**\n- one\n1. first')).toEqual({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [text('Title')] },
        paragraph(text('We are '), text('Palm Villa', true)),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('one'))] }] },
        {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [paragraph(text('first'))] }],
        },
      ],
    })
  })

  test('gives an empty policy one empty paragraph to type into', () => {
    expect(editorDocFromText('')).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
  })
})

describe('textFromEditorDoc', () => {
  test('writes the editor document as stored text', () => {
    const doc: EditorNode = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [text('Contact us')] },
        paragraph(text('Data Protection Officer: ', true), text('A Person')),
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [paragraph(text('Ask'))] },
            { type: 'listItem', content: [paragraph(text('Wait'))] },
          ],
        },
      ],
    }

    expect(textFromEditorDoc(doc)).toBe(
      '## Contact us\n**Data Protection Officer:** A Person\n1. Ask\n2. Wait',
    )
  })

  test('leaves out empty paragraphs and empty items, which are only where the cursor was', () => {
    const doc: EditorNode = {
      type: 'doc',
      content: [
        { type: 'paragraph' },
        paragraph(text('Words')),
        paragraph(text('   ')),
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
      ],
    }

    expect(textFromEditorDoc(doc)).toBe('Words')
  })

  test('keeps the words of shapes the schema refuses rather than dropping them', () => {
    const doc: EditorNode = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [paragraph(text('Quoted'))] },
        paragraph(text('Line'), { type: 'hardBreak' }, text('break')),
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                paragraph(text('Outer')),
                {
                  type: 'bulletList',
                  content: [{ type: 'listItem', content: [paragraph(text('Inner'))] }],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(textFromEditorDoc(doc)).toBe('Quoted\nLine break\n- Outer\n- Inner')
  })
})

describe('the round trip', () => {
  test('opening text in the editor and saving it straight back changes nothing', () => {
    const samples = [
      privacyPolicyTemplate(CONTACT),
      '## A **bold** heading\n\\2026. Not a list\n- item with \\* star and \\\\ slash\n1. one\n2. two',
    ]

    for (const sample of samples) {
      const stored = normalisePrivacyPolicy(sample)

      expect(textFromEditorDoc(editorDocFromText(stored))).toBe(stored)
    }
  })
})
