"use client";

import React, { useMemo } from "react";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { SankeyData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SankeyChartProps {
  data: SankeyData;
  width?: number;
  height?: number;
}

interface CustomSankeyNode {
  index?: number;
  name: string;
  color?: string;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
}

interface CustomSankeyLink {
  source: CustomSankeyNode;
  target: CustomSankeyNode;
  value: number;
  width?: number;
  y0?: number;
  y1?: number;
}

export function SankeyChart({ data, width = 780, height = 360 }: SankeyChartProps) {
  const { nodes, links } = useMemo<{
    nodes: CustomSankeyNode[];
    links: CustomSankeyLink[];
  }>(() => {
    if (!data.nodes.length || !data.links.length) {
      return { nodes: [], links: [] };
    }

    try {
      const sankeyGenerator = d3Sankey<CustomSankeyNode, CustomSankeyLink>()
        .nodeWidth(18)
        .nodePadding(18)
        .extent([
          [10, 10],
          [width - 120, height - 20],
        ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const graph = (sankeyGenerator as any)({
        nodes: data.nodes.map((d) => ({ ...d })),
        links: data.links.map((d) => ({ ...d })),
      });

      return {
        nodes: (graph.nodes || []) as CustomSankeyNode[],
        links: (graph.links || []) as CustomSankeyLink[],
      };
    } catch {
      return { nodes: [], links: [] };
    }
  }, [data, width, height]);

  if (!nodes.length || !links.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        Not enough transaction flow data to generate Sankey diagram.
      </div>
    );
  }

  const linkPath = sankeyLinkHorizontal();

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[650px] overflow-visible"
      >
        <defs>
          <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
          </linearGradient>
        </defs>

        {/* Links */}
        <g fill="none">
          {links.map((link: CustomSankeyLink, i: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const path = linkPath(link as any) || "";
            return (
              <path
                key={i}
                d={path}
                stroke="url(#linkGrad)"
                strokeWidth={Math.max(2, link.width || 1)}
                strokeOpacity={0.5}
                className="transition-all hover:stroke-opacity-80 hover:stroke-blue-500 cursor-pointer"
              >
                <title>
                  {`${link.source.name} → ${link.target.name}: ${formatCurrency(
                    link.value
                  )}`}
                </title>
              </path>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((node: CustomSankeyNode, i: number) => {
            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const nodeHeight = Math.max(y1 - y0, 4);
            const nodeColor = node.color || "#3B82F6";

            const isRightSide = x0 > width / 2;

            return (
              <g key={i} className="group cursor-pointer">
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={nodeHeight}
                  fill={nodeColor}
                  rx={3}
                  className="transition-transform group-hover:scale-105"
                >
                  <title>{`${node.name}: ${formatCurrency(node.value || 0)}`}</title>
                </rect>

                <text
                  x={isRightSide ? x1 + 8 : x0 - 8}
                  y={y0 + nodeHeight / 2}
                  dy="0.35em"
                  textAnchor={isRightSide ? "start" : "end"}
                  fontSize={11}
                  className="fill-slate-700 dark:fill-slate-300 font-medium select-none pointer-events-none"
                >
                  {node.name}
                  <tspan
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-normal"
                    dx={4}
                  >
                    ({formatCurrency(node.value || 0, { maximumFractionDigits: 0 })})
                  </tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
