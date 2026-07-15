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
    isAvailable: () => false,
  },
]

export default RECIPES
