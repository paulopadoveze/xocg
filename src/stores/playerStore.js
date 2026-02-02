import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const usePlayerStore = defineStore('player', () => {
  // State
  const id = ref('')
  const name = ref('')
  const currentRoom = ref('')
  const isAdmin = ref(false)
  const recentRooms = ref([])

  // Getters (computed properties)
  const isAuthenticated = computed(() => !!id.value)
  const playerInfo = computed(() => ({
    id: id.value,
    name: name.value,
    room: currentRoom.value,
    isAdmin: isAdmin.value
  }))

  // Actions
  function initializePlayer() {
    // Try to load from localStorage first
    const savedId = localStorage.getItem('playerId')
    const savedName = localStorage.getItem('playerName')

    console.log('savedid', savedId)
    
    if (savedId) {
      id.value = savedId
    } else {
      id.value = uuidv4()
      localStorage.setItem('playerId', id.value)
    }
    
    if (savedName) {
      name.value = savedName
    } else {
      name.value = `Player ${Math.floor(Math.random() * 900 + 100)}`
      localStorage.setItem('playerName', name.value)
    }
    
    // Load recent rooms
    const savedRooms = localStorage.getItem('recentRooms')
    if (savedRooms) {
      recentRooms.value = JSON.parse(savedRooms)
    }
  }

  function setName(newName) {
    name.value = newName
    localStorage.setItem('playerName', newName)
  }

  function setRoom(roomCode, isRoomAdmin = false) {
    currentRoom.value = roomCode
    isAdmin.value = isRoomAdmin
    
    // Add to recent rooms
    addRecentRoom(roomCode)
  }

  function clearRoom() {
    currentRoom.value = ''
    isAdmin.value = false
  }

  function addRecentRoom(roomCode) {
    const existingIndex = recentRooms.value.findIndex(r => r.code === roomCode)
    
    if (existingIndex >= 0) {
      // Move to front
      const room = recentRooms.value.splice(existingIndex, 1)[0]
      room.lastAccessed = new Date().toISOString()
      recentRooms.value.unshift(room)
    } else {
      recentRooms.value.unshift({
        code: roomCode,
        lastAccessed: new Date().toISOString()
      })
    }
    
    // Keep only last 5
    recentRooms.value = recentRooms.value.slice(0, 5)
    localStorage.setItem('recentRooms', JSON.stringify(recentRooms.value))
  }

  function resetPlayer() {
    id.value = ''
    name.value = ''
    currentRoom.value = ''
    isAdmin.value = false
    localStorage.removeItem('playerId')
    localStorage.removeItem('playerName')
  }

  // Initialize on creation
  initializePlayer()

  return {
    // State
    id,
    name,
    currentRoom,
    isAdmin,
    recentRooms,
    
    // Getters
    isAuthenticated,
    playerInfo,
    
    // Actions
    initializePlayer,
    setName,
    setRoom,
    clearRoom,
    addRecentRoom,
    resetPlayer
  }
})