import type { RefObject } from 'react'
import { Theme } from '@mui/material'
import type { Selection } from 'd3'
import { PanelResultsHandler } from './components/search/PanelResults'

export type Coordinates = {
  x: number
  y: number
}

export type DocumentTerm = {
  id: string
  lemma: string
  ent: string
  count: number
  ngrams: number
}

export type DocumentRank = {
  rank: number
  rank_per_topic: {
    [x: string]: {
      rank: number
      score?: number
      score_bin?: number
      count_specific_terms?: number
      specificity_bin?: number
      bunka_score?: number
    }
  }
}

export type DocumentAuthor = {
  name: string
  username: string
  picture: string
  url: string
}

export type DocumentDimension = {
  id: string
  score: number
}

export type Document = {
  id: string
  text: string
  text_cleaned?: string
  source?: "twitter.com" | "reddit.com"
  language: "en" | "fr"
  languages: ("en" | "fr")[]
  created_at_timestamp_sec?: number
  author: DocumentAuthor
  terms: DocumentTerm[]
  embedding_light: [number, number]
  topic_ids: number[]
  rank: DocumentRank
  dimensions?: DocumentDimension[]
  coordinates?: Coordinates
}

export type TopicCentroid = {
  cluster_id: number
  x: number
  y: number
}

export type TopicConvexHull = {
  cluster_id: number
  x_coordinates?: number[]
  y_coordinates?: number[]
}

export type TopicExplanation = {
  topic_id: number
  name: string
  specific_terms: string[]
  top_terms: string[]
  top_entities: string[]
}

export type Topic = {
  id: number
  size: number
  percent: number
  parent_topic_id?: number
  centroid: TopicCentroid
  convex_hull: TopicConvexHull
  explanation: TopicExplanation
}

export type SearchQueryTopics = {
  shape?: number[]
  convex_hull_interpolation?: boolean
  min_doc_per_topic?: number
  ngrams?: number[]
  min_count_term?: number
  top_terms_included?: number
  text_type?: string
  n_terms_in_name?: number
  number_top_terms_returned?: number
  number_specific_terms_returned?: number
  specificity_weight?: number
  popularity_weight?: number
  feature_binned_number?: number
}

export type SearchQueryIntensityDimension = {
  id: string
  words: string[]
}

export type SearchQueryContinuumDimension = {
  id: string
  left_id: string,
  left_words: string[],
  right_id: string,
  right_words: string[]
}

export type SearchQuery = {
  text: string
  top_k: number
  min_doc_retrieved?: number
  max_toxicity?: number
  languages?: string[]
  topics?: SearchQueryTopics
  intensity_dimensions?: SearchQueryIntensityDimension[]
  continuum_dimensions?: SearchQueryContinuumDimension[]
}

export type SearchResponseDimension = {
  id: string
  kind: 'intensity' | 'continuum'
}

export type ResultsMetadata = {
  earlierDocument?: Document
  laterDocument?: Document
}

export type SearchResponse = {
  id?: string
  query?: SearchQuery
  nb_documents?: number
  documents: Document[]
  topics?: Topic[]
  dimensions?: SearchResponseDimension[]
  metadata?: ResultsMetadata
}

export type SearchCustomOptions = {
  customIntensityDimensions?: SearchQueryIntensityDimension[]
  customContinuumDimensions?: SearchQueryContinuumDimension[]
  override?: SearchQuery
}

export enum DimensionType {
  "NONE",
  "DENSITY",
  "FRESHNESS",
}

export type ScreenSize = {
  width: number
  height: number
}

export type DocumentSelection = {
  document?: Document
  topic?: Topic
}

export type DocumentSelectedEvent = CustomEvent<DocumentSelection>

export type TopicSelectedEvent = CustomEvent<{ topic?: Topic }>

export type ViewHandler = {
  focusOnDocument?: (document?: Document, topic?: Topic) => void
  dispatchDocumentTargetted?: (document?: Document) => void
  getDocumentSelection?: (document?: Document) => Selection<SVGGElement, Document, any, unknown> | undefined
  dispatchDocumentSelected?: (document?: Document, topic?: Topic) => void
  dispatchTopicSelected?: (topic?: Topic) => void
  getSize: () => { width: number, height: number }
}

export type ViewDimension = {
  type: DimensionType | string
  label: string
}

export type ViewDimensionIntensity = ViewDimension & {
  keywords?: string[]
}

export type ViewDimensionContinuum = ViewDimension & {
  idLeft?: string
  keywordsLeft?: string[]
  idRight?: string
  keywordsRight?: string[]
}

export type ViewDimensions = {
  intensity: ViewDimensionIntensity[]
  continuum: ViewDimensionContinuum[]
}

export enum Views {
  "MAP",
  "CONTOURS",
  "TREEMAP",
  "BOURDIEU_MAP",
  "VORONOI",
  "DEBUG"
}

export type ViewProps = {
  ref: RefObject<ViewHandler>
  panelResultsRef?: RefObject<PanelResultsHandler>
  view?: Views
  documents: Document[]
  topics: Topic[]
  dimensions: ViewDimensions
  documentSelected?: Document
  selectDocument?: (document?: Document, topic?: Topic) => void
  topicSelected?: Topic
  selectTopic?: (topic?: Topic) => void
  onDocumentClick?: (s: string | undefined) => void
  screenSize?: ScreenSize
  theme?: Theme
  searchCustomOptions?: SearchCustomOptions
  changeSearchCustomOptions?: (options: SearchCustomOptions) => void
  sortDocumentsBy?: (dimension: string, ascending?: boolean) => void
}

export type ResultsSortOrder = 'time' | 'relevance' | DimensionType | string
export type ResultsFilterOption = 'popularity' | DimensionType

declare module '@mui/material/styles' {
  interface Palette {
    titles: Palette['primary']
    details: Palette['primary']
  }

  interface PaletteOptions {
    titles: PaletteOptions['primary']
    details: PaletteOptions['primary']
  }

  interface PaletteColor {
    titles?: string
    details?: string
  }

  interface SimplePaletteColorOptions {
    titles?: string
    details?: string
  }
}

export type MapTransform = {
  k?: number
  x?: number
  y?: number
}
