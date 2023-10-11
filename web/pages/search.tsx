import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import type { SWRResponse } from 'swr'
import { CustomEvent, PageViews, SiteSearch } from '@piwikpro/react-piwik-pro'
import {
  Box,
  Container,
  FormControl,
  Grid,
  MenuItem,
  Select
} from '@mui/material'

import AppLayout from '../components/AppLayout'
import ErrorScreen from '../components/screens/Error'
import LoadingScreen from '../components/screens/Loading'
import PanelResults, {
  PanelResultsHandler
} from '../components/search/PanelResults'
import {
  DimensionType,
  SearchCustomOptions,
  SearchResponse,
  Document,
  ViewDimensions,
  ViewHandler,
  Topic,
  Views
} from '../types'
import useSearch from '../utils/useSearch'
import View from '../components/views/View'
import useSearchCustomOptions from '../utils/useSearchCustomOptions'
import React from 'react'

export type SearchPageSuccessProps = {
  query: string
  response: SWRResponse<SearchResponse>
  customOptions: SearchCustomOptions
  changeCustomOptions: (options: SearchCustomOptions) => void
}

export function SearchPageSuccess({
  query,
  response,
  customOptions,
  changeCustomOptions
}: SearchPageSuccessProps) {
  const { t } = useTranslation('common')
  const viewRef = useRef<ViewHandler>(null)
  const panelResultsRef = useRef<PanelResultsHandler>(null)
  const [view, setView] = useState<Views>(Views['MAP'])

  const dimensions: ViewDimensions = {
    intensity: [
      { type: DimensionType.NONE, label: t`None` },
      ...(response.data?.dimensions ?? [])
        .filter((rdd) => rdd.kind === 'intensity')
        .map((rdd) => {
          const dimQuery = response.data?.query?.intensity_dimensions?.find(
            (qd) => qd.id === rdd.id
          )
          return {
            type: rdd.id.toLowerCase(),
            label:
              (rdd.id as string)[0].toUpperCase() + (rdd.id as string).slice(1),
            keywords: dimQuery?.words
          }
        })
    ],
    continuum: (response.data?.dimensions ?? [])
      .filter((rdd) => rdd.kind === 'continuum')
      .map((rdd) => {
        const dimQuery = response.data?.query?.continuum_dimensions?.find(
          (qd) => qd.id === rdd.id
        )
        return {
          type: rdd.id.toLowerCase(),
          label:
            (rdd.id as string)[0].toUpperCase() + (rdd.id as string).slice(1),
          idLeft: dimQuery?.left_id,
          idRight: dimQuery?.right_id,
          keywordsLeft: dimQuery?.left_words,
          keywordsRight: dimQuery?.right_words
        }
      })
  }

  const targetDocument = (document?: Document) => {
    viewRef.current?.dispatchDocumentTargetted?.(document)
  }

  const [documentSelected, setDocumentSelected] = useState<
    Document | undefined
  >()
  const [topicSelected, setTopicSelected] = useState<Topic | undefined>()
  const selectTopic = (topic?: Topic) => {
    setTopicSelected(topic)
  }
  const selectDocument = (document?: Document, topic?: Topic) => {
    setDocumentSelected(document)
    if (topic) {
      setTopicSelected(topic)
    }
  }

  useEffect(() => {
    if (response.data?.nb_documents != null && response.data.nb_documents > 0) {
      SiteSearch.trackSiteSearch(query, 'search', response.data.nb_documents)
    }
  }, [query, response.data?.nb_documents])

  // useEffect(() => {
  //   if (panelResultsRef.current != null) {
  //     panelResultsRef.current?.selectDocument?.(documentSelected, topicSelected)
  //     viewRef.current?.selectDocument(documentSelected)
  //   }
  // }, [documentSelected, topicSelected])

  const viewSelector = (
    <Box marginY='0.5em'>
      <FormControl fullWidth>
        <Select
          value={view}
          variant='standard'
          fullWidth
          onChange={(e) => {
            CustomEvent.trackEvent('view', 'change', e.target.value as string)
            setView(e.target.value as Views)
          }}
        >
          <MenuItem value={Views['MAP']}>{t('Map')}</MenuItem>
          <MenuItem value={Views['BOURDIEU_MAP']}>{t('Bourdieu Map')}</MenuItem>
          {process.env.NEXT_PUBLIC_BETA !== 'true' && (
            <MenuItem value={Views['DEBUG']}>{t('Debug')}</MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  )

  return (
    <Grid container>
      <Grid item xs={12} sm={8}>
        <AppLayout
          query={query}
          viewSelector={viewSelector}
          response={response}
        >
          <View
            ref={viewRef}
            view={view}
            panelResultsRef={panelResultsRef}
            documents={response.data?.documents ?? []}
            dimensions={dimensions}
            topics={response.data?.topics ?? []}
            searchCustomOptions={customOptions}
            changeSearchCustomOptions={changeCustomOptions}
            documentSelected={documentSelected}
            topicSelected={topicSelected}
            selectDocument={selectDocument}
            selectTopic={selectTopic}
          />
        </AppLayout>
      </Grid>

      <Grid item xs={12} sm={4}>
        <PanelResults
          ref={panelResultsRef}
          view={view}
          response={response}
          dimensions={dimensions}
          searchCustomOptions={customOptions}
          changeSearchCustomOptions={changeCustomOptions}
          documentSelected={documentSelected}
          topicSelected={topicSelected}
          targetDocument={targetDocument}
          selectDocument={selectDocument}
          selectTopic={selectTopic}
        />
      </Grid>
    </Grid>
  )
}

export default function SearchPage() {
  const { query } = useRouter()
  const { saveCustomOptions } = useSearchCustomOptions()
  const { t } = useTranslation('common')
  const [customOptions, setCustomOptions] = useState<SearchCustomOptions>()
  const q = (query.q ??
    process.env.NEXT_PUBLIC_DEFAULT_SEARCH_QUERY ??
    'bunka') as string
  const lg = (query.lg ??
    process.env.NEXT_PUBLIC_DEFAULT_SEARCH_LANG ??
    'en') as string

  let response: SWRResponse = useSearch(q, lg, customOptions)

  useEffect(() => {
    PageViews.trackPageView('searchPage')
  }, [])

  useEffect(() => {
    if (customOptions != null) {
      saveCustomOptions(customOptions)
    }
  }, [customOptions, saveCustomOptions])

  useEffect(() => {
    if (response?.error?.message != null) {
      CustomEvent.trackEvent('search', 'error', response.error.message)
    }
  }, [response?.error])

  return response.error ||
    response.data?.documents == null ||
    (response.data?.documents && response.data?.documents.length == 0) ? (
    <AppLayout query={query?.q != null ? `${query.q}` : undefined}>
      <Container sx={{ paddingY: '1em', height: '100%' }}>
        {response.error ? (
          <ErrorScreen error={t(response.error.message)} />
        ) : !response.isLoading &&
          !response.isValidating &&
          response.data?.message != null ? (
          <ErrorScreen error={t(response.data.message)} />
        ) : (
          <LoadingScreen />
        )}
      </Container>
    </AppLayout>
  ) : (
    <SearchPageSuccess
      query={`${query.q}`}
      response={response}
      customOptions={customOptions ?? {}}
      changeCustomOptions={setCustomOptions}
    />
  )
}
