/**
 * Child entity types
 */

export type ChildId = 'adam' | 'sami';

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
