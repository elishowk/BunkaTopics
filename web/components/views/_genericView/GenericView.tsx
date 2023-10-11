import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import * as D3 from 'd3'
import styled from '@emotion/styled'
import { Box } from '@mui/material'

import {
  DocumentSelectedEvent,
  Topic,
  TopicSelectedEvent,
  ViewHandler,
  ViewProps
} from '../../../types'
import draw from './draw'
import React from 'react'

export type GenericViewProps = ViewProps & {}

const StyledRendered = styled.div`
  position: relative
  width: 100%
  height: 100%
`

const GenericViewWithRef = forwardRef<ViewHandler, GenericViewProps>(
  function GenericView({ selectDocument, selectTopic, ...props }, ref) {
    const renderedRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(
      ref,
      () => {
        return {
          selectDocument(document?: Document, topic?: Topic) {
            renderedRef.current?.dispatchEvent(
              new CustomEvent('documentselected', {
                detail: { document, topic }
              }) as DocumentSelectedEvent
            )
          },
          selectTopic(topic?: Topic) {
            renderedRef.current?.dispatchEvent(
              new CustomEvent('topicselected', {
                detail: { topic }
              }) as TopicSelectedEvent
            )
          },
          getSize() {
            return {
              width: renderedRef.current?.clientWidth ?? 0,
              height: renderedRef.current?.clientHeight ?? 0
            }
          }
        }
      },
      []
    )

    useLayoutEffect(() => {
      if (props.screenSize?.width != null && props.screenSize.width > 0) {
        draw('rendered', {
          ...props,
          screenSize: props.screenSize
        })
      }

      return () => {
        // clear render
        D3.select('#rendered').selectChildren().remove()
      }
    }, [props])

    return (
      <Box position='relative' flexGrow={1} overflow='auto'>
        <Box>
          GenericView
          <pre>{JSON.stringify(props, null, 2)}</pre>
        </Box>
        <StyledRendered id='rendered' ref={renderedRef} />
      </Box>
    )
  }
)

export default GenericViewWithRef
