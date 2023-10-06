import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'
import * as D3 from 'd3'
import useTranslation from 'next-translate/useTranslation'
import { Box, debounce } from '@mui/material'

import type { Document, ResultsMetadata, ScreenSize } from '../../types'
import draw, { type TimelineInput, type TimelineInputs } from './drawTimeline'

export type DocumentsTimelineProps = {
  documents: Document[]
  metadata?: ResultsMetadata
}

export default function DocumentsTimeline({ documents, metadata }: DocumentsTimelineProps) {
  const { t } = useTranslation('common')
  const renderedRef = useRef<HTMLDivElement>()
  const [screenSize, setScreenSize] = useState<ScreenSize>()

  const handleResize = useMemo(
    () => debounce(setScreenSize, 40),
    []
  )

  useEffect(() => {
    const onResize = () => {
      const renderedSize = {
        width: renderedRef.current?.clientWidth ?? 0,
        height: renderedRef.current?.clientHeight ?? 0
      }
      if (renderedSize.width) {
        handleResize(renderedSize)
      }
    }

    window.addEventListener('resize', onResize)
    const renderedSize = {
      width: renderedRef.current?.clientWidth ?? 0,
      height: renderedRef.current?.clientHeight ?? 0
    }
    if (renderedSize?.width && !screenSize) {
      setScreenSize(renderedSize)
    }

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const docs = documents
    .map(d => ({
      id: d.id,
      ts: d.created_at_timestamp_sec,
    }))
    .filter(d => (d.ts ?? 0) > 0)
    .reduce((prev: TimelineInputs, curr, _ind, arr) => {
      let defaultInput: TimelineInput = {
        year: moment.unix(curr.ts ?? 0).format('YYYY'),
        month: moment.unix(curr.ts ?? 0 ).format('MM'),
        count: 0
      }
      defaultInput.label = `${defaultInput.month}/${defaultInput.year}`
      const group = `${defaultInput.year}-${defaultInput.month}`
      prev[group] = {
        ...defaultInput,
        count: (prev[group]?.count ?? defaultInput.count) + 1
      }
      return prev
    }, {})

  if (metadata?.earlierDocument != null) {
    let year = parseInt(moment.unix(metadata.earlierDocument.created_at_timestamp_sec ?? 0).format('YYYY'))
    let month = parseInt(moment.unix(metadata.earlierDocument.created_at_timestamp_sec ?? 0).format('M')) - 1
    const endYear = parseInt(moment().format('YYYY'))
    const endMonth = parseInt(moment().format('M'))
    while (year <= endYear) {
      const _month = moment().month(month).format("MM")
      docs[`${year}-${_month}`] = docs[`${year}-${_month}`] ?? {
        year: `${year}`,
        month: _month,
        count: 0,
        label: `${_month}/${year}`,
      }
      if (year == endYear && month === endMonth) {
        docs[`${year}-${_month}`].label = t('Current month')
        break;
      } else if (month !== 11)
        month++
      else {
        month = 0
        year++
      }
    }
  }

  useLayoutEffect(() => {
    draw("timeline", { inputs: docs })

    return () => {
      // clear render
      D3
        .select('#timeline')
        .selectChildren()
        .remove()
    }
  }, [docs])
  
  return (
    <Box
      maxHeight="200px"
      width="100%"
      height="150px"
      id="timeline"
      ref={renderedRef}
    />
  ) 
}