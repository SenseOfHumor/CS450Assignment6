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
        
        
        // tootltip
        const tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").attr("class", "tooltip")
        .style("opacity", 0).style("background-color", "white").style("position", "absolute")
        .style("border", "1px solid gray").style("border-radius", "5px").style("padding", "5px")

        tooltip.selectAll("svg") // for the barchart, appending a svg TODO: Change dimensions later
        .data([0])
        .join("svg")
        .attr("width", 250)
        .attr("height", 200);



    // Draw areas
    chartGroup.selectAll(".myareachart")
    .data(stackSeries) // pass in the stack series
    .join("path") // create a path for each stack
    .attr("class", "myareachart") // for styling
    .attr("d", d=>{
      console.log(areaGen(d)) // d is each stack series
      return areaGen(d)
    }) // use the area generator
    .attr("fill", d => colorScale(d.key))
    .on("mouseover", function(event, layerData) {
    tooltip.style("opacity", 1);
    })


    .on("mousemove", function(event, layerData) {
    tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`);
        

    // parse data
    const values = layerData.map(d => ({
        date: d.data["Date"],
        value: +d.data[layerData.key]
    }));



    // barchart
    const svg = tooltip.select("svg");
    svg.selectAll("*").remove(); //remove prev data if any
    const width = 250, height = 200, margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;


    const x = d3.scaleBand()    // width
        .domain(values.map(d => d.date))
        .range([0, innerWidth])
        .padding(0.1);
    const y = d3.scaleLinear()   // height
        .domain([0, d3.max(values, d => d.value)])
        .range([innerHeight, 0]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        

    g.selectAll("rect")
        .data(values)
        .join("rect")
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => innerHeight - y(d.value))
        // .attr("fill", "green");
        .attr("fill", colorScale(layerData.key));


    // axes
    // x
    g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b"))) // %b is month
        .selectAll("text")
        .attr("font-size", "8px");

    // y
    g.append("g")
        .call(d3.axisLeft(y).ticks())
        .selectAll("text")
        .attr("font-size", "8px");
    })


    .on("mouseleave", () => {
    tooltip.style("opacity", 0);
    });


    // Draw x-axis <- for the main chart 
    chartGroup.selectAll(".x-axis").data([null]).join("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));
    // Draw y-axis
    //chartGroup.selectAll(".y-axis").data([null]).join("g").attr("class", "y-axis").call(d3.axisLeft(yScale).ticks(5));

    // Draw Legend
    const legend = svg.append("g")
    .attr("class", "legend")
    // .attr("transform", `translate(${width + margin.left + 20}`);
    .attr("transform", `translate(${width + margin.left + 20}, ${margin.top+ 100})`);
    
    // iterate, append rect and text 
    colorScale.domain().forEach((model, i) => {
    const item = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

    item.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colorScale(model));
    item.append("text")
        .attr("x", 24)
        .attr("y", 13)
        .attr("font-size", "14px")
        .text(model);
    });


  }

  render() {
    return <svg className="container"></svg>;
  }
}

export default Chart;