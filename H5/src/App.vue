<template>
  <div class="container" @touchstart="handleTouchStart" @touchmove="handleTouchMove">
    <date-picker :notes="filteredNotes" @jump-to-index="handleDateJump" @update:visibility="handlePickerVisibility"
      @click.stop />
    <div class="notes-wrapper" :class="{ 'is-hidden-by-picker': isPickerVisible, 'is-fading': isFading }">
      <rainbow-title text="Cyber Whispers" />

      <zt-card v-for="(note, index) in renderedNotes" :key="note.noteData.id" class="note"
        :class="{ 'is-active': note.noteData.id === currentIndex }" :style="{
          transform: note.transform,
          opacity: note.opacity,
          zIndex: renderedNotes.length - index,
          transitionDuration: transitionDuration,
          pointerEvents: note.pointerEvents || 'auto'
        }" :note="note.noteData" @like="handleNoteLike" @click="handleContainerClick" />
    </div>
  </div>
  <Transition name="modal">
    <note-detail v-if="selectedNote" :note="selectedNote" :comments="selectedNote.comments" @close="closeDetail"
      @publish-comment="handleCommentPublish" @like="handleNoteLike" @report="handleNoteReport" />
  </Transition>
  <Transition name="modal">
    <write-note v-if="isWriteNoteVisible" :default-name="currentUser?.name || ''" @close="isWriteNoteVisible = false"
      @publish="handleNotePublish" @click.stop />
  </Transition>
</template>

<script setup>
import { useUniapp } from './composables/useUniapp';

const notes = ref([]);
const currentIndex = ref(0);
const selectedNote = ref(null);
const isAnimating = ref(false);
const isFading = ref(false);
const isPickerVisible = ref(false);
const isFilterMyNotes = ref(false);
const isPerformanceMode = ref(false);
const transitionDuration = ref('0.5s');
const interactionCooldown = ref(false);
const isInitialLoad = ref(true);

const touchStartY = ref(0);
const touchStartTime = ref(0);

const {
  currentUser,
  isWriteNoteVisible,
  publishNote,
  publishComment,
  likeNote,
  reportNote
} = useUniapp(notes, isFilterMyNotes, isPerformanceMode, isInitialLoad);

// 是否筛选“我的笔记”
const filteredNotes = computed(() => {
  if (isFilterMyNotes.value && currentUser.value?._id) {
    return notes.value.filter(note => note.noteData.userId === currentUser.value._id);
  }
  return notes.value;
});

// 计算实际需要在DOM中渲染的笔记子集，以优化性能
const renderedNotes = computed(() => {
  const allNotes = filteredNotes.value;
  if (!allNotes.length) return [];

  const renderBuffer = 2;
  const startIndex = Math.max(0, currentIndex.value - renderBuffer);
  const endIndex = Math.min(allNotes.length, currentIndex.value + 3 + renderBuffer);

  return allNotes.slice(startIndex, endIndex);
});

// 监听笔记数据变化
watch(notes, (newNotes) => {
  if (selectedNote.value) {
    const updatedNote = newNotes.find(
      note => note.noteData.id === selectedNote.value.id
    );
    if (updatedNote) {
      selectedNote.value = updatedNote.noteData;
    } else {
      selectedNote.value = null;
    }
  }
}, { deep: true });

// 处理初次加载和筛选状态切换时的笔记卡片位置重置
watch(filteredNotes, (newFilteredList, oldFilteredList) => {
  if (isInitialLoad.value && newFilteredList.length > 0) {
    nextTick(() => {
      updateNotePositions(currentIndex.value);
    });
    isInitialLoad.value = false;
    return;
  }

  if (newFilteredList.length !== oldFilteredList.length) {
    isAnimating.value = true;
    transitionDuration.value = '0s'; // 立即变化，无动画
    currentIndex.value = 0;

    nextTick(() => {
      updateNotePositions(0);
      setTimeout(() => {
        transitionDuration.value = '0.5s';
        isAnimating.value = false;
      }, 50);
    });
  }
}, { deep: true });

// 更新所有渲染出的笔记卡片的位置、缩放和透明度
const updateNotePositions = (startIndex) => {
  const V_SCALE_STEP = 0.15;
  const Y_OFFSETS = [65, 30, 0];
  const VISIBLE_COUNT = 3;
  const allNotes = filteredNotes.value;
  if (!allNotes.length) return;

  const rendered = renderedNotes.value;
  const renderBuffer = 2;
  const renderStartIndex = Math.max(0, startIndex - renderBuffer);

  rendered.forEach((note, relativeIndex) => {
    const globalIndex = renderStartIndex + relativeIndex;
    const relToStart = globalIndex - startIndex;

    let transform, opacity, pointerEvents;
    if (relToStart < 0) {
      const pastIndex = Math.abs(relToStart);
      transform = `translateX(-50%) translateY(${120}px) scale(${Math.min(1 + (pastIndex * 0.20), 2)})`;
      opacity = Math.max(0, 1 - (pastIndex * 1)).toString();
      pointerEvents = 'none';
    } else if (relToStart < VISIBLE_COUNT) {
      transform = `translateX(-50%) translateY(${Y_OFFSETS[relToStart]}px) scale(${1 - (relToStart * V_SCALE_STEP)})`;
      opacity = '1';
      pointerEvents = 'auto';
    } else {
      transform = `translateX(-50%) translateY(${-25}px) scale(${1 - (VISIBLE_COUNT * V_SCALE_STEP)})`;
      opacity = '0';
      pointerEvents = 'none';
    }

    if (note.transform !== transform || note.opacity !== opacity) {
      note.transform = transform;
      note.opacity = opacity;
      note.pointerEvents = pointerEvents;
    }
  });
};

// 切换到下一张笔记
const nextNote = () => {
  if (currentIndex.value >= filteredNotes.value.length - 1 || isAnimating.value) return;
  isAnimating.value = true;
  transitionDuration.value = '0.5s';
  currentIndex.value++;
  updateNotePositions(currentIndex.value);
  setTimeout(() => { isAnimating.value = false; }, 500);
};

// 切换到上一张笔记
const prevNote = () => {
  if (currentIndex.value <= 0 || isAnimating.value) return;
  isAnimating.value = true;
  transitionDuration.value = '0.5s';
  currentIndex.value--;
  updateNotePositions(currentIndex.value);
  setTimeout(() => { isAnimating.value = false; }, 500);
};

// 一次性跳过多个笔记
/* TODO: 这里理论上把renderedNotes的范围调大到5以上 然后通过手动设定两个方向的5张卡片的最终位置和透明度变化来实现动画效果
动画完成之后再一次性更新周围所需更新的DOM 可以大大降低性能消耗 但是代码复杂度很高 可行性也有待商榷*/
const skipNotes = (count) => {
  if (isAnimating.value) return;
  const targetIndex = Math.max(0, Math.min(filteredNotes.value.length - 1, currentIndex.value + count));
  if (targetIndex === currentIndex.value) return;

  isAnimating.value = true;

  // 性能模式下直接使用淡入淡出
  if (isPerformanceMode.value) {
    isFading.value = true;
    transitionDuration.value = '0.3s';
    setTimeout(() => {
      transitionDuration.value = '0s';
      currentIndex.value = targetIndex;
      updateNotePositions(currentIndex.value);
      setTimeout(() => {
        transitionDuration.value = '0.5s';
        isFading.value = false;
        setTimeout(() => { isAnimating.value = false; }, 500);
      }, 50);
    }, 300);
  } else {
    const direction = Math.sign(count);
    let remaining = Math.abs(count);
    const fastAnimationDuration = 60;
    transitionDuration.value = `${fastAnimationDuration / 1000}s`;

    const animateStep = () => {
      if (remaining <= 0) {
        transitionDuration.value = '0.5s';
        isAnimating.value = false;
        return;
      }
      const nextIndex = currentIndex.value + direction;
      if (nextIndex >= filteredNotes.value.length || nextIndex < 0) {
        isAnimating.value = false;
        return;
      }
      currentIndex.value = nextIndex;
      updateNotePositions(currentIndex.value);
      remaining--;
      if (remaining === 0) {
        transitionDuration.value = `${400 / 1000}s`;
      }
      // 使用requestAnimationFrame来平滑快速滚动动画
      requestAnimationFrame(() => {
        setTimeout(animateStep, fastAnimationDuration);
      });
    };
    animateStep();
  }
};

// 处理从日期选择器跳转到指定笔记的逻辑
const handleDateJump = (targetIndex) => {
  if (isAnimating.value) return;
  const count = targetIndex - currentIndex.value;
  if (count === 0) return;

  // 当跳转距离过长时，先瞬间跳到目标附近，再执行动画，避免大量消耗性能
  const JUMP_OPTIMIZATION_THRESHOLD = 5;
  if (Math.abs(count) > JUMP_OPTIMIZATION_THRESHOLD) {
    const direction = Math.sign(count);
    const intermediateIndex = targetIndex - (direction * JUMP_OPTIMIZATION_THRESHOLD);

    isAnimating.value = true;
    transitionDuration.value = '0s';
    currentIndex.value = intermediateIndex;
    updateNotePositions(currentIndex.value);

    nextTick(() => {
      transitionDuration.value = '0.5s';
      isAnimating.value = false;
      skipNotes(direction * JUMP_OPTIMIZATION_THRESHOLD);
    });
  } else {
    skipNotes(count);
  }
};

// 处理触摸开始事件
const handleTouchStart = (event) => {
  touchStartY.value = event.touches[0].clientY;
  touchStartTime.value = Date.now();
};

// 处理触摸滑动事件
const handleTouchMove = (event) => {
  if (isAnimating.value) return;
  const touchEndY = event.touches[0].clientY;
  const deltaY = touchEndY - touchStartY.value;

  if (Math.abs(deltaY) > 50) { // 滑动距离超过一定量才触发
    const deltaTime = Math.max(1, Date.now() - touchStartTime.value);
    const velocity = Math.abs(deltaY / deltaTime);

    // 根据滑动速度判断是普通切换还是快速跳跃
    if (velocity > 1.2) {
      if (interactionCooldown.value) return;
      interactionCooldown.value = true; // 增加冷却，防止快速滑动时连续触发
      setTimeout(() => { interactionCooldown.value = false; }, 1500);
      const notesToSkip = Math.min(5, Math.max(2, Math.floor(velocity * 4)));
      skipNotes(deltaY > 0 ? notesToSkip : -notesToSkip);
    } else {
      deltaY > 0 ? nextNote() : prevNote();
    }
    touchStartY.value = touchEndY;
    touchStartTime.value = Date.now();
  }
};

// 处理卡片容器的点击事件
const handleContainerClick = () => {
  if (selectedNote.value || isPickerVisible.value) return;
  if (filteredNotes.value.length > 0 && currentIndex.value >= 0) {
    openDetail(notes.value[currentIndex.value].noteData);
  }
};

const openDetail = (note) => { selectedNote.value = note; };
const closeDetail = () => { selectedNote.value = null; };
const handlePickerVisibility = (isVisible) => { isPickerVisible.value = isVisible; };

const handleNotePublish = (notePayload) => {
  publishNote(notePayload);
};

const handleCommentPublish = (commentPayload) => {
  publishComment(commentPayload);
};

const handleNoteLike = (noteId) => {
  const currentNote = filteredNotes.value.find(n => n.noteData.id === noteId);
  if (currentNote) {
    likeNote(noteId, currentNote.noteData);
  }
};

const handleNoteReport = (noteId) => {
  reportNote(noteId);
};
</script>


<style lang="scss" scoped>
.container {
  position: relative;
  width: 100vw;
  height: 100vh;
  margin: 0;
  background: radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 44vh;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background:
      radial-gradient(circle at 30% 20%, rgba(0, 224, 255, 0.2) 0%, transparent 40%),
      radial-gradient(circle at 70% 80%, rgba(187, 0, 255, 0.2) 0%, transparent 40%);
    z-index: 10;
    pointer-events: none;
  }
}

.note {
  position: absolute;
  left: 50%;
  transform-origin: center;
  transition: transform 0.5s ease, opacity 0.5s ease;
  will-change: transform, opacity;
}

.note.is-active {
  box-shadow: 0 0 20px currentColor;
}

.notes-wrapper {
  position: relative;
  width: 100%;
}

.notes-wrapper.is-hidden-by-picker {
  pointer-events: none;
  visibility: hidden;
}

.notes-wrapper.is-fading .note {
  opacity: 0 !important;
  transition: opacity 0.3s ease-out;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.5s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>