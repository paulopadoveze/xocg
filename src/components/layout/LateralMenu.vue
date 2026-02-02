<template>
  <div class="lateral-menu" :class="{ 'lateral-menu--collapsed': isCollapsed }">
    <!-- Toggle Button (always visible) -->
    <button 
      class="lateral-menu__toggle"
      @click="toggleMenu"
      :aria-expanded="!isCollapsed"
      aria-label="Toggle menu"
    >
      <svg v-if="isCollapsed" class="lateral-menu__icon" viewBox="0 0 24 24">
        <!-- Menu Icon (bars) -->
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
      </svg>
      <svg v-else class="lateral-menu__icon" viewBox="0 0 24 24">
        <!-- Close Icon (X) -->
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>

    <!-- Overlay for mobile -->
    <div 
      v-if="!isCollapsed" 
      class="lateral-menu__overlay"
      @click="closeMenu"
    ></div>

    <!-- Menu Content -->
    <div class="lateral-menu__content">
      <!-- Header slot -->
      <div class="lateral-menu__header">
        <slot name="header">
          <div class="lateral-menu__default-header">
            <h2 class="lateral-menu__title">Game Menu</h2>
            <div class="lateral-menu__room-info" v-if="currentRoom">
              <span class="lateral-menu__room-label">Room:</span>
              <code class="lateral-menu__room-code">{{ currentRoom }}</code>
            </div>
          </div>
        </slot>
      </div>

      <!-- Navigation Links -->
      <nav class="lateral-menu__nav">
        <ul class="lateral-menu__list">
          <li class="lateral-menu__item">
            <router-link 
              to="/" 
              class="lateral-menu__link"
              @click="closeMenu"
              exact-active-class="lateral-menu__link--active"
            >
              <svg class="lateral-menu__link-icon" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
              </svg>
              <span class="lateral-menu__link-text">Home</span>
            </router-link>
          </li>
          
          <li class="lateral-menu__item">
            <router-link 
              to="/games" 
              class="lateral-menu__link"
              @click="closeMenu"
              active-class="lateral-menu__link--active"
            >
              <svg class="lateral-menu__link-icon" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z" fill="currentColor"/>
              </svg>
              <span class="lateral-menu__link-text">Games</span>
            </router-link>
          </li>

          <li class="lateral-menu__item">
            <router-link 
              to="/room/create" 
              class="lateral-menu__link"
              @click="closeMenu"
              active-class="lateral-menu__link--active"
            >
              <svg class="lateral-menu__link-icon" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
              </svg>
              <span class="lateral-menu__link-text">Create Room</span>
            </router-link>
          </li>

          <li class="lateral-menu__item" v-if="currentRoom">
            <router-link 
              :to="`/room/${currentRoom}`" 
              class="lateral-menu__link"
              @click="closeMenu"
              active-class="lateral-menu__link--active"
            >
              <svg class="lateral-menu__link-icon" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              <span class="lateral-menu__link-text">Current Room</span>
              <span class="lateral-menu__room-badge">{{ currentRoom }}</span>
            </router-link>
          </li>

          <li class="lateral-menu__item">
            <router-link 
              to="/settings" 
              class="lateral-menu__link"
              @click="closeMenu"
              active-class="lateral-menu__link--active"
            >
              <svg class="lateral-menu__link-icon" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
              </svg>
              <span class="lateral-menu__link-text">Settings</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- User Info (optional) -->
      <div class="lateral-menu__user" v-if="user">
        <div class="lateral-menu__user-avatar">
          {{ user.name.charAt(0).toUpperCase() }}
        </div>
        <div class="lateral-menu__user-info">
          <div class="lateral-menu__user-name">{{ user.name }}</div>
          <div class="lateral-menu__user-status">
            <span class="lateral-menu__status-dot"></span>
            Online
          </div>
        </div>
      </div>

      <!-- Footer slot -->
      <div class="lateral-menu__footer">
        <slot name="footer">
          <button 
            class="lateral-menu__logout-button"
            @click="handleLogout"
          >
            <svg class="lateral-menu__logout-icon" viewBox="0 0 24 24">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
            </svg>
            Logout
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  currentRoom: {
    type: String,
    default: ''
  },
  user: {
    type: Object,
    default: null
  },
  initialCollapsed: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['logout', 'roomChange'])

const isCollapsed = ref(props.initialCollapsed)
const route = useRoute()

// Auto-close on mobile when route changes
watch(() => route.path, () => {
  if (window.innerWidth < 768) {
    closeMenu()
  }
})

// Handle keyboard shortcuts
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && !isCollapsed.value) {
    closeMenu()
  }
  if (e.key === 'm' && e.ctrlKey) {
    toggleMenu()
    e.preventDefault()
  }
}

// Handle resize
const handleResize = () => {
  if (window.innerWidth < 768) {
    isCollapsed.value = true
  }
}

const toggleMenu = () => {
  isCollapsed.value = !isCollapsed.value
  // Prevent body scroll when menu is open on mobile
  if (!isCollapsed.value && window.innerWidth < 768) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMenu = () => {
  isCollapsed.value = true
  document.body.style.overflow = ''
}

const handleLogout = () => {
  emit('logout')
  closeMenu()
}

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
  // Auto-collapse on mobile
  if (window.innerWidth < 768) {
    isCollapsed.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>

.lateral-menu {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &--collapsed {
    left: -100%;

    
    .lateral-menu__toggle {
      left: 0;
      border-radius: 0 12px 12px 0;
    }
  }
  
  &__toggle {
    position: fixed;
    top: 20px;
    left: 280px; // Width of menu
    z-index: 1001;
    width: 48px;
    height: 48px;
    background: rgba(139, 92, 246, 0.9);
    border: none;
    border-radius: 12px 0 0 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: rgba(167, 139, 250, 0.9);
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &__icon {
    width: 24px;
    height: 24px;
    color: white;
    transition: transform 0.3s ease;
  }
  
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 998;
    animation: fadeIn 0.3s ease;
    
    @media (min-width: 768px) {
      display: none;
    }
  }
  
  &__content {
    position: relative;
    width: 280px;
    height: 100%;
    background: linear-gradient(165deg, #12121a 0%, #1a1a24 100%);
    box-shadow: 
      4px 0 20px rgba(0, 0, 0, 0.5),
      inset 1px 0 0 rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    overflow-y: auto;
    z-index: 999;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.5);
      border-radius: 3px;
    }
  }
  
  &__header {
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &__default-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(90deg, #8b5cf6, #00d9ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
  
  &__room-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  &__room-label {
    color: #94a3b8;
  }
  
  &__room-code {
    font-family: 'Fira Code', monospace;
    background: rgba(0, 217, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: #00d9ff;
    font-weight: 600;
  }
  
  &__nav {
    margin-bottom: 2rem;
  }
  
  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  &__item {
    margin-bottom: 0.5rem;
  }
  
  &__link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    text-decoration: none;
    color: #cbd5e1;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      transform: translateX(5px);
      
      .lateral-menu__link-icon {
        transform: scale(1.1);
      }
    }
    
    &--active {
      background: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
      font-weight: 600;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background: linear-gradient(180deg, #8b5cf6, #00d9ff);
        border-radius: 0 4px 4px 0;
      }
    }
  }
  
  &__link-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  
  &__link-text {
    flex-grow: 1;
  }
  
  &__room-badge {
    background: rgba(0, 217, 255, 0.15);
    color: #00d9ff;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  &__user {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin-top: auto;
  }
  
  &__user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #00d9ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
  }
  
  &__user-info {
    flex-grow: 1;
  }
  
  &__user-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  &__user-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
  }
  
  &__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00ff88;
    animation: pulse 2s infinite;
  }
  
  &__footer {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &__logout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.875rem;
    background: rgba(255, 56, 96, 0.1);
    border: 1px solid rgba(255, 56, 96, 0.2);
    border-radius: 8px;
    color: #ff3860;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 56, 96, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 56, 96, 0.2);
    }
  }
  
  &__logout-icon {
    width: 18px;
    height: 18px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

// Responsive
@media (max-width: 768px) {
  .lateral-menu {
    &__content {
      width: 100%;
      max-width: 320px;
    }
    
    &--collapsed {
      .lateral-menu__content {
        transform: translateX(-100%);
      }
      
      .lateral-menu__toggle {
        left: 0;
        border-radius: 0 12px 12px 0;
      }
    }
    
    &__toggle {
      left: 0;
      border-radius: 0 12px 12px 0;
      background: rgba(139, 92, 246, 0.95);
    }
  }
}
</style>