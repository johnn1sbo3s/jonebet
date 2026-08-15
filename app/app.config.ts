export default defineAppConfig({
  ui: {
    colors: {
      primary: 'teal',
      secondary: 'blue',
      neutral: 'slate',
    },
    card: {
      slots: {
        root: 'rounded-2xl',
      },
    },
    skeleton: {
      base: 'animate-pulse rounded-2xl bg-zinc-800',
    },
    modal: {
      slots: {
        content: 'bg-zinc-900',
        overlay: 'bg-black/80',
      },
    },
    selectMenu: {
      slots: {
        base: 'rounded-xl',
      },
      variants: {
        variant: {
          outline: 'text-highlighted bg-zinc-900 border border-zinc-800 h-8 hover:bg-zinc-800/60 disabled:bg-zinc-900',
        },
      },
    },
    input: {
      slots: {
        base: 'rounded-xl bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20',
      },
    },
  },
})
