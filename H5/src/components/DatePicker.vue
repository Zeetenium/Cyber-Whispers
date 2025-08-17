<template>
  <div class="datepicker-container">
    <div class="date-display" @click.stop="toggleDatePicker">
      <span>{{ formattedDate }}</span>
      <span class="arrow" :class="{ 'is-open': isVisible }">▾</span>
    </div>

    <Transition name="datepicker-fade">
      <div v-if="isVisible" class="calendar-wrapper">
        <date-picker v-model:value="selectedDate" @change="handleDateSelect" :append-to-body="false"
          :open="isVisible"></date-picker>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';

const props = defineProps({
  notes: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['jump-to-index', 'update:visibility']);

const isVisible = ref(false);
const selectedDate = ref(new Date());

const formattedDate = computed(() => {
  const year = selectedDate.value.getFullYear();
  const month = (selectedDate.value.getMonth() + 1).toString().padStart(2, '0');
  const day = selectedDate.value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// 切换日期选择器的显示和隐藏状态
const toggleDatePicker = () => {
  isVisible.value = !isVisible.value;
  emit('update:visibility', isVisible.value);
};

// 处理日期选择事件，找到最匹配的笔记并跳转
const handleDateSelect = () => {
  if (!selectedDate.value) return;

  if (props.notes.length === 0) {
    isVisible.value = false;
    emit('update:visibility', false);
    return;
  }

  const targetDate = new Date(selectedDate.value);
  targetDate.setHours(0, 0, 0, 0);
  let bestMatchIndex = -1;

  // 找到第一个日期大于或等于所选日期的笔记
  // TODO: 因notes为按照时间排序，此处可使用二分查找优化
  for (let i = props.notes.length - 1; i >= 0; i--) {
    const noteDate = new Date(props.notes[i].noteData.moment);
    noteDate.setHours(0, 0, 0, 0);
    if (noteDate >= targetDate) {
      bestMatchIndex = i;
      break;
    }
  }

  if (bestMatchIndex !== -1) {
    emit('jump-to-index', bestMatchIndex);
  } else {
    emit('jump-to-index', 0);
  }

  isVisible.value = false;
  emit('update:visibility', false);
};
</script>

<style lang="scss" scoped>
.datepicker-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 50px 20px 0 20px;
  height: 5.5rem;
  display: flex;
  background-color: rgba(10, 10, 26, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 224, 255, 0.2);
  flex-direction: column;
  align-items: center;
  z-index: 1000;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00e0ff;
  font-size: 1.2rem;
  text-shadow: 0 0 0.1rem #00e0ff;
  margin-bottom: 15px;
  transition: color 0.3s ease;
  position: relative;
}

.arrow {
  position: absolute;
  right: -15px;
  font-size: 1rem;
  transition: transform 0.3s ease-in-out;

  &.is-open {
    transform: rotate(180deg);
  }
}

.mx-datepicker {
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  width: 15.5rem;
}

.datepicker-fade-enter-active,
.datepicker-fade-leave-active {
  transition: all 0.4s ease;
}

.datepicker-fade-enter-from,
.datepicker-fade-leave-to {
  opacity: 0;
}

:deep(.mx-datepicker) {
  .mx-input-wrapper {
    display: none;
  }
}

:deep(.mx-calendar) {
  background-color: #0a0a1a;
  border: 0.05rem solid rgba(187, 0, 255, 0.5);
  color: #fff;
  box-shadow: 0 0 1rem rgba(187, 0, 255, 0.3);
  padding: 0.5rem;
  width: 15.5rem;
}

:deep(.mx-calendar-header) {
  color: #00e0ff;
}

:deep(.mx-table-date td:hover) {
  background-color: rgba(0, 224, 255, 0.2);
  color: #00e0ff;
  border-radius: 50%;
}

:deep(.mx-table-date .today) {
  color: #bb00ff;
  border: 1px solid #bb00ff;
  border-radius: 50%;
}

:deep(.mx-table-date .active) {
  background-color: #00e0ff;
  color: #0a0a1a;
  border-radius: 50%;
  box-shadow: 0 0 0.5rem #00e0ff;
}

:deep(.mx-table-date .disabled) {
  color: #555;
}
</style>