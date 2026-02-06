import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VisualizerProps {
  data: number[];
  highlights: number[];
  width?: number;
  height?: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ data, highlights, width = 600, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // We use the passed width/height as the coordinate system (viewBox),
    // but the actual display size is handled by CSS (width: 100%, height: 100%)
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand()
      .domain(d3.range(data.length).map(String))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(...data, 100)]) // Ensure some height even if small numbers
      .range([innerHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => xScale(String(i)) || 0)
      .attr("y", d => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d))
      .attr("fill", (d, i) => {
        if (highlights.includes(i)) return "#f59e0b"; // Highlight color (Amber)
        return "#3b82f6"; // Primary color (Blue)
      })
      .attr("rx", 4) // Rounded corners
      .attr("ry", 4);

    // Labels
    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .text(d => d)
      .attr("x", (d, i) => (xScale(String(i)) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .style("font-size", "12px")
      .style("font-family", "monospace");

    // X Axis (Indices)
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((i) => i))
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("fill", "#94a3b8");

  }, [data, highlights, width, height]);

  return (
    <div className="w-full h-full flex justify-center items-center p-4 bg-surface rounded-lg shadow-inner border border-secondary/20 overflow-hidden">
      <svg 
        ref={svgRef} 
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible" 
        style={{ maxHeight: '100%', maxWidth: '100%' }}
      />
    </div>
  );
};

export default Visualizer;