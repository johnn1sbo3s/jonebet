export default defineAppConfig({
  ui: {
    colors: {
      primary: 'teal',
      secondary: 'blue',
      neutral: 'slate'
    },
    card: {
      slots: {
        root: 'rounded-2xl'
      }
    },
    skeleton: {
      base: 'animate-pulse rounded-2xl bg-zinc-800'
    }
  }
})
