export interface TypedFolderSchema {
  label: string
  icon?: string
  children: string[]
  columns?: string[]
  namePattern?: string
  actions?: string[]
  metadata?: Record<string, TypedFieldDef>
  viewers?: Record<string, string>    // file extension → viewer name
  elementLayout?: ElementLayout       // default layout for element view
  isContainer?: boolean               // renders children recursively
  protectButtonVisible?: boolean      // show protect/unprotect button for managers
  isLeaf?: boolean                    // leaf folder: click opens app instead of navigating
  app?: string                        // registered web-app to open for leaf folders
  appEntry?: string                   // entry file passed to the app (e.g. "seite.md")
  fileReferencePattern?: string       // pattern for auto-numbering (e.g. "{parentRef}.{seq:02}")
}

export interface TypedFieldDef {
  label: string
  type: 'string' | 'enum' | 'date' | 'number'
  values?: string[]
  auto?: boolean
}

export interface ElementLayout {
  display?: 'flex' | 'grid'
  direction?: 'row' | 'column'
  wrap?: 'wrap' | 'nowrap'
  gap?: string
  columns?: number
  align?: string
  padding?: string
}
