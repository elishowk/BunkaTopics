// D3 code.
import * as d3 from 'd3'
import { interpolateHsvLong, hsv } from 'd3-hsv'
import { MapProps } from './Map'
import { DimensionType, Document, ScreenSize, Topic } from '../../../types'
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

var _topicSelected: Topic | undefined
var _documentTargetted: Document | undefined
var _documentSelected: Document | undefined

export default function draw(elementId: string, props: MapProps & { screenSize: ScreenSize }) {
  const {
    documents,
    topics,
    screenSize,
    interpolation,
    dimension,
    // dimensions,
    documentSelected,
    topicSelected,
    selectDocument,
    triggerSubtopics,
    transform: defaultTransform,
    theme
  } = props
  const width = screenSize.width
  const height = screenSize.height

  if (width <= 0 || height <= 0) {
    return false
  }

  _topicSelected = topicSelected
  _documentSelected = documentSelected

  /**
   * Selection of the map HTML wrapper.
   */
  const map = d3
    .select(`#${elementId}`)
    .classed('darkmode', theme?.palette?.mode === 'dark')
  
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
  const canvas = svg.append("g")
    .classed('canvas', true)

  /**
   * Scales.
   */
  const xRangeComputed = d3.extent(documents?.map(d => d.embedding_light[0]) ?? [0, 10]) as [number, number]
  const xMargin = (xRangeComputed[1] - xRangeComputed[0]) / 10 // 10% margin.
  const xRange = [xRangeComputed[0] - xMargin, xRangeComputed[1] + xMargin]
  const yRangeComputed = d3.extent(documents?.map(d => d.embedding_light[1]) ?? [0, 10]) as [number, number]
  const yMargin = (yRangeComputed[1] - yRangeComputed[0]) / 10 // 10% margin.
  const yRange = [yRangeComputed[0] - yMargin, yRangeComputed[1] + yMargin]
  var x = d3.scaleLinear()
    .domain(xRange)
    .range([ 0, width ])
  var y = d3.scaleLinear()
    .domain(yRange)
    .range([ height, 0 ])

  /**
   * Zoom.
   */
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 3])
    .translateExtent([[0,0], [width, height]])
    .on("zoom", function ({ transform }) {
      canvas.attr(
        "transform",
        `translate(${transform.x ?? 0}, ${transform.y ?? 0}) scale(${transform.k ?? 1})`
      )
      positionLabels()
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
    .x(d => x(d.embedding_light[0])) // x and y = column name in .csv input data
    .y(d => y(d.embedding_light[1]))
    .weight(_d => {
      if (dimension === DimensionType.NONE || dimension === DimensionType.DENSITY)
        return 1
      const score = _d.dimensions?.find(dd => dd.id.toLowerCase() === dimension)?.score ?? 0
      const threshold = dimension === 'popularity' && process.env.NEXT_PUBLIC_POPULARITY_SCORE_THRESHOLD != null
        ? parseFloat(process.env.NEXT_PUBLIC_POPULARITY_SCORE_THRESHOLD)
        : process.env.NEXT_PUBLIC_DIMENSION_SCORE_THRESHOLD != null
          ? parseFloat(process.env.NEXT_PUBLIC_DIMENSION_SCORE_THRESHOLD)
          : 0
      return score >= threshold ? score : 0
    })
    .size([width, height])
    .thresholds(props.thresholds ?? 10)
    .bandwidth(props.bandwith ?? 20)
  var densityData = contoursGenerator(documents ?? []) 
  var color = dimension === DimensionType.NONE
    ? () => 'none'
    : d3.scaleSequential(
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
  
  /**
   * Contours of density.
   */
  canvas
    .selectAll("path")
    .data(densityData)
    .enter()
    .append("path")
      .attr("d", d3.geoPath())
      .attr("fill", (d) => color(d.value))
      .attr("opacity", interpolation === 'terrain' && dimension !== DimensionType.NONE
        ? 0.25
        : 1)
      .attr("stroke", dimension === DimensionType.NONE ? "#ccc" : "#fff")
      .attr("stroke-opacity", 0.5)

  /***
   * 
   *  TOPICS
   * 
   */

  /**
   * Labels (HTML divs outside of SVG)
   */
  ;(topics?.forEach(topic => {
    map
      .datum(topic)
      .append("div")
      .classed("centroidLabelWrapper", true)
      .style("display", (topic) => {
        const trigger = triggerSubtopics ?? 2
        return (topic.parent_topic_id == null && initialTransform.k < trigger)
          || (topic.parent_topic_id != null && initialTransform.k >= trigger)
            ? "block"
            : "none"
      })
      .style("left", function (topic) {
        const zoomTransform = canvas.node() != null
          ? d3.zoomTransform(canvas.node() as SVGElement)
          : initialTransform
        const _x = (pos: number) => zoomTransform.applyX(x(pos))
        return `${_x(topic.centroid.x) - Math.floor(this.clientWidth / 2)}px`
      })
      .style("top", function (topic) {
        const zoomTransform = canvas.node() != null
          ? d3.zoomTransform(canvas.node() as SVGElement)
          : initialTransform
        const _y =  (pos: number) => zoomTransform.applyY(y(pos))
        return `${_y(topic.centroid.y) - this.clientHeight}px`
      })
      .on("mouseover", function (event) {
        d3.select(event.target)
          .style('cursor', 'pointer')
        d3.select(`#topic-${topic.id}-area`)
          .attr('fill-opacity', 0.4)
      })
      .on("mouseout", function(event) {
        d3.select(`#topic-${topic.id}-area`)
          .attr('fill-opacity', 0)
        d3.select(this)
          .style('cursor', 'unset')
      })
      .on("click", function (event) {
        _topicSelected = topic
        props.selectTopic?.(topic)
      })
      // @dev Mouse wheel events do not bubble up to the map (SVG is not a parent).
      .append("div")
      .classed("centroidLabel", true)
      .text(topic.explanation.specific_terms.filter((_, i) => i < 5).join(' | '))
  }))

  /**
   * Re-position labels after transformation.
   */
  function positionLabels() {
    const trigger = triggerSubtopics ?? 2
    const zoomTransform = canvas.node() != null
      ? d3.zoomTransform(canvas.node() as SVGElement)
      : initialTransform
    // Labels.
    d3.selectAll<HTMLDivElement, Topic>('div.centroidLabelWrapper')
      .style("left", function (topic) {
        const _x = (pos: number) => zoomTransform.applyX(x(pos))
        return `${_x(topic.centroid.x) - Math.floor(this.clientWidth / 2)}px`
      })
      .style("top", function (topic) {
        const _y =  (pos: number) => zoomTransform.applyY(y(pos))
        return `${_y(topic.centroid.y) - this.clientHeight}px`
      })
      .style("display", (topic) => {
        return (topic.parent_topic_id == null && zoomTransform.k < trigger)
          || (topic.parent_topic_id != null && zoomTransform.k >= trigger)
            ? "block"
            : "none"
      })
    // Perimeters.
    d3.selectAll<SVGGElement, Topic>(`.perimeter`)
      .style("display", (topic) => {
        return (topic.parent_topic_id != null && zoomTransform.k >= trigger)
          || topic.parent_topic_id == null
          ? "unset"
          : "none"
      })
      .style("opacity", (topic) => {
        return topic.parent_topic_id == null && zoomTransform.k >= trigger
          ? "0.25"
          : "1"
      })
  }
  /**
   * Position labels on first draw.
   */
  positionLabels()

  // /**
  //  * Draws centroids.
  //  */
  // const centroids = canvas
  //   .selectAll('.centroid')
  //   .data(topics ?? [])
  //   .enter()
  //   .append("g")
  //   .attr("class", "topicCentroid")
  //   .style("display", (topic) => {
  //     const trigger = triggerSubtopics ?? 2
  //     return (topic.parent_topic_id == null && initialTransform.k < trigger)
  //       || (topic.parent_topic_id != null && initialTransform.k >= trigger)
  //         ? "default"
  //         : "none"
  //   })
  //   .append("circle")
  //   .attr("r", 1)
  //   .attr("cx", t => x(t.centroid.x))
  //   .attr("cy", t => y(t.centroid.y))
  //   .attr("fill", "red")

  /**
   * Topics convex hulls.
   */
  const convexHulls = canvas
    .selectAll(".area")
    .data(topics ?? [])
    .enter()
    .append("g")
    .attr("class", "perimeter")
    .style("display", (topic) => {
      return topic.parent_topic_id != null && initialTransform.k > (triggerSubtopics ?? 2)
        ? "unset"
        : topic.parent_topic_id == null
          ? "unset"
          : "none"
    })
    .style("opacity", (topic) => {
      return topic.parent_topic_id == null && initialTransform.k >= (triggerSubtopics ?? 2)
          ? "0.1"
          : "1"
    })
  
  /**
   * Draw topics convex hulls perimeter.
   */
  convexHulls
    .append('polygon')
    .attr('id', (t) => `topic-${t.id}-area`)
    .attr('points', (t) => {
      return t.convex_hull.x_coordinates != null
        && t.convex_hull.y_coordinates != null
        && t.convex_hull.x_coordinates.length > 0
        ? [...new Array<string>(t.convex_hull.x_coordinates.length)]
            .map((_, i) => ([
              // @ts-ignore
              x(t.convex_hull.x_coordinates[i]),
              // @ts-ignore
              y(t.convex_hull.y_coordinates[i])
            ].join(',')))
        : ""
    })
    .attr('stroke', 'black')
    .attr('stroke-dasharray', '5,5')
    .attr('fill', (t) => {
      return _topicSelected?.id == null || t.id !== _topicSelected.id ? areaPrimaryColor : 'red'
    })
    .attr('fill-opacity', (t) => t.id === _topicSelected?.id ? 0.4 : 0)
    .on('mouseover', function (event, topic) {
      d3.select(this)
        .attr('fill', function(t) {
          const topic = t as Topic | undefined
          return topic?.id !== _topicSelected?.id ? areaPrimaryColor : 'red'
        })
        .attr('fill-opacity', 0.4)
        .style('cursor', 'pointer')
    })
    .on('mouseout', function (event, topic) {
      d3.select(this)
        .attr('fill', _topicSelected?.id == null || topic.id !== _topicSelected.id ? areaPrimaryColor : 'red')
        .attr('fill-opacity', _topicSelected?.id == null || topic.id !== _topicSelected.id ? 0 : 0.4)
        .style('cursor', 'unset')
    })
    .on("click", function (event, topic) {
      _topicSelected = topic
      props.selectTopic?.(_topicSelected)
    })

  /**
   * Documents.
   */
  const documentsPoints = canvas
    .selectAll('.document')
    .data(documents ?? [])
    .enter()
    .append("g")
    .attr("id", doc => `document-${doc.id.replaceAll("/", "-").replaceAll(".", "_")}`)
    .append("circle")
    .attr("class", "documentCircle")
    .classed("selected", (d) => d.id === _documentSelected?.id)
    .attr("r", 2)
    .attr("cx", doc => x(doc.embedding_light[0]))
    .attr("cy", doc => y(doc.embedding_light[1]))
    .attr("fill", doc => _documentSelected?.id != null && doc.id === _documentSelected?.id ? "red" : "blue")
    .attr("opacity", (doc) => _documentSelected?.id != null && doc.id === _documentSelected.id ? 1 : 0.5)
    .on("mouseover", function (event) {
      d3.select(event.target)
        .style('cursor', 'crosshair')
        .attr("fill", "red")
        .attr("opacity", 1)
        .attr("r", 4)
    })
    .on("mouseout", function(event, document) {
      d3.select<SVGCircleElement, Document>(event.target)
        .attr("r", 2)
        .attr("fill", (doc): string => _documentSelected != null && doc?.id === _documentSelected.id
          ? "red"
          : "blue"
        )
        .attr("opacity", (doc) => _documentSelected != null && doc?.id === _documentSelected.id
          ? 1
          : 0.5
        )
    })
    .on("click", function (event: MouseEvent, document?: Document) {
      _documentSelected = document
      props.selectDocument?.(document)
    })
  
  /**
   * Colorscale
   */
  if (color(0) !== "none") {
    const colorscaleColor = (color as d3.ScaleSequential<string, never>).domain([1, 0])
    const colorscale = svg.insert('g')
      .classed("colorscale", true)
      .style("borderColor", "black")
      .style("border", 1)
    let dimensionLabel = dimension?.toString() ?? ''
    dimensionLabel = dimensionLabel.length > 0
      ? dimensionLabel[0].toUpperCase() + dimensionLabel.slice(1)
      : ''
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
        .datum(i)
        .classed("colorscale-rect", true)
        .attr("x", width - 40)
        .attr("y", (height + i*100) - 200)
        .attr("width", 10)
        .attr("height", 1)
        .attr("fill", d => colorscaleColor(d))
    }

    if (dimensionLabel !== "") {
      colorscale
        .insert('text')
        .classed("colorscale-label", true)
        .text(dimensionLabel)
        .attr("text-anchor", "end")
        .attr("font-size", 12)
        .attr("x", width - 45)
        .attr("y", height - 150)
    }
  }

  /**
   * Document selection.
   */
  map
    .on("topicselected", function (event) {
      const topic = event.detail.topic
      _topicSelected = topic
    })

  map.on("documenttargetted", function(event) {
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