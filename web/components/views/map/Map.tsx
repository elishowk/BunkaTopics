import React, { useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle, Fragment } from 'react'
import * as D3 from 'd3'
import useTranslation from 'next-translate/useTranslation'
import styled from '@emotion/styled'
import { CustomEvent as AnalyticsCustomEvent } from '@piwikpro/react-piwik-pro'
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  css,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Theme,
  useTheme
} from '@mui/material'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
// import IosShareIcon from '@mui/icons-material/IosShare'

import {
  DimensionType,
  DocumentSelectedEvent,
  Document,
  ViewProps,
  ViewHandler,
  Topic
} from '../../../types'
import draw from './draw'
import DimensionSwitcherCard from '../../DimensionSwitcherCard'

export type MapTransform = {
  k?: number
  x?: number
  y?: number
}

export type MapProps = ViewProps & {
  dimension?: DimensionType | string
  transform?: MapTransform
  setTransform?: (t: MapTransform) => void
  showTopics?: boolean
  altitude?: number
  bandwith?: number
  thresholds?: number | number[]
  interpolation?: 'blue' | 'terrain'
  triggerSubtopics?: number // Minimum transform.k to display subtopics.
}

export const StyledMap = styled.div<{ theme: Theme }>(({ theme }) => {
  return css`
    position: relative;
    width: 100%;
    height: 100%;

    .tooltip {
      position: absolute;
      display: none;
      cursor: default;
      font-size: 0.8em;
      padding: 0.5em;
      background-color: white;
    }

    div.centroidLabelWrapper {
      position: absolute;
      padding: 0.2em;
      cursor: default;
      user-select: none;
      font-size: 0.8em;
      font-family: Roboto, Helvetica, Arial, sans-serif;
      color: black;
      text-align: center;
      text-anchor: middle;
      opacity: 0.9;
      
      & > div.centroidLabel {
        background-color: rgba(255,255,255,0.9);
        width: 160px;
      }

      &::after {
        content: ' ';  
        width: 0;
        height: 0;
        display: block;
        border-left: 4px solid transparent; 
        border-right: 4px solid transparent; 
        border-top: 5px solid rgba(255,255,255,0.9); 
        position: relative;
        left: 76px;
      }
    }

    svg {
      cursor: grab;
      position: relative;
    }

    ${theme.palette.mode === 'dark' && css`
      svg {
        background-color: ${theme.palette.background.default};

      }
      svg circle.documentCircle {
        fill: white;
      }
      svg circle.documentCircle:hover,
      svg circle.documentCircle.selected,
      svg circle.documentCircle.targetted {
        fill: red;
      }
      svg .colorscale text {
        fill: white;
      }
    `}
  `
})

const MapWithRef = forwardRef<ViewHandler, MapProps>(function Map(props, ref) {
  const { t } = useTranslation("common")
  const theme = useTheme()
  const renderedRef = useRef<HTMLDivElement>(null)
  const [isHelpOpen, setHelpOpen] = useState(false)
  const openHelp = () => setHelpOpen(true)
  const closeHelp = () => setHelpOpen(false)
  const [transform, setTransform] = useState<MapTransform>(props.transform ?? { k: 1 })
  const [dimension, _setDimension] = useState<DimensionType | string>(props.dimension ?? DimensionType.NONE)
  // Trigger redraw by updating this counter.
  const [redrawCounter, setRedrawCounter] = useState<number>(0)
  const redraw = () => setRedrawCounter(redrawCounter + 1)
  const triggerSubtopics = 2
  // const zoomStep = 0.25

  const setDimension: typeof _setDimension = (d) => {
    AnalyticsCustomEvent.trackEvent('map', 'setDimension', (d as string))
    props.sortDocumentsBy?.(d === DimensionType.NONE ? 'relevance' : d as string)
    _setDimension(d)
  }

  useImperativeHandle(ref, () => {
    return {
      focusOnDocument: (document?: Document, topic?: Topic) => {
        return renderedRef.current?.dispatchEvent(new CustomEvent("documentfocus", {
          detail: { document, topic }
        }))
      },
      getDocumentSelection: (document?: Document) => {
        if (document?.id != null) {
          return D3
            .select('#bourdieuMap')
            .select<SVGGElement>(`g.document#document-${document.id.replaceAll('/','-').replaceAll('.', '_')}`)
            .datum(document)
        }
      },
      dispatchDocumentTargetted (document) {
        renderedRef.current?.dispatchEvent(new CustomEvent("documenttargetted", {
          detail: { document }
        }) as DocumentSelectedEvent)
      },
      dispatchDocumentSelected (document) {
        renderedRef.current?.dispatchEvent(new CustomEvent("documentselected", {
          detail: { document }
        }) as DocumentSelectedEvent)
      },
      dispatchTopicSelected: (topic?: Topic) => {
        renderedRef.current?.dispatchEvent(new CustomEvent("topicselected", {
          detail: { topic }
        }))
      },
      getSize() {
        return {
          width: renderedRef.current?.clientWidth ?? 0,
          height: renderedRef.current?.clientHeight ?? 0
        }
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (props.screenSize?.width != null && props.screenSize.width > 0) {
      draw("map", {
        ...props,
        screenSize: props.screenSize,
        dimension,
        transform,
        setTransform,
        triggerSubtopics,
        theme
      })
    }

    return () => {
      // clear map
      D3
        .select('#map')
        .selectChildren()
        .remove()
    }
  }, [dimension, redrawCounter, props.documentSelected, props.topicSelected, props])

  let exportHref: string | undefined = undefined
  const svg = renderedRef.current?.getElementsByTagName('svg')[0]
  // @todo : Remove process.env.NEXT_PUBLIC_BETA !== "true"
  if (svg && process.env.NEXT_PUBLIC_BETA !== "true") {
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svg.outerHTML], {type:"image/svg+xml;charset=utf-8"})
    exportHref = URL.createObjectURL(svgBlob)
  }

  return (
    <Box position="relative" flexGrow={1} overflow="hidden" sx={{
      backgroundColor: props.interpolation === "terrain" ? "white" : "inherit"
    }}>
      <StyledMap
        id="map"
        theme={theme}
        ref={renderedRef}
        style={props.interpolation === "terrain" ? {
          backgroundColor: 'rgba(194,223,255,0.5)'
        } : undefined}
      />

      <Box
        position="absolute"
        top="1em"
        left="1em"
        display="block"
      >
        <DimensionSwitcherCard
          dimension={dimension}
          dimensions={props.dimensions}
          setDimension={setDimension}
          searchCustomOptions={props.searchCustomOptions}
          changeSearchCustomOptions={props.changeSearchCustomOptions}
        />
      </Box>

      {/* exportHref != null && (
        <Box
          position="absolute"
          top="1em"
          right="1em"
          display="block"
        >
          <Button
            variant="outlined"
            startIcon={<IosShareIcon />}
            sx={({ palette }) => ({ backgroundColor: palette.background.default })}
            href={exportHref}
            download="Bunka map export.svg"
          >
            {t('Share')}
          </Button>
        </Box>
      ) */}

      <Box
        position="absolute"
        top="1em"
        right="1em"
        display="block"
      >
        <Card variant="outlined" sx={{ border: 0 }}>
          <Button
            onClick={openHelp}
            color="inherit"
            variant="outlined"
            size="small"
          >
            {t`How does this map work?`}
          </Button>
          <Dialog
            open={isHelpOpen}
            onClose={closeHelp}
            aria-labelledby="help-dialog-title"
            aria-describedby="help-dialog-description"
          >
            <DialogTitle id="help-dialog-title">
              {t`How this map works`}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="help-dialog-description">
                <Fragment>
                  <p>{t`The algorithm locates tweets on the map. It groups them into semantic regions, which are represented by dotted areas and a label at the center. The labels indicate the most specific words shared by tweets in a region.`}</p>
                </Fragment>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button color="info" onClick={closeHelp}>{t`OK`}</Button>
            </DialogActions>
          </Dialog>
        </Card>
      </Box>

      <Box
        position="absolute"
        right="1em"
        bottom="1em"
        display="block"
      >
        <Card variant="outlined">
          <ButtonGroup
            orientation="vertical"
            aria-label="vertical outlined button group"
          >
            <IconButton size="small" onClick={() => {
              AnalyticsCustomEvent.trackEvent('map', 'zoom', 'reset', 1)
              setTransform({ k: 1 })
              redraw()
            }}>
              <ZoomOutMapIcon />
            </IconButton>
          </ButtonGroup>
        </Card>
      </Box>
    </Box>
  )
})

export default MapWithRef
