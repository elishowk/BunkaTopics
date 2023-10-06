import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Box, Chip, IconButton, Typography } from '@mui/material'
import useTranslation from 'next-translate/useTranslation'
import type { SWRResponse } from 'swr'
import ClearIcon from '@mui/icons-material/Clear'

import type { Document, ResultsMetadata, ResultsSortOrder, SearchCustomOptions, SearchResponse, Topic, ViewDimensions, Views } from '../../types'
import SearchResults, { SearchResultsHandler } from './SearchResults'
import DocumentsTimeline from './DocumentsTimeline'
import moment from 'moment'
import { ascending } from 'd3'

export type PanelResultsProps = {
  view?: Views
  response: SWRResponse<SearchResponse>
  dimensions: ViewDimensions
  selection?: string
  setSelection?: (s: string | undefined) => void
  documentSelected?: Document
  topicSelected?: Topic
  selectDocument?: (document?: Document, topic?: Topic) => void
  selectTopic?: (topic?: Topic) => void
  searchCustomOptions: SearchCustomOptions
  changeSearchCustomOptions: (options: SearchCustomOptions) => void
  targetDocument?: (document?: Document) => void
}

export type PanelResultsHandler = {
  onDocumentSelected: (doc?: Document, topic?: Topic) => void
  onTopicSelected: (topic?: Topic) => void
  sortDocumentsBy: (dimension: string, ascending?: boolean) => void
}

export const PanelResultsWithRef = forwardRef<PanelResultsHandler, PanelResultsProps>(
  function PanelResults({
    response,
    dimensions,
    targetDocument,
    documentSelected,
    topicSelected,
    selectDocument,
    selectTopic,
    ...props
  }, ref) {
    const { t } = useTranslation("common")
    const resultsRef = useRef<SearchResultsHandler>(null)
    const [filters, setFilters] = useState<string[]>([])
    const [sortOrder, setSortOrder] = useState<ResultsSortOrder>('relevance')
    const [sortDirectionAsc, setSortDirectionAsc] = useState(false)
    const [sources, setSources] = useState<string[]>([])
    // const subtopic = selection != null
    //   ? response.data?.topics?.find(rt => rt.id.toString() === selection)
    //   : undefined

    const allDocuments = response.data?.documents
      .filter((d) => {
        // sources
        return sources.length === 0
          || (sources.length > 0 && d.source != null && sources.indexOf(d.source) >= 0)
      })
      .filter((d) => {
        // Documents <= 6 months old.
        return moment.unix(d.created_at_timestamp_sec ?? 0).isSameOrAfter(moment().subtract(6, 'months'))
      })
      ?? []

    const metadata = {
      ...allDocuments.reduce<ResultsMetadata>((prev, curr, ind, arr) => {
        if (curr.created_at_timestamp_sec != null && curr.created_at_timestamp_sec > 0) {
          if (
            prev.earlierDocument == null
            // @ts-expect-error prev.earlierDocument.created_at_timestamp_sec cannot be undefined here.
            || curr.created_at_timestamp_sec < prev.earlierDocument.created_at_timestamp_sec
          )
            prev.earlierDocument = curr
          if (
            prev.laterDocument == null
            // @ts-expect-error prev.laterDocument.created_at_timestamp_sec cannot be undefined here.
            || curr.created_at_timestamp_sec > prev.laterDocument.created_at_timestamp_sec
          )
            prev.laterDocument = curr
        }
        return prev
      }, { earlierDocument: undefined, laterDocument: undefined }),
    }

    const filtered: Document[] = allDocuments
      .filter((d) => {
        // selection
        return topicSelected == null
          || d.topic_ids.findIndex(tid => tid === topicSelected?.id) >= 0
      })

    const sorted: Document[] = filtered
      .sort((a, b) => {
        const elts: [Document, Document] = sortDirectionAsc ? [a, b] : [b, a]
        switch (sortOrder) {
          case 'time':
            return (elts[0].created_at_timestamp_sec ?? 0) - (elts[1].created_at_timestamp_sec ?? 0)
          case 'relevance':
            return topicSelected?.id == null
              ? elts[1].rank.rank - elts[0].rank.rank
              : elts[1].rank.rank_per_topic[topicSelected.id].rank - elts[0].rank.rank_per_topic[topicSelected.id].rank
          default:
            return (elts[0].dimensions?.find(ed => ed.id === sortOrder)?.score ?? 1)
              - (elts[1].dimensions?.find(ed => ed.id === sortOrder)?.score ?? 0)
        }
      })

    useImperativeHandle(ref, () => ({
      onDocumentSelected: () => {},
      onTopicSelected: () => {},
      sortDocumentsBy: (sortOrder = 'relevance', ascending = true) => {
        setSortOrder(sortOrder)
        setSortDirectionAsc(ascending)
      }
    }))

    return (
      <Box display="flex" flexDirection="column" height="100vh" borderLeft="1px solid lightgrey" paddingTop="1em">
        <Box display="flex" flexDirection="column" flexGrow={1} overflow="hidden">
        {topicSelected != null && (
            <Box flexShrink={1} margin="0.75em" marginTop="0">
              <IconButton onClick={() => selectTopic?.(undefined)}>
                <ClearIcon />
              </IconButton>
              <Box sx={{
                border: "1px solid",
                borderColor: "lightgrey",
                borderRadius: "0.5em",
                backgroundColor: "#0a7cba",
                padding: "0.5em",
                textAlign: "center"
              }}>
                <Typography component="h5" sx={{
                  fontSize: "1em",
                  color: '#fff',
                  fontWeight: "bold",
                }}>
                  {topicSelected.explanation.specific_terms.filter((_, i) => i < 5).join(' | ')}
                </Typography>
              </Box>
              <Typography component="p" sx={{
                marginTop: "0.5em"
              }}>
                {topicSelected.explanation.specific_terms.filter((_, i) => i >= 5 && i < 15).join(', ')}
                {topicSelected.percent && (
                  <Box my="0.8em">
                    <Chip
                      variant="outlined"
                      size="medium"
                      label={`${Math.round(topicSelected.percent * 100 * 10) / 10.0}% of the territory`}
                      sx={{ fontSize: "1em" }}
                    />
                  </Box>
                )}
              </Typography>
            </Box>
          )}

          <Box flexShrink={1} paddingX="0.5em" marginX="0.25em">
            <DocumentsTimeline
              documents={filtered}
              metadata={metadata}
            />
          </Box>

          <Box flexGrow={1} overflow="scroll">
            <SearchResults
              ref={resultsRef}
              view={props.view}
              response={{ ...response.data, documents: allDocuments }}
              documents={sorted}
              metadata={metadata}
              dimensions={dimensions}
              documentSelected={documentSelected}
              topicSelected={topicSelected}
              targetDocument={targetDocument}
              selectDocument={selectDocument}
              selectTopic={selectTopic}
              filters={filters}
              setFilters={setFilters}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              sortDirectionAsc={sortDirectionAsc}
              setSortDirectionAsc={setSortDirectionAsc}
            />
          </Box>
        </Box>
      </Box>
    )
  }
)

export default PanelResultsWithRef
