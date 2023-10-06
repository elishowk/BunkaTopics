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
  CardHeader,
  css,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  Radio,
  Theme,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import HelpIcon from '@mui/icons-material/Help'

import {
  DimensionType,
  DocumentSelectedEvent,
  ViewProps,
  ViewHandler,
  MapTransform
} from '../../../types'
import draw from './draw'
import AddContinuumDimensionsListItem from '../../AddContinuumDimensionsListItem'

export type BourdieuMapProps = ViewProps & {
  dimensionX?: DimensionType | string
  dimensionY?: DimensionType | string
  transform?: MapTransform
  setTransform?: (t: MapTransform) => void
  interpolation?: 'blue' | 'terrain'
  bandwith?: number
  thresholds?: number | number[]
}

export const StyledMap = styled.div<{ theme: Theme }>(({ theme }) => css`
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

  svg {
    cursor: grab;
    position: relative;
    .xAxis text, .yAxis text {
      fill: #808080;
      font-size: 1.4em;
    }
    .xAxis path, .yAxis path {
      stroke: #808080;
    }
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
    .colorscale text {
      fill: white;
    }
  `}
`)

const BourdieuMapWithRef = forwardRef<ViewHandler, BourdieuMapProps>(function BourdieuMap(props, ref) {
  const { t } = useTranslation("common")
  const theme = useTheme()
  const mapRef = useRef<HTMLDivElement>(null)
  const [isHelpOpen, setHelpOpen] = useState(false)
  const openHelp = () => setHelpOpen(true)
  const closeHelp = () => setHelpOpen(false)
  const [transform, _setTransform] = useState<MapTransform>({ k: 1 })
  const [dimensionX, setDimensionX] = useState<string | DimensionType>(props.dimensionX ?? 'positive / negative')
  const [dimensionY, setDimensionY] = useState<string | DimensionType>(props.dimensionY ?? 'national / international')
  // Trigger redraw by updating this counter.
  const [redrawCounter, setRedrawCounter] = useState<number>(0)
  const redraw = () => setRedrawCounter(redrawCounter + 1)
  const zoomStep = 0.25

  const setTransform = ((newT: MapTransform) => {
    _setTransform(t => {
      t.x = newT.x
      t.y = newT.y
      t.k = newT.k
      return t
    })
  })

  useImperativeHandle(ref, function () {
    return {
      focusOnDocument (doc) {
        // this.dispatchDocumentSelected?.(doc)
      },
      dispatchDocumentTargetted (document) {
        mapRef.current?.dispatchEvent(new CustomEvent("documenttargetted", {
          detail: { document }
        }) as DocumentSelectedEvent)
      },
      dispatchDocumentSelected (document) {
        mapRef.current?.dispatchEvent(new CustomEvent("documentselected", {
          detail: { document }
        }) as DocumentSelectedEvent)
      },
      getDocumentSelection (doc) {
        if (doc != null) {
          return D3
            .select('#bourdieuMap')
            .select<SVGGElement>(`g.document#document-${doc?.id}`)
            .datum(doc)
        }
      },
      getSize () {
        return {
          width: mapRef.current?.clientWidth ?? 0,
          height: mapRef.current?.clientHeight ?? 0
        }
      }
    }
  }, [props.documentSelected])

  useLayoutEffect(() => {
    if (props.screenSize?.width != null && props.screenSize.width > 0) {
      draw("bourdieuMap", {
        ...props,
        // documentSelected: props.documentSelected,
        screenSize: props.screenSize,
        dimensionX,
        dimensionY,
        transform,
        setTransform,
        theme
      })
    }

    return () => {
      // clear map
      D3
        .select('#bourdieuMap')
        .selectChildren()
        .remove()
    }
  }, [
    dimensionX,
    dimensionY,
    redrawCounter,
    transform,
    props.documentSelected,
    props.screenSize,
    props.interpolation,
    theme
  ])

  let exportHref: string | undefined = undefined
  const svg = mapRef.current?.getElementsByTagName('svg')[0]
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
        id="bourdieuMap"
        ref={mapRef}
        theme={theme}
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
        <Card variant="outlined" sx={{ paddingY: "0.5em" }}>
          <Box display="flex">
            <CardHeader
              title={t("Dimensions")}
              titleTypographyProps={{ fontSize: "0.8em", fontWeight: "bold" }}
              sx={{ paddingY: "0.5em", flexGrow: 1 }}
            />
            <Box flexShrink={1}>
              <Tooltip
                title={(
                  <Typography>
                    {t(`By adding Dimension Filters, you can explore the map and refine your search.\nIf a region is red, it means that many tweets contain terms similar to the label.`)}
                  </Typography>
                )}
              >
                <IconButton size="small">
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <List dense disablePadding>
            {
              [
                ...(props.dimensions?.continuum ?? [])
              ]
                .map(({ type, label }) => (
                  <ListItem dense disablePadding sx={{ paddingX: "1em" }} key={type}>
                    <Radio
                      edge="start"
                      size="small"
                      checked={dimensionX === type}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-labelledby': "labelId" }}
                      onChange={() => {
                        setDimensionX(type)
                      }}
                    />
                    <Radio
                      edge="start"
                      size="small"
                      checked={dimensionY === type}
                      onChange={() => {
                        setDimensionY(type)
                      }}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-labelledby': "labelId" }}
                    />
                      <Typography fontSize="0.8em">{label}</Typography>
                  </ListItem>
                ))
            }

            <AddContinuumDimensionsListItem
              searchCustomOptions={props.searchCustomOptions}
              changeSearchCustomOptions={props.changeSearchCustomOptions}
              variant="continuum"
            />
          </List>
        </Card>
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
                  <p>{t`Tweets are positioned on the map according to their locations along different axes. By exploring the map, you can gain insight into how a given phenomenon may be biased.`}</p>
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

export default BourdieuMapWithRef
