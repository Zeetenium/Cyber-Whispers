const ERROR_CODES = {
	LOGIN_REQUIRED: 1001, // 需要登录
	AUTH_FAILED: 1002, // 身份验证失败
	PARAMS_INVALID: 2001, // 参数无效
	FORMAT_INVALID: 2002, // 格式不正确（如长度超限）
	NOTE_NOT_FOUND: 3001, // 留言不存在
	USER_NOT_FOUND: 3002, // 用户不存在
	ALREADY_LIKED: 4001, // 重复点赞
	INTERNAL_ERROR: 5000 // 服务器内部错误
};

// 计算文本宽度的辅助函数
function calculateTextWidth(text) {
	if (!text) return 0;
	const doubleByteChars = text.match(/[^\x00-\xff]/g) || [];
	return text.length + doubleByteChars.length;
}

// 校验昵称长度
function validateNickname(name) {
	if (!name || name.length > 20 || name.length < 1) {
		return {
			errCode: ERROR_CODES.PARAMS_INVALID,
			msg: '昵称长度必须在1到20个字符之间'
		};
	}
	return null;
}

module.exports = {
	// 校验添加留言的数据
	validateNoteData: function(noteData) {
		const {
			text,
			color
		} = noteData;

		if (!text) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要的参数：留言内容'
			};
		}

		if (calculateTextWidth(text) > 180) {
			return {
				errCode: ERROR_CODES.FORMAT_INVALID,
				msg: '留言内容不得超过180字符宽度'
			};
		}

		return null;
	},

	// 校验添加评论的数据
	validateCommentData: function(commentData) {
		const {
			noteId,
			text
		} = commentData;

		if (!noteId || !text) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要的参数：留言ID或评论内容'
			};
		}

		if (calculateTextWidth(text) > 180) {
			return {
				errCode: ERROR_CODES.FORMAT_INVALID,
				msg: '评论内容不得超过180字符宽度'
			};
		}

		return null; // 校验通过
	},

	// 校验点赞的数据
	validateLikeData: function(likeData) {
		const {
			noteId
		} = likeData;

		if (!noteId) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要的参数：留言ID'
			};
		}

		return null; // 校验通过
	},

	// 校验留言是否存在
	validateNoteExists: function(noteRes) {
		if (!noteRes.data || noteRes.data.length === 0) {
			return {
				errCode: ERROR_CODES.NOTE_NOT_FOUND,
				msg: '操作失败，留言不存在'
			};
		}
		return null;
	},

	// 校验是否已经点赞
	validateAlreadyLiked: function(note, userId) {
		const likeUserIds = note.likeUserIds || [];
		if (likeUserIds.includes(userId)) {
			return {
				errCode: ERROR_CODES.ALREADY_LIKED,
				msg: '您已经点赞过了'
			};
		}
		return null;
	},

	// 校验举报数据
	validateReportData: function(reportData) {
		const {
			noteId
		} = reportData;

		if (!noteId) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要的参数：留言ID'
			};
		}
		return null;
	},

	// 校验用户是否存在
	validateUserExists: function(userRes) {
		if (!userRes.data || userRes.data.length === 0) {
			return {
				errCode: ERROR_CODES.USER_NOT_FOUND,
				msg: '未找到指定的用户'
			};
		}
		return null;
	},

	// 校验更新昵称的参数
	validateUpdateNicknameParams: function(params) {
		const {
			newName
		} = params;

		if (!newName) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要参数：新昵称'
			};
		}

		const nicknameError = validateNickname(newName);
		if (nicknameError) return nicknameError;

		return null;
	},

	// 校验标记已读的参数
	validateMarkNotificationsAsReadParams: function(params, userId) {
		const {
			notificationIds
		} = params;
		if (!userId || !notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '参数不正确'
			};
		}
		return null;
	},

	// 校验认证参数
	validateAuthParams: function(params) {
		const {
			token,
			userId
		} = params || {};

		if (!token || !userId) {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少认证参数：token 或 userId'
			};
		}

		if (typeof token !== 'string' || typeof userId !== 'string') {
			return {
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '认证参数格式不正确'
			};
		}

		return null;
	}
};