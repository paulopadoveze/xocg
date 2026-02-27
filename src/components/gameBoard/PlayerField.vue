<template>
  <div class="player-field">
    <ul class="cardArea">
      <template v-for="(card, idx) in cardsList" :key="`${card.cardId}-${idx}`">
        <li class="field-item">
          <StackCard
            :card-id="card.cardId"
            :stacked-cards="card.cards || []"
            :expanded="expandedStacks[idx] ?? false"
            @update:expanded="onToggleExpand(idx, $event)"
            @double-click="$emit('card-double-click', card.cardId, $event)"
            @contextmenu="$emit('card-contextmenu', card.cardId, $event)"
            @stacked-double-click="$emit('stacked-card-double-click', $event)"
            @stacked-contextmenu="$emit('stacked-card-contextmenu', $event)"
          />
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import StackCard from './StackCard.vue'

const props = defineProps({
  cards: { required: true, type: Array },
  fieldId: { type: [String, Number], default: null }
})
const emit = defineEmits([
  'field-change',
  'update:cards',
  'card-double-click',
  'card-contextmenu',
  'stacked-card-double-click',
  'stacked-card-contextmenu',
])

// track expanded stacks (keyed by list index)
const expandedStacks = ref({})

// normalize incoming field data to nested format PlayerField expects
function normalizeCards(list) {
  if (!Array.isArray(list)) return []

  // If data already uses nested `cards` arrays, just sanitize and return
  const usesNested = list.some(item => Array.isArray(item?.cards))
  if (usesNested) {
    return list
      .filter(Boolean)
      .map(item => ({ ...item, cards: Array.isArray(item.cards) ? item.cards.filter(Boolean).map(c => ({ ...c })) : [] }))
  }

  // Otherwise, convert flat model (entries with `isStackedOn`) into nested groups
  const idToEntry = new Map()
  const topLevelOrder = []

  // First pass: create shallow copies and register
  list.forEach(item => {
    if (!item) return
    const copy = { ...item }
    copy.cards = []
    idToEntry.set(copy.cardId, copy)
    topLevelOrder.push(copy)
  })

  // Second pass: attach stacked children to their parent if present
  const result = []
  topLevelOrder.forEach(entry => {
    if (!entry.isStackedOn) {
      result.push(entry)
    }
  })

  // Attach children (preserve original order)
  list.forEach(item => {
    if (!item) return
    if (item.isStackedOn) {
      const parent = idToEntry.get(item.isStackedOn)
      if (parent) {
        const childCopy = { ...item }
        delete childCopy.isStackedOn
        childCopy.cards = Array.isArray(childCopy.cards) ? childCopy.cards.filter(Boolean).map(c => ({ ...c })) : []
        parent.cards.push(childCopy)
      } else {
        // parent not found — treat as top-level
        const orphanCopy = { ...item, cards: [] }
        result.push(orphanCopy)
      }
    }
  })

  return result
}

const cardsList = computed({
  get: () => normalizeCards(props.cards || []),
  set(val) {
    // no op; parent listens to update event
  }
})

function onFieldChange() {
  const payload = { fieldId: props.fieldId, cards: cardsList.value }
  emit('field-change', payload)
  emit('update:cards', cardsList.value)
}

/** Called when a StackCard emits update:expanded (controlled mode) */
function onToggleExpand(idx, isExpanded) {
  expandedStacks.value = { ...expandedStacks.value, [idx]: isExpanded }
}

/** Remove a stacked card from a given stack by index */
function removeFromStack(stackIdx, cardIdx) {
  const stack = cardsList.value[stackIdx]
  if (stack?.cards && stack.cards[cardIdx]) {
    stack.cards.splice(cardIdx, 1)
    if (stack.cards.length === 0) {
      expandedStacks.value = { ...expandedStacks.value, [stackIdx]: false }
    }
    onFieldChange()
  }
}
</script>

<style scoped>
.cardArea {
  min-height: 50px;
  outline: 1px dashed rgba(255, 255, 255, 0.2);
  list-style: none;
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}

.player-field {
  width: 100%;
}

.field-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.2s ease;
}
</style>
