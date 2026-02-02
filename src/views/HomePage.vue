<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="grid md:grid-cols-2 gap-8">
      <!-- Create Room Section -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Your Name</label>
            <input 
              v-model="playerName"
              placeholder="Enter your name"
              class="border p-3 rounded w-full"
              @keyup.enter="createRoom"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Admin Password</label>
            <input 
              v-model="adminPassword"
              type="password"
              placeholder="Enter admin password"
              class="border p-3 rounded w-full"
            />
            <p class="text-sm text-gray-500 mt-1">Use 'superbanana' to create room</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Max Players</label>
            <select v-model="maxPlayers" class="border p-3 rounded w-full">
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </select>
          </div>
          
          <button 
            @click="createRoom"
            class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors w-full font-semibold disabled:opacity-50"
            :disabled="creating || adminPassword !== 'superbanana' || !playerName.trim()"
          >
            <span v-if="creating">
              <svg class="animate-spin h-5 w-5 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
            <span v-else>Create Game Room</span>
          </button>
          
          <p v-if="createError" class="text-red-500 text-center">{{ createError }}</p>
        </div>
      </div>

      <!-- Join Room Section -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          Join Existing Room
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Your Name</label>
            <input 
              v-model="joinPlayerName"
              placeholder="Enter your name"
              class="border p-3 rounded w-full"
              @keyup.enter="joinRoom"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Room Code</label>
            <input 
              v-model="roomCode"
              placeholder="Enter 10-character room code"
              class="border p-3 rounded w-full font-mono text-center uppercase"
              @keyup.enter="joinRoom"
              maxlength="10"
            />
          </div>
          
          <button 
            @click="joinRoom"
            class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors w-full font-semibold disabled:opacity-50"
            :disabled="joining || !roomCode.trim() || !joinPlayerName.trim()"
          >
            <span v-if="joining">
              <svg class="animate-spin h-5 w-5 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining...
            </span>
            <span v-else>Join Game Room</span>
          </button>
          
          <p v-if="joinError" class="text-red-500 text-center">{{ joinError }}</p>
          
          <!-- Quick join from URL if available -->
          <div v-if="roomCodeFromUrl" class="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p class="text-sm text-blue-800 mb-2">
              Room detected in URL: <strong class="font-mono">{{ roomCodeFromUrl }}</strong>
            </p>
            <button 
              @click="joinRoomFromUrl"
              class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 w-full"
            >
              Join this room
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Rooms -->
    <div v-if="recentRooms.length > 0" class="mt-12">
      <h3 class="text-xl font-bold mb-4">Recent Rooms</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div 
          v-for="room in recentRooms" 
          :key="room.room_code"
          class="bg-gray-50 border rounded p-4 hover:bg-gray-100 transition-colors cursor-pointer"
          @click="joinRecentRoom(room)"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="font-mono font-semibold">{{ room.room_code }}</div>
              <div class="text-sm text-gray-600">{{ room.players }} player{{ room.players !== 1 ? 's' : '' }}</div>
            </div>
            <span class="text-xs px-2 py-1 rounded" 
                  :class="room.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'">
              {{ room.status }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            {{ formatTime(room.last_accessed) }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../stores/gameStore'
import { useSupabase } from '../composables/useSupabase'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()
const { createRoomWithAdmin, getRoom } = useSupabase()

// Local form state only
const adminPassword = ref('')
const maxPlayers = ref(4)
const creating = ref(false)
const createError = ref('')
const roomCode = ref('')
const joining = ref(false)
const joinError = ref('')

const recentRooms = ref([])
// Use computed for player info
const playerName = computed({
  get: () => playerStore.name,
  set: (value) => playerStore.setName(value)
})

const joinPlayerName = computed({
  get: () => playerStore.name,
  set: (value) => playerStore.setName(value)
})

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 12).toUpperCase()
}

async function createRoom() {
  if (adminPassword.value !== 'superbanana') {
    createError.value = 'Invalid admin password'
    return
  }
  
  if (!playerName.value.trim()) {
    createError.value = 'Please enter your name'
    return
  }

  creating.value = true
  createError.value = ''

  try {
    const roomCode = generateRoomCode()
    
    const room = await createRoomWithAdmin({
      room_code: roomCode,
      admin_password: adminPassword.value,
      max_players: parseInt(maxPlayers.value),
      created_by: playerStore.id
    }, {
      id: playerStore.id,
      name: playerName.value
    })
    
    // Set player as admin in this room
    playerStore.setRoom(roomCode, true)
    
    // Navigate to room
    router.push(`/room/${roomCode}`)
    
  } catch (error) {
    console.error('Error creating room:', error)
    createError.value = 'Failed to create room. Please try again.'
  } finally {
    creating.value = false
  }
}

async function joinRoom() {
  if (!roomCode.value.trim()) {
    joinError.value = 'Please enter a room code'
    return
  }
  
  if (!joinPlayerName.value.trim()) {
    joinError.value = 'Please enter your name'
    return
  }

  joining.value = true
  joinError.value = ''

  try {
    const room = await getRoom(roomCode.value.toUpperCase())
    
    if (!room) {
      joinError.value = 'Room not found'
      return
    }
    
    if (room.players && room.players.length >= room.max_players) {
      joinError.value = 'Room is full'
      return
    }
    
    if (room.status === 'playing') {
      joinError.value = 'Game has already started'
      return
    }
    
    // Set player's current room
    playerStore.setRoom(roomCode.value, false)
    
    // Navigate to room
    router.push(`/room/${roomCode.value}`)
    
  } catch (error) {
    console.error('Error joining room:', error)
    joinError.value = 'Failed to join room. Please try again.'
  } finally {
    joining.value = false
  }
}
</script>