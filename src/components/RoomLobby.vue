<template>
  <div class="room-container">
    {{playerStore}}
    <p>adminId: {{adminId}}</p>
    <div v-if="loading" class="room-loading">Carregando...</div>
    <div v-else-if="error" class="room-error">
      <p class="room-error__message">{{ error }}</p>
      <button 
        @click="$router.push('/')"
        class="room-error__back-button"
      >
        Voltar
      </button>
    </div>

    <div v-else class="room-content">
      <div class="room-header">
        <h1 class="room-header__title">Sala: {{ roomCode }}</h1>
        <div class="room-header__player-count">
          Players: {{ players.length }}/{{ maxPlayers }}
        </div>
      </div>

      <div class="room-players">
        <h2 class="room-players__title">Players in Room</h2>
        
        <div class="room-players__list">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="room-players__item"
          >
            <div class="room-players__info">
              <div class="room-players__avatar">
                {{ player.player_name?.charAt(0) || '?' }}
              </div>
              <span class="room-players__name">{{ player.player_name }}</span>
              <span 
                v-if="player.player_id === adminId " 
                class="room-players__admin-badge"
              >
                Admin
              </span>
            </div>
            
            <button 
              v-if="isAdmin && player.player_id !== adminId"
              @click="kickPlayer(player.player_id)"
              class="room-players__kick-button"
            >
              Remover
            </button>
          </div>
        </div>
      </div>

      <div class="room-actions">
        <button 
          v-if="isAdmin"
          @click="startGame"
          :disabled="players.length < 2"
          class="room-actions__button room-actions__button--start"
          :class="{'room-actions__button--disabled': players.length < 2}"
        >
          Start Game
        </button>
        
        <button 
          v-if="isAdmin"
          @click="closeRoom"
          class="room-actions__button room-actions__button--close"
        >
          Close Room
        </button>
        
        <button 
          @click="leaveRoom"
          class="room-actions__button room-actions__button--leave"
        >
          Leave Room
        </button>
      </div>

      <div class="room-share">
        <p class="room-share__text">
          Share this room code with others: <strong class="room-share__code">{{ roomCode }}</strong>
        </p>
        <p class="room-share__text">
          Or share the URL: {{ windowLocation }}/room/{{ roomCode }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/playerStore.js'
import { useRealtimeStore } from '../stores/realtimeStore.js'
import { useSupabase } from '../composables/useSupabase'
import { storeToRefs } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  roomCode: String
})

const router = useRouter()
const { 
  getRoom, 
  updateRoomStatus, 
  deleteRoom, 
  joinRoom: joinRoomApi, 
  leaveRoom: leaveRoomApi,
  kickPlayer: kickPlayerApi,
  getRoomPlayers,
  subscribeToRoom,
} = useSupabase()

const playerStore = usePlayerStore()
const realtimeStore = useRealtimeStore()

const emit = defineEmits(['game-started', 'room-closed'])

// Use storeToRefs to maintain reactivity
const { id: userId, name: playerName } = storeToRefs(playerStore)

const loading = ref(true)
const error = ref('')
const roomData = ref([])
const players = ref([])

// State - Remove duplicate userId and playerName
const maxPlayers = ref(4)
const adminId = ref(null)
const windowLocation = window.location.origin
const subscription = ref(null)
const startingGame = ref(false)

// Add a computed property to check if current player is admin
const isAdmin = computed(() => {
  if (!roomData.value || !players.value.length) return false

  console.log('isAdmin', roomData.value, players.value)
  const player = players.value.find(p => p.player_id === userId.value)

  return player ? player.is_admin : false
})

// Remove the localStorage setup in onMounted - store already handles it
onMounted(async () => {

  await loadRoom()

  if (roomData.value?.id) {
    setupRealtimeUpdates()
    joinRoom()
  }

})

onUnmounted(() => {
  if (roomData.value?.id) {
    realtimeStore.cleanupSubscription(`room-${roomData.value.id}`)
    realtimeStore.cleanupSubscription(`room-status-${roomData.value.id}`)
  }
})

async function loadRoom() {
  loading.value = true
  try {
    const room = await getRoom(props.roomCode)
    
    if (!room) {
      error.value = 'Room not found'
      return
    }
    
    roomData.value = room

    console.log('room rromm', room)
    players.value = room.players || []
    adminId.value = room.created_by


    const isAlreadyInRoom = players.value.some(p => p.player_id === userId.value)
    if (!isAlreadyInRoom && room.status === 'playing') {
      error.value = 'Game has already started'
      return
    }
    
  } catch (err) {
    console.error('Error loading room:', err)
    error.value = 'Failed to load room'
  } finally {
    loading.value = false
  }
}

async function joinRoom() {
  // console.log('joinRoom() called with player:', {
  //   id: userId.value,
  //   name: playerName.value
  // })

  // Check if already in room using store ID

  await refreshPlayers()

  const alreadyJoined = players.value.some(p => p.player_id === userId.value)
  
  console.log('players on room', players.value, alreadyJoined)

  if (alreadyJoined) {
    //console.log('Player already in room, skipping join')
    return
  }

  try {
    await joinRoomApi(roomData.value.id, {
      player_id: userId.value,  // Use from store
      name: playerName.value,   // Use from store
      is_admin: players.value.length === 0 // First player is admin
    })
    
    // Update player store with room info
    playerStore.setRoom(
      props.roomCode, 
      players.value.length === 0 // isAdmin
    )
    
    await refreshPlayers()
    
  } catch (err) {
    console.error('Error joining room:', err)
    if (err.message?.includes('duplicate') || err.code === '23505') {
      await refreshPlayers()
    } else {
      error.value = 'Failed to join room'
    }
  }
}

async function refreshPlayers() {
  try {
    const roomPlayers = await getRoomPlayers(roomData.value.id)
    players.value = roomPlayers || []
    //console.log('👥 Players refreshed:', players.value.length)
    
    // Check if current player is still in room
    const currentPlayerInRoom = players.value.some(p => p.player_id === userId.value)
    if (!currentPlayerInRoom && roomData.value?.status !== 'waiting') {
      // Player was kicked or left
      playerStore.clearRoom()
      alert('You are no longer in this room')
      router.push('/')
    }
    
  } catch (err) {
    console.error('Error refreshing players:', err)
  }
}

function setupRealtimeUpdates() {
  //console.log('🔄 Setting up realtime updates for room')
  
  // Watch for player changes (join/leave/kick)
  realtimeStore.watchRoom(roomData.value.id, async (payload) => {
    //console.log('👥 Player update via realtime:', payload)
    
    await refreshPlayers()
    
    switch (payload.eventType) {
      case 'INSERT':
        //console.log(`🎉 ${payload.new.player_name} joined the room`)
        break
        
      case 'DELETE':
        //console.log(`👋 ${payload.old.player_name} left the room`)
        
        // Check if it was the current player
        if (payload.old.player_id === userId.value) {
          playerStore.clearRoom()
          alert('You have been removed from the room')
          router.push('/')
        }
        break
    }
  })
  
  // Watch for room status changes
  realtimeStore.watchRoomStatus(roomData.value.id, (payload) => {
    //console.log('🚪 Room status update:', payload)
    
    if (payload.new.status === 'playing') {
      // Check if current player is in the game
      const isPlayerInGame = players.value.some(p => p.player_id === userId.value)
      if (isPlayerInGame) {
        //console.log('🎮 Game started! Redirecting...')
        router.push(`/game/${props.roomCode}`)
      } else {
        //console.log('Game started but current player is not in it')
        playerStore.clearRoom()
        router.push('/')
      }
    }
  })
}

async function leaveRoom() {
  try {
    if (roomData.value) {
      await leaveRoomApi(roomData.value.id, userId.value)
    }
  } catch (err) {
    console.error('Error leaving room:', err)
  } finally {
    playerStore.clearRoom()
    localStorage.removeItem('currentRoom')
    emit('room-closed')
    router.push('/')
  }
}

async function kickPlayer(playerId) {
  if (!isAdmin.value) return
  
  try {
    await kickPlayerApi(roomData.value.id, playerId)
    await refreshPlayers()
  } catch (err) {
    console.error('Error kicking player:', err)
    alert('Failed to kick player')
  }
}

async function startGame() {
  // Only admin can start game
  if (!isAdmin.value) {
    alert('Only the room admin can start the game')
    return
  }
  
  if (players.value.length < 2) {
    alert('Need at least 2 players to start the game')
    return
  }
  
  if (!confirm('Start the game? This cannot be undone.')) return
  
  startingGame.value = true
  
  try {
    // Update room status to playing
    await updateRoomStatus(roomData.value.room_code, 'playing')
    
    // Initialize game state
    await initializeGameState()
    
    // Redirect to game board
    router.push(`/game/${props.roomCode}`)
    
  } catch (err) {
    console.error('Error starting game:', err)
    alert('Failed to start game')
  } finally {
    startingGame.value = false
  }
}

async function initializeGameState() {
  try {
    // Select random starting player
    const randomIndex = Math.floor(Math.random() * players.value.length)
    const startingPlayerId = players.value[randomIndex].player_id
    const startingPlayerName = players.value[randomIndex].player_name
    
    // Generate card IDs
    const mainCardIds = generateRandomIds(1, 100, 100)

    //console.log('Starting player ID:', startingPlayerId)
    
    // Create game state
    const gameState = {
      players: players.value.map((player, index) => ({
        id: player.player_id,
        name: player.player_name,
        hand: [],
        field: [],
        coins: 0,
        isTurn: player.player_id === startingPlayerId,
        playerIndex: index,
        stats: {
          cardsDrawn: 0,
          cardsPlayed: 0,
          turnsTaken: 0
        }
      })),
      currentTurn: randomIndex,
      currentTurnPlayerId: startingPlayerId,
      currentTurnPlayerName: startingPlayerName,
      decks: {
        main: {
          cardIds: mainCardIds,
          count: mainCardIds.length,
          metadata: {
            type: 'main',
            minId: 1,
            maxId: 100,
            shuffledAt: new Date().toISOString()
          }
        }
      },
      garbage: {
        cardIds: [],
        count: 0
      },
      arrows: [],
      logs: [{
        id: uuidv4(),
        message: `Game started! ${startingPlayerName} goes first.`,
        timestamp: new Date().toISOString(),
        type: 'system'
      }],
      turnHistory: [],
      startedAt: new Date().toISOString(),
      turnNumber: 1,
      gameVersion: '1.0'
    }
    
    // Draw initial cards
    drawInitialCards(gameState)
    
    // Save game state
    const { saveGameState } = useSupabase()
    await saveGameState(roomData.value.id, gameState)
    
  } catch (err) {
    console.error('Error initializing game state:', err)
    throw err
  }
}

function generateRandomIds(min, max, count) {
  const allIds = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const shuffled = [...allIds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function drawInitialCards(gameState) {
  gameState.players.forEach(player => {
    for (let i = 0; i < 5; i++) {
      if (gameState.decks.main.cardIds.length > 0) {
        const cardId = gameState.decks.main.cardIds.pop()
        player.hand.push(cardId)
        gameState.decks.main.count--
      }
    }
  })
}

async function closeRoom() {
  if (!isAdmin.value) return
  
  try {
    await deleteRoom(roomData.value.id)
    playerStore.clearRoom()
    localStorage.removeItem('currentRoom')
    emit('room-closed')
    router.push('/')
  } catch (err) {
    console.error('Error closing room:', err)
    alert('Failed to close room')
  }
}
</script>

<style scoped>
/* Main container */
.room-container {
  padding: 2rem;
  max-width: 64rem;
  margin: 0 auto;
}

/* Loading state */
.room-loading {
  text-align: center;
  padding: 2rem 0;
}

/* Error state */
.room-error {
  text-align: center;
  padding: 2rem 0;
}

.room-error__message {
  color: #ef4444;
  margin-bottom: 1rem;
}

.room-error__back-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.room-error__back-button:hover {
  background-color: #2563eb;
}

/* Room content */
.room-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.room-header__title {
  font-size: 1.875rem;
  font-weight: bold;
}

.room-header__player-count {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Players section */
.room-players {
}

.room-players__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.room-players__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.room-players__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}

.room-players__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.room-players__avatar {
  width: 2rem;
  height: 2rem;
  background-color: #dbeafe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.room-players__name {
  font-weight: 500;
}

.room-players__admin-badge {
  font-size: 0.75rem;
  background-color: rgba(255,255,255,0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.room-players__kick-button {
  color: #ef4444;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.room-players__kick-button:hover {
  color: #dc2626;
}

/* Actions */
.room-actions {
  display: flex;
  gap: 0.75rem;
}

.room-actions__button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.room-actions__button--start {
  background-color: #22c55e;
  color: white;
}

.room-actions__button--start:hover {
  background-color: #16a34a;
}

.room-actions__button--start.room-actions__button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-actions__button--start.room-actions__button--disabled:hover {
  background-color: #22c55e;
}

.room-actions__button--close {
  background-color: #ef4444;
  color: white;
}

.room-actions__button--close:hover {
  background-color: #dc2626;
}

.room-actions__button--leave {
  background-color: #d1d5db;
  color: #111827;
}

.room-actions__button--leave:hover {
  background-color: #9ca3af;
}

/* Share section */
.room-share {
  margin-top: 1.5rem;
}

.room-share__text {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.room-share__code {
  font-weight: bold;
}
</style>
