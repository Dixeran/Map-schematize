/**
 * Created by lenovo on 2017/9/10.
 */
let ParentVue = window.opener.app;
let vue = new Vue({
    el:'#container',
    data:{
        Days:0,
        City:'',
        dateObj: Date(),
        items:[],
        transPlan:[]
    }
});

window.onload = function () {
    vue.Days = ParentVue.Days;
    vue.City = ParentVue.city;
    vue.dateObj = ParentVue.dateObj;
    AMap.service('AMap.Transfer');
    $('#progressBar').css('width', '10%');
    SearchAllDays();

    function SearchAllDays() {
        var list = JSON.parse($.cookie('cache'));
        console.log(list);
        vue.code = list[0];
        vue.dateObj = new Date(list[1]);
        vue.date = vue.dateObj.getFullYear() + "-" + (vue.dateObj.getMonth() + 1) + "-" + vue.dateObj.getDate();
        vue.city = list[2];
        vue.CurrentDay = 1;
        vue.Days = list.length - 3;
        var searchDetail = new window.opener.AMap.PlaceSearch({
            city:vue.code,
            extensions:'all'
        });//根据文件得到的地址编码获取更详细的信息

        let gre = SearchDetail();
        gre.next();

        function * SearchDetail() {
            for(var day = 1; day <= vue.Days; day++){
                for(var i = 0; i<list[day + 2].length; i++){
                    yield _SearchDetail(day, i)
                }
            }
            //TODO: 在异步搜索完成以后的函数调用
            $('#progressBar').css('width', '40%');
            Day_Map();
            setTimeout(function () {
                Set_Pic();
                Search_Transfers();
            }, 500);
        }

        function _SearchDetail(day, index){
            searchDetail.getDetails(list[day + 2][index], function (status, result) {
                let cache = result.poiList.pois[0];
                if(!vue.items[day - 1]) vue.items.push([]);
                cache.index = vue.items[day - 1].length;
                cache.method = 'Transfer';
                console.log(cache.id);
                vue.items[day - 1].push(cache);
                gre.next();
            });
        }
    }

    function Day_Map() {
        /*http://restapi.amap.com/v3/staticmap?markers=large,0xFF0000,A:116.37359,39.92437|large,0xFF0000,B:117.37359,38.92437&key=7ad31990285d9ed11f1171e5906bb123&size=1024*768*/
        console.log($('.day_map'));
        let C_Dr = 1;
        let sign = 'A';
        $('.day_map').each(function () {
            let base = 'http://restapi.amap.com/v3/staticmap?markers=';
            for(let t = 0; t < vue.items[C_Dr - 1].length; t++){
                base += (t == 0 ? 'large,0xFF0000,' : '|large,0xFF0000,') + String.fromCharCode(sign.charCodeAt() + t) + ':' + vue.items[C_Dr - 1][t].location.toString();
            }
            base += '&key=7ad31990285d9ed11f1171e5906bb123&size=1024*576';
            console.log(base);
            console.log(this);
            $(this).attr('src', base);
            C_Dr++;
        })
    }

    function Set_Pic() {
        let C_Dr = 1;
        let t = 0;
        /*http://restapi.amap.com/v3/place/detail?id=B0FFFZ7A7D&output=xml&key=7ad31990285d9ed11f1171e5906bb123*/
        $('.headding img').each(function () {
            let base = 'http://restapi.amap.com/v3/place/detail?id=';
            let P_this = this;
            url = base + vue.items[C_Dr - 1][t].id + '&output=json&key=7ad31990285d9ed11f1171e5906bb123';
            $.ajax({
                url:url,
                dataType:'json',
                async:false,
                success:function (data) {
                    //console.log(data.pois[0].photos[0].url + '\n' + vue.items[C_Dr - 1][t].name);
                    if(data.pois[0].photos[0]){
                        $(P_this).attr('src', data.pois[0].photos[0].url);
                    }
                    else{
                        let transUrl = 'http://restapi.amap.com/v3/staticmap?markers=small,0xFF0000,0:' + vue.items[C_Dr - 1][t].location.toString() + '&key=7ad31990285d9ed11f1171e5906bb123&size=800*600';
                        $(P_this).attr('src', transUrl);
                    }
                }
            });

            if(t == vue.items[C_Dr - 1].length - 1){
                t = 0;
                C_Dr++;
            }
            else{
                t++;
            }
        })
    }

    function Search_Transfers() {
        let cache = 0;
        let nodes = $('.TR-map');

        let gne = main();
        gne.next();

        function * main() {
            for(let k = 0; k < vue.Days; k++){
                vue.transPlan.push([]);
                for(let j = 0; j < (vue.items[k].length - 1); j++){
                    try{
                        let Tmap = new AMap.Map(nodes[cache], {
                            zoom:12,
                            center: [116.480983, 40.0958],
                            mapStyle:'light'
                        });
                        let transfer = new AMap.Transfer({
                            city: vue.City,
                            map: Tmap,
                            extensions:'all'
                        });
                        yield transfer.search([vue.items[k][j].location.getLng(), vue.items[k][j].location.getLat()], [vue.items[k][j + 1].location.getLng(), vue.items[k][j + 1].location.getLat()],function (status, result) {
                            if(status == "complete"){
                                vue.transPlan[k].push(result);
                                gne.next();
                            }
                        });
                        cache++;
                    }catch (err){
                        console.log(err);
                    }
                }
            }
            $('#progressBar').css('width', '80%');
            setTimeout(function () {
                $('#progressBar').css('width', '100%');
                $('#print').removeClass('disabled');
            }, 2000)
        }
    }
};
