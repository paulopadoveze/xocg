<template>
  <div class="app">
    <LateralMenu 
      :current-room="currentRoom"
      :user="user"
      @logout="handleLogout"
    />

    <div class="app-main">
      <!-- Main Content -->
      <main class="app-content">
        <RouterView />
      </main>

      <!-- Global Notifications -->
      <div v-if="notification.show" class="app-notification">
        <div 
          class="app-notification__alert"
          :class="{
            'app-notification__alert--error': notification.type === 'error',
            'app-notification__alert--success': notification.type !== 'error'
          }"
        >
          {{ notification.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Header styles */
.app-header {
  flex-shrink: 0;
  position: fixed;
}

.app-nav {

  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-nav__container {
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .app-nav__container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-nav__container {
    padding: 0 2rem;
  }
}

.app-nav__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.app-nav__logo-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.app-nav__logo-text {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.app-nav__links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-nav__back-link {
  color: #4b5563;
  text-decoration: none;
  transition: color 0.2s;
}

.app-nav__back-link:hover {
  color: #2563eb;
}

.app-nav__room-info {
  background-color: #eff6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-nav__room-label {
  font-size: 0.875rem;
  color: #1d4ed8;
}

.app-nav__room-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #1d4ed8;
}

/* Main content area */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}

.app-content__container {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}

@media (min-width: 640px) {
  .app-content__container {
    padding: 2rem 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-content__container {
    padding: 2rem 2rem;
  }
}

/* Notifications */
.app-notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
}

.app-notification__alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid;
  font-weight: 500;
}

.app-notification__alert--error {
  background-color: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.app-notification__alert--success {
  background-color: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}
</style>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from './stores/playerStore.js'
import { useGameStore } from './stores/gameStore.js'
import LateralMenu from './components/layout/LateralMenu.vue'

const playerStore = usePlayerStore()
const gameStore = useGameStore()

const route = useRoute()

const playerId = ref()
const playerName = ref()

onMounted(() => {
  // Get or create player ID
  let savedPlayerId = localStorage.getItem('playerId')
  
  if (!savedPlayerId) {
    savedPlayerId = uuidv4()
    localStorage.setItem('playerId', savedPlayerId)
  }
  
  playerId.value = savedPlayerId
  
  // Restore or create player name
  const savedName = localStorage.getItem('playerName')
  if (savedName) {
    playerName.value = savedName
  } else {
    playerName.value = `Player ${Math.floor(Math.random() * 900 + 100)}`
  }
})


const notification = ref({
  show: false,
  message: '',
  type: 'info'
})

// Get current room from route
const currentRoom = computed(() => {
  if (route.params.roomCode) {
    return route.params.roomCode
  }
  return null
})

// Watch for route changes to show notifications
watch(route, (to, from) => {
  // Show notification when leaving game
  if (from.name === 'GameBoard' && to.name === 'Home') {
    showNotification('Left the game room', 'info')
  }
})

function showNotification(message, type = 'info') {
  notification.value = {
    show: true,
    message,
    type
  }
  
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}
</script>

<style>

.headerNav {
  background: rgba(0,0,0,.4);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
}

/* Smooth transitions */
.router-view-enter-active,
.router-view-leave-active {
  transition: opacity 0.3s ease;
}

.router-view-enter-from,
.router-view-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>