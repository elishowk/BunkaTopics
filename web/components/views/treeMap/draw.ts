// @ts-nocheck



// D3 code.
import * as d3 from 'd3'

import { TreeMapProps } from './TreeMap'

export default function draw(elementId: string, props: TreeMapProps) {
  const {
    documents,
    topics,
    screenSize,
    selection,
    theme,
    setSelection
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

  var topicSelected: string | undefined
  rendered.on('topicselected', (e) => {
    topicSelected = e.detail.topicId
  })

  /**
   * SVG canvas group on which transforms apply.
   */
  const canvas = svg.append("g")
  let group = canvas

  const x = d3.scaleLinear().rangeRound([50, width-100])
  const y = d3.scaleLinear().rangeRound([50, height-100])

  const breadcrumbs = d => d.ancestors().reverse().map(d => d.data.name).join("/")

  function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
      child.x0 = x0 + child.x0 / width * (x1 - x0);
      child.x1 = x0 + child.x1 / width * (x1 - x0);
      child.y0 = y0 + child.y0 / height * (y1 - y0);
      child.y1 = y0 + child.y1 / height * (y1 - y0);
    }
  }

  const treemap = data => d3.treemap()
    .tile(tile)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

  function wrap(text) {
    text.each(function() {
      const datum = d3.select(this).datum()
      const _width = x(datum.x1) - x(datum.x0)
      var that = d3.select(this),
          lineNumber = 0,
          lineHeight = 1.1,
          deltaY = 1.5,
          _text = datum.data.name,
          words = _text.split(/\s+/).reverse(),
          word,
          wordCount = 0,
          line = [],
          y = that.attr("y") ?? 0,
          tspan = that.text("").append("tspan").attr("x", 5).attr("y", y).attr("dy", `${deltaY}em`)
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(" "))
        if ((tspan.node().getComputedTextLength() > (_width - 10)) && wordCount > 0) {
          line.pop()
          tspan.text(line.join(" "))
          line = [word]
          tspan = that
            .append("tspan")
            .attr("x", 5)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + deltaY + "em")
            .text(word)
        }
        ++wordCount
      }
    })
  }

  function render(group, root) {
    function uid (type: string) {
      return {
        id: `${type}-${Math.round(Math.random() * 100000)}`
      }
    }
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g")
      .attr("class", "block")

    node.filter(d => d === root ? d.parent : d.children)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => d === root ? zoomout(root) : zoomin(d))

    node.append("title")
      .text(d => `${breadcrumbs(d)}\n${d.data.count} documents`)

    const leaf = node.append("rect")
      .attr("id", d => (d.leafUid = uid("leaf")).id)
      .attr("fill", d => d === root
        ? "#fff"
        : d.children
          ? "#ccc"
          : "#ddd")
      .attr("stroke", d => d === root ? "inherit" : "#fff")
      .on('click', (event, d) => {
        if (!d.children) {
          setSelection(d.data.id?.toString())
        }
      })

    node.append("clipPath")
      .attr("id", d => (d.clipUid = uid("clip")).id)
      .append("use")
      .attr("xlink:href", d => d.leafUid.href)

    const label = node.append("g")
      .attr("class", "blockLabel")
      .attr("clip-path", d => d.clipUid.id)
      .attr("id", d => (d.labelUid = uid("label")).id)
      .append('text')
      .attr("transform", d => d === root ? "translate(0, 30)" : null)
    
    label.append("tspan")
      .attr("class", "blockLabelText")
      .attr("fill", d => d === root && theme?.palette.mode === "dark" ? "white" : "black")
      .attr("dy", "1.2em")
      .text(d => d.data.name)
      .call(wrap)
    
    label.append("tspan")
      .attr("class", "blockLabelNumber")
      .attr("fill", d => d === root && theme?.palette.mode === "dark" ? "white" : "black")
      .attr("x", 5)
      .attr("dy", "1.8em")
      .text(d => d.data.territory)

    group.call(position, root)
  }

  function position(group, root) {
    group.selectAll("g.block")
      .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
      .select("rect")
        .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
        .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0))

    group.selectAll("g.block")
      .select('.blockLabelText')
      .call(wrap)
  }

  function dispatchTopicSelection(_: d3.Selection, topicId?: string) {
    // Dispatch custom event.
    rendered.dispatch<HTMLElement, { topicId?: string }>('topicselected', { detail: {
      topicId
    }})
    props.setSelection?.(topicId)
  } 

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none")
    const group1 = group = svg.append("g").call(render, d)

    x.domain([d.x0, d.x1])
    y.domain([d.y0, d.y1])

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .call(position, d.parent))
        .call(t => group1.transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d))
        .call(dispatchTopicSelection, d.data.id.toString())
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none")
    const group1 = group = svg.insert("g", "*").call(render, d.parent)

    x.domain([d.parent.x0, d.parent.x1])
    y.domain([d.parent.y0, d.parent.y1])

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d))
        .call(t => group1.transition(t)
          .call(position, d.parent))
        .call(dispatchTopicSelection, d.parent.data.id?.toString())
  }

  const topicsFiltered = topics?.filter(topic => topic.parent_topic_id == null) ?? []
  const data = {
    name: "All",
    id: undefined,
    count: documents.length,
    territory: '100%',
    children: topicsFiltered.length > 0
      ? topicsFiltered
          .map(topic => {
            const subtopics = topics?.filter(subtopic => subtopic.parent_topic_id === topic.id)
              .map(subtopic => ({
                name: subtopic.explanation.name,
                id: subtopic.id,
                value: subtopic.size,
                count: subtopic.size,
                territory: `${Math.round(subtopic.percent * 100 * 10) / 10.0}%`
              }))
              .filter(st => st.value > 0)
              ?? []
            return ({
              name: topic.explanation.name,
              id: topic.id,
              value: topic.size,
              children: subtopics.length > 0 ? subtopics : undefined,
              count: topic.size,
              territory: `${Math.round(topic.percent * 100 * 10) / 10.0}%`
            })
          })
          // .filter(topic => topic.children.length > 0)
      : undefined
  }

  canvas.call(render, treemap(data))
}
