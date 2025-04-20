import React, { Component } from "react";
import "./App.css";
import FileUpload from "./FileUpload";
import * as d3 from 'd3';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data:[],
    };
    this.colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
  }
  componentDidMount(){
    this.renderChart();
  }
  componentDidUpdate(){
    this.renderChart();
    this.renderLegend();
  }
  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  }
  renderChart = () => {
    const margin = { left: 50, right: 150, top: 30, bottom: 40 };
    const width = 700, height = 400;

    const data = this.state.data;
    console.log("Data in render chart: ", data)
    if (!data || data.length === 0) return;
    const parseDate = d3.timeParse("%-m/%-d/%y");

    const parsedData = data.map(d => {
      const parsedDate = parseDate(d["Date"]);
      const entry = { date: parsedDate };

      Object.keys(d).forEach(key => {
        if (key !== "Date") {
          entry[key] = isNaN(+d[key]) ? 0 : +d[key];
        }
      });

      return entry;
    }).filter(d => d.date instanceof Date && !isNaN(d.date.getTime()));

    const keys = Object.keys(parsedData[0]).filter(k => k !== "date");

    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([margin.left, width - margin.right]);

    const stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);

    const stackedData = stack(parsedData);
    this.stackedKeys = stackedData.map(d => d.key);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(stackedData, layer => d3.min(layer, d=>d[0])), 
        d3.max(stackedData, layer => d3.max(layer, d=>d[1]))
      ])
      .range([height - margin.bottom - 10, margin.top]);
  
    const areaGenerator = d3.area()
      .x(d=> xScale(d.data.date))
      .y0(d=>yScale(d[0]))
      .y1(d=>yScale(d[1]))
      .curve(d3.curveCardinal);

    console.log("Sample stacked data", stackedData[0]?.[0]?.data);
    console.log("x", stackedData[0]?.map(d => d.data.date));
    console.log("y0", stackedData[0]?.map(d => d[0]));
    console.log("y1", stackedData[0]?.map(d => d[1]));

    d3.select('#chart-svg').selectAll('path').data(stackedData)
    .join('path')
    .style('fill', (d, i) => this.colors[i % this.colors.length])
    .attr('d', d=>areaGenerator(d))
    .on("mousemove", (event, layerData) => {
      const tooltip = d3.select("#tooltip");
      tooltip
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY + 15}px`)
        .style("display", "block");
    
      this.renderTooltipBarChart(layerData, layerData.key);
    })
    .on("mouseleave", () => {
      d3.select("#tooltip").style("display", "none");
    });    

    d3.select('#chart-svg').append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%b")));
  };
  
  renderLegend = () => {
    const data = this.state.data;
    if(!data || data.length === 0) return;
    
    const keys = Object.keys(data[0]).filter(k => k!== "Date");

    const chartSvg = d3.select("#chart-svg");
  
    const legend = chartSvg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(560, 30)");
  
    keys.forEach((key, i)=>{
      const group = legend.append("g")
      .attr("transform",`translate(0,${i*20})`);
      group.append("rect")
      .attr("width",10).attr("height",10)
      .attr("fill",this.colors[i % this.colors.length]);
      group.append("text")
      .attr("x",15).attr("y",10)
      .style("font-size","12px")
      .text(key);
    });
  }
  renderTooltipBarChart = (layerData, modelKey) => {
    const svg = d3.select("#tooltip-barchart");
    svg.selectAll("*").remove();
  
    const barData = layerData.map(d => ({
      date: d.data.date,
      value: d.data[modelKey]
    }));
  
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
  
    const x = d3.scaleBand()
      .domain(barData.map(d => d3.timeFormat("%b")(d.date)))
      .range([margin.left, width - margin.right])
      .padding(0.2);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.value)])
      .range([height - margin.bottom, margin.top]);
  
    svg.append("g")
      .selectAll("rect")
      .data(barData)
      .join("rect")
      .attr("x", d => x(d3.timeFormat("%b")(d.date)))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d.value))
      .attr("fill", () => {
        const index = this.stackedKeys.indexOf(modelKey);
        return this.colors[index % this.colors.length];
      });
  
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(3));
  };   
  
  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data}></FileUpload>
        <div className="parent">
          <div className="child1 item"> 
            <svg id="chart-svg" width="700" height="400"></svg>
            <div
              id="tooltip"
              style={{
                position: "absolute",
                pointerEvents: "none",
                background: "white",
                border: "1px solid #ccc",
                padding: "10px",
                display: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                zIndex: 10
              }}
              >
              <svg id="tooltip-barchart" width="220" height="120"></svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
