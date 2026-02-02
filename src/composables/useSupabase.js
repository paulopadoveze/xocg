import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export function useSupabase() {
  // Room operations
  const createRoom = async (roomData) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          room_code: roomData.room_code,
          admin_password: roomData.admin_password,
          max_players: roomData.max_players,
          status: 'waiting',
          created_by: roomData.created_by
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  }

  const createRoomWithAdmin = async (roomData, adminPlayer) => {
    try {
      // Start a transaction by creating room first
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([{
          room_code: roomData.room_code,
          admin_password: roomData.admin_password,
          max_players: roomData.max_players,
          status: 'waiting',
          created_by: adminPlayer.id
        }])
        .select()
        .single()

      if (roomError) throw roomError

      // Then create the admin player
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          room_id: room.id,
          player_id: adminPlayer.id,
          player_name: adminPlayer.name,
          is_admin: true
        }])

      if (playerError) throw playerError

      return room
    } catch (error) {
      console.error('Error creating room with admin:', error)
      throw error
    }
  }

  const getRoom = async (roomCode) => {
    try {

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *
        `)
        .eq('room_code', roomCode)
        .single()


      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting room:', error)
      return null
    }
  }

  const updateRoomStatus = async (roomCode, status) => {
    try {

      console.log('udpateRoom Stat', roomCode)
      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          status,
          game_started_at: status === 'playing' ? new Date().toISOString() : null
        })
        .eq('room_code', roomCode)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating room:', error)
      throw error
    }
  }

  const deleteRoom = async (roomCode) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('room_code', roomCode)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting room:', error)
      throw error
    }
  }

  // Player operations
  const joinRoom = async (roomId, playerData) => {
    console.log('join supabase', playerData)
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          room_id: roomId,
          player_name: playerData.name,
          is_admin: playerData.is_admin || false,
          player_id: playerData.player_id // Our local player ID
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error joining room:', error)
      throw error
    }
  }

  const leaveRoom = async (roomId, playerId) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error leaving room:', error)
      throw error
    }
  }

  const kickPlayer = async (roomId, playerId) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error kicking player:', error)
      throw error
    }
  }

  const getRoomPlayers = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting room players:', error)
      return []
    }
  }

  // Game state operations
  const saveGameState = async (roomId, gameData) => {
    try {
      // Stringify with proper formatting to handle large JSON
      const gameDataJson = JSON.stringify(gameData)
      
      const { data, error } = await supabase
        .from('game_states')
        .upsert({
          room_id: roomId,
          game_data: gameData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'room_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase save error:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error saving game state:', error)
      throw error
    }
  }
  
  const getGameState = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('game_states')
        .select('*')
        .eq('room_id', roomId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting game state:', error)
      return null
    }
  }

  // Game log operations
  const addGameLog = async (roomId, logData) => {
    try {
      const { data, error } = await supabase
        .from('game_logs')
        .insert([{
          room_id: roomId,
          player_id: logData.playerId,
          action: logData.action,
          details: logData.details || {},
          player_name: logData.playerName
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding game log:', error)
      throw error
    }
  }

  const getGameLogs = async (roomId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('game_logs')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting game logs:', error)
      return []
    }
  }

  // Real-time subscriptions
  const subscribeToRoom = (roomId, callback) => {
    return supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`
      }, callback)
      .subscribe()
  }

  
  const subscribeToRoomChanges = (roomId, callback) => {
  //console.log('📡 Subscribing to room changes:', roomId)
  
  const subscription = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        console.log('👥 Room player change:', payload)
        callback(payload)
      }
    )
    .subscribe((status, err) => {
      //console.log('📡 Room subscription status:', status)
      if (err) console.error('Room subscription error:', err)
    })

    return subscription
  }

  const subscribeToGameState = (roomId, callback) => {
    //console.log('🎮 Subscribing to game state:', roomId)
    
    const subscription = supabase
      .channel(`game:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Only updates (game state changes)
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          //console.log('🔄 Game state update:', payload)
          callback(payload)
        }
      )
      .subscribe((status, err) => {
        console.log('🎮 Game subscription status:', status)
        if (err) console.error('Game subscription error:', err)
      })

    return subscription
  }

  const subscribeToRoomStatus = (roomId, callback) => {
    //console.log('🚪 Subscribing to room status:', roomId)
    
    const subscription = supabase
      .channel(`room-status:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          //console.log('🚪 Room status update:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return subscription
  }

  const unsubscribe = (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription)
      console.log('📴 Unsubscribed from channel')
    }
  }

  return {
    supabase,
    createRoomWithAdmin,  // Add this line
    createRoom,
    getRoom,
    updateRoomStatus,
    deleteRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    getRoomPlayers,
    saveGameState,
    getGameState,
    addGameLog,
    getGameLogs,
    subscribeToRoom,
    subscribeToGameState,
    subscribeToRoomChanges,
    subscribeToRoomStatus,
    unsubscribe
  }
}