'use strict';
const db = uniCloud.database();
const notificationsCollection = db.collection('notifications');
const dbCmd = db.command;

exports.main = async (event, context) => {
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	try {
		const res = await notificationsCollection
			.where({
				createTime: dbCmd.lt(sevenDaysAgo)
			})
			.remove();
			
		const message = `成功删除了 ${res.deleted} 条旧通知。`;
		console.log(message); 
		
		return {
			errCode: 0,
			msg: message,
			deleted: res.deleted
		};
	} catch (error) {
		console.error('删除旧通知失败:', error);
		return {
			errCode: 'DB_ERROR',
			msg: '删除旧通知失败'
		};
	}
};