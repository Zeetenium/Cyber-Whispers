<template>
  <h1 class="title glitch" :data-text="text" ref="titleElement" @touchstart="handleTouch">{{ text }}</h1>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: 'Cyber Whispers'
  }
});

const titleElement = ref(null);
let rainbowTimer = null;
const isAnimating = ref(false);

const playRainbowAnimation = () => {
  if (isAnimating.value) {
    return;
  }

  const title = titleElement.value;
  if (!title) return;

  isAnimating.value = true;
  title.classList.add('rainbow');

  setTimeout(() => {
    title.classList.remove('rainbow');
    isAnimating.value = false;
  }, 5000);
};

const handleTouch = () => {
  playRainbowAnimation();
};

const startRandomEffectLoop = () => {
  // 15-25s 的随机延迟
  const randomDelay = Math.random() * 10000 + 15000;

  rainbowTimer = setTimeout(() => {
    playRainbowAnimation();
    startRandomEffectLoop();
  }, randomDelay);
};

onMounted(() => {
  startRandomEffectLoop();
});

onUnmounted(() => {
  clearTimeout(rainbowTimer);
});
</script>

<style lang="scss" scoped>
@keyframes rainbow-anim {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.title {
  position: absolute;
  top: -15vh;
  left: 50%;
  transform: translateX(-50%);
  color: #e0ffff;
  font-size: 2.3rem;
  white-space: nowrap;
  font-family: 'Orbitron', 'Arial', sans-serif;

  background: linear-gradient(90deg,
      #ff00e0,
      #00e0ff,
      #ffdd00,
      #ff00e0);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  transition: color 1s;
}

.title.rainbow {
  color: transparent;
  animation: rainbow-anim 5s linear infinite;
}


@font-face {
  font-family: 'Orbitron';
  src: url('../assets/fonts/Orbitron.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
</style>