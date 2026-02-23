'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';
import * as d3 from 'd3';
import { ChartFilterState } from '@/app/actions/company';
import { getBubbleChartData, CompanyNode } from '@/data/dummyHierarchy';

interface CompanyBubbleChartProps {
  filters: ChartFilterState;
}

const parseRevenue = (rev: string | undefined): number => {
  if (!rev) return 0;
  const num = parseFloat(rev.replace(/[^0-9.]/g, ''));
  if (rev.includes('B')) return num * 1000000000;
  if (rev.includes('M')) return num * 1000000;
  if (rev.includes('K')) return num * 1000;
  return num;
};

// 🌟🌟🌟 修复后的筛选逻辑 🌟🌟🌟
const filterHierarchy = (node: CompanyNode, filters: ChartFilterState): CompanyNode | null => {
  let isMatch = true;

  if (node.level !== 'Root') {
    // 1. Level 筛选
    const levelNum = parseInt(node.level.replace('Level ', ''));
    if (filters.levels.length > 0 && !isNaN(levelNum) && !filters.levels.includes(levelNum)) {
      isMatch = false;
    }

    // 2. 地理/数值筛选
    if (filters.countries.length > 0 && node.country && !filters.countries.includes(node.country)) isMatch = false;
    if (filters.cities.length > 0 && node.city && !filters.cities.includes(node.city)) isMatch = false;
    if (node.foundedYear) {
      if (filters.foundedYear.start && node.foundedYear < parseInt(filters.foundedYear.start)) isMatch = false;
      if (filters.foundedYear.end && node.foundedYear > parseInt(filters.foundedYear.end)) isMatch = false;
    }
    if (node.employees) {
      if (filters.employees.min && node.employees < parseInt(filters.employees.min)) isMatch = false;
      if (filters.employees.max && node.employees > parseInt(filters.employees.max)) isMatch = false;
    }
    if (node.revenue) {
      const revVal = parseRevenue(node.revenue);
      if (filters.annualRevenue.min && revVal < parseInt(filters.annualRevenue.min)) isMatch = false;
      if (filters.annualRevenue.max && revVal > parseInt(filters.annualRevenue.max)) isMatch = false;
    }
  }

  let filteredChildren: CompanyNode[] = [];
  if (node.children) {
    filteredChildren = node.children
      .map(child => filterHierarchy(child, filters))
      .filter((child): child is CompanyNode => child !== null);
  }

  if (isMatch) {
    const hasChildren = filteredChildren.length > 0;
    // 关键修复：如果变成了叶子节点且没有 value，手动注入 value
    let nodeValue = node.value;
    if (!hasChildren && !nodeValue) {
        nodeValue = parseRevenue(node.revenue) || 1000; 
    }

    return {
      ...node,
      children: hasChildren ? filteredChildren : undefined,
      value: nodeValue
    };
  }

  if (filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren
    };
  }

  return null;
};

export default function CompanyBubbleChart({ filters }: CompanyBubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: CompanyNode | null;
  }>({ visible: false, x: 0, y: 0, data: null });

  const colors = {
    rootBg: '#efebe9',     
    rootCircle: '#ffffff', 
    level1: '#8d6e63',     
    level2: '#a1887f',     
    level3: '#bcaaa4',     
    leaf: '#558b2f',       
    hover: '#ffcc80',      
    textLight: '#ffffff',  
    textDark: '#3e2723',   
  };

  const colorScale = d3.scaleOrdinal()
    .domain(['Level 1', 'Level 2', 'Level 3', 'Level 4'])
    .range([colors.level1, colors.level2, colors.level3, colors.leaf]);

  const renderChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const rawData = getBubbleChartData();
    const data = filterHierarchy(rawData, filters);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!data) {
        svg.append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").attr("fill", "#999").text("No matching data");
        return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = 550; // 统一高度
    
    const pack = d3.pack<CompanyNode>()
        .size([width, height])
        .padding(2); 

    const root = d3.hierarchy<CompanyNode>(data)
        .sum(d => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const rootNode = pack(root);
    let focus = rootNode;
    let view: [number, number, number];

    svg
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("cursor", "pointer")
        .style("background", colors.rootBg)
        .on("click", (event) => zoom(event, rootNode));

    const node = svg.append("g")
        .selectAll("circle")
        .data(rootNode.descendants())
        .join("circle")
        .attr("fill", d => d.depth === 0 ? colors.rootCircle : (d.children ? (colorScale(d.data.level) as string) : colors.leaf))
        .attr("fill-opacity", d => d.depth === 0 ? 0 : (d.children ? 0.85 : 1))
        .attr("stroke", d => d.depth === 0 ? null : "#fff")
        .attr("stroke-width", d => d.depth === 0 ? 0 : 1.5)
        .on("mouseover", function(event, d) {
            if (d.depth === 0) return;
            d3.select(this).attr("stroke", colors.hover).attr("stroke-width", 3);
            setTooltip({
                visible: true,
                x: event.clientX + 20,
                y: event.clientY + 20,
                data: d.data
            });
        })
        .on("mousemove", function(event) {
            setTooltip(prev => ({ ...prev, x: event.clientX + 20, y: event.clientY + 20 }));
        })
        .on("mouseout", function(event, d) {
            if (d.depth === 0) return;
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
            setTooltip(prev => ({ ...prev, visible: false }));
        })
        .on("click", (event, d) => {
            if (focus !== d) {
                zoom(event, d);
                event.stopPropagation();
            }
        });

    const label = svg.append("g")
        .style("font", "12px sans-serif")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(rootNode.descendants())
        .join("text")
        .style("fill", colors.textDark)
        .style("fill-opacity", 1)
        .style("display", "none")
        .style("text-shadow", "0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff")
        .text(d => d.data.name);

    zoomTo([rootNode.x, rootNode.y, rootNode.r * 2]);

    function zoomTo(v: [number, number, number]) {
        const minDim = Math.min(width, height);
        const k = (minDim - 20) / v[2];
        view = v;

        const labelTransform = (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k - (d.r * k) + 15})`;
        const circleTransform = (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`;

        label.attr("transform", labelTransform);
        node.attr("transform", circleTransform);
        node.attr("r", d => d.r * k);
        
        label.style("display", d => {
            if (d === focus) return "none";
            // 优化：Level 1 的标签总是显示（除非是 focus）
            if (d.depth === 1) return "inline"; 
            if (d.parent === focus) return "inline";
            if (d.depth === focus.depth + 1) return "inline";
            return "none";
        });
        
        label.style("opacity", d => (d.r * k > 20) ? 1 : 0);
    }

    function zoom(event: any, d: d3.HierarchyCircularNode<CompanyNode>) {
        const focus0 = focus;
        focus = d;

        const transition = svg.transition()
            .duration(750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });
    }

  }, [filters]);

  useEffect(() => {
    // 延迟渲染避免布局闪烁
    const timer = setTimeout(() => {
        renderChart();
    }, 100);
    window.addEventListener('resize', renderChart);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', renderChart);
    };
  }, [renderChart]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: 550, position: 'relative', overflow: 'hidden', borderRadius: 3, bgcolor: colors.rootBg }}>
        <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
        
        <Fade in={tooltip.visible}>
            <Paper elevation={6} sx={{ position: 'fixed', left: tooltip.x, top: tooltip.y, pointerEvents: 'none', p: 2, zIndex: 9999, minWidth: 200, maxWidth: 300, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: `1px solid ${colors.level1}`, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                {tooltip.data && (
                    <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: colors.textDark, mb: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>{tooltip.data.name}</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.85rem' }}>
                            <Typography variant="caption" color="text.secondary">Level</Typography><Typography variant="body2" fontWeight="bold" color={colors.level1}>{tooltip.data.level}</Typography>
                            <Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2" fontWeight="bold">{tooltip.data.country}, {tooltip.data.city}</Typography>
                            <Typography variant="caption" color="text.secondary">Revenue</Typography><Typography variant="body2" fontWeight="bold">{tooltip.data.revenue}</Typography>
                            <Typography variant="caption" color="text.secondary">Employees</Typography><Typography variant="body2" fontWeight="bold">{tooltip.data.employees?.toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">Founded</Typography><Typography variant="body2" fontWeight="bold">{tooltip.data.foundedYear}</Typography>
                        </Box>
                    </>
                )}
            </Paper>
        </Fade>
        
        <Typography variant="caption" sx={{ position: 'absolute', bottom: 16, right: 24, color: colors.level2, pointerEvents: 'none', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>● Scroll / Click to Zoom</Typography>
    </Box>
  );
}