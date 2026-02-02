import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSupabase } from '../composables/useSupabase'

export const useRealtimeStore = defineStore('realtime', () => {
  const { 
    subscribeToRoomChanges, 
    subscribeToGameState,
    subscribeToRoomStatus,
    unsubscribe 
  } = useSupabase()

  const subscriptions = ref({})
  
  // Subscribe to room player changes
  const watchRoom = (roomId, onUpdate) => {
    console.log(`👀 Watching room ${roomId} for player changes`)
    
    // Cleanup existing subscription
    if (subscriptions.value[`room-${roomId}`]) {
      unsubscribe(subscriptions.value[`room-${roomId}`])
    }
    
    const subscription = subscribeToRoomChanges(roomId, onUpdate)
    subscriptions.value[`room-${roomId}`] = subscription
    
    return subscription
  }
  
  // Subscribe to game state changes
  const watchGame = (roomId, onUpdate) => {
    console.log(`🎲 Watching game ${roomId} for state changes`)
    
    if (subscriptions.value[`game-${roomId}`]) {
      unsubscribe(subscriptions.value[`game-${roomId}`])
    }
    
    const subscription = subscribeToGameState(roomId, onUpdate)
    subscriptions.value[`game-${roomId}`] = subscription
    
    return subscription
  }
  
  // Watch room status (waiting → playing)
  const watchRoomStatus = (roomId, onUpdate) => {
    console.log(`🚪 Watching room ${roomId} status`)
    
    if (subscriptions.value[`room-status-${roomId}`]) {
      unsubscribe(subscriptions.value[`room-status-${roomId}`])
    }
    
    const subscription = subscribeToRoomStatus(roomId, onUpdate)
    subscriptions.value[`room-status-${roomId}`] = subscription
    
    return subscription
  }
  
  // Cleanup all subscriptions
  const cleanup = () => {
    console.log('🧹 Cleaning up all subscriptions')
    Object.values(subscriptions.value).forEach(subscription => {
      unsubscribe(subscription)
    })
    subscriptions.value = {}
  }
  
  // Cleanup specific subscription
  const cleanupSubscription = (key) => {
    if (subscriptions.value[key]) {
      unsubscribe(subscriptions.value[key])
      delete subscriptions.value[key]
      console.log(`🧹 Cleaned up subscription: ${key}`)
    }
  }
  
  return {
    subscriptions,
    watchRoom,
    watchGame,
    watchRoomStatus,
    cleanup,
    cleanupSubscription
  }
})