//将Data数据转为字符串形式
export const formatDate = (dateInput) => {
	if (!dateInput) return "";
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return "";

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}`;
};

//计算字符串的视觉宽度
export const calculateWidth = (text) => {
	if (!text) return 0;
	const doubleByteChars = text.match(/[^\x00-\xff]/g) || [];
	return text.length + doubleByteChars.length;
};

//根据字符串的视觉宽度截断字符串
export const truncateByWidth = (text, max) => {
	let currentWidth = 0;
	let cutIndex = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const charWidth = /[^\x00-\xff]/.test(char) ? 2 : 1;
		if (currentWidth + charWidth > max) {
			break;
		}
		currentWidth += charWidth;
		cutIndex = i + 1;
	}
	return text.substring(0, cutIndex);
};
