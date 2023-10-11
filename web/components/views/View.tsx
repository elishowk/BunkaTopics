import React from 'react'
import {
  forwardRef,
  useState,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  memo
} from 'react'
import { debounce } from '@mui/material'

import {
  Document,
  ViewHandler,
  ScreenSize,
  ViewProps,
  Topic,
  Views
} from '../../types'
import Map from './map/Map'
import DebugView from './_genericView/GenericView'
import BourdieuMap from './bourdieuMap/BourdieuMap'

const View = forwardRef<ViewHandler, ViewProps>(function ViewRender(
  props,
  ref
) {
  const renderedRef = useRef<ViewHandler>(null)
  const [screenSize, setScreenSize] = useState<ScreenSize>()
  const {
    view,
    panelResultsRef,
    documents,
    dimensions,
    topics,
    searchCustomOptions,
    changeSearchCustomOptions,
    documentSelected,
    topicSelected,
    selectDocument,
    selectTopic
  } = props

  const sortDocumentsBy = (dimension: string, asc: boolean = false) => {
    panelResultsRef?.current?.sortDocumentsBy(dimension, asc)
  }

  useImperativeHandle(
    ref,
    () => ({
      focusOnDocument: (document?: Document, topic?: Topic) => {
        return renderedRef.current?.focusOnDocument?.(document, topic)
      },
      getDocumentSelection: (document?: Document) => {
        return renderedRef.current?.getDocumentSelection?.(document)
      },
      dispatchDocumentTargetted: (document) => {
        return renderedRef.current?.dispatchDocumentTargetted?.(document)
      },
      dispatchDocumentSelected: (document?: Document, topic?: Topic) => {
        return renderedRef.current?.dispatchDocumentSelected?.(document, topic)
      },
      dispatchTopicSelected: (topic?: Topic) => {
        return renderedRef.current?.dispatchTopicSelected?.(topic)
      },
      getSize: () => renderedRef.current?.getSize() ?? { width: 0, height: 0 }
    }),
    []
  )

  const handleResize = useMemo(() => debounce(setScreenSize, 40), [])

  useEffect(() => {
    const onResize = () => {
      const renderedSize = renderedRef.current?.getSize()
      if (renderedSize) {
        handleResize(renderedSize)
      }
    }

    window.addEventListener('resize', onResize)
    const renderedSize = renderedRef.current?.getSize()
    if (renderedSize != null && !screenSize) {
      setScreenSize(renderedSize)
    }

    return () => {
      window.removeEventListener('resize', onResize)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    selectDocument?.()
    selectTopic?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const viewProps: ViewProps = {
    ref: renderedRef,
    view,
    documents,
    topics,
    dimensions,
    screenSize,
    searchCustomOptions,
    changeSearchCustomOptions,
    documentSelected,
    topicSelected,
    selectDocument,
    selectTopic,
    sortDocumentsBy
  }

  switch (view) {
    case Views.BOURDIEU_MAP:
      return <BourdieuMap interpolation='terrain' {...viewProps} />
    case Views.DEBUG:
      return <DebugView {...viewProps} />
    case Views.MAP:
    default:
      return (
        <Map
          interpolation={view === Views['MAP'] ? 'terrain' : 'blue'}
          {...viewProps}
        />
      )
  }
})

export default View
