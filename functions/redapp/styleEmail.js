module.exports = function(content, vueBinding, sig){
	if(typeof vueBinding == 'string'){
		vueBinding = 'v-html="'+vueBinding+'"';
	} else {
		var vueBinding = '';
	}

	if(typeof sig != 'object'){ sig = {}; }
	sig.name = sig.name || '';
	sig.email = sig.email || '';



	if(typeof content == 'object'){
		var content_str = '<table>';
		for(var key in content){
			content_str +=  '<tr><td>'+key+':</td><td>'+content[key]+'</td></tr>';
		}
		content_str += '</table>';
		content = content_str;
	}

	return '<div style=\
	"width: 100%; height: 100%;\
	margin: 0px;\
	font-family: Roboto, -apple-system, BlinkMacSystemFont, arial, sans-serif;\
	background-color: #ECEFF1;\
	color: #2b2b2b;\
	background: #f44336;\
	box-sizing: border-box;\
	padding: 10px 4px;\
	background: -moz-linear-gradient(-114deg, #f44336 52%, #e53935 52%);\
	background: -webkit-linear-gradient(-114deg, #f44336 52%,#e53935 52%);\
	background: linear-gradient(66deg, #f44336 52%,#e53935 52%);">\
	<table style=\
	"position: relative;\
	width: auto; max-width: 800px; height: 100%;\
	margin: 0px auto;\
	border-collapse: collapse;">\
	<tbody>\
	<tr>\
		<td>\
			<div style=\
			"background-color: #FFFFFF;\
			height: 100%;\
			color: #2b2b2b;\
			border-radius: 8px;\
			padding: 40px 30px;"'+vueBinding+'>'+content+'</div>\
		</td>\
	</tr><tr>\
		<td style="height: 100px; color: #FFFFFF; padding: 10px 30px;">\
		<div>'+sig.name+'</div>\
		<div>'+sig.email+'</div>\
		<a href="http://redapp.co/" style="text-decoration: none;">\
			<div style=\
			"font-size: 50px;\
			text-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);">\
				<span style="color: #FFFFFF;">RED</span><span style="color: #263238;">APP</span>\
			</div>\
			<div style=\
			"color: #FFFFFF;\
			font-style: italic;\
			font-size: 16px;\
			margin-bottom: 20px;\
			">Reach China\'s 700 million mobile users.</div>\
		</a>\
		</td>\
	</tr>\
	</tbody>\
	</table>\
	</div>';
}