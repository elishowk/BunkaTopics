import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react'
import type { SearchCustomOptions } from '../types'

export type SavedCustomOptionsContext = {
  savedCustomOptions: () => SearchCustomOptions
  saveCustomOptions: (options: SearchCustomOptions) => void
}

export const savedCustomOptionsContext = createContext<SavedCustomOptionsContext>({
  savedCustomOptions: () => ({}),
  saveCustomOptions: () => {}
})

export const SearchCustomOptionsProvider: FC<PropsWithChildren> = (props) => {
  const savedCustomOptions: SavedCustomOptionsContext['savedCustomOptions'] = () => {
    if (typeof window !== 'undefined' && window.localStorage != null) {
      const storedOptionsStr = window.localStorage.getItem('searchCustomOptions')
      if (storedOptionsStr !== null && storedOptionsStr !== "") {
        try {
          return JSON.parse(storedOptionsStr)
        } catch (_) {}
      }
    }
    return {}
  }
  const saveCustomOptions: SavedCustomOptionsContext['saveCustomOptions'] = (options) => {
    if (typeof window !== 'undefined' && window.localStorage != null) {
      const _savedCustomOptions = savedCustomOptions()
      const newSavedCustomOptions = {
        customIntensityDimensions: [
          ...(_savedCustomOptions.customIntensityDimensions ?? []),
          ...(
            (options.customIntensityDimensions ?? [])
              .filter((o) =>
                (_savedCustomOptions.customIntensityDimensions ?? [])
                  .findIndex((so) => so.id.toLowerCase() === o.id.toLowerCase()) < 0
              )
          )
        ],
        customContinuumDimensions: [
          ...(_savedCustomOptions.customContinuumDimensions ?? []),
          ...(
            (options.customContinuumDimensions ?? [])
              .filter((o) =>
                (_savedCustomOptions.customContinuumDimensions ?? [])
                  .findIndex((so) => so.id.toLowerCase() === o.id.toLowerCase()) < 0
              )
          )
        ],
      }
      window.localStorage.setItem('searchCustomOptions', JSON.stringify(newSavedCustomOptions))
    }
  }

  return (
    <savedCustomOptionsContext.Provider {...props} value={{
      savedCustomOptions,
      saveCustomOptions
    }} />
  )
}

export const useSearchCustomOptions = () => useContext(savedCustomOptionsContext)

export default useSearchCustomOptions
