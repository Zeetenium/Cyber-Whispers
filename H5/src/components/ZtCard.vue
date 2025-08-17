<template>
  <div class="zt-card">
    <div class="card-header">{{ formatDate(note.moment) }}</div>

    <div class="card-body">{{ note.message }}</div>

    <div class="card-footer">
      <div class="footer-left">
        <span class="footer-item" @click.stop="handleLike">
          <svg class="icon" aria-hidden="true">
            <use :xlink:href="note.isLiked ? '#icon-aixin1' : '#icon-aixin'"></use>
          </svg>
          <span>{{ note.like }}</span>
        </span>

        <span v-if="note.comment > 0" class="footer-item">
          <svg class="icon" aria-hidden="true">
            <use xlink:href="#icon-pinglun"></use>
          </svg>
          <span>{{ note.comment }}</span>
        </span>
      </div>

      <div class="footer-right">{{ note.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { colors } from '../utils/data.js';
import { formatDate } from '../utils/common.js';
import "../assets/images/iconfont.js";

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
});
const emit = defineEmits(['like']);

const color = computed(() => {
  if (props.note && typeof props.note.color !== 'undefined' && colors[props.note.color]) {
    return colors[props.note.color];
  }
  return colors[0];
});

// 处理点赞事件
const handleLike = () => {
  if (props.note.isLiked) {
    return;
  }
  emit('like', props.note.id);
};
</script>

<style lang="scss" scoped>
@use '../styles/common.scss';

.zt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 80vw;
  height: 60vw;
  padding: 1rem;
  border: 0.125rem solid;
  border-radius: 0.625rem;
  opacity: 0;
  overflow: hidden;
  background-color: v-bind('color.background');
  border-color: v-bind('color.borderColor');
  color: v-bind('color.textColor');
  //TODO: 在某些移动设备上快速滑动时观察到闪烁现象，可能与此处的独立渲染层有关，需进一步测试
  transform: translateZ(0);
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle,
        v-bind('color.gradient') 0%,
        transparent 70%);
    transform: translateZ(0);
    pointer-events: none;
  }
}
</style>