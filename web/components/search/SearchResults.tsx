import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { CustomEvent } from '@piwikpro/react-piwik-pro'
import moment from 'moment'
import {
  Box,
  debounce,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Menu,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import ClearIcon from '@mui/icons-material/Clear'
// import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
// import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import type {
  Document,
  ResultsMetadata,
  ResultsSortOrder,
  SearchResponse,
  Topic,
  ViewDimensions
} from '../../types'
import { Views } from '../../types'
import DocumentChips from './DocumentChips'

export type SearchResultsProps = {
  response: SearchResponse
  documents: Document[]
  dimensions: ViewDimensions
  metadata?: ResultsMetadata
  documentSelected?: Document
  topicSelected?: Topic
  view?: Views
  selectDocument?: (document?: Document, topic?: Topic) => void
  selectTopic?: (topic?: Topic) => void
  filters?: string[]
  setFilters?: (filters: string[]) => void
  sortOrder?: ResultsSortOrder
  setSortOrder?: (sort: ResultsSortOrder) => void
  sortDirectionAsc?: boolean
  setSortDirectionAsc?: (asc: boolean) => void
  targetDocument?: (document?: Document) => void
}

export type SearchResultsHandler = {
  fillSearchFromDocument: (document?: Document, topic?: Topic) => void
}

export type SortOption = { id: ResultsSortOrder; title: string; asc?: boolean }

export const SearchResultsWithRef = forwardRef<
  SearchResultsHandler,
  SearchResultsProps
>(function SearchResults(
  {
    documents,
    view,
    dimensions,
    topicSelected,
    documentSelected,
    targetDocument,
    sortOrder,
    setSortOrder,
    sortDirectionAsc,
    setSortDirectionAsc
  },
  ref
) {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [sortAnchorEl, setSortAnchorEl] = useState<undefined | HTMLElement>()
  const sortOpen = Boolean(sortAnchorEl)

  const sortOptions: SortOption[] = [
    { id: 'relevance', title: t('Search Results') },
    { id: 'time', title: t('Time') },
    ...(view === Views.BOURDIEU_MAP
      ? dimensions.continuum
          .filter((dim) => dim.type !== 0)
          .map((dim) => [
            {
              id: dim.type,
              title:
                dim.idLeft != null && dim.idLeft.length > 0
                  ? dim.idLeft[0].toUpperCase() + dim.idLeft.slice(1)
                  : ''
            },
            {
              id: dim.type,
              title:
                dim.idRight != null && dim.idRight.length > 0
                  ? dim.idRight[0].toUpperCase() + dim.idRight.slice(1)
                  : '',
              asc: true
            }
          ])
          .reduce((prev: SortOption[], curr: SortOption[]) => {
            return [...prev, ...curr]
          }, [])
      : dimensions.intensity
          .filter((dim) => dim.type !== 0)
          .map((dim) => ({ id: dim.type, title: dim.label })))
  ]
  // const filterOptions: { id: ResultsFilterOption, title: string }[] = [
  //   { id: 'popularity', title: t('Popularity') }
  // ]

  const filteredDocuments = documents
    // apply search
    .filter(
      (rd) =>
        searchFilter === '' ||
        rd.text.toLowerCase().indexOf(searchFilter.toLowerCase()) >= 0
    )
    // remove duplicate ids.
    .filter((d, index, arr) => arr.findIndex((ad) => ad.id === d.id) === index)

  useEffect(() => {
    // Scroll results back to top on re-render
    if (!documentSelected) resultsRef.current?.scrollTo({ top: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSelected, filteredDocuments])

  useEffect(() => {
    if (documentSelected != null) {
      if (documentSelected?.text != null && inputRef.current != null) {
        setSearchFilter(documentSelected.text)
        inputRef.current.value = documentSelected.text
      }
      resultsRef.current?.scrollTo({ top: 0 })
    }
  }, [documentSelected])

  return (
    <Box display='flex' flexDirection='column' height='100%' alignItems='start'>
      <Box padding='0.75em' width='100%' display='flex' flexDirection='row'>
        <Box flexGrow={1}>
          <TextField
            inputRef={inputRef}
            placeholder={t`Search`}
            fullWidth
            size='small'
            InputProps={{
              endAdornment:
                searchFilter == null || searchFilter === '' ? (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                ) : (
                  <IconButton
                    onClick={() => {
                      if (inputRef.current != null) {
                        inputRef.current.value = ''
                      }
                      setSearchFilter('')
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                )
            }}
            onChange={debounce((e) => {
              CustomEvent.trackEvent('filterResults', 'search', e.target.value)
              setSearchFilter(e.target.value)
            }, 250)}
          />
        </Box>
        <Box flexShrink={1}>
          <IconButton
            aria-label='more'
            id='sort-menu-button'
            aria-controls={sortOpen ? 'sort-menu' : undefined}
            aria-expanded={sortOpen ? 'true' : undefined}
            aria-haspopup='true'
            onClick={(event) => setSortAnchorEl(event.currentTarget)}
          >
            <SortIcon />
          </IconButton>
          <Menu
            id='sort-menu'
            MenuListProps={{
              'aria-labelledby': 'sort-menu-button'
            }}
            anchorEl={sortAnchorEl}
            open={sortOpen}
            onClose={() => setSortAnchorEl(undefined)}
          >
            {sortOptions.map((sortOption) => (
              <MenuItem
                key={`${sortOption.id}-${
                  sortOption.asc === true ? 'asc' : 'desc'
                }`}
                selected={
                  sortOrder === sortOption.id &&
                  sortOption.asc === sortDirectionAsc
                }
                onClick={() => {
                  CustomEvent.trackEvent(
                    'results',
                    'sort',
                    `${sortOption.id}-${
                      sortOption.asc === true ? 'asc' : 'desc'
                    }`
                  )
                  setSortOrder?.(sortOption.id)
                  setSortDirectionAsc?.(sortOption.asc === true)
                  setSortAnchorEl(undefined)
                }}
              >
                {sortOption.title}
                {/*sortOrder === sortOption.id && (sortDirectionAsc
                  ? <ArrowUpwardIcon fontSize="small" />
                  : <ArrowDownwardIcon />
                )*/}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* {filterOptions.length > 0 && (
        <Box padding="0.75em" width="100%" display="flex" flexDirection="row">
          {filterOptions.map(({ id, title }) => (
            <FormControlLabel
              control={<Checkbox />}
              label={title}
              key={id}
              onChange={(e) => setFilters?.([id])}
            />
          ))}
        </Box>
      )} */}

      <Box
        flexGrow={1}
        overflow='scroll'
        alignItems='start'
        paddingX='0.5em'
        ref={resultsRef}
      >
        <List disablePadding dense>
          {filteredDocuments.map((document, i, a) => {
            const _doc = document
            return (
              <ListItem
                key={_doc.id}
                dense
                disableGutters
                onMouseOver={() => targetDocument?.(_doc)}
                onMouseOut={() => targetDocument?.()}
                // onClick={() => {selectDocument?.(_doc)}}
              >
                <Box
                  borderBottom={
                    i < a.length - 1 ? '1px solid lightgrey' : 'none'
                  }
                  width='100%'
                >
                  <Box display='flex' flexDirection='column'>
                    <Box display='flex'>
                      {document.author.picture != null &&
                        document.author.picture !== '' && (
                          <Box padding='0.4rem' lineHeight='0'>
                            <Image
                              src={document.author.picture}
                              alt=''
                              width={32}
                              height={32}
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
                              }}
                            />
                          </Box>
                        )}
                      <Box paddingY='0.2rem'>
                        <Box
                          sx={({ palette }) => ({
                            fontSize: '0.8rem',
                            lineHeight: '1rem',
                            fontWeight: 'bold',
                            '& > a': {
                              textDecoration: 'none',
                              color: palette.text.primary
                            },
                            paddingY: '0.2rem'
                          })}
                        >
                          <a
                            href={`https://${document.id}`}
                            target='_blank'
                            rel='nofollow noreferrer'
                          >
                            {document.author.name}
                          </a>
                        </Box>
                        <Box
                          sx={({ palette }) => ({
                            fontFamily: 'monospace',
                            fontSize: '0.8em',
                            lineHeight: '1em',
                            '& > a': {
                              textDecoration: 'none',
                              color: palette.text.secondary
                            }
                          })}
                        >
                          <a
                            href={`${document.author.url}`}
                            target='_blank'
                            rel='nofollow noreferrer'
                          >
                            @{document.author.username}
                          </a>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Typography padding='0.4rem' fontSize='0.8rem'>
                    {document.text}
                  </Typography>
                  {(document.created_at_timestamp_sec ?? 0) > 0 && (
                    <Typography
                      component='p'
                      paddingX='0.4rem'
                      paddingBottom='0.8rem'
                      paddingTop={0}
                      fontSize='0.6rem'
                      lineHeight='0.8rem'
                      color='text.secondary'
                      sx={({ palette }) => ({
                        '& > a': {
                          textDecoration: 'none',
                          color: palette.text.secondary
                        }
                      })}
                    >
                      <a
                        href={`https://${document.id}`}
                        target='_blank'
                        rel='nofollow noreferrer'
                      >
                        {moment
                          .unix(document.created_at_timestamp_sec ?? 0)
                          .format('ll')}
                      </a>
                    </Typography>
                  )}

                  <DocumentChips
                    document={document}
                    dimensions={dimensions.intensity}
                  />
                </Box>
              </ListItem>
            )
          })}
        </List>
      </Box>
    </Box>
  )
})

export default SearchResultsWithRef
