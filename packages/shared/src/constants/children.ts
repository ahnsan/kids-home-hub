/**
 * Child constants
 */

import type { ChildId, Child } from '../types';

export const CHILDREN: readonly ChildId[] = ['adam', 'sami'] as const;

export const CHILD_DATA: Record<ChildId, Omit<Child, 'moneyTotal' | 'pointsTotal' | 'screenTotal'>> = {
  adam: {
    id: 'adam',
    name: 'Adam',
    avatar: 'https://m.media-amazon.com/images/I/61GlRO63gBL.__AC_SX300_SY300_QL70_ML2_.jpg'
  },
  sami: {
    id: 'sami',
    name: 'Sami',
    avatar: 'https://www.positivepromotions.com/images/1000/OSA-324.jpg'
  }
};
