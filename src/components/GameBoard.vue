<template>
  <div class="game-container">
    <!-- Loading state -->
    <main class="mainboard">     
       

      <div v-if="loading" class="game-loading">
        <div class="game-loading__spinner"></div>
        <p class="game-loading__text">Loading game...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="game-error">
        <h2 class="game-error__title">{{ error }}</h2>
      </div>

      <div v-else class="game-content">

        <div class="players-board-container" :class="getNumberOfPlayerCSSClass">

          <template v-for="playerState in gameState.players" :key="playerState.id">
            <div style="position: absolute; top: 0; right: 0; background: black; font-size: 10px;"></div>
            <pre><code>{{playerState.field}}</code></pre>

            <div class="playerBoard" v-if="currentPlayer.id !== playerState.id" :class="{currentPlayer: playerState.id === currentTurnPlayer.id }">
              <div class="playerField">
                <PlayerField
                  :cards="playerState.field"
                  :field-id="playerState.id"
                  @update:cards="onPlayerFieldUpdate(playerState.id, $event)"
                  @drop-on-field="onDropOnField"
                  @drop-on-stack="onDropOnStack"
                />
              </div>
              <PlayerHand :cards="playerState.hand" :opponent="true" />
            </div>
            <div class="playerBoard player" v-else :class="{currentPlayer: playerState.id === currentTurnPlayer.id }">
              <PlayerField
                :cards="playerState.field"
                :field-id="playerState.id"
                @update:cards="onPlayerFieldUpdate(playerState.id, $event)"
                @drop-on-field="onDropOnField"
                @drop-on-stack="onDropOnStack"
              />
              <!-- Player's Hand -->
              <PlayerHand
                :cards="playerHand"
                :player-id="playerId"
                @play-card="playCard"
                @drop-card="onDropOnHand"
              />

            </div>
            
          </template>
        </div> <!-- Players Status -->
        
      </div>
    </main>
   
    <aside class="sidebar">
      <div class="cardDetails"></div>  
      <div class="gameDecks">
        <DeckComponent
          title="Others Deck"
          :count="gameState.decks?.main?.count || 0"
          deck-type="others"
          :deck-metadata="gameState.decks?.main?.metadata || {}"
          @draw="drawCard"
          @peek="peekDeck('main')"
          @shuffle="shuffleDeck('main')"
          @drop-card="onDropOnDeck"
        />
      </div>
      <div class="gameGarbage">
        <GarbageComponent
          :cards="gameState.garbage"
          @play="playCardFromGarbage"
          @drop-card="onDropOnGarbage"
        />
      </div>

      <div class="game-players">
        <h3 class="game-players__title">Players Status</h3>
        <div class="game-players__list">
          <div 
            v-for="player in gameState.players"
            :key="player.id"
            class="game-players__player"
            :class="{
              'game-players__player--turn': player.id === currentTurnPlayer.id,
              'game-players__player--self': player.id === playerId,
              'game-players__player--other': player.id !== currentTurnPlayer.id && player.id !== playerId
            }"
          >
            <div class="game-players__header">
              <div 
                class="game-players__avatar"
                :class="playerColor(player.id)"
              >
                {{ player.name.charAt(0).toUpperCase() }}
              </div>
              <div class="game-players__info">
                <div class="game-players__name">{{ player.name }}</div>
                <div class="game-players__role">
                  {{ player.id === playerId ? 'You' : 'Opponent' }}
                </div>
              </div>
              <span 
                v-if="player.id === currentTurnPlayer.id"
                class="game-players__badge game-players__badge--turn"
              >
                Current Turn
              </span>
              <span 
                v-else-if="player.id === nextPlayer.id"
                class="game-players__badge game-players__badge--next"
              >
                Next
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="game-garbage">
        <h3 class="game-garbage__title">Garbage</h3>
        <div class="game-garbage__cards">
          <div 
            v-for="cardId in gameState.garbage?.cardIds || []"
            :key="cardId"
            @dblclick="takeFromGarbage(cardId)"
            class="game-garbage__card"
          >
            {{ getCardDetails(cardId)?.name || `Card ${cardId}` }}
          </div>
        </div>
        <div class="game-garbage__count">
          {{ gameState.garbage?.count || 0 }} cards
        </div>
      </div>

      <!-- Game Log -->
      <div class="gamelog-container">
        <GameLog :logs="gameState.logs" :current-player-id="playerId" />
      </div>
      

      <!-- Debug Info (remove in production) -->
      <!--<div v-if="showDebug" class="game-debug">
        <div class="game-debug__title">Debug Info:</div>
        <div class="game-debug__info">Current Turn Player ID: {{ gameState.currentTurnPlayerId || 'None' }}</div>
        <div class="game-debug__info">Current Turn Index: {{ gameState.currentTurn }}</div>
        <div class="game-debug__info">Your Player ID: {{ playerId }}</div>
        <div class="game-debug__info">Is Your Turn: {{ isPlayerTurn }}</div>
        <button @click="forceTurnFix" class="game-debug__fix-button">
          Force Fix Turn
        </button>
      </div>-->
    </aside>
  
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabase } from '../composables/useSupabase'
import { useRealtimeStore } from '../stores/realtimeStore.js'
import { useGameStore } from '../stores/gameStore.js'
import { storeToRefs } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

import IconXorume from '../assets/icons/IconXorume.vue'

import CardComponent from './CardComponent.vue'
import DeckComponent from './DeckComponent.vue'
import ArrowRenderer from './ArrowRenderer.vue'

import PlayerField from './gameBoard/PlayerField.vue'
import PlayerHand from './gameBoard/PlayerHand.vue'
import GarbageComponent from './gameBoard/GarbageComponent.vue'
import GameLog from './GameLog.vue'


const props = defineProps({
  roomCode: String
})

const emit = defineEmits(['leave-game'])
const router = useRouter()
const { 
  getGameState, 
  saveGameState, 
  getGameLogs, 
  addGameLog,
  subscribeToGameState,
  getRoom,
} = useSupabase()
const realtimeStore = useRealtimeStore()
const gameStore = useGameStore()
const { mainDeck } = storeToRefs(gameStore)

// Game state
const gameState = ref({
  players: [],
  currentTurn: 0,
  currentTurnPlayerId: '',
  currentTurnPlayerName: '',
  decks: {
    main: { cardIds: [], count: 0, metadata: {} }
  },
  board: { main: {}, positions: {} },
  garbage: { cardIds: [], count: 0 },
  arrows: [],
  logs: [],
  turnHistory: [],
  turnNumber: 1,
  startedAt: '',
  gameVersion: '1.0'
})

// UI state
const loading = ref(true)
const error = ref('')

const showDebug = ref(true) // Set to true for debugging
const contextMenu = ref({ show: false, x: 0, y: 0, type: '', deckType: '' })
const highlightTimer = ref(null)
const subscription = ref(null)

// Player state - get from localStorage or generate
const playerId = ref(localStorage.getItem('playerId') || uuidv4())
const playerName = ref(localStorage.getItem('playerName') || `Player ${Math.floor(Math.random() * 900 + 100)}`)

// Save player info to localStorage
localStorage.setItem('playerId', playerId.value)
localStorage.setItem('playerName', playerName.value)

// Card details map
const cardDetailsMap = ref({})

const currentPlayer = computed(() => {
  return gameState.value.players.find(p => p.id === playerId.value)
})

const isPlayerTurn = computed(() => {
  return currentPlayer.value?.id === gameState.value.currentTurnPlayerId
})

const currentTurnPlayer = computed(() => {
  return gameState.value.players.find(p => p.id === gameState.value.currentTurnPlayerId) || gameState.value.players[0]
})

const playerHand = computed(() => {
  return currentPlayer.value?.hand || []
})

const turnOrder = computed(() => {
  return gameState.value.players || []
})

const getNumberOfPlayerCSSClass = computed(() => {
  return 'boardFor' + gameState.value.players.length
})

const nextPlayer = computed(() => {
  if (!gameState.value.players || gameState.value.players.length === 0) return null
  const nextIndex = (gameState.value.currentTurn + 1) % gameState.value.players.length
  return gameState.value.players[nextIndex] || gameState.value.players[0]
})

// Lifecycle
onMounted(async () => {
  // console.log('GameBoard mounted. Player:', {
  //   id: playerId.value,
  //   name: playerName.value,
  //   fromStorage: !!localStorage.getItem('playerId')
  // })
  
  // Build card details lookup
  buildCardDetailsMap()
  
  // Load game state
  await loadGameState()
  
  // Setup real-time updates
  setupRealtimeUpdates()
})

onUnmounted(() => {
  // Cleanup realtime subscriptions
  if (props.roomCode) {
    realtimeStore.cleanupSubscription(`game-${props.roomCode}`)
    realtimeStore.cleanupSubscription(`room-${props.roomCode}`)
  }
})

function setupRealtimeUpdates() {
  //console.log('🔄 Setting up realtime game updates')
  
  // Get room ID first, then subscribe
  getRoom(props.roomCode).then(room => {
    if (!room?.id) {
      //console.error('Cannot setup realtime: Room not found')
      return
    }
    
    // Watch for game state changes
    realtimeStore.watchGame(room.id, (payload) => {
      //console.log('🎲 Game state updated via realtime:', payload)
      
      if (payload.new?.game_data) {
        // Update local state
        const oldTurn = gameState.value.currentTurnPlayerId
        gameState.value = payload.new.game_data
        const newTurn = gameState.value.currentTurnPlayerId
        
        // Show notification if turn changed
        if (oldTurn !== newTurn) {
          showRealtimeNotification('🔄 Turn updated')
        }
        
        // Log it
        addLog('Game updated in real-time', 'system')
      }
    })
    
    // Also watch for player changes (in case someone leaves)
    realtimeStore.watchRoom(room.id, (payload) => {
      if (payload.eventType === 'DELETE' && payload.old.player_id === playerId.value) {
        //console.log('🚫 Player removed from game')
        alert('You have been removed from the game')
        leaveGame()
      }
    })
  })
}

// Functions
function buildCardDetailsMap() {
  const map = {}
  mainDeck.value.forEach(card => {
    map[card.id] = card
  })
  cardDetailsMap.value = map
}

function getCardDetails(cardId) {
  return cardDetailsMap.value[cardId] || {
    id: cardId,
    name: `Card #${cardId}`,
    type: 'main',
    description: 'Card details not found'
  }
}

// Handle updates from PlayerField component when cards change
async function onPlayerFieldUpdate(playerIdParam, newCards) {
  try {
    const player = gameState.value.players.find(p => p.id === playerIdParam)
    if (!player) {
      //console.warn('Player not found for field update:', playerIdParam)
      return
    }

    // Convert nested stack representation ({ cardId, cards: [...] })
    // into flat field entries the game state expects ({ cardId, isTapped, position, isStackedOn })
    const flatField = []
    for (let i = 0; i < (Array.isArray(newCards) ? newCards.length : 0); i++) {
      const item = newCards[i]
      if (!item) continue
      // main/top-level card
      const mainCard = {
        ...(typeof item === 'object' ? { ...item } : { cardId: item }),
        isTapped: item.isTapped || false,
        position: item.position != null ? item.position : flatField.length,
      }
      // ensure we don't keep nested 'cards' array in the flat model
      delete mainCard.cards
      flatField.push(mainCard)

      // children (stacked cards) — single-level only
      if (Array.isArray(item.cards) && item.cards.length) {
        for (const child of item.cards) {
          if (!child) continue
          const childEntry = {
            ...(typeof child === 'object' ? { ...child } : { cardId: child }),
            isTapped: child.isTapped || false,
            position: mainCard.position,
            isStackedOn: mainCard.cardId
          }
          delete childEntry.cards
          flatField.push(childEntry)
        }
      }
    }

    player.field = flatField
    addLog(`${player.name} field updated`, 'system')
    await saveGameStateToDb()
  } catch (err) {
    console.error('Error updating player field:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Drag-and-drop handlers
// All child components only emit events; GameBoard owns all state mutations.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove a card from wherever it currently lives in the game state.
 * Returns the card object (or null if not found).
 *
 * payload shape:
 *   { source, cardId, sourcePlayerId, stackIdx, cardIdx }
 *
 * source values: 'hand' | 'field' | 'garbage' | 'deck'
 */
function removeCardFromSource(payload) {
  console.log('removecard', payload)
  const { source, cardId, sourcePlayerId, stackIdx, cardIdx } = payload

  if (source === 'hand') {
    const player = gameState.value.players.find(p => p.id === sourcePlayerId)
    if (!player) return null
    // Compare as both number and string to handle type coercion
    const idx = player.hand.findIndex(id => id == cardId)
    if (idx === -1) return null
    player.hand.splice(idx, 1)
    return { cardId }
  }

  if (source === 'field') {
    const player = gameState.value.players.find(p => p.id === sourcePlayerId)
    if (!player) return null

    // Stacked card (cardIdx is a number, not null)
    if (typeof cardIdx === 'number' && cardIdx !== null) {
      const normalized = normalizeFieldCards(player.field)
      const stackEntry = normalized[stackIdx]
      if (!stackEntry || !stackEntry.cards || !stackEntry.cards[cardIdx]) return null
      const removed = { ...stackEntry.cards[cardIdx] }
      // Remove from flat field: find the entry with matching cardId that has isStackedOn
      const flatIdx = player.field.findIndex(
        e => e.cardId == removed.cardId && e.isStackedOn != null
      )
      if (flatIdx !== -1) {
        player.field.splice(flatIdx, 1)
      } else {
        // nested format — remove from cards array
        const nestedStack = player.field[stackIdx]
        if (nestedStack?.cards) nestedStack.cards.splice(cardIdx, 1)
      }
      return removed
    }

    // Base card of a stack (cardIdx is null)
    const normalized = normalizeFieldCards(player.field)
    const stackEntry = normalized[stackIdx]
    if (!stackEntry) return null
    const removed = { ...stackEntry }

    // Remove the base card and all its stacked children from the flat field
    const baseId = stackEntry.cardId
    for (let i = player.field.length - 1; i >= 0; i--) {
      const e = player.field[i]
      if (e.cardId == baseId || e.isStackedOn == baseId) {
        player.field.splice(i, 1)
      }
    }
    return removed
  }

  if (source === 'garbage') {
    const garbage = gameState.value.garbage
    const idx = (garbage.cardIds || []).findIndex(id => id == cardId)
    if (idx === -1) return null
    garbage.cardIds.splice(idx, 1)
    garbage.count = Math.max(0, (garbage.count || 0) - 1)
    return { cardId }
  }

  if (source === 'deck') {
    const deck = gameState.value.decks?.main
    if (!deck) return null
    const idx = (deck.cardIds || []).findIndex(id => id == cardId)
    if (idx === -1) return null
    deck.cardIds.splice(idx, 1)
    deck.count = Math.max(0, (deck.count || 0) - 1)
    return { cardId }
  }

  return null
}

/** Normalize a flat field array into nested stacks */
function normalizeFieldCards(list) {
  if (!Array.isArray(list)) return []
  const usesNested = list.some(item => Array.isArray(item?.cards))
  if (usesNested) {
    return list.filter(Boolean).map(item => ({
      ...item,
      cards: Array.isArray(item.cards) ? item.cards.filter(Boolean) : []
    }))
  }

  const idToEntry = new Map()
  list.forEach(item => {
    if (!item) return
    idToEntry.set(item.cardId, { ...item, cards: [] })
  })
  const result = []
  list.forEach(item => {
    if (!item) return
    const entry = idToEntry.get(item.cardId)
    if (!item.isStackedOn) {
      result.push(entry)
    } else {
      const parent = idToEntry.get(item.isStackedOn)
      if (parent) parent.cards.push(entry)
      else result.push(entry)
    }
  })
  return result
}

/**
 * Card dropped onto a player's field area (not on a specific stack).
 * payload: { source, cardId, sourcePlayerId, stackIdx, cardIdx, target, targetFieldId }
 */
async function onDropOnField(payload) {
  console.log('drop on filed')
  const { cardId, targetFieldId } = payload
  const targetPlayer = gameState.value.players.find(p => p.id === targetFieldId)
  if (!targetPlayer) return

  const removed = removeCardFromSource(payload)
  if (!removed) {
    console.warn('onDropOnField: card not found in source', payload)
    return
  }

  // Add as a new top-level field card
  targetPlayer.field.push({
    cardId,
    isTapped: removed.isTapped || false,
    position: targetPlayer.field.length,
    isStackedOn: null,
  })

  // If the removed card has stacked children, move them all together
  if (Array.isArray(removed.cards) && removed.cards.length > 0) {
    for (const child of removed.cards) {
      targetPlayer.field.push({
        cardId: child.cardId,
        isTapped: child.isTapped || false,
        position: targetPlayer.field.length - 1, // Same position as parent
        isStackedOn: cardId, // Reference to the parent card
      })
    }
    addLog(`Stack with ${removed.cards.length + 1} cards moved to ${targetPlayer.name}'s field`)
  } else {
    addLog(`Card ${cardId} moved to ${targetPlayer.name}'s field`)
  }

  await saveGameStateToDb()
}

/**
 * Card dropped onto a specific stack inside a PlayerField.
 * payload: { source, cardId, sourcePlayerId, stackIdx, cardIdx, target, targetStackIdx, targetFieldId }
 */
async function onDropOnStack(payload) {

  const { cardId, targetFieldId, targetStackIdx } = payload
  const targetPlayer = gameState.value.players.find(p => p.id === targetFieldId)
  if (!targetPlayer) return

  const removed = removeCardFromSource(payload)
  if (!removed) {
    console.warn('onDropOnStack: card not found in source', payload)
    return
  }

  // Find the base card of the target stack
  const normalized = normalizeFieldCards(targetPlayer.field)
  const targetStack = normalized[targetStackIdx]

  console.log('target stack', targetStack)
  
  if (!targetStack) {
    // // Fallback: add as top-level
    targetPlayer.field.push({ cardId, isTapped: false, position: targetPlayer.field.length, isStackedOn: null })
    addLog(`Card ${cardId} added to ${targetPlayer.name}'s field`)
    await saveGameStateToDb()
    return
  }

  // Add the card to the existing stack's cards array (nested format)
  if (!targetStack.cards) {
    targetStack.cards = []
  }
  targetStack.cards.push({ cardId, isTapped: false })

  // Convert the entire field to nested format and save
  targetPlayer.field = normalized.map(entry => ({
    ...entry,
    cards: entry.cards || []
  }))

  addLog(`Card ${cardId} stacked on ${targetStack.cardId} in ${targetPlayer.name}'s field`)
  await saveGameStateToDb()
}

/**
 * Card dropped onto the player's own hand.
 * payload: { source, cardId, sourcePlayerId, stackIdx, cardIdx, target }
 */
async function onDropOnHand(payload) {
  const { cardId } = payload
  const player = gameState.value.players.find(p => p.id === playerId.value)
  if (!player) return

  const removed = removeCardFromSource(payload)
  if (!removed) {
    console.warn('onDropOnHand: card not found in source', payload)
    return
  }

  player.hand.push(cardId)
  addLog(`Card ${cardId} returned to ${player.name}'s hand`)
  await saveGameStateToDb()
}

/**
 * Card dropped onto the deck.
 * payload: { source, cardId, sourcePlayerId, stackIdx, cardIdx, target, deckType }
 */
async function onDropOnDeck(payload) {
  const { cardId } = payload
  const deck = gameState.value.decks?.main
  if (!deck) return

  const removed = removeCardFromSource(payload)
  if (!removed) {
    console.warn('onDropOnDeck: card not found in source', payload)
    return
  }

  // Add to bottom of deck
  if (!deck.cardIds) deck.cardIds = []
  deck.cardIds.unshift(cardId)
  deck.count = (deck.count || 0) + 1

  addLog(`Card ${cardId} returned to deck`)
  await saveGameStateToDb()
}

/**
 * Card dropped onto the garbage pile.
 * payload: { source, cardId, sourcePlayerId, stackIdx, cardIdx, target }
 */
async function onDropOnGarbage(payload) {
  const { cardId } = payload
  const garbage = gameState.value.garbage
  if (!garbage) return

  const removed = removeCardFromSource(payload)
  if (!removed) {
    console.warn('onDropOnGarbage: card not found in source', payload)
    return
  }

  if (!garbage.cardIds) garbage.cardIds = []
  garbage.cardIds.push(cardId)
  garbage.count = (garbage.count || 0) + 1

  addLog(`Card ${cardId} discarded to garbage`)
  await saveGameStateToDb()
}

async function loadGameState() {
  try {
    console.log('📥 Loading initial game state...')
    const room = await getRoom(props.roomCode)
    if (!room) {
      error.value = 'Room not found'
      loading.value = false
      return
    }
    
    const savedGame = await getGameState(room.id)
    if (savedGame?.game_data) {
      gameState.value = savedGame.game_data
      console.log('✅ Game state loaded:', {
        players: gameState.value.players?.length,
        turn: gameState.value.turnNumber
      })
    } else {
      error.value = 'Game state not found'
    }
  } catch (err) {
    console.error('Error loading game state:', err)
    error.value = 'Failed to load game state'
  } finally {
    loading.value = false
  }
}


async function endTurn() {
  if (!isPlayerTurn.value) {
    alert("It's not your turn!")
    return
  }
  
  if (!currentPlayer.value) {
    alert('Player data not found. Please refresh the page.')
    return
  }
  
  // Record turn history
  gameState.value.turnHistory.push({
    turnNumber: gameState.value.turnNumber,
    playerId: currentPlayer.value.id,
    playerName: currentPlayer.value.name,
    endedAt: new Date().toISOString(),
    handSize: currentPlayer.value.hand.length,
    fieldSize: currentPlayer.value.field.length,
    coins: currentPlayer.value.coins
  })
  
  // Reset current player's field card rotations and untap all cards
  if (currentPlayer.value) {
    // Reset board positions
    currentPlayer.value.field.forEach(fieldCard => {
      const position = gameState.value.board?.positions?.[fieldCard.cardId]
      if (position) {
        position.rotation = 0
      }
      // Untap all cards at end of turn
      fieldCard.isTapped = false
    })
  }
  
  // Clear arrows
  gameState.value.arrows = []
  
  // Update current player stats
  if (currentPlayer.value.stats) {
    currentPlayer.value.stats.turnsTaken++
  }
  
  const currentIndex = gameState.value.currentTurn
  const nextIndex = (currentIndex + 1) % gameState.value.players.length
  
  // Update all players' turn flags
  gameState.value.players.forEach((player, index) => {
    player.isTurn = index === nextIndex
  })
  
  // Update turn tracking
  gameState.value.currentTurn = nextIndex
  const nextPlayer = gameState.value.players[nextIndex]
  gameState.value.currentTurnPlayerId = nextPlayer.id
  gameState.value.currentTurnPlayerName = nextPlayer.name
  gameState.value.turnNumber++
  
  // Log the turn change
  addLog(`${currentPlayer.value.name}'s turn ended`)
  addLog(`${nextPlayer.name}'s turn starts`)
  
  await saveGameStateToDb()
  showRealtimeNotification('✅ Turn ended - other players notified')
}

async function drawCard() {
  if (!isPlayerTurn.value) {
    alert("It's not your turn!")
    return
  }
  
  if (!currentPlayer.value) {
    alert('Player data not found')
    return
  }
  
  const deck = gameState.value.decks?.main
  if (!deck || deck.cardIds.length === 0) {
    alert("Others deck is empty!")
    return
  }
  
  const cardId = deck.cardIds.pop()
  deck.count--
  
  currentPlayer.value.hand.push(cardId)
  
  if (currentPlayer.value.stats) {
    currentPlayer.value.stats.cardsDrawn++
  }
  
  const cardDetails = getCardDetails(cardId)
  addLog(`${currentPlayer.value.name} comprou uma carta`)
  
  await saveGameStateToDb()
}

async function playCard(cardId) {
  if (!isPlayerTurn.value) return
  
  if (!currentPlayer.value) {
    alert('Player data not found')
    return
  }
  
  const player = currentPlayer.value
  const cardIndex = player.hand.findIndex(id => id === cardId)
  if (cardIndex === -1) return
  
  const playedCard = player.hand.splice(cardIndex, 1)[0]
  
  // Create a field card object instead of just pushing the ID
  const fieldCard = {
    cardId: playedCard,
    isTapped: false,
    position: player.field.length, // Default position is next in sequence
    isStackedOn: null // Not stacked by default
  }
  
  player.field.push(fieldCard)
  
  if (player.stats) {
    player.stats.cardsPlayed++
  }
  
  const cardDetails = getCardDetails(cardId)
  addLog(`${player.name} played ${cardDetails.name}`)
  
  await saveGameStateToDb()
}

async function tapCard(cardId) {
  if (!isPlayerTurn.value) return
  
  if (!currentPlayer.value) {
    alert('Player data not found')
    return
  }

  const player = currentPlayer.value
  const cardIndex = player.field.findIndex(fieldCard => fieldCard.cardId === cardId)
  if (cardIndex === -1) return
  
  // Toggle the tapped state
  player.field[cardIndex].isTapped = !player.field[cardIndex].isTapped
  
  const cardDetails = getCardDetails(cardId)
  const action = player.field[cardIndex].isTapped ? 'tapped' : 'untapped'
  addLog(`${player.name} ${action} ${cardDetails.name}`)
  
  await saveGameStateToDb()
}

async function takeFromGarbage(cardId) {
  if (!isPlayerTurn.value) return
  
  if (!currentPlayer.value) {
    alert('Player data not found')
    return
  }
  
  const garbage = gameState.value.garbage
  const cardIndex = garbage.cardIds.findIndex(id => id === cardId)
  if (cardIndex === -1) return
  
  garbage.cardIds.splice(cardIndex, 1)
  garbage.count--
  
  currentPlayer.value.hand.push(cardId)
  
  const cardDetails = getCardDetails(cardId)
  addLog(`${currentPlayer.value.name} took ${cardDetails.name} from garbage`)
  
  await saveGameStateToDb()
}

async function playCardFromGarbage(cardId) {
  await takeFromGarbage(cardId)
}

function peekDeck(deckType, count = 5) {
  const deck = gameState.value.decks?.main
  if (!deck || deck.cardIds.length === 0) {
    alert(`${deckType} deck is empty!`)
    return
  }
  
  const cardsToShow = deck.cardIds.slice(0, Math.min(count, deck.cardIds.length))
  const cardNames = cardsToShow.map(cardId => {
    const details = getCardDetails(cardId)
    return details.name
  }).join('\n')
  
  alert(`Top ${cardsToShow.length} cards in ${deckType} deck:\n\n${cardNames}`)
  
  const playerName = currentPlayer.value?.name || 'Player'
  addLog(`${playerName} peeked at ${deckType} deck`)
}

async function shuffleDeck(deckType) {
  if (!confirm(`Are you sure you want to shuffle the ${deckType} deck?`)) return
  
  const deck = gameState.value.decks?.main
  if (!deck || deck.cardIds.length < 2) {
    alert('Not enough cards to shuffle')
    return
  }
  
  // Shuffle the IDs
  deck.cardIds = shuffleArray(deck.cardIds)
  
  // Update metadata
  if (deck.metadata) {
    deck.metadata.shuffledAt = new Date().toISOString()
  }
  
  const playerName = currentPlayer.value?.name || 'Player'
  addLog(`${playerName} shuffled ${deckType} deck`)
  await saveGameStateToDb()
}

function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function getCardPosition(cardId) {
  const position = gameState.value.board?.positions?.[cardId]
  if (position) {
    return {
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: `rotate(${position.rotation}deg)`,
      zIndex: position.zIndex
    }
  }
  return {}
}

async function rotateCard(cardId) {
  const position = gameState.value.board?.positions?.[cardId]
  if (position) {
    position.rotation = (position.rotation + 90) % 360
    await saveGameStateToDb()
  }
}

async function addCoin() {
  if (currentPlayer.value) {
    currentPlayer.value.coins++
    addLog(`${currentPlayer.value.name} gained 1 coin`)
    await saveGameStateToDb()
  }
}

function addLog(message, type = 'info') {
  const logEntry = {
    id: uuidv4(),
    message,
    timestamp: new Date().toISOString(),
    type,
    playerId: playerId.value,
    playerName: playerName.value
  }
  
  gameState.value.logs.unshift(logEntry)
  
  if (gameState.value.logs.length > 50) {
    gameState.value.logs = gameState.value.logs.slice(0, 50)
  }
}


// Visual notification for realtime updates
function showRealtimeNotification(message) {
  const notification = document.createElement('div')
  notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-50'
  notification.textContent = message
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.classList.add('opacity-0', 'transition-opacity', 'duration-300')
    setTimeout(() => notification.remove(), 300)
  }, 2000)
}


async function saveGameStateToDb() {
  try {
    const room = await getRoom(props.roomCode)
    if (!room?.id) {
      console.error('Cannot save: Room ID not found')
      return
    }
    
    const { saveGameState } = useSupabase()
    await saveGameState(room.id, gameState.value)
    //console.log('💾 Game state saved (will trigger realtime update)')
  } catch (err) {
    //console.error('Error saving game state:', err)
    throw err
  }
}

function playerColor(playerId) {
  if (!playerId) return 'bg-gray-500'
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

function leaveGame() {
  emit('leave-game')
  router.push('/')
}

</script>



<style scoped>

.game-container {
  display: grid;
  grid-template-columns: auto 250px;
}

.sidebar {
  height: 100vh;
}

.mainboard {
  height: 100vh;
}


.playerField {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  height: 100%;
}

.gamelog-container {
  height: 300px;
}

/* Loading state */
.game-loading {
  text-align: center;
  padding: 3rem 0;
}

.game-loading__spinner {
  animation: spin 1s linear infinite;
  border-radius: 50%;
  height: 3rem;
  width: 3rem;
  border-bottom: 2px solid #3b82f6;
  margin: 0 auto;
}

.game-loading__text {
  margin-top: 1rem;
}

/* Error state */
.game-error {
  text-align: center;
  padding: 3rem 0;
}

.game-error__icon {
  color: #ef4444;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.game-error__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-error__button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.game-error__button:hover {
  background-color: #2563eb;
}

/* Game content */
.game-content {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  height: 100%;
}

/* Game header */
.game-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .game-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

@media (min-width: 768px) {
  .game-header {
    align-items: center;
  }
}

.game-header__info {
  flex: 1;
}

.game-header__title {
  font-size: 1.5rem;
  font-weight: bold;
}

.game-header__debug {
  font-size: 0.875rem;
  color: #666;
}

.game-header__subtitle {
  color: #4b5563;
}

.game-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-header__leave-button {
  background-color: #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.game-header__leave-button:hover {
  background-color: #9ca3af;
}

/* Turn indicator */
.turn-indicator {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  min-width: 300px;
}

.turn-indicator__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.turn-indicator__title {
  font-weight: 600;
}

.turn-indicator__turn-number {
  font-size: 0.875rem;
  color: #4b5563;
}

.turn-indicator__player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.turn-indicator__player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.turn-indicator__player-info {
  flex-grow: 1;
}

.turn-indicator__player-name {
  font-weight: 500;
}

.turn-indicator__player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.turn-indicator__status-turn {
  font-size: 0.75rem;
  background-color: #dcfce7;
  color: #166534;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.turn-indicator__status-turn--active {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.turn-indicator__status-waiting {
  font-size: 0.75rem;
  color: #4b5563;
}

.turn-indicator__end-turn-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.turn-indicator__end-turn-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.turn-indicator__end-turn-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Turn order */
.turn-order {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.turn-order__title {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.turn-order__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.turn-order__item {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.turn-order__item--current {
  background-color: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

.turn-order__item--other {
  background-color: #f3f4f6;
  color: #374151;
}

.turn-order__crown {
  font-size: 0.75rem;
}

.turn-order__player-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-order__indicator {
  margin-left: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.turn-order__next {
  font-size: 0.75rem;
  color: #4b5563;
}

.turn-order__direction {
  margin-left: 0.5rem;
}

/* Debug info */
.game-debug {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.25rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.game-debug__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-debug__info {
  margin-bottom: 0.25rem;
}

.game-debug__fix-button {
  margin-top: 0.5rem;
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.game-debug__fix-button:hover {
  background-color: #dc2626;
}

@media (min-width: 768px) {
  .game-main {
    grid-template-columns: 1fr 2fr 1fr;
  }
}

/* Sidebar */
.game-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Stats */
.game-stats {
  background-color: white;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-stats__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-stats__content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.game-stats__coins {
  font-weight: 500;
}

.game-stats__add-button {
  background-color: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.game-stats__add-button:hover {
  background-color: #d97706;
}

/* Garbage */
.game-garbage {
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-garbage__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-garbage__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.game-garbage__card {
  width: 4rem;
  height: 6rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
}

.game-garbage__card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.game-garbage__count {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Game field */
.game-field {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.game-field__title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.game-field__area {
  position: relative;
  min-height: 300px;
  border: 2px dashed #d1d5db;
  border-radius: 0.25rem;
}

.game-field__card-container {
  position: absolute;
}

/* Game hand */
.gameHand {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.game-hand__title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.game-hand__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  min-width: 300px;
  height: 100px;
  background-color: #0d0d13;
}

.game-hand__count {
  font-size: 0.875rem;
  color: #4b5563;
}
.game-players__title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.game-players__player {
  border-right: 3px solid;
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.game-players__player--turn {
  border-color: #3b82f6;
}

.game-players__player--self {
  border-color: #10b981;
}

.game-players__player--other {
  border-color: #d1d5db;
}

.game-players__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.game-players__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.game-players__info {
  flex-grow: 1;
  min-width: 0;
}

.game-players__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-players__role {
  font-size: 0.75rem;
  color: #4b5563;
}

.game-players__badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.game-players__badge--turn {
  background-color: #dbeafe;
  color: #1e40af;
}

.game-players__badge--next {
  background-color: #fef3c7;
  color: #92400e;
}

.game-players__stats {
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.game-players__stat {
  line-height: 1.2;
}

.game-players__meta {
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 0.25rem;
}

.players-board-container {
  display: grid;
  width: 100%;
  grid-template-rows: 1fr 1fr;
  grid-template-areas: 'opponent' 'player';
}

.player {
  background-color: rgba(255,255,255,0.1);
  grid-area: player;
}

.players-board-container.boardFor3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.players-board-container.boardFor4 {
  grid-template-columns: 1fr 1fr;
}
/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.opponentHand {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  gap: 0;
}

.opponentCard {
  box-shadow: 10px 10px 10px -5px rgba(0,0,0,0.5);
  aspect-ratio: 5/7;
  background: radial-gradient(  #2f2f37, transparent 50%), linear-gradient(135deg, #1f1f2d, #0d0d13);
  border: 1px solid #414162;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  margin-right: -4rem;
  width: 50px;
  z-index: 1;
}


.opponentCard svg {
  width: 48px;
  height: 48px;
}


.playerBoard {
  border: 1px solid #313131;
  height: 100%;
  position: relative;
}

.playerBoard.currentPlayer {
  border-color: #c6a236;
}
</style>
