declare module 'react-syntax-highlighter' {
  import { ComponentType, ReactNode } from 'react'

  interface SyntaxHighlighterProps {
    language?: string
    style?: Record<string, any>
    children?: ReactNode
    className?: string
    showLineNumbers?: boolean
    lineNumberStyle?: Record<string, any>
    codeTagProps?: Record<string, any>
    useInlineStyles?: boolean
    startingLineNumber?: number
    PreTag?: string | ComponentType<any>
    [key: string]: any
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>
  export const Light: ComponentType<SyntaxHighlighterProps>
  export default Prism
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const vscDarkPlus: Record<string, any>
  export const atomDark: Record<string, any>
  export const oneDark: Record<string, any>
  export const dracula: Record<string, any>
  export const materialDark: Record<string, any>
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism' {
  export const vscDarkPlus: Record<string, any>
  export const atomDark: Record<string, any>
  export const oneDark: Record<string, any>
  export const dracula: Record<string, any>
  export const materialDark: Record<string, any>
}
