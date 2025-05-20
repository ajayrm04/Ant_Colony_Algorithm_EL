export enum NodeType {
  ROUTER = 'router',
  DEVICE = 'device',
}

export interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  type: NodeType;
}

export interface Edge {
  source: number;
  target: number;
  weight: number;
}

export interface AntPosition {
  from: number;
  to: number;
  progress: number;
  x: number;
  y: number;
}
