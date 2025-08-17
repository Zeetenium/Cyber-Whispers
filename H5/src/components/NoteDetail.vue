<template>
  <div class="modal-overlay" @click.self.stop="close" @touchmove.stop>
    <div class="modal-panel" :style="{
      '--panel-border-color': color.borderColor,
      '--panel-shadow-color': shadowColor,
      '--panel-faint-color': faintColor,
      '--panel-text-color': color.textColor
    }">
      <div class="card-content">
        <div class="card-header header">
          <span>{{ formatDate(note.moment) }}</span>
          <span @click="handleReport">
            <svg class="icon" aria-hidden="true">
              <use xlink:href="#icon-jinggao-yuan-F"></use>
            </svg>
          </span>
        </div>

        <div class="card-body body">{{ note.message }}</div>

        <div class="card-footer">
          <div class="footer-left">
            <span class="footer-item" @click="handleLike">
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

      <hr class="detail-line" />

      <div class="comment-input">
        <textarea v-model="newCommentText" type="text" placeholder="请输入..." />
        <button @click="handleCommentSubmit" :disabled="!newCommentText.trim()">发送</button>
      </div>

      <hr class="detail-line" />

      <div class="comment-list">
        <div class="comment-item" v-for="c in comments" :key="c._id">
          <span class="comment-name">{{ c.userInfo.name }}</span>
          <span class="comment-date">{{ formatDate(c.createTime) }}</span>
          <span class="comment-text">{{ c.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { colors } from '../utils/data.js';
import { formatDate } from '../utils/common.js';

const props = defineProps({
  note: Object,
  comments: Array
});
const emit = defineEmits(['close', 'publish-comment', 'like', 'report']);

const newCommentText = ref('');

const color = computed(() => {
  if (props.note && typeof props.note.color !== 'undefined') {
    return colors[props.note.color];
  }
  return colors[0];
});

const shadowColor = computed(() => {
  return color.value.gradient.replace('0.3', '0.5');
});

const faintColor = computed(() => {
  return color.value.gradient.replace('0.3', '0.2');
});

// 处理点赞事件
const handleLike = () => {
  if (props.note.isLiked) {
    return;
  }
  emit('like', props.note.id);
};

// 处理举报事件
const handleReport = () => {
  emit('report', props.note.id);
};

// 处理提交评论事件
const handleCommentSubmit = () => {
  emit('publish-comment', {
    noteId: props.note.id,
    text: newCommentText.value
  });
  newCommentText.value = '';
};

const close = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
@use '../styles/common.scss';

.card-content {
  color: var(--panel-text-color);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.body {
  height: 10rem;
  color: #fff;
}

.detail-line {
  margin: 1rem 0;
  width: 100%;
  border: none;
  height: 1px;
  background-color: #DEE2E6;
}

.comment-input {
  display: flex;
  align-items: center;
  width: 100%;
  height: 3rem;
  gap: 0.5rem;
}

.comment-input textarea {
  flex: 1;
  height: 3rem;
  padding: 0.5rem;
  border-radius: 0.4rem;
  background-color: transparent;
  color: #fff;
  resize: none;
  border: 1px solid var(--panel-faint-color);
}

.comment-input button {
  width: 2rem;
  height: 3rem;
  border: none;
  border-radius: 0.4rem;
  background-color: var(--panel-border-color);
  color: #1a1a2e;
}

.comment-input button:disabled {
  background-color: var(--panel-border-color) !important;
  opacity: 0.5;
}

.comment-list {
  overflow-y: auto;
  padding-right: 0.5rem;
}

.comment-item {
  border-bottom: 0.06rem solid var(--panel-faint-color);
  padding: 0.5rem 0;
}

.comment-name {
  font-weight: bold;
  font-size: 0.9rem
}

.comment-date {
  margin: 0 0.5rem;
  opacity: 0.8;
  font-size: 0.75rem;
}

.comment-text {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.85rem;
}
</style>