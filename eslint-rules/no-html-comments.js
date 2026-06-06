export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'Disallow HTML comments in Vue templates'
    },
    fixable: 'code',
    schema: [],
    messages: {
      noComment: 'HTML comments are not allowed in templates.'
    }
  },
  create(context) {
    return {
      Program(node) {
        if (!node.templateBody || !node.templateBody.comments) return

        for (const comment of node.templateBody.comments) {
          context.report({
            node: comment,
            loc: comment.loc,
            messageId: 'noComment',
            fix: (fixer) => {
              const sourceCode = context.sourceCode
              const start = comment.range[0]
              const end = comment.range[1]
              const text = sourceCode.text.slice(start, end)

              // Check if removing the comment leaves an empty line
              const lineStart = sourceCode.text.lastIndexOf('\n', start) + 1
              const lineEnd = sourceCode.text.indexOf('\n', end)
              const fullLine = sourceCode.text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)

              // If the line is only the comment (plus whitespace), remove the whole line
              if (fullLine.trim() === text.trim()) {
                const nextLineStart = sourceCode.text.indexOf('\n', end)
                if (nextLineStart !== -1) {
                  return fixer.removeRange([lineStart, nextLineStart + 1])
                }
                return fixer.removeRange([lineStart, end])
              }

              // Otherwise just remove the comment
              return fixer.removeRange([start, end])
            }
          })
        }
      }
    }
  }
}
