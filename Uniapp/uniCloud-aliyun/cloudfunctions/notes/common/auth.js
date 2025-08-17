const db = uniCloud.database();
const usersCollection = db.collection('users');

const ERROR_CODES = {
    LOGIN_REQUIRED: 1001, // 需要登录
    AUTH_FAILED: 1002,    // 身份验证失败（token过期或无效）
    PARAMS_INVALID: 2001, // 参数无效
};

async function userAuth(userId, token) {
	const userRes = await usersCollection.doc(userId).get();
	if (!userRes.data || userRes.data.length === 0) {
		return null; 
	}
	const user = userRes.data[0];
	if (user.token !== token || user.tokenExpired < Date.now()) {
		return null; 
	}
	return user;
}

module.exports = {
	_before: async function() {
		const methodName = this.getMethodName();
		const params = this.getParams();

		// 不需要强制登录校验的方法列表
		const publicMethods = ['getList', 'login', 'reportNote']; 

		if (publicMethods.includes(methodName)) {
			// 对于 getList 如果提供了用户信息 则尝试获取以便返回点赞状态
			if (methodName === 'getList' && params && Array.isArray(params) && params.length > 0) {
				const { userId, token } = params[0] || {};
				if (userId && token) {
					const user = await userAuth(userId, token);
					if (user) {
						this.authInfo = user; 
					}
				}
			}
			return;
		}

		if (!params || !Array.isArray(params) || params.length === 0) {
			throw new Error(JSON.stringify({
				errCode: ERROR_CODES.PARAMS_INVALID,
				msg: '缺少必要参数'
			}));
		}

		const { token, userId } = params[0] || {};

		if (!token || !userId) {
			throw new Error(JSON.stringify({
				errCode: ERROR_CODES.LOGIN_REQUIRED,
				msg: '需要登录才能操作'
			}));
		}
		
		const user = await userAuth(userId, token);
		if (!user) {
			throw new Error(JSON.stringify({
				errCode: ERROR_CODES.AUTH_FAILED,
				msg: '身份验证失败，请重新登录'
			}));
		}

		// 将验证后的用户信息挂载到 this 上 方便后续函数使用
		this.authInfo = user;
	}
}