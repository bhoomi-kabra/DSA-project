/**
 * HeroGraph.jsx — Abstract CSS/SVG network illustration for the Hero section.
 * Pure CSS/SVG, no external assets required.
 */
export default function HeroGraph() {
  // Node positions [cx, cy]
  const nodes = [
    { id: 'a', x: 24,  y: 22,  status: 'done'     },
    { id: 'b', x: 96,  y: 10,  status: 'done'     },
    { id: 'c', x: 150, y: 40,  status: 'active'   },
    { id: 'd', x: 24,  y: 80,  status: 'done'     },
    { id: 'e', x: 90,  y: 100, status: 'active'   },
    { id: 'f', x: 155, y: 115, status: 'locked'   },
    { id: 'g', x: 70,  y: 55,  status: 'done'     },
  ];

  const edges = [
    ['a', 'g'], ['b', 'g'], ['d', 'g'],
    ['g', 'c'], ['g', 'e'],
    ['c', 'f'], ['e', 'f'],
  ];

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  const statusColors = {
    done:   '#52D9A4',
    active: '#8B7CFF',
    locked: '#55617A',
  };

  return (
    <svg
      viewBox="0 0 180 140"
      width="180"
      height="140"
      aria-hidden="true"
      role="img"
    >
      {/* Edges */}
      {edges.map(([s, t], i) => {
        const src = nodeById[s];
        const tgt = nodeById[t];
        return (
          <line
            key={i}
            x1={src.x} y1={src.y}
            x2={tgt.x} y2={tgt.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          {/* glow for active */}
          {n.status === 'active' && (
            <circle
              cx={n.x} cy={n.y} r="9"
              fill={statusColors[n.status]}
              opacity="0.15"
            />
          )}
          <circle
            cx={n.x} cy={n.y} r="5"
            fill={statusColors[n.status]}
            opacity={n.status === 'locked' ? 0.4 : 0.9}
          />
          {/* inner dot for active */}
          {n.status === 'active' && (
            <circle cx={n.x} cy={n.y} r="2.2" fill="white" opacity="0.8" />
          )}
        </g>
      ))}

      {/* Labels for key nodes */}
      <text x="18"  y="36"  fill="rgba(255,255,255,0.28)" fontSize="6" fontFamily="Inter,sans-serif">Intro</text>
      <text x="62"  y="49"  fill="rgba(255,255,255,0.28)" fontSize="6" fontFamily="Inter,sans-serif">Core</text>
      <text x="138" y="33"  fill="rgba(139,124,255,0.7)"  fontSize="6" fontFamily="Inter,sans-serif">Adv.</text>
      <text x="140" y="130" fill="rgba(255,255,255,0.18)" fontSize="6" fontFamily="Inter,sans-serif">Goal</text>
    </svg>
  );
}
