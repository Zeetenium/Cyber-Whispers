# xt-cloud-email uniCloud 服务端发送邮件

> 本插件是对 `nodemailer` 封装，支持qq、163邮箱。
> 其余邮箱支持smtp服务，理论上也可以使用。

## 安装
- 从插件市场直接导入，本插件是公共模块。可查看官方使用公共模块的方法(https://uniapp.dcloud.io/uniCloud/cf-common.html)

## 使用方法
### 获取授权码
- qq邮箱
<img src="https://xiaodaweb.gitee.io/personal-image/uniapp/xt-cloud-email/2.jpg" />
<img src="https://xiaodaweb.gitee.io/personal-image/uniapp/xt-cloud-email/3.jpg" />
开启其中一个 smtp 服务，获取授权码
- 163邮箱
<img src="https://xiaodaweb.gitee.io/personal-image/uniapp/xt-cloud-email/1.jpg" />
开启其中一个 smtp 服务，获取授权码
### 使用
- 基本使用
```js
const XtCloudEmail = require("xt-cloud-email")
exports.main = async (event, context) => {

	// 邮箱基础配置必传
	const config = {
		host: 'smtp.qq.com', // 发送邮件的服务器地址 - 这里是qq邮箱，具体邮箱服务，请查看对应的服务器
		auth: {
			user: '', // 发送邮件的邮箱账号
			pass: '' // 发送邮件的授权码
		}
	}

	const xtCloudEmail = XtCloudEmail(config)
	// 检测邮箱服务是否连接成功
	let flag = await xtCloudEmail.verify()
	if (flag) {
		xtCloudEmail.sendTextMail({
			name: "Test", // 发送人名称，
			to: '', // 收件邮箱
			subject: '测试', // 邮件主题
			text: '测试邮箱' // 邮件文本信息
		})
	}

	//返回数据给客户端
	return event
};
```

- 设置每次发送邮件的默认配置
```js
const XtCloudEmail = require("xt-cloud-email")
exports.main = async (event, context) => {
	// 邮箱基础配置必传
	const config = {
		host: 'smtp.qq.com', // 发送邮件的服务器地址 - 这里是qq邮箱，具体邮箱服务，请查看对应的服务器
		auth: {
			user: '', // 发送邮件的邮箱账号
			pass: '' // 发送邮件的授权码
		}
	}
	// 可选项 - 每次发送邮件
	const defaults = {
		name: "Test", // 发送人名称，
		to: '', // 收件邮箱
		subject: '测试', // 邮件主题
		text: '测试邮箱' // 邮件文本信息
	}

	const xtCloudEmail = XtCloudEmail(config, defaults)

	// 检测邮箱服务是否连接成功
	let flag = await xtCloudEmail.verify()
	if (flag) {
		// 发送邮件
		xtCloudEmail.sendTextMail()
	}
	
	//返回数据给客户端
	return event
};
```

## 属性

### `XtCloudEmail(config[, defaults])`

#### `config` 基本的属性 完整属性参考[nodemailer](https://nodemailer.com/smtp/)
|属性		|类型				|是否必传	|默认值	|说明																																				|
|:--			|:--					|:--				|:--			|:--																																					|
|host		|string			|		是			|				|邮箱服务器地址																															|
|port		|number			|		否			|465		|端口，secure 为false时，该属性必传。																				|
|secure	|boolean		|		否			|true		| 为true，连接到服务器时将使用TLS, 端口为: 465, 使用其他端口需要设置为false	|
|auth		|AuthConfig	|		是			|				|发送人账号信息,																														|

#### `AuthConfig` 基本的属性
|属性	|类型		|是否必传	|默认值	|说明			|
|:--		|:--			|:--				|:--			|:--				|
|user	|string	|是				|				|邮件账号	|
|pass	|string	|是				|				|授权码		|

#### `defaults` 基本的属性 完整属性参考[nodemailer](https://nodemailer.com/message/)
|属性				|类型								|是否必传																		|默认值	|说明																																|
|:--					|:--									|:--																					|:--			|:--																																	|
|name				|string							|否																					|				|不传，默认使用发送者的邮箱																					|
|to					|string/Array				|否/使用sendTextMail或sendHtmlMail方法时必传|				|收件人的邮箱地址，多个邮箱地址需要用逗号(`,`)隔开, 或者传入一个数组|
|subject		|strig							|否/使用sendTextMail或sendHtmlMail方法时必传|				|邮件主题																														|
|text				|string							|否/使用sendTextMail时必传									|				|邮件文本内容																												|
|html				|string							|否使用sendHtmlMail时必传										|				|邮件的html内容																											|
|attachments|Array<Attachments>	|否																					|				|																																		|

## 方法
|方法名				|类型													|说明																					|
|:--					|:--													|:--																					|
|sendTextMail	|(defaults)=> Promise<boolean>|发送文本邮件- 发送成功返回true, 失败返回false|
|sendHtmlMail	|(defaults)=> Promise<boolean>|发送html邮件- 发送成功返回true, 失败返回false|
|verify				|()=> Promise<boolean>				|校验连接邮箱服务器是否成功										|