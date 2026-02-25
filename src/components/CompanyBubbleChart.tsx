'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';
import * as d3 from 'd3';

export default function CompanyBubbleChart({ treeData }: { treeData: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: any }>({ visible: false, x: 0, y: 0, data: null });

  const colors = { rootBg: '#efebe9', rootCircle: '#ffffff', level1: '#8d6e63', level2: '#a1887f', level3: '#bcaaa4', leaf: '#558b2f', hover: '#ffcc80', textDark: '#3e2723' };
  const colorScale = d3.scaleOrdinal().domain(['Level 1', 'Level 2', 'Level 3', 'Level 4']).range([colors.level1, colors.level2, colors.level3, colors.leaf]);

  const renderChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = 550; 
    
    const pack = d3.pack().size([width, height]).padding(2); 
    // 👉 修复1：加上 <any> 泛型，解决 unknown 报错
    const root = d3.hierarchy<any>(treeData).sum((d: any) => d.value || 0).sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    const rootNode = pack(root as any);
    let focus = rootNode;
    let view: [number, number, number];

    svg.attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
       .style("display", "block").style("cursor", "pointer").style("background", colors.rootBg)
       .on("click", (event) => zoom(event, rootNode));

    // 👉 修复2：所有回调函数里的 d 都显式声明为 (d: any)
    const node = svg.append("g").selectAll("circle").data(rootNode.descendants()).join("circle")
        .attr("fill", (d: any) => d.depth === 0 ? colors.rootCircle : (d.children ? (colorScale(d.data.level) as string) : colors.leaf))
        .attr("fill-opacity", (d: any) => d.depth === 0 ? 0 : (d.children ? 0.85 : 1))
        .attr("stroke", (d: any) => d.depth === 0 ? null : "#fff")
        .attr("stroke-width", (d: any) => d.depth === 0 ? 0 : 1.5)
        .on("mouseover", function(event, d: any) {
            if (d.depth === 0) return;
            d3.select(this).attr("stroke", colors.hover).attr("stroke-width", 3);
            setTooltip({ visible: true, x: event.clientX + 20, y: event.clientY + 20, data: d.data });
        })
        .on("mousemove", (event) => setTooltip(prev => ({ ...prev, x: event.clientX + 20, y: event.clientY + 20 })))
        .on("mouseout", function(event, d: any) {
            if (d.depth === 0) return;
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
            setTooltip(prev => ({ ...prev, visible: false }));
        })
        .on("click", (event, d: any) => { if (focus !== d) { zoom(event, d); event.stopPropagation(); } });

    const label = svg.append("g").style("font", "12px sans-serif").style("font-weight", "bold").style("pointer-events", "none")
        .attr("text-anchor", "middle").selectAll("text").data(rootNode.descendants()).join("text")
        .style("fill", colors.textDark).style("fill-opacity", 1).style("display", "none").style("text-shadow", "0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff")
        .text((d: any) => d.data.name);

    zoomTo([rootNode.x, rootNode.y, rootNode.r * 2]);

    function zoomTo(v: [number, number, number]) {
        const k = (Math.min(width, height) - 20) / v[2]; view = v;
        label.attr("transform", (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k - (d.r * k) + 15})`);
        node.attr("transform", (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`).attr("r", (d: any) => d.r * k);
        label.style("display", (d: any) => (d === focus ? "none" : (d.depth === 1 || d.parent === focus || d.depth === focus.depth + 1) ? "inline" : "none"));
        label.style("opacity", (d: any) => (d.r * k > 20) ? 1 : 0);
    }
    function zoom(event: any, d: any) { focus = d; svg.transition().duration(750).tween("zoom", d => { const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); return t => zoomTo(i(t)); }); }
  }, [treeData]);

  useEffect(() => { const timer = setTimeout(renderChart, 100); window.addEventListener('resize', renderChart); return () => { clearTimeout(timer); window.removeEventListener('resize', renderChart); }; }, [renderChart]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: 550, position: 'relative', overflow: 'hidden', borderRadius: 3, bgcolor: colors.rootBg }}>
        <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
        <Fade in={tooltip.visible}>
            <Paper elevation={6} sx={{ position: 'fixed', left: tooltip.x, top: tooltip.y, pointerEvents: 'none', p: 2, zIndex: 9999, minWidth: 200, maxWidth: 300, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: `1px solid ${colors.level1}`, borderRadius: 3 }}>
                {tooltip.data && (
                    <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: colors.textDark, mb: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>{tooltip.data.name}</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.85rem' }}>
                            <Typography variant="caption" color="text.secondary">Level</Typography><Typography variant="body2" fontWeight="bold" color={colors.level1}>{tooltip.data.level}</Typography>
                            <Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2" fontWeight="bold">{tooltip.data.country}, {tooltip.data.city}</Typography>
                            <Typography variant="caption" color="text.secondary">Revenue</Typography><Typography variant="body2" fontWeight="bold">¥{tooltip.data.revenue?.toLocaleString()}</Typography>
                        </Box>
                    </>
                )}
            </Paper>
        </Fade>
    </Box>
  );
}