$(document).ready(function(){
    var objApp = window.external; //WizExplorerApp
    var objDatabase = objApp.Database;
    var objWindow = objApp.Window;
    var objDoc = objWindow.CurrentDocument; //获得当前正在浏览的Wiz文档(WizDocument)
    var objHtmlDocument = objWindow.CurrentDocumentHtmlDocument;	//获得当前正在浏览的html网页的document对象(IHTMLDocument2)
    var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
    //
    var pluginPath = objApp.GetPluginPathByScriptFileName("KMHelper.js"); //获得插件的路径
    var languageFileName = pluginPath + "plugin.ini";  //语言文件
    //
    textKeywords.value = objDoc.Keywords;   //显示当前文档的关键字
    textAuthor.value = objDoc.Author;	   //显示当前文档的作者
    //
    objApp.LocalizeHtmlDocument(languageFileName, document);
    //
    // UI界面对象
    var chkDictcn = document.getElementById("chkDictcn");
    /* 已经全面更换内核，可弃用
    var g_isChrome;
    function isChrome() {
        if (g_isChrome) return g_isChrome;
        //
        var ua = navigator.userAgent.toLowerCase();
        g_isChrome = ua.indexOf('chrome') != -1;
        //
        return g_isChrome;
    }
    */
    ///
    function SetMeta(name, key, value){
        if (!objDatabase) return false;
        //
        objDatabase.SetMeta(name, key, value);
    }
    // read Wizhelper global settings
    function KMSettings(strKey) {
        /* 直接用objCommon接口
        var fso, filehandle, strValue;
        fso = objApp.CreateActiveXObject("Scripting.FileSystemObject");
        filehandle = fso.OpenTextFile(languageFileName, 1, false, 0);
        regErr = /^([^\s]+)\s*[=]\s*(.*)/;
        while (!filehandle.AtEndOfStream) {
            var ss = filehandle.ReadLine();
            if (regErr.test(ss) && strKey == RegExp.$1) {
                strValue = RegExp.$2;
                break;
            }
        }
        filehandle.Close();
        fso = null;
        */
        strValue = objCommon.GetValueFromIni(languageFileName, "Common", strKey);
        return strValue;
    }
    //
    function textKeywords_onchange() {
        objDoc.Keywords = textKeywords.value;   //保存关键字
    }
    //
    function textAuthor_onchange() {
        objDoc.Author = textAuthor.value;	   //保存作者
    }
    //
    // 全局变量，保存筛选结果（不考虑当前是否在当前文件夹）
    var colorSelTags = "#FFFF00";
    var listDocs = objApp.CreateWizObject("WizKMCore.WizDocumentCollection");
    //
    // 获取当前选中文件夹下地文件 GUID 列表
    var objCurFolder = objApp.Window.CategoryCtrl.SelectedFolder; //当前选中的文件夹
    var guidDocsInCurFolder = "";
    if (objCurFolder != null) { //如果没有选中
        addChildDocs(objCurFolder);
    }
    function addChildDocs(ParentFolder) {
        var ChildrenFolders = ParentFolder.Folders;
        var ChildrenDocs = ParentFolder.Documents;
        if (ChildrenDocs){
            for (var i = 0; i < ChildrenDocs.Count; i++) {
                guidDocsInCurFolder += ChildrenDocs.Item(i).GUID + "; ";
            }
        }
        if (ChildrenFolders){
            for (var i = 0; i < ChildrenFolders.Count; i++) {
                addChildDocs(ChildrenFolders.Item(i));
            }
        }
    }
    //
    // 获得含有文件的标签及其文档数量
    var arrayTags = objDatabase.GetAllTagsDocumentCount(0);
    // var tagsdata = (new VBArray(arrayTags)).toArray();
    var tagsdata = arrayTags;
    //
    var listTagsWithFile = [];
    var guidTagsWithFile = "";
    for (var i = 0; i < tagsdata.length; i++) {
        var line = tagsdata[i];
        var arr = line.split('=');
        if (arr.length != 2)
            continue;
        var guid = arr[1];  //文档guid
        var count = parseInt(arr[0]);   //文档数量
        var objTag = objDatabase.TagFromGUID(guid);  //通过guid获得标签对象
        var tagData = {};
            tagData.tag = objTag;
            tagData.GUID = guid;
            tagData.count = count;
        listTagsWithFile.push(tagData);
        guidTagsWithFile += guid + "; ";
    }
    //
    function textNewTags_onEnterPress(e) {
        var e = e || window.event;
        if (e.keyCode == 13 || e.keyCode == 186) {
            textNewTags_onblur();
        }
        if (textNewTags.value==";"){
            textNewTags.value="";
        }
    }
    //
    function textNewTags_onblur() {
        var text = textNewTags.value;
        var strDocTags = objDoc.TagsText;
        if (text=="" || text==null || strDocTags.indexOf(text)!=-1)
            return;
        if (objDoc) {
            objDoc.TagsText = strDocTags + ";" + text;
            listTags();
        }
            textNewTags.focus();
            textNewTags.value="";
    }
    //
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
    //
    function getTag(tagi){
        var tagData = {};
        tagData.tag = tagi;
        tagData.GUID = tagi.GUID;
        tagData.count = 0;
        for (var j = 0; j < listTagsWithFile.length; j++){
            if (tagData.GUID == listTagsWithFile[j].tag.GUID){
                tagData.count = listTagsWithFile[j].count;
            }
        }
        return tagData;
    }
    //
    function listTags (){
        var objTags = objDoc.Tags;
        var  html_check = "<input style='VERTICAL-ALIGN: middle' type='checkbox' id='checkUnionset' onclick='ListDocsByTags()' />" + objApp.LoadStringFromFile(languageFileName, "strUnionset") + " &nbsp;&nbsp;";
        html_check += "<input style='VERTICAL-ALIGN: middle' type='checkbox' id='checkCurFolder' onclick='ShowDocList()' />" + objApp.LoadStringFromFile(languageFileName, "strCurfolder") + " &nbsp;&nbsp;";
        html_check += "<input style='VERTICAL-ALIGN: middle' type='checkbox' id='checkFilelist' onclick='ShowDocList()' />" + objApp.LoadStringFromFile(languageFileName, "strSendtoDoc") + " <br>";
        divCheckbox.innerHTML = html_check;
        // 当前文档含有标签列出所有标签。
        if ( objTags.Count > 0){
            var html = "";
            for (var i = 0; i < objTags.Count; i++) {
                var objTag = objTags.Item(i);
                var tagi = getTag(objTag);
                html += tagToHtml(tagi);
            }
            divTags.innerHTML = html;
        }
    }
    //
    function listAttachments() {
        var objAttachments = objDoc.Attachments;
        if ( objAttachments.Count > 0){
            var html = "";
            for (var i = 0; i < objAttachments.Count; i++) {
                var objAttachi = objAttachments.Item(i);
                html += '<a href="' + objAttachi.FileName + '">'+ objAttachi.Name +'</a><br/> ';
            }
            divAttachments.innerHTML = html;
        }
    }
    //
    //将文件按照名称排序，方便查找
    function CompareDoc(a, b) {
        var n1 = a.Title.toLowerCase();
        var n2 = b.Title.toLowerCase();
        //
        if (n1 > n2)
            return 1;
        else if (n1 < n2)
            return -1;
        return 0;
    }
    // 点击标签，通过 tag guid 获得列出对应的文档
    function ListDocsByTagGUID(guid) {
        var aTag = document.getElementById(guid);
        if ( aTag.isSelected == "0" ){
            aTag.isSelected = "1";
            aTag.style.cssText = "background:" + colorSelTags + ";";
        }
        else{
            aTag.isSelected = "0";
            aTag.style.cssText = "" ;
        }
        ListDocsByTags();
    }
    //
    function ListDocsByTags() {
        var objTags = objApp.CreateWizObject("WizKMCore.WizTagCollection");
        var aTags = divTags.getElementsByTagName("a");
        for (var i = 0; i < aTags.length; i++) {
            var aTagi = aTags[i];
            if (aTagi.isSelected=="1") {
                var guid = aTagi.getAttribute("id");
                if (guid != null) {
                    try {
                        var objTag = objDatabase.TagFromGUID(guid);
                        objTags.Add(objTag);
                    }
                    catch (err) {
                    }
                }
            }
        }
        if (objTags.Count == 0) {
            var documents = objApp.CreateWizObject("WizKMCore.WizDocumentCollection");
        }
        else {
            if (checkUnionset.checked){
                var documents = objApp.CreateWizObject("WizKMCore.WizDocumentCollection");
                var documentsGUID = "";
                for (var j=0; j<objTags.Count; j++){
                    var objTags1 = objApp.CreateWizObject("WizKMCore.WizTagCollection");
                    objTags1.Add(objTags.Item(j));
                    var documents_CurrentTag = objDatabase.DocumentsFromTags(objTags1);
                    for (var k=0; k<documents_CurrentTag.Count; k++){
                        var documentk = documents_CurrentTag.Item(k);
                        if (documentsGUID.indexOf(documentk.GUID) == -1) {
                            documentsGUID += documentk.GUID + "; ";
                            documents.Add(documents_CurrentTag.Item(k));
                        }
                    }
                }
            }
            else{
                var documents = objDatabase.DocumentsFromTags(objTags);
            }
        }
        listDocs = documents;
        ShowDocList();
    }
    // 删除标签
    function DeleteTagByGUID(guid) {
        var objTag = objDatabase.TagFromGUID(guid);
        objDoc.RemoveTag(objTag);
        listTags();
    }		//
    // 列出筛选出的文档列表
    function ShowDocList(){
        // 列出筛选出的文档列表
        if (checkCurFolder.checked && guidDocsInCurFolder!=""){
            var listDocsInCurFolder = objApp.CreateWizObject("WizKMCore.WizDocumentCollection");
            for ( i=0; i<listDocs.Count; i++){
                var doci = listDocs.Item(i);
                if (guidDocsInCurFolder.indexOf(doci.GUID)!=-1){
                    listDocsInCurFolder.Add(doci);
                }
            }
            listDocs_tmp = listDocsInCurFolder;
        }
        else{
            listDocs_tmp =listDocs;
        }
        // 对文档按标题进行排序
        var listDoc = [];
        for (var i=0; i<listDocs_tmp.Count; i++){
            var doci = listDocs_tmp.Item(i);
            var dataDoc = {};
            dataDoc.Title = doci.Title;
            dataDoc.objDoc = doci;
            listDoc.push(dataDoc);
        }
        listDoc.sort(CompareDoc);
        var listDocs_plt = objApp.CreateWizObject("WizKMCore.WizDocumentCollection");
        for (var i=0; i<listDoc.length; i++){
            listDocs_plt.Add(listDoc[i].objDoc);
        }
        // 输出文档列表
        var html_files = "<p> ";
        for (var i=0; i<listDocs_plt.Count; i++){
            var doci = listDocs_plt.Item(i);
            html_files += docToHtml(doci);
        }
        if (checkFilelist.checked){
            objApp.Window.DocumentsCtrl.SetDocuments(listDocs_plt);
            divFiles.innerHTML = "";
        }
        else{
            divFiles.innerHTML = html_files;
        }
        divStatus.innerHTML = listDocs_plt.Count + " files are matching!"
    }
    //
    // 在新窗口中打开选中文件
    function OpenDocumentByGUID(guid) {
        //通过文档guid显示文档
        var doc = null;
        try {
            doc = objDatabase.DocumentFromGUID(guid);
        }
        catch (err) {
            alert(err.message);
        }
        if (!doc)
            return;
        //在Wiz里面打开这个文档。第二个参数表示在新窗口打开
        objWindow.ViewDocument(doc, true);
    }
    //
    /*
    通过关键字搜索相关文档，显示在文档窗口中。注：目前没有将关键字进行分隔，这样会有缺陷。
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
    //
    var imgRateArray = [rate1, rate2, rate3, rate4, rate5];
    var imgRateSrc1 = 'km_star1.png';
    var imgRateSrc2 = 'km_star2.png';
    //
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
    for (var i = 0; i < imgRateArray.length; i++) {
        imgRateArray[i]._num = i;
        imgRateArray[i].onclick = onRateImageClick;
        imgRateArray[i].onmouseover = onRateImageMouseOver;
        imgRateArray[i].onmouseout = resetRate;
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
    //
    function changeDateFormate(objDate) {
        var dt = new Date(objDate);
        var strDay = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        var strDateModified = dt.getFullYear() + "-" + sameStrLen(dt.getMonth()+1) + "-" + sameStrLen(dt.getDate()) + " " + strDay[dt.getDay()];
        strDateModified += "  " + sameStrLen(dt.getHours()) + ":" + sameStrLen(dt.getMinutes()) + ":" + sameStrLen(dt.getSeconds());
        return strDateModified;
    }
    function sameStrLen(DateTime){
        var strDateTime = String(DateTime);
        if (strDateTime.length<2){
            strDateTime = "0" + strDateTime;
        }
        return strDateTime;
    }
    //
    function AddInfoPage() {
        ivalue_document_title.innerHTML = objDoc.Title;
        textAuthor.value = objDoc.Author;
        textKeywords.value = objDoc.Keywords;
        ivalue_document_location.innerHTML = "<A href=javascript:GotoCurDocList();>" + objDoc.Location + "</A>";
        ivalue_document_attachments.innerHTML = objDoc.Attachments.Count;
        ivalue_document_owner.innerHTML = objDoc.Owner;
        ivalue_dt_created.innerHTML = changeDateFormate(objDoc.DateCreated);
        ivalue_dt_modified.innerHTML = changeDateFormate(objDoc.DateModified);
        if (objDoc.URL)
            ivalue_document_url.innerHTML = "<A href=javascript:OpenCurURL();>" + StringLessThanN(objDoc.URL,35) + "</A>";
        if (objDoc.Style)
            ivalue_document_style.innerHTML = objDoc.Style.Name;
        ivalue_document_readcount.innerHTML = objDoc.ReadCount;
        if (KMSettings("KMButtonsInMainMenu") != "1") {
            trButtonToggles.style.display = "";
        }
    }
    //
    // 读取当前维基语法高亮, wiz助手高亮, 必须按下Alt触发Wizhelper 状态
    function getFlags() {
        if (objDatabase.GetMeta("wizhelp_parm", "KEYWORD_FLAG") == "1") {
            //chkKeyword.setAttribute("checked", "checked");
            chkKeyword.checked = true;
        }
        else {
            chkKeyword.checked = false;
            //chkKeyword.setAttribute("checked", "");
        //
        }
        if (objDatabase.GetMeta("wizhelp_parm", "SMARTTAG_FLAG") == "1") {
            //chkSmarttag.setAttribute("checked", "checked");
            chkSmarttag.checked = true;
        }
        else {
            chkSmarttag.checked = false;
            //chkSmarttag.setAttribute("checked", "");
        //
        }
        if (objDatabase.GetMeta("wizhelp_parm","ALTKEY_FLAG") == "1") {
            //chkAltkey.setAttribute("checked", "checked");
            chkAltkey.checked = true;
        }
        else {
            chkAltkey.checked = false;
            //chkAltkey.setAttribute("checked", "");
        //
        }
        if (objDatabase.GetMeta("wizhelp_parm","DICTCN_FLAG") == "1") {
            //chkDictcn.setAttribute("checked", "checked");
            chkDictcn.checked = true;
            
        }
        else {
            chkDictcn.checked = false;
            //chkDictcn.setAttribute("checked", "");
        }
    }
    // 切换维基语法高亮状态
    function setKEYWORD_FLAG() {
        if (chkKeyword.checked) {
            chkKeyword.checked = true;
            //chkKeyword.setAttribute("checked", "checked");
            SetMeta("wizhelp_parm","KEYWORD_FLAG", "1");
        }
        else {
            chkKeyword.checked = false;
            //chkKeyword.setAttribute("checked", "");
            SetMeta("wizhelp_parm","KEYWORD_FLAG", "0");
        }
    }
    // 切换wiz助手高亮状态
    function setSMARTTAG_FLAG() {
        if (chkSmarttag.checked) {
            chkSmarttag.checked = true;
            //chkSmarttag.setAttribute("checked", "checked");
            SetMeta("wizhelp_parm","SMARTTAG_FLAG", "1");
        }
        else {
            chkSmarttag.checked = false;
            //chkSmarttag.setAttribute("checked", "");
            SetMeta("wizhelp_parm","SMARTTAG_FLAG", "0");
        }
    }
    // 切换是否按下Alt键才触发Wizhelper
    function setALTKEY_FLAG() {
        if (chkAltkey.checked) {
            chkAltkey.checked = true;
            //chkAltkey.setAttribute("checked", "checked");
            SetMeta("wizhelp_parm","ALTKEY_FLAG", "1");
        }
        else {
            chkAltkey.checked = false;
            //chkAltkey.setAttribute("checked", "");
            SetMeta("wizhelp_parm","ALTKEY_FLAG", "0");
        }
    }
    // 切换是否开启海词在线
    function setDICTCN_FLAG() {
        if (chkDictcn.checked) {
            chkDictcn.checked = true;
            //chkDictcn.setAttribute("checked", "checked");
            SetMeta("wizhelp_parm","DICTCN_FLAG", "1");
            console.log(chkDictcn.checked);
        }
        else {
            chkDictcn.checked = false;
            //chkDictcn.setAttribute("checked", "");
            SetMeta("wizhelp_parm","DICTCN_FLAG", "0");
            console.log(chkDictcn.checked);
        }
    }
    //
    function GotoCurDocList() {
        objWindow.CategoryCtrl.SelectedFolder = objDoc.Parent;
        setTimeout('objWindow.DocumentsCtrl.SelectedDocuments = objDoc;',500);
        
    }
    //
    objWindow.DocumentsCtrl.SelectedDocuments = objDoc;
    //
    function OpenCurURL() {
        objWindow.ViewHtml(objDoc.URL, true);
    }
    //
    function update_version() {
        if (objDatabase.GetMeta("keyword_HL","keyword_flag") != null || 
            objDatabase.GetMeta("keyword_HL","keyword_flag") != "" ) {
            SetMeta("WIZHELP_PARM","KEYWORD_FLAG", objDatabase.GetMeta("keyword_HL","keyword_flag"));
        }
    }
    function initPage() {
        // update_version();
        resetRate();
        AddInfoPage();
        listTags();
        listAttachments();
        if (KMSettings("KMButtonsInMainMenu") != "1") {
            getFlags();
        }
        checkFilelist.setAttribute("checked", "checked");
        textNewTags.focus();
    }
    //
    function Main() {
        initPage();
    }
    Main();
    //
    $(function() {
        var availableTags = [];
        var objTags = objDatabase.Tags;
        for (var i = 0; i < objTags.Count; i++) {
            availableTags.push(objTags.Item(i).Name);
        } 
        // $("#textNewTags").autocomplete({
        //     source: availableTags,
        //     multiple: true,
        //     multipleSeparator: ';'
        // });
        //$("#textNewTags").autocomplete(availableTags, {
        //    multiple: false,
        //    mustMatch: false,
        //    autoFill: true
        //});
    });
})