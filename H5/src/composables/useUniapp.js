export function useUniapp(
	notes,
	isFilterMyNotes,
	isPerformanceMode,
	isInitialLoad
) {
	const currentUser = ref(null);
	const isWriteNoteVisible = ref(false);
	const pendingActions = new Map(); // 用于存放乐观更新后等待Uniapp端确认的待定操作 包含回滚函数

	// 处理发布留言事件
	const publishNote = (notePayload) => {
		uni.webView.postMessage({
			data: { type: "addNote", payload: notePayload },
		});
		isWriteNoteVisible.value = false;
	};

	// 处理点赞事件
	const likeNote = (noteId, currentNoteData) => {
		if (!noteId || !currentNoteData) return;

		const correlationId = `like_${noteId}_${Date.now()}`;
		const originalLike = currentNoteData.like;
		const originalIsLiked = currentNoteData.isLiked;

		// 回滚函数，用于操作失败时恢复原始状态
		const rollback = () => {
			const noteToRollback = notes.value.find(
				(n) => n.noteData.id === noteId
			)?.noteData;
			if (noteToRollback) {
				noteToRollback.like = originalLike;
				noteToRollback.isLiked = originalIsLiked;
			}
		};
		// 乐观更新
		currentNoteData.like++;
		currentNoteData.isLiked = true;

		pendingActions.set(correlationId, { rollback });

		uni.webView.postMessage({
			data: { type: "likeNote", payload: { noteId }, correlationId },
		});
	};

	// 处理发布评论事件
	const publishComment = (commentPayload) => {
		const { noteId, text } = commentPayload;
		if (!noteId || !text) return;

		const noteToUpdate = notes.value.find(
			(n) => n.noteData.id === noteId
		)?.noteData;
		if (!noteToUpdate) return;

		const correlationId = `comment_${noteId}_${Date.now()}`;
		const originalComments = [...noteToUpdate.comments];
		const originalCommentCount = noteToUpdate.comment;

		// 回滚函数，用于操作失败时恢复原始状态
		const rollback = () => {
			const noteToRollback = notes.value.find(
				(n) => n.noteData.id === noteId
			)?.noteData;
			if (noteToRollback) {
				noteToRollback.comments = originalComments;
				noteToRollback.comment = originalCommentCount;
			}
		};
		// 乐观更新
		noteToUpdate.comment++;
		noteToUpdate.comments.push({
			_id: `temp_${correlationId}`,
			text: text,
			createTime: new Date().toISOString(),
			userInfo: {
				userId: currentUser.value?._id || "local",
				name: currentUser.value?.name || "我",
			},
		});

		pendingActions.set(correlationId, { rollback });

		uni.webView.postMessage({
			data: {
				type: "addComment",
				payload: commentPayload,
				correlationId,
			},
		});
	};

	// 处理举报事件
	const reportNote = (noteId) => {
		if (!noteId) return;
		uni.webView.postMessage({
			data: { type: "reportNote", payload: { noteId } },
		});
	};

	// 接收Uniapp端notes并进行解析与初始化
	const receiveNotesHandler = (cloudNotes) => {
		const mappedNotes = cloudNotes.map((note) => ({
			noteData: {
				id: note._id,
				message: note.text,
				color: note.color,
				moment: new Date(note.createTime),
				userId: note.userInfo.userId,
				name: note.userInfo.name,
				like: note.likeCount,
				comment: note.commentCount,
				report: note.reportCount,
				comments: note.comments || [],
				isLiked: note.isLiked || false,
			},
			transform: `translateX(-50%) translateY(150px) scale(0.8)`,
			opacity: "0",
		}));
		notes.value = mappedNotes;
		isInitialLoad.value = true;
	};

	// 接收乐观更新后Uniapp端操作结果
	const resolveActionHandler = ({ correlationId, status, error }) => {
		if (!pendingActions.has(correlationId)) return;
		const { rollback } = pendingActions.get(correlationId);
		if (status === "error") {
			console.error("useUniapp: 操作失败，执行回滚", {
				correlationId,
				error,
			});
			rollback();
		}
		pendingActions.delete(correlationId);
	};

	// 接收Uniapp端用户信息
	const receiveUserInfoHandler = (userInfo) => {
		currentUser.value = userInfo;
	};

	// 处理来自Uniapp的“只看我的”模式变更
	const setFilterModeHandler = (isEnabled) => {
		isFilterMyNotes.value = isEnabled;
	};

	// 处理来自Uniapp的“性能模式”变更
	const setPerformanceModeHandler = (isEnabled) => {
		isPerformanceMode.value = isEnabled;
	};

	// 控制发布留言模态框的显示
	const showWriteModalHandler = () => {
		isWriteNoteVisible.value = true;
	};

	onMounted(() => {
		window.receiveNotes = receiveNotesHandler;
		window.resolveAction = resolveActionHandler;
		window.receiveUserInfo = receiveUserInfoHandler;
		window.setFilterMode = setFilterModeHandler;
		window.setPerformanceMode = setPerformanceModeHandler;
		window.addEventListener("showWriteModal", showWriteModalHandler);
	});

	onUnmounted(() => {
		delete window.receiveNotes;
		delete window.resolveAction;
		delete window.receiveUserInfo;
		delete window.setFilterMode;
		delete window.setPerformanceMode;
		window.removeEventListener("showWriteModal", showWriteModalHandler);
	});

	return {
		currentUser,
		isWriteNoteVisible,
		publishNote,
		likeNote,
		publishComment,
		reportNote,
	};
}
