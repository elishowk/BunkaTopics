/**
 * UNUSED
 * @todo WIP Move control of search results in a logic component.
 */

import { createContext, FC, PropsWithChildren, ReactNode, useContext, useState } from 'react'
import { Document, Topic } from '../types'

export type UserSelection = {
  document?: {
    searchId?: string
    topic?: Topic
    document?: Document
  }
  topic?: {
    searchId?: string
    topic?: Topic
  }
  pinned?: {
    documentsIds?: string[]
    topicsIds?: string[]
  }
}

const defaultSelection: UserSelection = {}

export type UserSelectionContext = {
  selection: UserSelection,
  setSelection: (selection: UserSelection) => void
  selectDocument: (document?: Document, topic?: Topic) => void
  selectTopic: (topic?: Topic) => void
}

export const userSelectionContext = createContext<UserSelectionContext>({
  selection: defaultSelection,
  setSelection: () => {},
  selectDocument: (_document, _topic) => {},
  selectTopic: (_topic) => {},
})

export const UserSelectionProvider: FC<PropsWithChildren> = (props) => {
  const [selection, setSelection] = useState<UserSelection>(defaultSelection)

  const pinDocument = (document: Document) => {
    setSelection((s) => {
      s.pinned?.documentsIds?.push?.(document.id)
      return s
    })
  }

  const unpinDocument = (document: Document) => {
    setSelection((s) => {
      if (s.pinned?.documentsIds != null) {
        s.pinned.documentsIds = s.pinned.documentsIds?.filter(dId => (
          dId !== document.id
        ))
      }
      return s
    })
  }

  const selectDocument: UserSelectionContext["selectDocument"] = (document, topic) => {
    setSelection({
      ...selection,
      document: {
        topic,
        document
      }
    })
  }

  const selectTopic: UserSelectionContext["selectTopic"] = (topic) => {
    setSelection({
      ...selection,
      topic: {
        topic,
      }
    })
  }

  return (
    <userSelectionContext.Provider value={{
      selection,
      setSelection,
      selectDocument,
      selectTopic,
    }} {...props} />
  )
}

export const withUserSelectionProvider = (Component: FC): FC => {
  return function WithUserSelectionProvider (props) {
    return (
      <UserSelectionProvider>
        <Component {...props} />
      </UserSelectionProvider>
    )
  }
}

export const useUserSelection = () => useContext(userSelectionContext)

export default useUserSelection
