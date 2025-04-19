import React, { Component } from "react";
import * as d3 from "d3";

class Chart extends Component {
  componentDidMount() {
    const {data} = this.props;

    const maxSum = d3.sum([
      d3.max(data, d => +d["GPT-4"]),
      d3.max(data, d => +d["Gemini"]),
      d3.max(data, d => +d["PaLM-2"]),
      d3.max(data, d => +d["Claude"]),
      d3.max(data, d => +d["LLaMA-3.1"]),
    ]);

    const minSum = d3.min([
        d3.min(data, d => +d["GPT-4"]),
        d3.min(data, d => +d["Gemini"]),
        d3.min(data, d => +d["PaLM-2"]),
        d3.min(data, d => +d["Claude"]),
        d3.min(data, d => +d["LLaMA-3.1"]),
        ]);

    console.log("Max Sum of Max Values:", maxSum);

    const margin = { top: 20, right: 20, bottom: 50, left: 50 },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleTime().domain(d3.extent(data, d => d["Date"])).range([0, width])
    //   yScale = d3.scaleLinear().domain([0, maxSum]).range([height, 0]);
        // yScale = d3.scaleLinear().domain([minSum, maxSum]).range([height, 0]);

    const colorScale = d3.scaleOrdinal().domain(["GPT-4", "Gemini", "PaLM-2","Claude","LLaMA-3.1"]).range(["#e41a1c", "#377eb8", "#4daf4a","#984ea3", "#ff7f00"]);

    // create stackGenerator
    var stackGenerator = d3.stack().keys(["GPT-4", "Gemini", "PaLM-2","Claude","LLaMA-3.1"]).offset(d3.stackOffsetWiggle) // specify the keys to stack
    var stackSeries = stackGenerator(data)

    const minY = d3.min(stackSeries, layer => d3.min(layer, d => d[0])); // first elemtnt in the array -> lowest height
    const maxY = d3.max(stackSeries, layer => d3.max(layer, d => d[1])); // second is the height

    const yScale = d3.scaleLinear()
    .domain([minY - 10, maxY]) // keep the diagram above the xaxis
    .range([height, 0]);

    console.log(stackSeries)

    // create areaGen
    var areaGen = d3.area().x(d => xScale(d.data["Date"])).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveCatmullRom); // d[0] and d[1] are the start and end of the area for each stack also curveCatmullRom is the smppth curve

    const svg = d3.select(".container").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
    const chartGroup = svg.selectAll(".chart-group").data([null]).join("g").attr("class", "chart-group").attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw areas
    chartGroup.selectAll(".myareachart")
    .data(stackSeries) // pass in the stack series
    .join("path") // create a path for each stack
    .attr("class", "myareachart") // for styling
    .attr("d", d=>{
      console.log(areaGen(d)) // d is each stack series
      return areaGen(d)
    }) // use the area generator
    .attr("fill", d=> colorScale(d.key))


    // Draw x-axis
    chartGroup.selectAll(".x-axis").data([null]).join("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));
    // Draw y-axis
    //chartGroup.selectAll(".y-axis").data([null]).join("g").attr("class", "y-axis").call(d3.axisLeft(yScale).ticks(5));

    // Draw Legend
    
  }

  render() {
    return <svg className="container"></svg>;
  }
}

export default Chart;