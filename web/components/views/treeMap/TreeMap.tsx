import { forwardRef, useImperativeHandle, useRef, useLayoutEffect, MouseEvent } from 'react'
import * as D3 from 'd3'
import styled from '@emotion/styled'
import { Box, useTheme } from '@mui/material'

import {
  DocumentSelectedEvent,
  Topic,
  TopicSelectedEvent,
  ViewHandler,
  ViewProps
} from '../../../types'
import draw from './draw'

export type TreeMapProps = ViewProps & {

}

const StyledRendered = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const TreeMapWithRef = forwardRef<ViewHandler, TreeMapProps>(function TreeMap(props, ref) {
  const renderedRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => {
    return {
      selectTopic(topic?: Topic) {
        renderedRef.current?.dispatchEvent(new CustomEvent("topicselected", {
          detail: { topic }
        }) as TopicSelectedEvent)
      },
      selectDocument(document?: Document, topic?: Topic) {
        renderedRef.current?.dispatchEvent(new CustomEvent("documentselected", {
          detail: { document, topic }
        }) as DocumentSelectedEvent)
      },
      getSize() {
        return {
          width: renderedRef.current?.clientWidth ?? 0,
          height: renderedRef.current?.clientHeight ?? 0
        }
      },
    }
  }, [])

  useLayoutEffect(() => {
    if (props.screenSize?.width != null && props.screenSize.width > 0) {
      draw("rendered", {
        ...props,
        theme,
        screenSize: props.screenSize
      })
    }

    return () => {
      // clear render
      D3
        .select('#rendered')
        .selectChildren()
        .remove()
    }
  }, [props.screenSize, props.documents, props.topics])

  return (
    <Box position="relative" flexGrow={1} overflow="hidden" sx={{
      backgroundColor: "white"
    }}>
      <StyledRendered
        id="rendered"
        ref={renderedRef}
        style={theme.palette.mode === "dark" ? ({ backgroundColor: theme.palette.background.default }) : ({})}
      />
    </Box>
  )
})

export default TreeMapWithRef