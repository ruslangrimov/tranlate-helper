function nl2br (str, is_xhtml) {   
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';  
    //str = (str + '').replace(/ /g, "&nbsp;");
    return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
}

$.fn.extend({
    insertAtCaret: function(myValue) {
        if (document.selection) {
                this[0].focus();
                sel = document.selection.createRange();
                sel.text = myValue;
                this[0].focus();
        }
        else if (this[0].selectionStart || this[0].selectionStart == '0') {
            var startPos = this[0].selectionStart;
            var endPos = this[0].selectionEnd;
            var scrollTop = this[0].scrollTop;
            this[0].value = this[0].value.substring(0, startPos) + myValue + this[0].value.substring(endPos, this[0].value.length);
            this[0].focus();
            this[0].selectionStart = startPos + myValue.length;
            this[0].selectionEnd = startPos + myValue.length;
            this[0].scrollTop = scrollTop;
        } else {
            this[0].value += myValue;
            this[0].focus();
        }
    }
})

function getNGramsStat() {
	var t = $("#main_txt");

	var txt = t.val();
	//gets all the words
	var words = txt.match(/([\w|\'|-]+)/gim)
	//console.log(words);
	var nwords = [];
	//Composite ngramms of diffrent size
	for (var n = 3; n < 6; n ++) {
		for (var i = 0; i < words.length - n + 1; i ++) {
			var str = '';
			for (var a = 0; a < n; a ++) {
				if (a > 0) {
					str = str + ' ';
				}
				str = str + words[i + a];
			}
			if (window.ngrams[str] == undefined) {
				//window.ngrams[str] = 0;	
				nwords.push(str);
			}			
		}
	}
	//console.log(nwords);

	if (nwords.length) {
		chrome.runtime.sendMessage({action: 'ngram', words: nwords});	
	}	

	//setTimeout(getNGramsStat, 1000);
}

function updateNGrams(ngrams) {
	for (k in ngrams) {
		window.ngrams[k] = ngrams[k];
	}
	//console.log(window.ngrams);
	localStorage['ngrams'] = JSON.stringify(window.ngrams);
}

function updateReverso(translation) {
	//$("#reverso").text(JSON.stringify(translation));
	$("#phrase").text(translation.phrase);
	$("#drans").html('');
	for (var i = 0; i < translation.dtrans.length; i ++) {
		$("#drans").append('<span><a href="#">'+translation.dtrans[i]+'</a></span> ');
	}
	$("#drans a").click(function() {
		$("#tr_to").val($(this).text());	
	});
	$("#rtr").html('');
	for (var i = 0; i < translation.translation.length; i ++) {
		$("#rtr").append('<div class="rtrow"><div>'+translation.translation[i][0]+'</div><div>'+translation.translation[i][1]+'</div></div>');
	}	
	$("#rtr a").attr('href', '#').click(function() {
		$("#tr_to").val($(this).text());	
	});
}

function updateGoogle(translation) {
	$("#google").text('');

	if (translation.dict) {
		for (var i = 0; i < translation.dict.length; i ++) {
			var html = '';
			html += '<div class="g_type">';
			html += '<div class="g_word"><b>' + translation.dict[i].base_form +
			'</b> <i>(' + translation.dict[i].pos + ')</i> <a href="#" class="g_exp"><span class="glyphicon glyphicon-chevron-down"></span></a></div>';
			html += '<div class="g_twords g_twords_min">';
			for (var j = 0; j < translation.dict[i].entry.length; j ++) {
				html += '<div class="g_tword">';
				html += '<a href="#" class="t">' + translation.dict[i].entry[j].word + '</a>';
				if (translation.dict[i].entry[j].reverse_translation) {
					html += ' (';
					for (var n = 0; n < translation.dict[i].entry[j].reverse_translation.length; n ++) {
						//html += ' (' + translation.dict[i].entry[j].reverse_translation.join(', ') + ')';
						html += '<a href="#" class="t_rev">' + translation.dict[i].entry[j].reverse_translation[n] + '</a>';
						if (n < translation.dict[i].entry[j].reverse_translation.length - 1) {
							html += ', ';
						}
					}
					html += ')';
				}
				html += '</div>';	
			}
			html += '</div>';

			html += '</div>';		
			$("#google").append(html);
		}
	}

	if (translation.sentences) {
		$("#tr_to").val(translation.sentences[0].trans);
		var html = '';
		html += '<div class="g_sent">';
		for (var i = 0; i < translation.sentences.length; i ++) {
			html += translation.sentences[i].orig + ' <a href="#">' + translation.sentences[i].trans + '</a>';	
		}
		html += '</div>';	
		$("#google").append(html);
	}

	$("#google a.t").click(function() {
		$("#tr_to").val($(this).text());	
	});		
	$("#google a.t_rev").click(function() {
		$("#tr_from").val($(this).text());	
		$("#t_btn").click();
	});	
	$("#google a.g_exp").click(function() {
		$(this).parent().next('.g_twords').toggleClass('g_twords_min');
		$(this).find('span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
	});				
}

function updateT(translation) {
	$("#translate_t").text('');


	if (translation.text) {
		$("#tr_to").val(translation.text);
		$('#translate_t').finish().hide();
	} else {
		if (translation.dict) {
			for (var i = 0; i < translation.dict.length; i ++) {
				var html = '';
				html += '<div class="g_type">';
				html += '<div class="g_word"><b>' + translation.dict[i].word +'</b> <i>(' + translation.dict[i].pos + ')</i> ' +
				translation.dict[i].forms + '</div>';
				//html += '<div class="g_forms">' + translation.dict[i].forms + '</div>';
				html += '<div class="g_twords">';
				for (var j = 0; j < translation.dict[i].entry.length; j ++) {
					html += '<div class="g_tword">';
					html += '<a href="#">' + translation.dict[i].entry[j] + '</a>';
					html += '</div>';	
				}
				html += '</div>';

				html += '</div>';		
				$("#translate_t").append(html);				
			}
		}
		$("#translate_t a").click(function() {
			$("#tr_to").val($(this).text());	
		});			
		$('#translate_t').finish().show();
	}
}

function updateM(translation) {
	$("#microsoft").text('');

	$("#tr_to").val(translation.text);
	$('#translate_m').finish().hide();
}

function hashCode(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function updateBackground(txt) {
	var b = $("#bcg_txt");
	var h = $("#bcg_hint");
	txt = nl2br(txt);
	var hash = hashCode(txt + '_' + Object.keys(window.ngrams).length);
	if (window.prevHash != hash) {
		window.prevHash = hash;
		h.html('');

		for (str in window.ngrams) {
			if (window.ngrams[str] > 0) {
				vc  = str.split(' ').length;
				rs  = new RegExp(str.replace(/([\s]{1})/gim, '[\\W]+'), 'gim');
				//console.log(rs)
				tmp = txt.replace(rs, '<span class="ng_'+vc+'_hint">$&</span>');
				if (tmp != txt) {
					h.append('<div class="ng_hint">'+tmp+'</div>');
				}
			}
		}

		txt = txt.replace(/[\*]{3}/g, '<span id="c_m">***</span>');
		b.html(txt);

		if (window.lastMOV) {
			$('#stat').text(window.lastMOV + ' (' + window.ngrams[window.lastMOV] + ')')
		}		
	}
}

function initBackground() {
	var t = $("#main_txt");
	var b = $("#bcg_txt");
	var h = $("#bcg_hint");
	t.scroll(function() {
		//b.css('top', -t.scrollTop());
		b.scrollTop(t.scrollTop());
		h.scrollTop(t.scrollTop());	
		//$("#bcg_hint div").scrollTop(t.scrollTop());	
	});

	t.keyup(function() {
		//b.innerWidth(t.innerWidth());
		//h.innerWidth(t.innerWidth());
		var txt = t.val();
		updateBackground(txt);
	});
	t.keyup();

	$("#tu_btn").click(function() {
		getNGramsStat();	
	});	

	setInterval(function() {
		var txt = t.val();
		updateBackground(txt);		
	}, 100);

	//$("#tu_btn").click();
}

function updateWCNgrams(ngrams) {
	for (k in ngrams) {
		if (k.indexOf('*') == -1) {
			$("#hint select").append('<option value="'+k.split(" ").splice(-1)[0]+'">'+k+' ('+parseFloat(ngrams[k]).toExponential(1)+')</option>')
			.attr('size', Math.min($("#hint option").length, 10));
		}
	}	
}

function showHint() {
	var t = $("#main_txt");
	v = t[0].value.substring(0, t[0].selectionStart) + '***' + t[0].value.substring(t[0].selectionEnd, t[0].value.length);		
	updateBackground(v);
	of = $("#c_m").offset();
	updateBackground(t[0].value);
	
	$("#hint").finish().toggle().css({
		top: of.top + "px",
		left: of.left + "px"
	});	

	var words = t[0].value.substring(0, t[0].selectionStart).match(/([\w|\'|-]+)/gim);
	nwords = [];
	for (n = 2; n < 5; n ++) {
		//console.log(words.slice(-n).join(' ') + ' *');	
		nwords.push(words.slice(-n).join(' ') + ' *');	
	}
	chrome.runtime.sendMessage({action: 'ngram_wc', words: nwords});

	$("#hint select").html('').focus().attr('size', 2);	
}

function main() {
	window.ngrams = {};

	$(document).ready(function() {
		chrome.extension.onRequest.addListener(function(data, sender, sendResponse) {
		    //alert(data.action);
		    if (data.action == 'ngram_a') {
		    	//console.log(data);
		    	updateNGrams(data.ngrams);
		    } else if (data.action == 'ngram_wc_a') {
		    	updateWCNgrams(data.ngrams);
		    } else if (data.action == 'reverso_a') {
				updateReverso(data.translation);
 			} else if (data.action == 'g_translate_a') {
				updateGoogle(data.translation);
		    } else if (data.action == 't_translate_a') {
				updateT(data.translation);				
		    } else if (data.action == 'm_translate_a') {
				updateM(data.translation);				
		    }

		});	

		if (localStorage['ngrams']) {
			window.ngrams = $.parseJSON(localStorage['ngrams']);	
		}
		//console.log(window.ngrams);

		$("textarea, #tr_res").each(function(i, obj) {
			$(obj).val(localStorage[obj.id]);
		});

		$(document).keydown(function(event) {
			if (event.keyCode == 27) {
				event.preventDefault();
			}
		});


		$("textarea").keyup(function(event) {
			localStorage[event.target.id] = $(event.target).val();
		}).mousemove(function(event) {
			clearTimeout(window.moT);
			var t = $("#main_txt");
			tmp = t[0].value.substring(t[0].selectionStart, t[0].selectionEnd).match(/([\w|\'|-]+)/gim);
			v = tmp ? tmp.join(' ') : '';
			window.lastMOV = v;
			if (v /*&& (window.lastMOV != v)*/) {
				moT = setTimeout(function() {
					$('#stat').text(v + ' (' + window.ngrams[v] + ')').
					/*offset({top: event.pageY + 4, left: event.pageX}).finish().show();*/
					css('top', event.pageY + 4).css('left', event.pageX).finish().show();
					if (window.ngrams[v] == undefined) {
						chrome.runtime.sendMessage({action: 'ngram', words: [v]});
					}
				}, 500);
			} else {
				$('#stat').finish().hide();
			}
		}).mouseleave(function() {
			$('#stat').finish().hide();	
		});

		$("#t_btn").click(function(event) {
			v = $("#tr_res").val();
			if (v == 'r') {
				if ($("#tr_from").val()) {
					chrome.runtime.sendMessage({action: 'reverso', word: $("#tr_from").val()});
				}
			} else if (v == 'g') {
				if ($("#tr_from").val()) {
					chrome.runtime.sendMessage({action: 'g_translate', word: $("#tr_from").val()});
				}
			} else if (v == 't') {
				if ($("#tr_from").val()) {
					chrome.runtime.sendMessage({action: 't_translate', word: $("#tr_from").val()});
				}
			} else if (v == 'm') {
				if ($("#tr_from").val()) {
					chrome.runtime.sendMessage({action: 'm_translate', word: $("#tr_from").val()});
				}
			}
		});		

		$("#tr_from").keydown(function (event) {
			if (event.ctrlKey && ((event.keyCode == 13) || (event.keyCode == 32))) {
				$("#t_btn").click();
				event.preventDefault();	
			}	
		});

		$("#tr_res").change(function(event) {
			localStorage[event.target.id] = $(event.target).val();
			v = $(this).val();
			if (v == 'r') {
				$("#reverso").finish().show().siblings().finish().hide();
			} else if (v == 'g') {
				$("#google").finish().show().siblings().finish().hide();				
			} else if (v == 't') {
				$("#translate_t").finish().show().siblings().finish().hide();
			} else if (v == 'm') {
				$("#translate_m").finish().show().siblings().finish().hide();
			}	
			$("#t_btn").click();	
		});

		setTimeout(function() {$("#tr_res").change();}, 10);

		$("#hint select").on('dblclick keyup', function(event) {
			if(event.which == 13 || event.type == 'dblclick') {
				$("#main_txt").insertAtCaret($(this).val());
				$("#main_txt").keyup();
				$("#hint").finish().hide();	
			}			
		}).keydown(function(event) {
			if (event.keyCode == 27) {
				$("#hint").finish().hide();	
				$("#main_txt").focus();
			}
		});

		$("#main_txt").keypress(function(event) {
			if ((event.key == " ") && (event.ctrlKey)) {
				showHint();
			} else {
				$("#hint").finish().hide();	
			}
		});

		$("#main_txt").click(function() {
			$("#hint").finish().hide();	
		});

		/*
		$("#main_txt").contextmenu(function(event) {
			event.preventDefault();
			$("#hint").finish().toggle(100).css({
				top: event.pageY + "px",
				left: event.pageX + "px"
			});			
		});
		*/

		$("#u_btn").click(function() {
			$("#main_txt").insertAtCaret($("#tr_to").val());
			$("#main_txt").keyup();	
		});

		initBackground();

		//chrome.runtime.sendMessage({word: 'there * a lot', action: 'ngram'});		
	});
}

main();