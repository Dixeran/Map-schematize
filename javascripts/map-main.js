/**
 * Created by Dixeran on 2017/3/30.
 */
var map = new AMap.Map('map-container',{
    zoom:12,
    center: [116.480983, 40.0958],
    mapStyle:'light'
});

var geolocation;
var placeSearchCity;

map.plugin('AMap.Geolocation',function () {
    geolocation = new AMap.Geolocation({
        timeout:3000,
        showCircle:false
    });
    map.addControl(geolocation);
    geolocation.getCurrentPosition(function (status, result) {
        if(status == 'complete'){
            app.code = result.addressComponent.citycode;/* 获取城市名称和代码，传递给app */
            if(result.addressComponent.city == ''){
                app.city = result.addressComponent.province;
            }
            else {
                app.city = result.addressComponent.city;
            }
            setCircle();
            setPath();
        }
    });
});

/*使用函数生成暴露到全局的变量*/
function setCircle() {
    /*高亮节点使用的圆形*/
    nodesCircle = new AMap.Circle({
        map:map,
        radius:'200',
        strokeStyle:'dashed',
        fillColor:'#3498DB',
        fillOpacity:0.3,
        strokeColor:'#2980D9',
        strokeWeight:2,
        strokeOpacity:0.5
    });
}

function setPath() {
    /*节点规划中的折线*/
    nodesLine = new AMap.Polyline({
        map:map,
        geodesic:true,
        strokeColor:'#E74C3C',
        lineJoin:'round',
        showDir:true,
        strokeWeight:6
    });
}

AMap.service('AMap.Transfer');
AMap.service('AMap.Walking');
AMap.service('AMap.Driving');
//AMap.service('AMap.Riding');
//AMap.plugin('AMap.Riding');