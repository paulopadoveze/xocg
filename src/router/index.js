import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import RoomLobby from '../components/RoomLobby.vue'
import GameBoard from '../components/GameBoard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/room/:roomCode',
    name: 'RoomLobby',
    component: RoomLobby,
    props: true
  },
  {
    path: '/game/:roomCode',
    name: 'GameBoard',
    component: GameBoard,
    props: true,
    beforeEnter: async (to, from, next) => {
      // Optional: Add verification that user is in the game
      next()
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router