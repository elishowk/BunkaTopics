// D3 code.
import * as d3 from 'd3'

import type { ScreenSize } from '../../types'
import BarChart from '../../utils/observableBarChart'

export type TimelineInput = {
  year: string
  month: string
  count: number
  label?: string
}

export type TimelineInputs = {
  [x: string]: TimelineInput
}

export type DrawTimelineProps = {
  inputs: TimelineInputs,
  screenSize?: ScreenSize
}

export default function draw(elementId: string, { inputs }: DrawTimelineProps) {
  const documents = Object.keys(inputs).map((key: string) => ({
    key,
    label: `${inputs[key].month}/${inputs[key].year}`,
    ...inputs[key]
  }))

  /**
   * Selection of the map HTML wrapper.
   */
  const rendered = d3
    .select<HTMLDivElement, unknown>(`#${elementId}`)

  /**
   * Selection of the SVG wrapper.
   */
  const width = rendered.node()?.clientWidth ?? 100
  const height = rendered.node()?.clientHeight ?? 100
  const svg = rendered
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

  /** @ts-ignore */
  // BarChart is appended to svg.
  BarChart(documents, {
    svg,
    x: d => d.label,
    y: d => d.count,
    xDomain: d3.groupSort(documents, ([a], [b]) => {
      if (a.key < b.key) return -1
      if (b.key < a.key) return 1
      return 0
    }, d => d.label),
    yLabel: "↑ Count",
    width,
    height,
    color: "steelblue",
    marginLeft: 30,
    marginRight: 20,
  })
}
