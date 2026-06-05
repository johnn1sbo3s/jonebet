const hasBlankLine = text => /\n\s*\n/.test(text)

function checkSiblings(context, parent) {
  const children = parent.children
  if (!children || children.length < 2) return

  let prevIdx = -1

  for (let i = 0; i < children.length; i++) {
    if (children[i].type === 'VElement') {
      if (prevIdx >= 0) {
        let hasBlank = false

        for (let j = prevIdx + 1; j < i; j++) {
          if (children[j].type === 'VText' && hasBlankLine(children[j].value)) {
            hasBlank = true
            break
          }
        }

        if (!hasBlank) {
          const prev = children[prevIdx]
          const curr = children[i]

          context.report({
            node: curr,
            loc: curr.loc,
            messageId: 'expectedBlankLine',
            fix: (fixer) => {
              const sourceCode = context.sourceCode
              const prevEnd = prev.range[1]
              const currStart = curr.range[0]
              const between = sourceCode.text.slice(prevEnd, currStart)
              const nlIdx = between.indexOf('\n')

              if (nlIdx >= 0) {
                return fixer.replaceTextRange(
                  [prevEnd, currStart],
                  between.slice(0, nlIdx + 1) + '\n' + between.slice(nlIdx + 1)
                )
              }
              return fixer.replaceTextRange([prevEnd, currStart], '\n\n')
            }
          })
        }
      }
      prevIdx = i
    }
  }
}

function traverse(node, context) {
  if (node.type === 'VDocumentFragment' || node.type === 'VElement') {
    checkSiblings(context, node)
  }
  const children = node.children || []
  for (const child of children) {
    if (child.type === 'VElement') {
      traverse(child, context)
    }
  }
}

export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'Require blank line between sibling elements in Vue templates'
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      expectedBlankLine: 'Expected a blank line between sibling elements.'
    }
  },
  create(context) {
    return {
      Program(node) {
        if (!node.templateBody) return
        traverse(node.templateBody, context)
      }
    }
  }
}
