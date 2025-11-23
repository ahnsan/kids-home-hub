/**
 * Child entity types
 */

export type ChildId = string;

export interface Child {
  id: ChildId;
  name: string;
  avatar: string;
  moneyTotal: number;
  pointsTotal: number;
  screenTotal: number;
}

export interface ChildMetadata {
  money: number;
  points: number;
  screen: number;
}
