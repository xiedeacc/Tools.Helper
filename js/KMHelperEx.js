var objApp = window.external; //WizExplorerApp
var objDatabase = objApp.Database;
var objWindow = objApp.Window;
var objDoc = objWindow.CurrentDocument; //获得当前正在浏览的Wiz文档(WizDocument)
var objBrowser = objWindow.CurrentDocumentBrowserObject;
var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
//
var pluginPath = objApp.GetPluginPathByScriptFileName("KMHelper.js"); //获得插件的路径
var languageFileName = pluginPath + "plugin.ini";  //语言文件
objApp.LocalizeHtmlDocument(languageFileName, WizChromeBrowser);

var imgRateArray;
var imgRateSrc1 = 'km_star1.png';
var imgRateSrc2 = 'km_star2.png';

var notice;
PNotify.prototype.options.styling = "bootstrap3";
var zoom = 100;

function SetMeta(name, key, value){
    if (!objDatabase) return false;
    //
    objDatabase.SetMeta(name, key, value);
}

// read Wizhelper global settings
function KMSettings(strKey) {
    strValue = objCommon.GetValueFromIni(languageFileName, "Common", strKey);
    return strValue;
}

function textKeywords_onchange() {
    objDoc.Keywords = textKeywords.value;   //保存关键字
}

function textAuthor_onchange() {
    objDoc.Author = textAuthor.value;	   //保存作者
}

function tagToHtml(tagi) {		
    return "<span style='display:inline-block;'><a isSelected=0 id='" + tagi.GUID + "' href=javascript:ListDocsByTagGUID('" + tagi.GUID + "');>" + tagi.tag.Name + " (" + tagi.count + ")</a>&nbsp;<a href=javascript:DeleteTagByGUID('"+tagi.GUID+"');>X</a>&nbsp;&nbsp;&nbsp;</span>";
}
function docToHtml(doci) {
    return "<span> - <A style='text-decoration: none;' href=javascript:OpenDocumentByGUID('" + doci.GUID + "');>" + StringLessThanN(doci.Title,40) + "</A></span><br/>";
}
function StringLessThanN(str,N) {
    if ( getBytesLength(str)>N ) { return subStringByBytes(str,N) + "...";}
    else {return str;}
}
function subStringByBytes(str, maxBytesLen) {
    var len = maxBytesLen;
    var result = str.slice(0, len);
    while (getBytesLength(result) > maxBytesLen) {
        result = result.slice(0, --len);
    }
    return result;
}
function getBytesLength(str) {
    // 在GBK编码里，除了ASCII字符，其它都占两个字符宽
    return str.replace(/[^\x00-\xff]/g, 'xx').length;
}

/*
 * 通过关键字搜索相关文档，显示在文档窗口中。注：目前没有将关键字进行分隔，这样会有缺陷。
 */
function SearchByKeywords() {
    var keywords = textKeywords.value;
    if (keywords == null || keywords == "")
        return false;
    //
    try {
        keywords = keywords.replace(/\'/g, "''");
        var sql = "document_keywords like '%" + keywords + "%'";
        var documents = objDatabase.DocumentsFromSQL(sql);
        if (documents != null) {
            objWindow.DocumentsCtrl.SetDocuments(documents);
        }
    }
    catch (err) {
    }
}

/*
通过作者搜索相关文档，显示在文档窗口中。注：目前没有将作者进行分隔，这样会有缺陷。
*/
function SearchByAuthor() {
    var author = textAuthor.value;
    if (author == null || author == "")
        return false;
    //
    try {
        author = author.replace(/\'/g, "''"); // 转义
        var sql = "document_author like '%" + author + "%'";
        var documents = objDatabase.DocumentsFromSQL(sql);
        if (documents != null) {
            objWindow.DocumentsCtrl.SetDocuments(documents);
        }
    }
    catch (err) {
    }
}
//

/*
星标功能。我们将星标数据保存到文档的参数里面，如下面的getDocRate和setDocRate方法。
文档参数可以有任意数量，可以和服务器进行同步。
*/
//
function getDocRate() {
    var rateval = objDoc.ParamValue("Rate");
    if (rateval == null || rateval == "")
        return 0;
    //
    return parseInt(rateval);
}
function setDocRate(rateval) {
    objDoc.SetParamValue("Rate", "" + rateval);
}

function onRateImageClick() {
    setDocRate(window.event.srcElement._num + 1);
}
//
function onRateImageMouseOver() {
    var elem = window.event.srcElement;
    //
    for (var j = 0; j < imgRateArray.length; j++) {
        if (j <= elem._num) {
            imgRateArray[j].src = imgRateSrc2;
        } else {
            imgRateArray[j].src = imgRateSrc1;
        }
    }
}

//
function resetRate() {
    var imgnum = getDocRate();
    for (n = 0; n < imgRateArray.length; n++) {
        imgRateArray[n].src = imgRateSrc1;
    }
    for (n = 0; n < imgnum; n++) {
        imgRateArray[n].src = imgRateSrc2;
    }
}
//
function removeRate() {
    objDoc.SetParamValue("Rate", "");
    resetRate();
}

function AddInfoPage() {
    $("#ivalue_document_title").text(objDoc.Title);
    $("#textAuthor").val(objDoc.Author);
    $("textKeywords.value").val(objDoc.Keywords);
    ivalue_document_readcount.innerHTML = objDoc.ReadCount;
}

// 读取当前维基语法高亮, wiz助手高亮, 必须按下Alt触发Wizhelper 状态
function getFlags() {
    if (objDatabase.GetMeta("wizhelp_parm", "KEYWORD_FLAG") == "1") {
        chkKeyword.checked = true;
    }
    else {
        chkKeyword.checked = false;
    }
    if (objDatabase.GetMeta("wizhelp_parm", "SMARTTAG_FLAG") == "1") {
        chkSmarttag.checked = true;
    }
    else {
        chkSmarttag.checked = false;
    }
    if (objDatabase.GetMeta("wizhelp_parm","ALTKEY_FLAG") == "1") {
        chkAltkey.checked = true;
    }
    else {
        chkAltkey.checked = false;
    }
}

// 切换维基语法高亮状态
function setKEYWORD_FLAG() {
    if (chkKeyword.checked) {
        chkKeyword.checked = true;
        SetMeta("wizhelp_parm","KEYWORD_FLAG", "1");
    }
    else {
        chkKeyword.checked = false;
        SetMeta("wizhelp_parm","KEYWORD_FLAG", "0");
    }
}
// 切换wiz助手高亮状态
function setSMARTTAG_FLAG() {
    if (chkSmarttag.checked) {
        chkSmarttag.checked = true;
        SetMeta("wizhelp_parm","SMARTTAG_FLAG", "1");
    }
    else {
        chkSmarttag.checked = false;
        SetMeta("wizhelp_parm","SMARTTAG_FLAG", "0");
    }
}
// 切换是否按下Alt键才触发Wizhelper
function setALTKEY_FLAG() {
    if (chkAltkey.checked) {
        chkAltkey.checked = true;
        SetMeta("wizhelp_parm","ALTKEY_FLAG", "1");
    }
    else {
        chkAltkey.checked = false;
        SetMeta("wizhelp_parm","ALTKEY_FLAG", "0");
    }
}

function setComponentsFlag(){
    let name = this.id
    switch (name) {
        case 'chkKeyword' :
            if (chkKeyword.checked) {
                chkKeyword.checked = true;
                SetMeta("wizhelp_parm","KEYWORD_FLAG", "1");
            }
            else {
                chkKeyword.checked = false;
                SetMeta("wizhelp_parm","KEYWORD_FLAG", "0");
            }
            break;
        case 'chkSmarttag':
            if (chkSmarttag.checked) {
                chkSmarttag.checked = true;
                SetMeta("wizhelp_parm","SMARTTAG_FLAG", "1");
            }
            else {
                chkSmarttag.checked = false;
                SetMeta("wizhelp_parm","SMARTTAG_FLAG", "0");
            }
            break;
        case 'chkAltkey':
            if (chkAltkey.checked) {
                chkAltkey.checked = true;
                SetMeta("wizhelp_parm","ALTKEY_FLAG", "1");
            }
            else {
                chkAltkey.checked = false;
                SetMeta("wizhelp_parm","ALTKEY_FLAG", "0");
            }
            break;
    }
    //提示
    if ( notice ) notice.remove();
    notice = new PNotify({
        text: '设置成功！重启为知笔记后生效。',
        type: 'success',
        addclass: '',
        animate: {
            animate: true,
            in_class: 'slideInDown',
            out_class: 'slideOutUp'
        }
    });
    notice.get().click(function() {
        notice.remove();
    });
}

//
function initZoom() {
    objBrowser.ExecuteScript(`window.document.body.style.zoom`, function(ret){
        zoom = ret ? parseInt((ret*100).toFixed(0)) : 100;
        zoomValue.value = zoom + "%";
    })
}

function setZoom(num) {
    objBrowser.ExecuteScript(`window.document.body.style.zoom = ${num/100}`, function(ret){
        initZoom();
    })
}

function buttonZoomIn_onclick() {
    zoom += 5;
    if ( zoom > 300 ) zoom = 300;
    setZoom(zoom);
}

function buttonZoomOut_onclick() {
    zoom -= 5;
    if (zoom < 50) zoom = 50;
    setZoom(zoom);
}

$(document).ready(function(){
    textKeywords.value = objDoc.Keywords;   //显示当前文档的关键字
    textAuthor.value = objDoc.Author;	   //显示当前文档的作者
    imgRateArray = [rate1, rate2, rate3, rate4, rate5];
    for (var i = 0; i < imgRateArray.length; i++) {
        imgRateArray[i]._num = i;
        imgRateArray[i].onclick = onRateImageClick;
        imgRateArray[i].onmouseover = onRateImageMouseOver;
        imgRateArray[i].onmouseout = resetRate;
    }

    /* 绑定事件句柄
     * -------------------------------------------------------------
     */
    $(textAuthor).on('change', textAuthor_onchange);
    $(textKeywords).on('change', textKeywords_onchange);
    $(chkKeyword).on('click', setComponentsFlag);
    $(chkSmarttag).on('click', setComponentsFlag);
    $(chkAltkey).on('click', setComponentsFlag);
    $(zoomIn).on('click', buttonZoomIn_onclick);
    $(zoomOut).on('click', buttonZoomOut_onclick);
    $(zoomValue).on('change', function(){
        zoom = parseInt(this.value);
        setZoom(zoom);
    })

    function initPage() {
        resetRate();
        AddInfoPage();
        if ( KMSettings("KMButtonsInMainMenu") != "1" ) {
            getFlags();
        }
    }

    initPage();
    initZoom();

    $('body').css('visibility', 'visible')

})