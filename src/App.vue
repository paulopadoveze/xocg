<template>
  <div class="app">
    <LateralMenu 
      :current-room="currentRoom"
      :user="user"
      @logout="handleLogout"
    />
    <div class="main">
      <main class="mainContent">
        <RouterView />
      </main>

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



.app-header {
  flex-shrink: 0;
  position: fixed;
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