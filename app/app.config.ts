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
    },
    input: {
      slots: {
        base: 'rounded-xl bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20',
      },
    },
  },
})
