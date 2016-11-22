function getGNGrams(words, isWC) {
    var GNGRAMS_URL = 'https://books.google.com/ngrams/interactive_chart?year_start=1999&year_end=2000&corpus=15&smoothing=5&content='; //&case_insensitive=on
    lwords = words.slice(0, 5);
    //console.log(lwords);

    url = GNGRAMS_URL + lwords.join(',');
    var expr = /data[\s]*=[\s]*(\[{.*?}\])/igm;
    $.ajax({
        url: url,
        success: function (text) {
            ngrams = {};
            for (i = 0; i < lwords.length; i ++) {
                ngrams[lwords[i]] = 0;   
            }

            var d = expr.exec(text);

            if (d) {
                d = $.parseJSON(d[1]); //&#39;
            } else {
                d = {};
            }

            for (k in d) {
                var str = d[k].ngram.replace(" &#39;", "'");
                ngrams[str] = d[k].timeseries[0]; 
            }            
            //console.log(lwords);
            //console.log(text);
            chrome.extension.sendRequest({action: isWC ? 'ngram_wc_a' : 'ngram_a', ngrams: ngrams});       

            words = words.slice(5);
            if (words.length) { 
                setTimeout(function () {getGNGrams(words);}, 10);
            }
        },
        error: function () {
            alert('getGNGrams error!');
        },
        dataType: 'text'
    });
}

function remTags(s) {
    s = s.replace(/<\/div>/igm, '');                   
    s = s.replace(/<div class="text"[^>]*?>\s*/igm, '');  
    s = s.replace(/<\/a>/igm, '');                   
    s = s.replace(/<a[^>]*?>/igm, '');   
    s = s.replace(/<em>/igm, '<a>');
    s = s.replace(/<\/em>/igm, '</a>'); 
    return s;
}

function transReverso(word) {
    var REV_RU_EN_URL = 'http://context.reverso.net/translation/russian-english/';  
    var REV_EN_RU_URL = 'http://context.reverso.net/translation/english-russian/';  

    var rev = word.charCodeAt(0) < 127;

    url = (rev ? REV_EN_RU_URL : REV_RU_EN_URL) + word;
    $.ajax({
        url: url,
        success: function (text) {
            var sexps = /<span class="entry"[^>]*>(.*?)<\/span>/igm;
            var dtrans = [];
            while (d = sexps.exec(text)) {
                dtrans.push(d[1]);
            }

            var tr = {phrase: /id="entry" value="([^"]*?)"/igm.exec(text)[1], dtrans: dtrans, translation: []};

            var expr = /<div class="text"[^>]*?>\s*(.*?)\s*<\/div>/igm;
            var d = text.match(expr);
            for (var n  = 0; n < d.length; n += 2) {
                tr.translation.push([remTags(d[n]), remTags(d[n + 1])]);
            }
            //console.log(tr);
            //console.log(text);

            chrome.extension.sendRequest({action: 'reverso_a', translation: tr}); 
        },
        error: function (jqXHR, textStatus, errorThrown) {
            chrome.extension.sendRequest({action: 'reverso_a', translation: {phrase: errorThrown, dtrans: [], translation: []}}); 
        },
        dataType: 'text'
    });    
}

function transT(word) {
    var T_URL = 'http://www.translate.ru/services/TranslationService.asmx/GetTranslateNew';  
    var rev = word.charCodeAt(0) < 127;    

    $.ajax({
        url: T_URL,
        method: 'POST',
        data: {
            dirCode: rev ? 'ru-en' : 'en-ru', 
            template: 'auto', 
            text: word,
            lang: 'ru',
            limit: 3000,
            useAutoDetect: true,
            key: '',
            ts: 'MainSite',
            tid: '', 
            IsMobile: false            
        },
        success: function (xml) {
            //console.log(xml);
            text = $(xml).find('result').text();
            var d = {text: '', dict: []};
            if (text.indexOf('<style') == -1) {
                d.text = text;
            } else {
                var doc = $(text);
                var wdivs = doc.find('div.cforms_result');
                for (var i = 0; i < wdivs.length; i ++) {
                    var wdiv = $(wdivs[i]);
                    var w = {
                        word: wdiv.find('.source_only').text(),
                        pos: wdiv.find('.ref_psp').text(),
                        forms: wdiv.find('.otherImportantForms').text().replace(/\n/g, ''),
                        entry: []
                    };
                    wdiv.find('.ref_result').each(function(i, el) {
                        w.entry.push($(el).text());
                    });
                    d.dict.push(w);
                }
                /*var wexps = /<span class="source_only"[^>]*>(.*?)<\/span>/igm;
                while (t = wexps.exec(text)) {
                    var w = {word: t[1]};
                    d.dict.push(w);
                }*/
            }
            
            chrome.extension.sendRequest({action: 't_translate_a', translation: d}); 
        },
        error: function () {
            alert('transT error!');
        },
        dataType: 'xml'
    });     
}

function transMicrosoft(word) {
    var rev = word.charCodeAt(0) < 127;  
    var url1 = "https://ssl.microsofttranslator.com/ajax/v3/widgetv3.ashx";

    $.ajax({
        url: url1,
        success: function (text) {
            var d = /appId:'([^']*?)'/.exec(text);
            if (d) {
                var appId = d[1].replace('\\x', '%');
                from = rev ? "en" : "ru";
                to = rev ? "ru" : "en";

                var url2 = "https://api.microsofttranslator.com/v2/ajax.svc/TranslateArray?appId=%22"+appId+"%22&texts=[%22"+
                    encodeURIComponent(word)+"%22]&from=%22"+from+"%22&to=%22"+to+
                    "%22&oncomplete=_mstc2&onerror=_mste2&loc=ru&ctr=&ref=WidgetV3&rgp=aa0fbc1";
                    $.ajax({
                        url: url2,
                        success: function (text) {
                            result = /_mst[c|e]2\((.*?)\);/gim.exec(text);
                            if (result) {
                                d = $.parseJSON(result[1]);
                                result = d[0].TranslatedText ? d[0].TranslatedText : d;
                            } else {
                                result = text;    
                            }
                            chrome.extension.sendRequest({action: 'm_translate_a', translation: {text: result}});
                        }, 
                        error: function (jqXHR, textStatus, errorThrown) {
                            chrome.extension.sendRequest({action: 'm_translate_a', translation: {text: errorThrown}}); 
                        },
                        dataType: 'text'
                    });    
            } else {
                chrome.extension.sendRequest({action: 'm_translate_a', translation: {text: 'Error on getting appId'}}); 
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            chrome.extension.sendRequest({action: 'm_translate_a', translation: {text: errorThrown}}); 
        },
        dataType: 'text'
    });     
}

function transGoogle(word) {
    var rev = word.charCodeAt(0) < 127;  
    var l1 = rev ? 'en' : 'ru';
    var l2 = rev ? 'ru' : 'en';    
    var G_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='+l2+'&hl='+l1+'&dt=t&dt=bd&dj=1&source=input&tk=0&q=';  
    $.ajax({
        url: G_URL + word,
        success: function (text) {
            d = $.parseJSON(text);
            //console.log(d);
            chrome.extension.sendRequest({action: 'g_translate_a', translation: d}); 
        },
        error: function () {
            alert('transGoogle error!');
        },
        dataType: 'text'
    });     
}


chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
    if (data.action) {
        if (data.action == 'ngram') {
            getGNGrams(data.words, false);
        } else if (data.action == 'ngram_wc') {
            getGNGrams(data.words, true);
    	} else if (data.action == 'reverso') {
            transReverso(data.word); 
        }  else if (data.action == 'g_translate') {
            transGoogle(data.word);         
        } else if (data.action == 't_translate') {
            transT(data.word);   
        } else if (data.action == 'm_translate') {
            transMicrosoft(data.word);   
        }
    }
});
