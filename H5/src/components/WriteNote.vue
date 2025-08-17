<template>
  <div class="modal-overlay" @click.self.stop="close" @touchmove.stop>
    <div class="modal-panel" :style="{
      '--panel-border-color': color.borderColor,
      '--panel-shadow-color': shadowColor,
      '--panel-faint-color': faintColor,
      '--panel-text-color': color.textColor
    }">
      <h2 class="title">撰写留言</h2>

      <div class="color-selector">
        <span v-for="(c, index) in colors" :key="index" class="color-swatch" :style="{ backgroundColor: c.borderColor }"
          :class="{ selected: selectedColorIndex === index }" @click="selectColor(index)"></span>
      </div>

      <div class="textarea-container">
        <textarea class="main-textarea" v-model="message" placeholder="留言..." rows="6"></textarea>
        <div class="char-counter" :class="{ 'over-limit': messageWidth > maxWidth }">
          {{ messageWidth }} / {{ maxWidth }}
        </div>


        <input type="text" class="signature-input" v-model="signature" placeholder="署名" />

      </div>

      <div class="inspiration-container" @click="getInspiration">
        <p v-show="!currentQuote">启动思维模块</p>
        <p v-show="currentQuote">{{ currentQuote }} ↻</p>
      </div>

      <p class="disclaimer" v-html="disclaimer"></p>

      <div class="action-buttons">
        <button class="btn btn-discard" @click="close">取消</button>
        <button class="btn btn-publish" @click="publishNote" :disabled="!message.trim()">发布</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { colors, quotes, disclaimer } from '../utils/data.js';
import { calculateWidth, truncateByWidth } from '../utils/common.js';

const props = defineProps({
  defaultName: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['close', 'publish']);

const message = ref('');
const signature = ref(props.defaultName);
const selectedColorIndex = ref(0);
const currentQuote = ref('');

const maxWidth = 180;
const maxLines = 6;
const maxSignatureWidth = 20;

const color = computed(() => {
  return colors[selectedColorIndex.value];
});

const shadowColor = computed(() => {
  return color.value.gradient.replace('0.3', '0.5');
});

const faintColor = computed(() => {
  return color.value.gradient.replace('0.3', '0.2');
});

// 计算留言和署名的当前宽度
const messageWidth = computed(() => calculateWidth(message.value));
const signatureWidth = computed(() => calculateWidth(signature.value));

// 监听留言输入
watch(message, (newValue) => {
  if (messageWidth.value > maxWidth) {
    message.value = truncateByWidth(newValue, maxWidth);
  }
});

// 监听署名输入
watch(signature, (newValue) => {
  if (signatureWidth.value > maxSignatureWidth) {
    signature.value = truncateByWidth(newValue, maxSignatureWidth);
  }
});

function selectColor(index) {
  selectedColorIndex.value = index;
}

// 思维模块逻辑
function getInspiration() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  let newQuote = quotes[randomIndex];
  while (newQuote === currentQuote.value) {
    const newIndex = Math.floor(Math.random() * quotes.length);
    newQuote = quotes[newIndex];
  }
  currentQuote.value = newQuote;
}

function publishNote() {
  emit('publish', {
    message: message.value,
    name: signature.value.trim() || '匿名用户',
    color: selectedColorIndex.value,
  });
  close();
}

function close() {
  emit('close');
}
</script>

<style lang="scss" scoped>
@use '../styles/common.scss';

.title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--panel-text-color);
  margin-bottom: 1rem;
}

.color-selector {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-swatch {
  position: relative;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
  -webkit-tap-highlight-color: transparent;

  &::after {
    content: '✔';
    position: absolute;
    top: 50%;
    left: 50%;
    color: #fff;
    text-shadow: 0 0 0.125rem rgba(0, 0, 0, 0.7);
    font-size: 1.2rem;
    font-weight: bold;
    line-height: 1;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.2s ease;
  }

  &.selected::after {
    transform: translate(-50%, -50%) scale(1);
  }
}

.textarea-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-faint-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  position: relative;
}

.main-textarea {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #fff;
  resize: none;
  font-size: 1rem;
}

.char-counter {
  font-size: 0.8rem;
  color: #888;
  text-align: right;
  margin-top: 0.25rem;
  transition: color 0.2s ease;

  &.over-limit {
    color: #e74c3c;
  }
}

.signature-input {
  background-color: transparent;
  color: #fff;
  border: 1px solid var(--panel-faint-color);
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  text-align: right;
  width: 100%;
  box-sizing: border-box;
}

.inspiration-container {
  margin: 1rem 0;
  padding: 0.5rem 0;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  color: var(--panel-text-color);
  opacity: 0.8;
  border: 1px dashed var(--panel-faint-color);
}


.disclaimer {
  font-size: 0.6rem;
  text-align: left;
  opacity: 0.6;
  flex-grow: 1;
  overflow-y: auto;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  gap: 1rem;
}
</style>
