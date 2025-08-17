// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const nodemailer = require('nodemailer');
const db = uniCloud.database();
const dbName = 'emailCode';
const emailConfig = require('./config.json'); 
/**
 * status：对应状态描述
 */
const statusMessage = {
	'sendFail': '发送验证码失败',
	'sendSuccess': '验证码发送成功',
	'notSend': '请先发送验证码，再验证',
	'expired': '验证码已过期，请重新发送',
	'codeError': '验证码错误',
	'codeUsed': '验证码已使用，请重新发送',
	'validateSuccess': '验证成功',
}

/**
 * 随机生成1-8位验证码
 */
function getEmailCode(num) {
	return String(Math.floor(Math.random() * 99900999)).slice(-num);
}

//发送邮箱
function sendEmail(params, code) {
	const transporter = nodemailer.createTransport(emailConfig[params.serviceType]);
	const mailOptions = {
		from: emailConfig[params.serviceType].auth.user,
		to: params.email,
		subject: params.subject,
		text: params.text.replace('#code#', code)
	};
	return transporter.sendMail(mailOptions);
}

module.exports = {
	/**
	 * 发送邮箱验证码
	 * @param {Object} params
	 * {
		capacity: 6, //验证码位数（1-8位），默认：6位,
		validMinute: 5, //邮箱验证码有效期，单位分钟，默认5分钟
		serviceType: 'qq', // 邮箱类别,对应emailConfig配置
		email: 'xx@xx.com', // 发送验证码的目标邮箱
		subject: '注册验证码', // 邮箱标题
		text: '感谢您注册,注册码是#code#', // 邮箱内容
	 }
	 */
	async sendEmailCode(params) {
		//随机生成验证码并发送
		console.log('-1-')
		const code = getEmailCode(params.capacity || 6);
		console.log('-2-')
		var res = await sendEmail(params, code);
		console.log('-3-')
		if (res.accepted.length == 1) {
			const _createTime = new Date().getTime()
			const result = await db.collection(dbName).add({
				...params,
				code,
				status: 'sendSuccess',
				_validateTime: _createTime + 1000 * 60 * (params.validMinute || 5),
				_createTime,
			});
			result.code = code;
			return {
				...result,
				success: true,
				status: 'sendSuccess',
				message: statusMessage.sendSuccess
			}
		} else return {
			...res,
			success: false,
			status: 'sendFail',
			message: statusMessage.sendFail
		}
	},
	/**
	 * @param {Object} params
	 * {
		_id: xx, //邮箱发送成功的唯一id
		email: 'xx@xx.com', // 发送验证码的目标邮箱
		code: 'xx', // 获取到的验证码
	 }
	 */
	async validateEmailCode(params) {
		const collection = db.collection(dbName);
		const nowTime = new Date().getTime();
		const res = await collection.where({
			_id: params._id,
			email: params.email,
		}).get();
		if (res.data.length) {
			const item = res.data[0];
			if (item._validateTime < nowTime) return { //验证码过期
				success: false,
				status: 'expired',
				message: statusMessage.expired
			}
			else if (item.code !== params.code) return { //验证码错误
				success: false,
				status: 'codeError',
				message: statusMessage.codeError
			}
			else if (item.status == 'codeUsed') return { //验证码已使用
				success: false,
				status: 'codeUsed',
				message: statusMessage.codeUsed
			}
			else { //验证成功
				await collection.doc(params._id).update({
					status: 'codeUsed'
				})
				return {
					success: true,
					status: 'validateSuccess',
					message: statusMessage.validateSuccess
				}
			}
		} else return { //未发送成功，或者邮箱变更
			success: false,
			status: 'notSend',
			message: statusMessage.notSend
		}
	}
}