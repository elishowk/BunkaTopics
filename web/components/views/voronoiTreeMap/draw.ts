// D3 code.
import * as d3 from 'd3'

import { VoronoiTreeMapProps } from './VoronoiTreeMap'

export default function draw(elementId: string, props: VoronoiTreeMapProps) {
  const {
    documents,
    topics,
    screenSize
  } = props
  const width = screenSize?.width ?? 0
  const height = screenSize?.height ?? 0
  if (width <= 0 || height <= 0) {
    return false
  }

  /**
   * Selection of the map HTML wrapper.
   */
  const rendered = d3
    .select(`#${elementId}`)
  
  /**
   * Selection of the SVG wrapper.
   */
  const svg = rendered
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  /**
   * SVG canvas group on which transforms apply.
   */
  const canvas = svg.append("g")
}
