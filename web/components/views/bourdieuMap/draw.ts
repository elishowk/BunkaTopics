// D3 code.
import * as d3 from 'd3'
import { interpolateHsvLong, hsv } from 'd3-hsv'
import { BourdieuMapProps } from './BourdieuMap'
import { Document, DocumentSelectedEvent, ScreenSize } from '../../../types'
import { ZoomTransform } from 'd3'

const areaPrimaryColor = 'blue' // '#0a7cba'

// Terrain colors from R.
export function interpolateTerrain(t: number) {
  const i0 = interpolateHsvLong(hsv(120, 1, 0.65), hsv(60, 1, 0.90))
  const i1 = interpolateHsvLong(hsv(60, 1, 0.90), hsv(0, 0, 0.95))
  return t < 0.5
    ? i0(t * 2)
    : i1((t - 0.5) * 2)
}

var _documentSelected: Document | undefined // topicId selected.
var _documentTargetted: Document | undefined

export default function draw(elementId: string, props: BourdieuMapProps & { screenSize: ScreenSize }) {
  const {
    documents,
    screenSize,
    interpolation,
    dimensions,
    transform: defaultTransform,
    documentSelected,
    theme
  } = props
  const dimensionX = dimensions.continuum.find(d => (d.type as string).toLowerCase() === (props.dimensionX as string).toLowerCase())
  const dimensionXType = ((dimensionX?.type ?? '') as string).toLowerCase()
  const dimensionY = dimensions.continuum.find(d => (d.type as string).toLowerCase() === (props.dimensionY as string).toLowerCase())
  const dimensionYType = ((dimensionY?.type ?? '') as string).toLowerCase()
  const width = screenSize.width
  const height = screenSize.height

  _documentSelected = documentSelected

  if (width <= 0 || height <= 0) {
    return false
  }

  /**
   * Selection of the map HTML wrapper.
   */
  const map = d3
    .select(`#${elementId}`)
    .classed('darkmode', theme?.palette?.mode === 'dark')
    .classed(`interpolation-${interpolation}`, interpolation != null)
  
  /**
   * Selection of the SVG wrapper.
   */
  const svg = map
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  /**
   * SVG canvas group on which transforms apply.
   */
  const canvas = svg.append("g").classed("canvas", true)
  const view = canvas.append("g").classed("view", true)

  /**
   * Scales.
   */
  const xRangeComputed = [-1, 1]
  const xMargin = (xRangeComputed[1] - xRangeComputed[0]) / 10 // 10% margin.
  const xRange = [xRangeComputed[0] - xMargin, xRangeComputed[1] + xMargin]
  const yRangeComputed = [-1, 1]
  const yMargin = (yRangeComputed[1] - yRangeComputed[0]) / 10 // 10% margin.
  const yRange = [yRangeComputed[0] - yMargin, yRangeComputed[1] + yMargin]
  var x = d3.scaleLinear()
    .domain(xRange)
    .range([ 0, width ])
  var y = d3.scaleLinear()
    .domain(yRange)
    .range([ height, 0 ])

  const axes = d3.create("svg:g").classed("axes", true)
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead-right')
    .attr('refX', 5)
    .attr('refY', 5)
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .append('path')
    .attr('d', 'M 0 0 L 5 5 L 0 10')
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead-left')
    .attr('refX', 0)
    .attr('refY', 5)
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .append('path')
    .attr('d', 'M 5 0 L 0 5 L 5 10')
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead-top')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .append('path')
    .attr('d', 'M 0 5 L 5 0 L 10 5')
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead-bottom')
    .attr('refX', 5)
    .attr('refY', 5)
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .append('path')
    .attr('d', 'M 0 0 L 5 5 L 10 0')
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
  // X axis
  axes.append("g")
    .attr("transform", `translate(0,${height / 2 - yMargin})`)
    .call(
      d3.axisBottom(x)
        .tickSizeInner(0)
        .tickSizeOuter(0)
        .tickPadding(10)
        .tickFormat(d => d === 1
          ? (dimensionX?.idLeft ?? dimensionX?.label ?? '')
          : d === -1
            ? (dimensionX?.idRight ?? dimensionX?.label ?? '')
            : ''
        )
    )
      .attr("class", "axis xAxis")
      .datum({ dimension: dimensionX })
      .select('path.domain')
        .attr("marker-start", "url(#arrowhead-left)")
        .attr("marker-end", "url(#arrowhead-right)")
  // Y axis
  axes.append("g")
    .attr("transform", `translate(${width / 2 - xMargin},0)`)
    .call(
      d3.axisRight(y)
        .tickSizeInner(0)
        .tickSizeOuter(0)
        .tickPadding(10)
        .tickFormat(d => d === 1
          ? (dimensionY?.idLeft ?? dimensionY?.label ?? '')
          : d === -1
            ? (dimensionY?.idRight ?? dimensionY?.label ?? '')
            : ''
        )
    )
      .attr("class", "axis yAxis")
      .datum({ dimension: dimensionY })
      .select('path.domain')
        .attr("marker-end", "url(#arrowhead-top)")
        .attr("marker-start", "url(#arrowhead-bottom)")

  /**
   * Zoom.
   */
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 4])
    .translateExtent([[0,0], [width, height]])
    .on("zoom", function ({ transform }) {
      canvas.attr(
        "transform",
        `translate(${transform.x ?? 0}, ${transform.y ?? 0}) scale(${transform.k ?? 1})`
      )
      props.setTransform?.({
        x: transform.x,
        y: transform.y,
        k: transform.k
      })
    })

  /**
   * Initial zoom.
   */
  svg.call(zoom)
  const initialTransform = defaultTransform?.k != null
    ? new ZoomTransform(
      defaultTransform.k ?? 1,
      defaultTransform.x ?? 0,
      defaultTransform.y ?? 0
    )
    : d3.zoomIdentity
  svg.call(zoom.transform, initialTransform)

  // /**
  //  * Initial empty tooltip for documents.
  //  */
  // const tooltip = d3
  //   .select(`#${elementId}`)
  //   .append("div")
  //   .classed("tooltip", true)
  //   .text("")

  /**
   * Contours generator.
   */
  const contoursGenerator = d3.contourDensity<Document>()
    .x(d => x(d.dimensions?.find(dd => dd.id.toLowerCase() === dimensionXType)?.score ?? 0))
    .y(d => y(d.dimensions?.find(dd => dd.id.toLowerCase() === dimensionYType)?.score ?? 0))
    .size([width, height])
    .thresholds(props.thresholds ?? 10)
    .bandwidth(props.bandwith ?? 20)
  var densityData = contoursGenerator(documents ?? []) 
  var color = (
    d3.scaleSequential(
      interpolation === 'terrain'
        ? interpolateTerrain
        // : d3.interpolateCividis
        // : d3.interpolateBlues
        // : d3.interpolateCool
        // : d3.interpolateWarm
        // : d3.interpolateGreens
        // : d3.interpolateGreys
        : theme?.palette.mode === 'dark'
          ? d3.interpolateViridis
          : d3.interpolateBlues
    )
    .domain(
      d3.extent(densityData.map(d => d.value)) as [number, number]
    )
  )
  
  /**
   * Contours of density.
   */
  view
    .selectAll("path")
    .data(densityData)
    .enter()
    .append("path")
      .attr("d", d3.geoPath())
      .attr("fill", (d) => color(d.value))
      .attr("opacity", interpolation === 'terrain' ? 0.25 : 1)
      .attr("stroke", "#ccc")
      .attr("stroke-opacity", 0.5)


  /**
   * Documents.
   */

  const documentsPoints = view
    .selectAll('.document')
    .data(documents ?? [])
    .enter()
    .append("g")
    .attr("id", doc => `document-${doc.id.replaceAll("/", "-").replaceAll(".", "_")}`)
    .append("circle")
    .attr("class", "documentCircle")
    .classed("selected", (d) => d.id === _documentSelected?.id)
    .attr("cx", doc => x(doc.dimensions?.find(d => d.id.toLowerCase() === dimensionXType)?.score ?? 0))
    .attr("cy", doc => y(doc.dimensions?.find(d => d.id.toLowerCase() === dimensionYType)?.score ?? 0))
    .attr("r", 2)
    .attr("fill", (doc) => _documentSelected?.id != null && doc.id === _documentSelected.id ? "red" : "blue")
    .attr("opacity", (doc) => _documentSelected?.id != null && doc.id === _documentSelected.id ? 1 : 0.5)
    .on("mouseover", function (event, _document) {
      d3.select(event.target)
        .attr("opacity", 1)
        .style("cursor", "crosshair")
        .attr("fill", "red")
        .attr("r", 4)
    })
    .on("mouseout", function (event, document) {
      d3.select<SVGCircleElement, Document>(event.target)
        .attr("r", 2)
        .attr("fill", (doc) => _documentSelected != null && doc.id === _documentSelected.id ? "red" : "blue")
        .attr("opacity", (doc) => _documentSelected != null && doc.id === _documentSelected.id ? 1 : 0.5)
    })
    .on("click", function (_event, document) {
      _documentSelected = document
      props.selectDocument?.(document)
    })

  /**
   * Axes
   */
  canvas.append(() => axes.node())


  /**
   * Colorscale
   */
  if (color(0) !== "none") {
    const colorscaleColor = (color as d3.ScaleSequential<string, never>).domain([1, 0])
    const colorscale = svg.insert('g')
      .classed("colorscale", true)
    colorscale
      .insert('text')
      .classed("colorscale-plus", true)
      .text('+')
      .attr("x", width - 40)
      .attr("y", height - 210)
    colorscale
      .insert('text')
      .classed("colorscale-minus", true)
      .text('-')
      .attr("x", width - 38)
      .attr("y", height - 80)

    for (var i = 0; i <= 1; i += 0.01) {
      colorscale.insert('rect')
        .classed("colorscale-rect", true)
        .datum(i)
        .attr("x", width - 40)
        .attr("y", (height + i*100) - 200)
        .attr("width", 10)
        .attr("height", 1)
        .attr("fill", d => colorscaleColor(d))
    }

    colorscale
      .insert('text')
      .classed("colorscale-label", true)
      .text('Density')
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("x", width - 45)
      .attr("y", height - 150)
  }

  canvas.selectAll(".axis .tick text")
    .style("cursor", "pointer")
    .on("click", function (event, datum) {
      const { dimension } = d3.select<SVGGElement, { dimension: typeof dimensionX }>(
        event.currentTarget.parentNode.parentNode
      ).datum()
      if (dimension && (datum === -1 || datum === 1)) {
        props.sortDocumentsBy?.(dimension.type as string, datum === -1)
      }
    })


  /**
   * Events on Map
   */
  map
    .on("documenttargetted", function(event: DocumentSelectedEvent) {
      _documentTargetted = event.detail.document
      const targetted = (d: Document): boolean =>
        _documentTargetted != null && d.id === _documentTargetted.id
      canvas
        .selectAll<SVGCircleElement, Document>(".documentCircle")
        .attr("r", (d) => targetted(d) ? 4 : 2)
        .attr("fill", (d) => targetted(d) ? "red" : "blue")
        .attr("opacity", (d) => targetted(d) ? 1 : 0.5)
        .classed("targetted", (d) => targetted(d))
    })
}