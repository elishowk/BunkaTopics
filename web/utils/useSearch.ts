import useSWR, { Key, SWRResponse } from 'swr'
import { SearchResponse, SearchCustomOptions } from '../types'

export const defaultQueryOptions = {
  top_k: parseInt(
    process.env.NEXT_PUBLIC_SEARCH_TOP_K ?? '400'
  ),
  min_doc_retrieved: 100,
  topics: {
    text_type: 'term_id',
    convex_hull_interpolation: true,
    min_doc_per_topic: parseInt(
      process.env.NEXT_PUBLIC_SEARCH_MIN_DOCS ?? '20'
    ),
    n_terms_in_name: 3,
    specificity_weight: 6,
    top_terms_included: 20000,
    ngrams: [1, 2],
    min_count_term: 1,
  },
}

const IS_LOCAL_DATA = process.env.NEXT_PUBLIC_API_ENDPOINT === 'local';

export default function useSearch(query: string, lang: string = "en", customOptions?: SearchCustomOptions): SWRResponse {
  const credentialsRes = useSWR(
    IS_LOCAL_DATA ? null : `${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/token`,
    (url) => {
      return fetch(url, {
        method: 'POST',
        body: new URLSearchParams({
          username: 'test',
          password: 'secret'
        }),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      })
        .then(data => data.json())
    }
  )

  let fullOverrideStr = typeof window !== "undefined" && window.localStorage != null
    ? window.localStorage.getItem('searchOverride')
    : null
  let fullOverride: object | undefined

  try {
    if (fullOverrideStr != null)
      fullOverride = JSON.parse(fullOverrideStr)
  } catch (e) {
    console.warn(e)
    if (typeof window !== "undefined" && window.localStorage != null) {
      window.localStorage.removeItem('searchOverride')
    }
  }
  type useSWRArgs = [
    u: RequestInfo | URL,
    q?: string,
    lg?: string,
    o?: SearchCustomOptions,
  ];

  return useSWR<SearchResponse>(
    !IS_LOCAL_DATA
      ? [`${process.env.NEXT_PUBLIC_API_ENDPOINT}/segment`, query, lang, customOptions]
      : ['/localSearchResults.json'],
    ([u, q, lg, o]: useSWRArgs) => {
      return fetch(u, !IS_LOCAL_DATA ? {
        method: 'post',
        body: JSON.stringify({
          text: q,
          ...(
            fullOverride || ({
              ...defaultQueryOptions,
              ...(o?.override ?? {}),
              topics: {
                ...defaultQueryOptions.topics,
                ...(o?.override?.topics ?? {}),
              },
            })
          ),
          languages: [lg],
          intensity_dimensions: [
            {
              id: 'positive',
              words: ['amazing'],
            },
            {
              id: 'negative',
              words: ['terrible'],
            },
            ...(o?.['customIntensityDimensions'] ?? [])
          ],
          continuum_dimensions: [
            {
              id: 'positive / negative',
              left_id: 'positive',
              left_words: ['amazing'],
              right_id: 'negative',
              right_words: ['terrible'],
            },
            {
              id: 'national / international',
              left_id: 'national',
              left_words: ['national'],
              right_id: 'international',
              right_words: ['international'],
            },
            ...(o?.['customContinuumDimensions'] ?? [])
          ],
        }),
        headers: {
          authorization: `Bearer ${credentialsRes?.data?.access_token}`,
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }: {
        method: 'get',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(data => {
          return data.json()})
    },
    {
      // cache management
      revalidateIfStale: true,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )
}
