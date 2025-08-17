const db = uniCloud.database();
const notesCollection = db.collection('notes');
const usersCollection = db.collection('users');
const notificationsCollection = db.collection('notifications');
const dbCmd = db.command;

const validators = require('./common/validators.js');
const auth = require('./common/auth.js');

const ERROR_CODES = {
	LOGIN_REQUIRED: 1001, // 需要登录
	AUTH_FAILED: 1002, // 身份验证失败
	PARAMS_INVALID: 2001, // 参数无效
	NOTE_NOT_FOUND: 3001, // 留言不存在
	INTERNAL_ERROR: 5000 // 服务器内部错误
};

module.exports = {
	_before: auth._before,

	// 获取留言列表
	getList: async function(params) {
		const loginUserId = this.authInfo ? this.authInfo._id : null;
		const res = await notesCollection.orderBy('createTime', 'desc').get();
		
		const noteExistsError = validators.validateNoteExists(res);
		if (noteExistsError) return noteExistsError;

		if (loginUserId) {
			res.data.forEach(note => {
				note.isLiked = (note.likeUserIds && Array.isArray(note.likeUserIds)) ? 
					note.likeUserIds.includes(loginUserId) : false;
			});
		}

		return {
			errCode: 0,
			msg: '获取成功',
			data: res.data
		};
	},

	// 添加留言
	addNote: async function(noteData) {
		const validationError = validators.validateNoteData(noteData);
		if (validationError) return validationError;

		const { _id } = this.authInfo;
		const userInfo = { userId: _id };
		const { text, color, name } = noteData;

		const noteToAdd = {
			text: text,
			color: color,
			userInfo: {
				userId: userInfo.userId,
				name: name
			},
			createTime: new Date(),
			likeCount: 0,
			commentCount: 0,
			reportCount: 0,
			likeUserIds: [],
			comments: []
		};

		try {
			const addRes = await notesCollection.add(noteToAdd);
			if (!addRes.id) {
				return {
					errCode: 5000,
					msg: '留言写入数据库失败'
				};
			}

			await usersCollection.doc(userInfo.userId).update({
				publishCount: dbCmd.inc(1)
			});

			return {
				errCode: 0,
				msg: '发布成功',
				id: addRes.id
			};
		} catch (error) {
			return {
				errCode: 5000,
				msg: '操作失败：' + error.message
			};
		}
	},

	// 点赞留言
	likeNote: async function(likeData) {
		const validationError = validators.validateLikeData(likeData);
		if (validationError) return validationError;

		const { _id, name } = this.authInfo;
		const actorInfo = { userId: _id, name: name };
		const { noteId } = likeData;
		const userId = actorInfo.userId;

		try {
			const noteRes = await notesCollection.doc(noteId).get();
			const noteExistsError = validators.validateNoteExists(noteRes);
			if (noteExistsError) return noteExistsError;

			const note = noteRes.data[0];
			const alreadyLikedError = validators.validateAlreadyLiked(note, userId);
			if (alreadyLikedError) return alreadyLikedError;

			const recipientId = note.userInfo.userId;

			const updateRes = await notesCollection.doc(noteId).update({
				likeCount: dbCmd.inc(1),
				likeUserIds: dbCmd.addToSet(userId)
			});

			if (updateRes.updated !== 1) {
				return {
					errCode: 5000,
					msg: '点赞失败，更新留言数据失败'
				};
			}

			await usersCollection.doc(userId).update({
				likeCount: dbCmd.inc(1)
			});

			if (recipientId !== userId) {
				const notificationToAdd = {
					recipientId: recipientId,
					actorInfo: actorInfo,
					noteId: noteId,
					noteContent: note.text.substring(0, 8) + (note.text.length > 8 ? '...' : ''),
					type: 'like',
					createTime: new Date(),
					isRead: false
				};

				notificationsCollection.add(notificationToAdd).catch(err => {
					console.error('点赞通知发送失败:', err);
				});
			}

			return {
				errCode: 0,
				msg: '点赞成功'
			};
		} catch (error) {
			return {
				errCode: 5000,
				msg: '操作失败：' + error.message
			};
		}
	},

	// 添加评论
	addComment: async function(commentData) {
		const validationError = validators.validateCommentData(commentData);
		if (validationError) return validationError;

		const { _id, name } = this.authInfo;
		const userInfo = { userId: _id, name: name };
		const { noteId, text } = commentData;

		const noteRes = await notesCollection.doc(noteId).get();
		const noteExistsError = validators.validateNoteExists(noteRes, '评论失败，留言不存在');
		if (noteExistsError) return noteExistsError;

		const note = noteRes.data[0];
		const recipientId = note.userInfo.userId;

		const commentToAdd = {
			_id: Date.now().toString(36) + Math.random().toString(36).substring(2),
			text: text,
			userInfo: userInfo,
			createTime: new Date()
		};

		try {
			const updateRes = await notesCollection.doc(noteId).update({
				comments: dbCmd.push(commentToAdd),
				commentCount: dbCmd.inc(1)
			});

			if (updateRes.updated !== 1) {
				return {
					errCode: 5000,
					msg: '评论写入数据库失败'
				};
			}

			await usersCollection.doc(userInfo.userId).update({
				commentCount: dbCmd.inc(1)
			});

			if (recipientId !== userInfo.userId) {
				const notificationToAdd = {
					recipientId: recipientId,
					actorInfo: userInfo,
					noteId: noteId,
					noteContent: note.text.substring(0, 8) + (note.text.length > 8 ? '...' : ''),
					type: 'comment',
					commentContent: text.substring(0, 8) + (text.length > 8 ? '...' : ''),
					createTime: new Date(),
					isRead: false
				};

				notificationsCollection.add(notificationToAdd).catch(err => {
					console.error('评论通知发送失败:', err);
				});
			}

			return {
				errCode: 0,
				msg: '评论发布成功',
				commentId: commentToAdd._id
			};
		} catch (error) {
			console.error('添加评论 - 发生错误:', error);
			return {
				errCode: 5000,
				msg: '操作失败：' + error.message
			};
		}
	},

	// 举报留言
	reportNote: async function(reportData) {
		const validationError = validators.validateReportData(reportData);
		if (validationError) return validationError;

		const { noteId } = reportData;

		try {
			const updateRes = await notesCollection.doc(noteId).update({
				reportCount: dbCmd.inc(1)
			});

			if (updateRes.updated !== 1) {
				const checkNote = await notesCollection.doc(noteId).get();
				const noteExistsError = validators.validateNoteExists(checkNote);
				if (noteExistsError) return noteExistsError;

				return {
					errCode: 5000,
					msg: '举报失败，更新数据库失败'
				};
			}

			return {
				errCode: 0,
				msg: '举报成功'
			};
		} catch (error) {
			console.error('举报留言 - 发生错误:', error);
			return {
				errCode: 5000,
				msg: '操作失败：' + error.message
			};
		}
	}
};