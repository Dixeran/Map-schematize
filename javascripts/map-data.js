/**
 * 
 * Created by Dixeran on 2017/3/30.
 */

/*jQuery部分*/
$(document).ready(function () {
    /*检查浏览器*/
    var userAgent = navigator.userAgent;
    if(userAgent.indexOf('Chrome') == -1){
        app.nonChrome = 1;
    }

    /*设置节点列表为拖动排序*/
    var sortableNodes = new Sortable(nodes,{
        animation:200,
        dataIdAttr:'index',
        onUpdate:function (event) {
            save();
            for(var t = 0; t<app.paths.length; t++){
                app.paths[t].clear();//清除已有的路线
            }
            drawLine();
        }
    });

    /*切换搜索城市*/
    $('#city').on('click',function () {
        $('#search-city-container').toggle();
    });

    /*日期选择器*/
    $('#date').on('click',function () {
        $('#date').flatpickr({
            onChange: function(selectedDates, dateStr, instance){
                app.date = dateStr;
            }
        }).open();
    });

    /*保存*/
    $('#save-btn').on('click',function () {
        for(var t = 0; t<app.paths.length; t++){
            app.paths[t].clear();//清除已有的路线
        }
        save();
        drawLine();
        map.setFitView();
    });

    /*保存节点和对应的marker，同时重整序号*/
    function save() {
        var cache_nodes = [];
        var cache_markers = [];
        var order = sortableNodes.toArray();
        console.log(order);
        for(var k = 0; k<order.length;k++)
        {
            app.items[k].state = 0;
            app.markers[k].state = 0;
        }
        for(var i = 0; i<order.length; i++)
        {
            for(var t = 0;t<app.items.length; t++)
            {
                if((app.items[t].index == order[i]) && (app.items[t].state != 1))
                {
                    cache_nodes.push(app.items[t]);
                    cache_nodes[i].state = 1;
                    /*震惊！Js深浅拷贝引发的惨案：直接phsh进去会发生浅拷贝，导致Nodes.items和cahce提前同步.
                     *序列化再转换回来可以避免类似惨案的发生;
                     * 震惊X2! 序列化会导致对象内部函数的丢失，考虑解决方法..
                     * 改变index后使用另一个标记来避免重复改变，所有修改完成后再重置标记*/
                    cache_nodes[i].index = i;
                    break;
                }
            }
        }
        for(var p = 0; p<order.length; p++)
        {
            for(var s = 0;s<app.markers.length; s++)
            {
                if((app.markers[s].index == order[p]) && (app.markers[s].state != 1))
                {
                    cache_markers.push(app.markers[s]);
                    cache_markers[p].state = 1;
                    cache_markers[p].index = p;
                    break;
                }
            }
        }
        app.items = cache_nodes;
        app.markers = cache_markers;
        order.sort(sortIndex);
        sortableNodes.sort(order);
    }
    function sortIndex(a, b) {
        return a - b;
    }

    /* 引入搜索服务 */
    AMap.service('AMap.PlaceSearch',function () {
        placeSearchCity = new AMap.PlaceSearch({
            map:map
        });
    });

    /* 自动补全插件 */
    AMap.plugin('AMap.Autocomplete',function () {
        var autoOptionsCity = {
            type: '190100|190103|190104|190105|190106',
            input:'search-city'
        };/* 搜索城市的自动完成*/
        var autocomplete = new AMap.Autocomplete(autoOptionsCity);
        AMap.event.addListener(autocomplete,'select',function (e) {
            placeSearchCity.search(e.poi.name,function (status,result) {
                if(status == 'complete'){
                    $('#search-city-container').hide();
                    app.code = result.poiList.pois[0].citycode;
                    app.city = result.poiList.pois[0].cityname;
                    map.clearMap();
                    /*clear以后重新生成全局对象*/
                    setCircle();
                    setPath();
                }
            });
        });
    });
    
    //引入piopickerUI插件
    $('#search-node').on('click', function () {
        AMapUI.loadUI(['misc/PoiPicker'], function (PoiPicker) {
            var nodePicker = new PoiPicker({
                input:'search-node',
                city:app.code
            });

            nodePicker.on('poiPicked', function (poiResult) {
                //alert(poiResult.item.name);
                //app.items.push({name:poiResult.item.name});
                var searchDetail = new AMap.PlaceSearch({
                    city:app.code,
                    extensions:'all'
                });//根据picker得到的地址变编码获取更详细的信息
                searchDetail.getDetails(poiResult.item.id, function (status, result) {
                    if(status == 'complete'){
                        addInfoWindow(result);
                    }
                });
                addMarker(poiResult); //添加marker
                map.setCenter(poiResult.item.location);
                map.setZoom(14);
            });
        });
    });

    /*绘制节点之间折线*/
    function drawLine() {
        var position = [];
        for(var t = 0; t<app.items.length; t++)
        {
            position.push(app.items[t].location);
        }
        nodesLine.setPath(position);
        nodesLine.show();
    }

    /*初始化提示框*/
    $(document).on('mouseover', '[data-toggle="tooltip"]',function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    /*导出文件*/
    function outPut() {
        var dataId = [];
        var dataString;
        dataId.push(app.code);
        dataId.push(app.date);
        dataId.push(app.city);
        for(var i = 0; i<app.items.length; i++){
            dataId.push(app.items[i].id);
        }
        dataString = JSON.stringify(dataId);
        console.log(dataString);
        var blob = new Blob([dataString], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "MapOutput.json");
    }
    $('#download').on('click', function () {
        outPut();
    });

    /*导入文件*/
    $('#upload').on('change', function (event) {
        var file = document.getElementById('upload').files[0];//取得input的文件
        var fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = function (e) {
            dataJSON = JSON.parse(this.result);
            console.log(dataJSON);
            initPlan(dataJSON);
        }
    })
});
/*jQuery部分结束*/

//添加marker
function addMarker(poiResult) {
    if(poiResult.item) {//通过poiPicker得到的数据
        marker = new AMap.Marker({
            position: poiResult.item.location
        });
        marker.setMap(map);
        marker.on('click', function (e) {
            openInfoWindow(e, poiResult);
        });
        marker.index = app.items.length;
        app.markers.push(marker);
    }
    else {
        marker = new AMap.Marker({//通过search得到的数据
            position: poiResult.location
        });
        marker.setMap(map);
        marker.on('click', function (e) {
            openInfoWindow(e, poiResult);
        });
        marker.index = app.items.length;
        app.markers.push(marker);
    }
}

//点击marker以后弹出的信息窗对象
var marker_infoWindow = new AMap.InfoWindow({
    offset: new AMap.Pixel(0, -30)
});

//点击marker以后弹出信息
function openInfoWindow(event, poiResult) {
    if(poiResult.item){//通过poiPicker得到的数据
        marker_infoWindow.setContent(poiResult.item.name);
    }
    else{//通过search得到的数据
        marker_infoWindow.setContent(poiResult.name);
    }
    marker_infoWindow.open(map, event.target.getPosition());
}

function addInfoWindow(detailResult) {
    var name = detailResult.poiList.pois[0].name;
    var type = detailResult.poiList.pois[0].type;
    var address = detailResult.poiList.pois[0].address;
    var location = detailResult.poiList.pois[0].location;
    var infoContent =   '<div class="panel">' +
                            '<div class="panel-heading">'+ name + '&nbsp;&nbsp;&nbsp;&nbsp;' +
                                '<button id="info-add" type="button" class="btn btn-primary btn-xs">ADD</button>' +
                                '&nbsp;<button id="info-close" type="button" class="btn btn-danger btn-xs">X</button></div>'+
                            '<div class="panel-body">' +
                                '<span class="label label-info">' + type + '</span>' +
                                '<span class="label label-primary">' + address + '</span>' +
                            '</div>'+
                        '</div>';
    var infoWindow = new AMap.InfoWindow({
        isCustom:true,
        content:infoContent,
        offset: new AMap.Pixel(0, -30)
    });
    infoWindow.open(map, location);
    $(document).on('click','#info-add', function () {
        detailResult.poiList.pois[0].index = app.items.length;
        detailResult.poiList.pois[0].method = 'Transfer';
        if(app.items.length > 0) {
            for (var i = 0; i < app.items.length; i++) {
                if (app.items[i].name == detailResult.poiList.pois[0].name) {
                    new $.zui.Messager('该节点已存在！', {
                        type: 'danger'
                    }).show();
                    map.clearInfoWindow();
                    $(document).off('click', '#info-add');
                    $(document).off('click', '#info-close');
                    return;
                }
            }
            app.items.push(detailResult.poiList.pois[0]);
        }
        else{
            app.items.push(detailResult.poiList.pois[0]);
        }
        map.clearInfoWindow();
        $(document).off('click', '#info-add');
        $(document).off('click', '#info-close');
    });

    //设置点击关闭按钮动作
    $(document).on('click', '#info-close', function () {
        marker.setMap(null);//销毁maker
        map.clearInfoWindow();//清空信息窗
        $(document).off('click', '#info-add');//销毁事件监听器
        $(document).off('click', '#info-close');
    });
}

/*从文件初始化*/
function initPlan(list) {
    app.code = list[0];
    app.date = list[1];
    app.city = list[2];
    var searchDetail = new AMap.PlaceSearch({
        city:app.code,
        extensions:'all'
    });//根据文件得到的地址编码获取更详细的信息
    var cache = [];
    for(var i = 3; i<list.length; i++){
        searchDetail.getDetails(list[i], function (status, result) {
            cache.push(result.poiList.pois[0]);
            console.log(result.poiList.pois[0].id);
        });
    }
    var message = new $.zui.Messager('正在导入', {
        type: 'info',
        placement: 'center'
    });
    message.show();
    /*搜索详细信息的返回不按顺序，所以要得到所有结果以后进行一次重整*/
    setTimeout(function () {
        for(var t = 0; t<list.length; t++){
            for(var k = 0; k<cache.length; k++){
                if(list[t] == cache[k].id){
                    cache[k].index = app.items.length;
                    cache[k].method = 'Transfer';
                    addMarker(cache[k]);
                    app.items.push(cache[k]);
                    setCircle();
                    setPath();
                    break;
                }
            }
        }
        message.hide();
    }, 2000);
}


