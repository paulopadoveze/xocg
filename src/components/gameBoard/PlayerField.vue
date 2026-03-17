<template>
  <div
    class="player-field"
    :class="{ 'player-field--drag-over': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <ul class="cardArea">
      <template v-for="(card, idx) in cardsList" :key="`${card.cardId}-${idx}`">
        <li class="field-item">
          <StackCard
            :card-id="card.cardId"
            :stacked-cards="card.cards || []"
            :expanded="expandedStacks[idx] ?? false"
            :stack-idx="idx"
            :field-id="fieldId"
            @update:expanded="onToggleExpand(idx, $event)"
            @double-click="$emit('card-double-click', card.cardId, $event)"
            @contextmenu="$emit('card-contextmenu', card.cardId, $event)"
            @stacked-double-click="$emit('stacked-card-double-click', $event)"
            @stacked-contextmenu="$emit('stacked-card-contextmenu', $event)"
            @drag-start="(payload) => handleDragStart(payload, card)"
            @drag-end="$emit('drag-end')"
            @drop-on-stack="(payload) => $emit('drop-on-stack', payload)"
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
  'drag-start',
  'drag-end',
  'drop-on-field',   // card dropped onto the field area (not on a specific stack)
  'drop-on-stack',   // card dropped onto a specific stack (bubbled from StackCard)
])

// track expanded stacks (keyed by list index)
const expandedStacks = ref({})
const isDragOver = ref(false)

function handleDragStart(payload, card) {
  // Enhance payload with source information
  emit('drag-start', {
    ...payload,
    source: 'field',
    sourcePlayerId: props.fieldId,
    stackIdx: payload.stackIdx,
    cardIdx: payload.cardIdx
  })
}
                       
const cardsList = computed({
  get: () => props.cards || [],
  set(val) {
    // Emit the nested format back to parent when it changes
    emit('update:cards', val)
  }
})

/** Called when a StackCard emits update:expanded (controlled mode) */
function onToggleExpand(idx, isExpanded) {
  expandedStacks.value = { ...expandedStacks.value, [idx]: isExpanded }
}

// ── Drag-over / drop on the field area ────────────────────────────────────────

function onDragOver(event) {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'move'
}

function onDragLeave(event) {
  // Only clear when leaving the field root element
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

function onDrop(event) {
  isDragOver.value = false
  const raw = event.dataTransfer.getData('application/xcg-card')
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    // Emit to parent (GameBoard) with target field info
    emit('drop-on-field', {
      ...payload,
      target: 'field',
      targetFieldId: props.fieldId,
    })
  } catch (e) {
    console.warn('PlayerField: invalid drag payload', e)
  }
}
</script>

<style scoped>
.cardArea {
  min-height: 50px;
  list-style: none;
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  transition: outline 0.15s ease, background 0.15s ease;
  height: 100%;
}

.player-field {
  width: 100%;
  height: 100%;
}

.player-field--drag-over .cardArea {
  outline: 2px dashed rgba(100, 200, 100, 0.7);
  background: rgba(100, 200, 100, 0.06);
}

.field-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.2s ease;
}
</style>
