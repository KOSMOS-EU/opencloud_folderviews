import { type InjectionKey, type Ref, type Component, markRaw } from 'vue'
import { type SpaceResource, type Resource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'
import { useContentLoader } from './useContentLoader'
import { type TypedFolderSchema, type ElementLayout } from './types'

// Lazy imports for viewers
import MarkdownViewer from '../components/viewers/MarkdownViewer.vue'
import ImageViewer from '../components/viewers/ImageViewer.vue'
import TextViewer from '../components/viewers/TextViewer.vue'

const VIEWER_COMPONENTS: Record<string, Component> = {
  markdown: markRaw(MarkdownViewer),
  image: markRaw(ImageViewer),
  text: markRaw(TextViewer)
}

export interface ElementRendererContext {
  space: Ref<SpaceResource>
  loadChildren: (path: string) => Promise<Resource[]>
  loadContent: (path: string, binary?: boolean) => Promise<{ content: string | ArrayBuffer; type: 'text' | 'binary' }>
  loadTypeParams: (path: string) => Promise<ElementLayout | null>
  getSchema: (typeName: string) => Promise<TypedFolderSchema | null>
  resolveViewer: (schema: TypedFolderSchema | null, extension: string) => Component | null
  clearCache: () => void
}

export const ELEMENT_RENDERER_KEY: InjectionKey<ElementRendererContext> = Symbol('elementRenderer')

export function useElementRenderer(space: Ref<SpaceResource>) {
  const clientService = useClientService()
  const { loadContent, clearCache } = useContentLoader(space)
  const schemaCache = new Map<string, TypedFolderSchema | null>()

  async function loadChildren(path: string): Promise<Resource[]> {
    try {
      const { children } = await clientService.webdav.listFiles(space.value, { path })
      return children
    } catch {
      return []
    }
  }

  async function getSchema(typeName: string): Promise<TypedFolderSchema | null> {
    if (schemaCache.has(typeName)) return schemaCache.get(typeName)!
    try {
      const { body } = await clientService.webdav.getFileContents(space.value, {
        path: `.views/${typeName}.viewtype`
      }) as any
      const schema = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body))
      schemaCache.set(typeName, schema)
      return schema
    } catch {
      schemaCache.set(typeName, null)
      return null
    }
  }

  async function loadTypeParams(path: string): Promise<ElementLayout | null> {
    try {
      const entry = await loadContent(path)
      const text = typeof entry.content === 'string' ? entry.content : new TextDecoder().decode(entry.content)
      return JSON.parse(text) as ElementLayout
    } catch {
      return null
    }
  }

  function resolveViewer(schema: TypedFolderSchema | null, extension: string): Component | null {
    if (!schema?.viewers) return null
    const viewerName = schema.viewers[extension] || schema.viewers['*']
    if (!viewerName) return null
    return VIEWER_COMPONENTS[viewerName] || null
  }

  function clearAll() {
    clearCache()
    schemaCache.clear()
  }

  return {
    space,
    loadChildren,
    loadContent,
    loadTypeParams,
    getSchema,
    resolveViewer,
    clearCache: clearAll
  } satisfies ElementRendererContext
}
