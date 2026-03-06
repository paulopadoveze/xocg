<template>
  <div
    class="stack-card"
    :class="{
      'stack-card--expanded': isExpanded,
      'stack-card--has-stack': hasStack,
      'stack-card--drag-over': isDragOver,
    }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >

    <!-- Main (bottom) card -->
    <div class="stack-card__main" @click="toggleExpand">
      <CardComponent
        :card-id="cardId"
        class="stack-card__base"
        :drag-meta="baseDragMeta"
        v-bind="$attrs"
        @double-click="$emit('double-click', cardId, $event)"
        @contextmenu="$emit('contextmenu', cardId, $event)"
        @mouse-down="$emit('mouse-down', cardId, $event)"
        @mouse-up="$emit('mouse-up', cardId, $event)"
        @mouse-enter="$emit('mouse-enter', cardId, $event)"
        @mouse-leave="$emit('mouse-leave', cardId, $event)"
        @drag-start="handleDragStart"
        @drag-end="$emit('drag-end')"
      />

      <!-- Stack count badge -->
      <Transition name="badge">
        <div
          v-if="hasStack"
          class="stack-card__badge"
          :title="`${stackedCards.length + 1} cards in stack`"
          @click.stop="toggleExpand"
        >
          {{ stackedCards.length + 1 }}
        </div>
      </Transition>

      <!-- Expand/collapse toggle button -->
      <button
        v-if="hasStack"
        class="stack-card__toggle"
        :aria-label="isExpanded ? 'Collapse stack' : 'Expand stack'"
        :aria-expanded="isExpanded"
        @click.stop="toggleExpand"
      >
        <span class="stack-card__toggle-icon">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>
    </div>

    <!-- Stacked cards (collapsed: offset peek; expanded: fan out) -->
    <Transition name="stack-expand">
      <div v-if="hasStack" class="stack-card__stack" :class="{ 'stack-card__stack--expanded': isExpanded }">
        <div
          v-for="(stacked, idx) in stackedCards"
          :key="`stacked-${stacked.cardId ?? idx}`"
          class="stack-card__stacked-item"
          :class="{ 'stack-card__stacked-item--expanded': isExpanded }"
          :style="stackedItemStyle(idx)"
        >
          <CardComponent
            :card-id="stacked.cardId"
            class="stack-card__stacked-card"
            :drag-meta="stackedDragMeta(idx)"
            @double-click="$emit('stacked-double-click', stacked.cardId, idx, $event)"
            @contextmenu="$emit('stacked-contextmenu', stacked.cardId, idx, $event)"
            @mouse-enter="$emit('stacked-mouse-enter', stacked.cardId, idx, $event)"
            @mouse-leave="$emit('stacked-mouse-leave', stacked.cardId, idx, $event)"
            @drag-end="$emit('drag-end')"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CardComponent from './CardComponent.vue'

/**
 * StackCard — displays a base card with an optional stack of cards on top.
 *
 * Props:
 *   cardId         — ID of the base (bottom) card
 *   stackedCards   — array of { cardId } objects representing cards stacked on top
 *   expanded       — optional controlled expanded state (use with onUpdate:expanded)
 *   stackIdx       — index of this stack in the parent field (for drag metadata)
 *   fieldId        — ID of the player field this stack belongs to (for drag metadata)
 *
 * Emits:
 *   toggle-expand(isExpanded)
 *   update:expanded(isExpanded)
 *   double-click(cardId, event)
 *   contextmenu(cardId, event)
 *   mouse-down(cardId, event)
 *   mouse-up(cardId, event)
 *   mouse-enter(cardId, event)
 *   mouse-leave(cardId, event)
 *   stacked-double-click(cardId, stackIndex, event)
 *   stacked-contextmenu(cardId, stackIndex, event)
 *   stacked-mouse-enter(cardId, stackIndex, event)
 *   stacked-mouse-leave(cardId, stackIndex, event)
 *   drag-start(payload)
 *   drag-end()
 *   drop-on-stack(payload)   — card dropped onto this stack
 */

const props = defineProps({
  /** ID of the base card */
  cardId: {
    type: [Number, String],
    required: true,
  },
  /** Cards stacked on top of the base card — each item must have a `cardId` field */
  stackedCards: {
    type: Array,
    default: () => [],
  },
  /**
   * Controlled expanded state. When provided the component acts as a
   * controlled component and emits `update:expanded` instead of managing
   * its own internal state.
   */
  expanded: {
    type: Boolean,
    default: null,
  },
  /** Pixel offset between stacked cards in collapsed mode */
  collapsedOffset: {
    type: Number,
    default: 10,
  },
  /** Pixel gap between stacked cards in expanded mode */
  expandedGap: {
    type: Number,
    default: 8,
  },
  /** Index of this stack in the parent PlayerField (used for drag metadata) */
  stackIdx: {
    type: Number,
    default: null,
  },
  /** Player field ID this stack belongs to (used for drag metadata) */
  fieldId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits([
  'toggle-expand',
  'update:expanded',
  'double-click',
  'contextmenu',
  'mouse-down',
  'mouse-up',
  'mouse-enter',
  'mouse-leave',
  'stacked-double-click',
  'stacked-contextmenu',
  'stacked-mouse-enter',
  'stacked-mouse-leave',
  'drag-start',
  'drag-end',
  'drop-on-stack',
])

// Internal expanded state (used when `expanded` prop is null / uncontrolled)
const internalExpanded = ref(false)
const isDragOver = ref(false)

const isExpanded = computed(() => {
  return props.expanded !== null ? props.expanded : internalExpanded.value
})

const hasStack = computed(() => Array.isArray(props.stackedCards) && props.stackedCards.length > 0)

/** Drag metadata for the base card */
const baseDragMeta = computed(() => ({
  source: 'field',
  sourcePlayerId: props.fieldId,
  stackIdx: props.stackIdx,
  cardIdx: null, // null = base card of the stack
}))

/** Drag metadata for a stacked card at a given index */
function stackedDragMeta(idx) {
  return {
    source: 'field',
    sourcePlayerId: props.fieldId,
    stackIdx: props.stackIdx,
    cardIdx: idx, // index within the stacked cards array
  }
}

function handleDragStart(payload) {
  emit('drag-start', payload)
}
function toggleExpand() {
  if (!hasStack.value) return
  const next = !isExpanded.value
  if (props.expanded !== null) {
    // Controlled mode — let parent decide
    emit('update:expanded', next)
  } else {
    internalExpanded.value = next
  }
  emit('toggle-expand', next)
}

// ── Drag-over / drop on this stack ────────────────────────────────────────────

function onDragOver(event) {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'move'
}

function onDragLeave(event) {
  // Only clear if leaving the stack-card root (not a child)
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

function onDrop(event) {
  event.stopPropagation()
  isDragOver.value = false
  // Don't allow dropping if there's already a stack on this card
  const raw = event.dataTransfer.getData('application/xcg-card')
  if (!raw) return
  try {
    console.log('payload stack', raw)
    const payload = JSON.parse(raw)
    // Emit to parent (PlayerField → GameBoard) with target info
    emit('drop-on-stack', {
      ...payload,
      target: 'stack',
      targetStackIdx: props.stackIdx,
      targetFieldId: props.fieldId,
    })
  } catch (e) {
    console.warn('StackCard: invalid drag payload', e)
  }
}

/**
 * Returns the inline style for each stacked card item.
 * Collapsed: cards peek out with a small offset behind the base card.
 * Expanded:  cards fan out below the base card with a fixed gap.
 */
function stackedItemStyle(idx) {
  if (isExpanded.value) {
    // In expanded mode the stack container uses flex-column, so we only
    // need a small visual indent to show depth.
    return {
      zIndex: props.stackedCards.length - idx,
      marginLeft: `${(idx + 1) * 4}px`,
    }
  }
  // Collapsed: absolute offset so cards peek behind the base card
  const offset = (idx + 1) * props.collapsedOffset
  return {
    transform: `translateX(${offset}px) translateY(${offset}px)`,
    zIndex: props.stackedCards.length - idx,
  }
}
</script>

<style lang="scss" scoped>
.stack-card {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  transition: outline 0.15s ease;

  &--drag-over {
    outline: 2px dashed rgba(100, 200, 255, 0.7);
    border-radius: 8px;
    background: rgba(100, 200, 255, 0.08);
  }

  // ── Main card wrapper ──────────────────────────────────────────────────────
  &__main {
    position: relative;
    z-index: 10;
    cursor: pointer;
  }

  // ── Stack badge ────────────────────────────────────────────────────────────
  &__badge {
    position: absolute;
    bottom: -8px;
    right: -8px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #ff8c42);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    z-index: 12;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  &__main:hover &__badge {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  // ── Toggle button ──────────────────────────────────────────────────────────
  &__toggle {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(30, 30, 50, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.8);
    font-size: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 13;
    transition: background 0.2s ease, transform 0.2s ease;
    padding: 0;
    line-height: 1;

    &:hover {
      background: rgba(60, 60, 90, 0.95);
      transform: scale(1.1);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary, #7c3aed);
      outline-offset: 2px;
    }
  }

  &__toggle-icon {
    display: block;
    line-height: 1;
  }

  // ── Stacked cards container ────────────────────────────────────────────────
  &__stack {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none; // collapsed: cards are decorative only

    &--expanded {
      position: relative;
      top: unset;
      left: unset;
      display: flex;
      flex-direction: column;
      gap: v-bind('`${expandedGap}px`');
      margin-top: v-bind('`${expandedGap}px`');
      pointer-events: auto;
    }
  }

  // ── Individual stacked card ────────────────────────────────────────────────
  &__stacked-item {
    position: absolute;
    top: 0;
    left: 0;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    opacity: 0.85;

    &--expanded {
      position: relative;
      top: unset;
      left: unset;
      transform: none !important;
      opacity: 1;
      pointer-events: auto;
    }

    &:hover {
      opacity: 1;
    }
  }

  &__stacked-card {
    display: block;
  }

  // ── Expanded layout adjustments ────────────────────────────────────────────
  &--expanded {
    .stack-card__main {
      z-index: 10;
    }
  }
}

// ── Badge transition ─────────────────────────────────────────────────────────
.badge-enter-active,
.badge-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

// ── Stack expand transition ───────────────────────────────────────────────────
.stack-expand-enter-active,
.stack-expand-leave-active {
  transition: opacity 0.25s ease;
}
.stack-expand-enter-from,
.stack-expand-leave-to {
  opacity: 0;
}
</style>
