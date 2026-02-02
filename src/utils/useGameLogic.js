import { v4 as uuidv4 } from 'uuid'

export const CARD_TYPES = {
  CIVIS: 'Civis',
  OTHERS: 'Others'
}

export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended'
}

export function generateCard(name, type, description = '') {
  return {
    id: uuidv4(),
    name,
    type,
    description,
    createdAt: new Date().toISOString(),
    rotated: false,
    highlighted: false,
    stackId: null, // For card stacking
    position: { x: 0, y: 0 }
  }
}

export function generateDeck(type, count = 30) {
  const cards = []
  
  for (let i = 0; i < count; i++) {
    cards.push(generateCard(
      `${type} Card ${i + 1}`,
      type,
      `This is a ${type} card with unique abilities.`
    ))
  }
  
  return shuffleDeck(cards)
}

export function shuffleDeck(deck) {
  const newDeck = [...deck]
  
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
  }
  
  return newDeck
}

export function createArrow(fromCard, toCard, fromPlayerId, toPlayerId) {
  return {
    id: uuidv4(),
    from: {
      cardId: fromCard.id,
      playerId: fromPlayerId,
      x: fromCard.position.x,
      y: fromCard.position.y
    },
    to: {
      cardId: toCard.id,
      playerId: toPlayerId,
      x: toCard.position.x,
      y: toCard.position.y
    },
    controlX: (fromCard.position.x + toCard.position.x) / 2,
    controlY: (fromCard.position.y + toCard.position.y) / 2 - 50,
    createdAt: new Date().toISOString(),
    color: '#3b82f6'
  }
}

export function calculateCardBounds(cards) {
  if (cards.length === 0) return null
  
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  cards.forEach(card => {
    minX = Math.min(minX, card.position.x)
    maxX = Math.max(maxX, card.position.x)
    minY = Math.min(minY, card.position.y)
    maxY = Math.max(maxY, card.position.y)
  })
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 100, // Assuming card width ~100px
    height: maxY - minY + 140  // Assuming card height ~140px
  }
}

export function canStackCards(cardA, cardB) {
  // Define stacking rules
  return cardA.type === cardB.type || 
         cardA.name === cardB.name ||
         // Add other stacking conditions
         true // For now, allow all stacking
}