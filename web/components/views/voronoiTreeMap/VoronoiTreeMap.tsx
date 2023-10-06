import { forwardRef, useImperativeHandle, useRef, useLayoutEffect } from 'react'
import * as D3 from 'd3'
import styled from '@emotion/styled'
import { Box } from '@mui/material'

import { DocumentSelectedEvent, Topic, TopicSelectedEvent, ViewHandler, ViewProps } from '../../../types'
import draw from './draw'

export type VoronoiTreeMapProps = ViewProps & {

}

const StyledRendered = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const VoronoiTreeMapWithRef = forwardRef<ViewHandler, VoronoiTreeMapProps>(function VoronoiTreeMap(props, ref) {
  const renderedRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => {
    return {
      selectDocument(document?: Document, topic?: Topic) {
        renderedRef.current?.dispatchEvent(new CustomEvent("documentselected", {
          detail: { document, topic }
        }) as DocumentSelectedEvent)
      },
      selectTopic(topic?: Topic) {
        renderedRef.current?.dispatchEvent(new CustomEvent("topicselected", {
          detail: { topic }
        }) as TopicSelectedEvent)
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
  }, [props])

  return (
    <Box position="relative" flexGrow={1} overflow="auto" sx={{
      backgroundColor: "white"
    }}>
      <Box color="black">
        VoronoiTreeMap
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </Box>
      <StyledRendered
        id="rendered"
        ref={renderedRef}
      />
    </Box>
  )
})

export default VoronoiTreeMapWithRef
