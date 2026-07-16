import { getXoaPlan } from 'utils'
import RecipeEasyVirt from './recipe-ev'
import RecipeKub from './recipe-kub'

const RECIPES = [
  {
    id: 'kubernetes',
    component: RecipeKub,
    isAvailable: () => true,
  },
  {
    id: 'easyvirt',
    component: RecipeEasyVirt,
    isAvailable: () => getXoaPlan() !== 'Community',
  },
]

export default RECIPES
