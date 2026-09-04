import { useEffect } from 'react'
import { BRAND } from '@kolkrabbi/design-editor'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : BRAND.name
  }, [title])
}
