<template>
  <div class="relative">
    <div
      :class="{ 'garbage--drag-over': isDragOver }"
      @contextmenu.prevent="showContextMenu($event)"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div class="numberOfCards">
        {{ count }} cards
      </div>

      <div class="relative h-40 flex items-center justify-center">
        <!-- Discard pile visualization with fanned cards -->
        <div
          v-for="i in Math.min(5, count)"
          :key="i"
          :style="{
            transform: `translateX(${(i - 1) * 2}px) translateY(${-(i - 1) * 2}px) rotate(${(i - 1) * 3 - 4}deg)`,
            zIndex: i
          }"
          class="absolute w-24 h-32 border rounded bg-gradient-to-b from-gray-700 to-gray-900 shadow-sm opacity-80"
        ></div>

        <!-- Top card preview (most recently discarded) -->
        <div
          v-if="count > 0 && topCardId"
          class="absolute z-10"
          :style="{ transform: 'rotate(-2deg)' }"
        >
          <CardComponent 
            :card-id="topCardId" 
            :drag-meta="{ source: 'garbage' }"
            @drag-start="(payload) => $emit('drag-start', payload)"
            @drag-end="$emit('drag-end')"
          />
        </div>

        <!-- Empty garbage indicator -->
        <div
          v-if="count === 0"
          class="text-center text-gray-500"
        >
          <div class="text-4xl mb-2">🗑️</div>
          <p class="text-sm">Empty discard pile</p>
        </div>
      </div>

      <div class="mt-4 flex justify-center gap-2">
        <button
          @click.stop="handleViewAll"
          class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :disabled="count === 0"
          :class="{ 'opacity-50 cursor-not-allowed': count === 0 }"
        >
          View All
        </button>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 min-w-[180px]"
      @click.stop
    >
      <div class="py-1">
        <button
          @click="handleViewAll"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          :disabled="count === 0"
        >
          👁️ View All Cards
        </button>

        <div class="border-t my-1"></div>

        <button
          @click="handleTakeTop"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          :disabled="count === 0"
        >
          ✋ Take Top Card
        </button>
      </div>
    </div>

    <!-- View All Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      @click.self="showModal = false"
    >
      <div class="garbage-modal bg-gray-900 rounded-xl shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-white text-xl font-bold">🗑️ Discard Pile ({{ count }} cards)</h2>
          <button
            @click="showModal = false"
            class="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div class="garbage-modal__cards">
          <div
            v-for="(cardId, idx) in reversedCardIds"
            :key="cardId"
            class="garbage-modal__card-row"
            @dblclick="handlePlayCard(cardId)"
          >
            <span class="garbage-modal__card-index text-gray-500 text-xs w-6 shrink-0">
              {{ count - idx }}
            </span>
            <CardComponent :card-id="cardId" class="shrink-0" />
            <button
              class="garbage-modal__take-btn ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded transition-colors"
              @click.stop="handlePlayCard(cardId)"
            >
              Take
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CardComponent from './CardComponent.vue'

const props = defineProps({
  cards: {
    type: Object,
    default: () => ({ cardIds: [], count: 0 })
  }
})

const emit = defineEmits(['play', 'take-top', 'drop-card', 'drag-start', 'drag-end'])

const showModal = ref(false)
const isDragOver = ref(false)

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0
})

const count = computed(() => props.cards?.count ?? props.cards?.cardIds?.length ?? 0)

const topCardId = computed(() => {
  const ids = props.cards?.cardIds
  if (!ids || ids.length === 0) return null
  return ids[ids.length - 1]
})

const reversedCardIds = computed(() => {
  const ids = props.cards?.cardIds
  if (!ids) return []
  return [...ids].reverse()
})

const showContextMenu = (event) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY
  }
}

const handleViewAll = () => {
  showModal.value = true
  contextMenu.value.visible = false
}

const handleTakeTop = () => {
  if (topCardId.value != null) {
    emit('play', topCardId.value)
  }
  contextMenu.value.visible = false
}

const handlePlayCard = (cardId) => {
  emit('play', cardId)
  showModal.value = false
}

function onDragOver(event) {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'move'
}

function onDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const onDrop = (event) => {
  isDragOver.value = false
  const raw = event.dataTransfer.getData('application/xcg-card')
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    // Emit to parent (GameBoard) — parent handles all state logic
    emit('drop-card', { ...payload, target: 'garbage' })
  } catch (e) {
    console.warn('GarbageComponent: invalid drag payload', e)
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.numberOfCards {
  font-size: 12px;
}

.garbage--drag-over {
  outline: 2px dashed rgba(255, 100, 100, 0.7);
  border-radius: 8px;
  background: rgba(255, 100, 100, 0.08);
}

.garbage-modal__cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.garbage-modal__card-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.15s ease;
}

.garbage-modal__card-row:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
