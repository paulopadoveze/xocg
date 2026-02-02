import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // Game state
  const gameState = ref(null)
  const isLoading = ref(false)
  const error = ref('')
  
  // Current game info
  const roomCode = ref('')
  const players = ref([])
  const currentTurnPlayerId = ref('')
  const turnNumber = ref(1)
  
  // Computed
  const currentPlayer = computed(() => {
    const playerStore = usePlayerStore()
    return players.value.find(p => p.id === playerStore.id) || null
  })
  
  const isPlayerTurn = computed(() => {
    return currentPlayer.value?.id === currentTurnPlayerId.value
  })
  
  const currentTurnPlayer = computed(() => {
    return players.value.find(p => p.id === currentTurnPlayerId.value) || null
  })
  
  // Actions
  function setGameState(state) {
    gameState.value = state
    roomCode.value = state?.roomCode || ''
    players.value = state?.players || []
    currentTurnPlayerId.value = state?.currentTurnPlayerId || ''
    turnNumber.value = state?.turnNumber || 1
  }
  
  function clearGame() {
    gameState.value = null
    roomCode.value = ''
    players.value = []
    currentTurnPlayerId.value = ''
    turnNumber.value = 1
    isLoading.value = false
    error.value = ''
  }
  
  function setLoading(loading) {
    isLoading.value = loading
  }
  
  function setError(errorMsg) {
    error.value = errorMsg
  }
  
  function updatePlayer(playerId, updates) {
    const index = players.value.findIndex(p => p.id === playerId)
    if (index !== -1) {
      players.value[index] = { ...players.value[index], ...updates }
    }
  }
  
  return {
    // State
    gameState,
    isLoading,
    error,
    roomCode,
    players,
    currentTurnPlayerId,
    turnNumber,
    
    // Computed
    currentPlayer,
    isPlayerTurn,
    currentTurnPlayer,
    
    // Actions
    setGameState,
    clearGame,
    setLoading,
    setError,
    updatePlayer
  }
})