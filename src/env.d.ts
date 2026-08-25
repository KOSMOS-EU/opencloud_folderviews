/// <reference types="vite/client" />

declare module 'vue3-gettext' {
  export function useGettext(): {
    $gettext: (msg: string) => string
  }
}
