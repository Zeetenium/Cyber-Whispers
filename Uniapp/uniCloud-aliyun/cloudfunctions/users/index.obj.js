const db = uniCloud.database();
const usersCollection = db.collection('users');
const notificationsCollection = db.collection('notifications');
const dbCmd = db.command;
const auth = require('./common/auth.js');
const validators = require('./common/validators.js');

const emailValidateCode = uniCloud.importObject("email-validate-code");

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

module.exports = {
	_before: auth._before,

    // 登录或注册
    login: async function(params) {
        const { email, code, _id } = params;
        if (!email || !code || !_id) {
            return { errCode: ERROR_CODES.PARAMS_INVALID, msg: '参数不完整' };
        }

        try {
            // 验证邮箱验证码
            const validateRes = await emailValidateCode.validateEmailCode({ _id, email, code });
            if (!validateRes.success) {
                return { errCode: ERROR_CODES.AUTH_FAILED, msg: validateRes.message || '验证码错误或已失效' };
            }

            // 查找或创建用户
            let userRes = await usersCollection.where({ email }).get();
            let userId;
            let userInfo;

            if (userRes.data.length === 0) {
                // 用户不存在 创建新用户
                const defaultName = email.split('@')[0];
                const userToAdd = {
                    email: email,
                    name: defaultName,
                    createTime: Date.now(),
                    likeCount: 0,
                    commentCount: 0,
                    publishCount: 0
                };
                const addResult = await usersCollection.add(userToAdd);
                if (!addResult.id) {
                    return { errCode: ERROR_CODES.INTERNAL_ERROR, msg: '创建用户失败' };
                }
                userId = addResult.id;
                userInfo = { ...userToAdd, _id: userId };
            } else {
                // 用户已存在
                userId = userRes.data[0]._id;
                userInfo = userRes.data[0];
            }

            // 生成并更新Token
            const token = 'token_' + Date.now() + Math.random().toString(36).substring(2);
            const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天后过期

            await usersCollection.doc(userId).update({
                token: token,
                tokenExpired: tokenExpired
            });

            return {
                errCode: 0,
                msg: '登录成功',
                data: {
                    userId: userId,
                    token: token,
                    userInfo: userInfo
                }
            };
        } catch (error) {
            return { errCode: ERROR_CODES.INTERNAL_ERROR, msg: '服务器内部错误：' + error.message };
        }
    },
	
	// 获取用户信息
	getUserProfile: async function(params) {
		try {
			return {
				errCode: 0,
				msg: '获取成功',
				data: this.authInfo
			};
		} catch (error) {
			return { errCode: ERROR_CODES.INTERNAL_ERROR, msg: '获取用户信息失败：' + error.message };
		}
	},
	
	// 更新用户昵称
	updateNickname: async function(params) {
		const validationError = validators.validateUpdateNicknameParams(params);
		if (validationError) return validationError;
		
		const { newName } = params;
		const userId = this.authInfo._id;
		
		try {
			const updateRes = await usersCollection.doc(userId).update({
				name: newName
			});
			if (updateRes.updated !== 1) {
				return {
					errCode: ERROR_CODES.USER_NOT_FOUND,
					msg: '更新昵称失败，未找到用户或无权限'
				};
			}
			return {
				errCode: 0,
				msg: '昵称更新成功'
			};
		} catch (error) {
			return {
				errCode: ERROR_CODES.INTERNAL_ERROR,
				msg: '数据库操作失败：' + error.message
			};
		}
	},
	
	// 获取当前用户的通知列表
	getNotifications: async function(params) {
		const userId = this.authInfo._id;
		
		try {
			const res = await notificationsCollection
				.where({
					recipientId: userId
				})
				.orderBy('createTime', 'desc')
				.get();
			return {
				errCode: 0,
				msg: '获取成功',
				data: res.data
			};
		} catch (error) {
			return {
				errCode: ERROR_CODES.INTERNAL_ERROR,
				msg: '获取通知列表失败：' + error.message
			};
		}
	}
}