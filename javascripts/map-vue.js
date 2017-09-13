/**
 * Created by Dixeran on 2017/3/31.
 */

var app = new Vue({
    el:'#right-panel',
    data:{
        CurrentDay:1,
        Days:1,
        city:'',
        code:'',
        date:'',
        dateObj:0,
        nonChrome: '',
        router: 1,
        items:[

        ],
        markers:[

        ],
        paths:[

        ],
        color:['#D2527F', '#27AE60', '#2C3E50', '#E67E22', '#87D37C', '#F1C40F', '#E26A6A', '#16A085',
        '#1ABC9C', '#8E44AD', '#019875','#9B59B6', '#2ECC71', '#D35400', '#F39C12', '#34495E']
    },
    methods:{
        showCircle:function (item) {
            //var target = $(event.target).attr('index');
            //console.log(target);
            //var item = Nodes.items[target];
            nodesCircle.setCenter(item.location);
            nodesCircle.setRadius((20 - map.getZoom()) * 200);
            nodesCircle.show();
        },
        hideCircle:function () {
            nodesCircle.hide();
        },
        deleteNode:function (item) {
            var target = item.index;
            console.log(app.items[target].location.toString() +'/'+app.markers[target].getPosition().toString());
            app.items.splice(target, 1);
            app.markers[target].hide();
            app.markers.splice(target, 1);
            nodesCircle.hide();
            setTimeout(function () {
                $('#save-btn').click();
            }, 90);//修改体现到DOM上有延迟
        },
        getPath:function () {
            var path;
            nodesLine.hide();
            for(var t = 0; t<app.paths.length; t++){
                app.paths[t].clear();
            }
            app.paths.splice(0, app.paths.length);
            for(var i = 0; i<app.items.length-1; i++) {
                if(app.items[i].method == 'Transfer') {
                    path = new AMap.Transfer({
                        city: app.city,
                        map: map,
                        panel: 'path' + (i + 1),
                        outlineColor: app.color[i]
                    });
                }
                else if(app.items[i].method == 'Walking'){
                    path = new AMap.Walking({
                        map: map,
                        panel: 'path' + (i + 1),
                        outlineColor: app.color[i]
                    });
                }
                else if(app.items[i].method == 'Riding'){
                    path = new AMap.Riding({
                        map: map,
                        panel: 'path' + (i + 1),
                        outlineColor: app.color[i]
                    });
                }
                else {
                    path = new AMap.Driving({
                        map: map,
                        panel: 'path' + (i + 1),
                        outlineColor: app.color[i],
                        showTraffic:false
                    });
                }
                app.paths.push(path);
                path.search(app.items[i].location, app.items[i+1].location);
            }
            map.setFitView();
        },
        renderMap:function () {
            /*var list = document.getElementById('paths');
            html2canvas(list).then(function (canvas) {
                document.body.appendChild(canvas);
            })*/
            var container = $('#pathContainer');
            var image = document.getElementById('image');
            image.setAttribute('height', $('#paths').height() + 60);//长度不能直接取元素高度，原因未知？
            image.setAttribute('width', $('#paths').width());
            var context = image.getContext("2d");

            var title = new Image();
            title.src = 'title.png';
            document.body.appendChild(title);

            var viewHeight = $(window).height() - 38;//视图的实际高度，窗口高度减去navBar
            var scrollPre = 0;
            var scrollNow = 0;
            var containerNt = document.getElementById('pathContainer');//原生方法获取的DOM
            container.scrollTop(0);
            draw();
            /*生成长截图*/
            function draw() {
                html2canvas(containerNt).then(function (canvas) {
                    context.drawImage(canvas,0 , scrollNow);
                    document.body.appendChild(canvas);
                });

                if((scrollPre - scrollNow) <= viewHeight){
                    setTimeout(function () {
                        scrollPre += viewHeight;
                        container.scrollTop(scrollPre);
                        scrollNow = container.scrollTop();
                        draw();
                    }, 5000);
                }
                else{
                    context.drawImage(title, 0, 0);
                    setTimeout(function () {
                        var imagePNG = image.toDataURL("image/png");
                        window.open(imagePNG);
                    }, 500);
                }
            }
        },
        collapseIn:function () {
            $('.panel-collapse').collapse('show');
        },
        addDay:function () {
            app.Days++;
            saveToCookie(app.CurrentDay);
            var cache = JSON.parse($.cookie('cache'));
            cache.push([]);
            $.cookie('cache', JSON.stringify(cache), {expires:7})
        },
        deleteDay:function () {
            if(app.Days > 1){
                if($.cookie('cache')){
                    var cache = JSON.parse($.cookie('cache'));
                    cache.splice(app.CurrentDay + 2, 1);
                    $.cookie('cache', JSON.stringify(cache), {expires: 7});
                }
                --app.Days;
                app.CurrentDay == 1 ? console.log() : app.CurrentDay--;
                loadFromCookie(app.CurrentDay);
            }
        },
        switchToDay:function (n) {
            nodesLine.hide();
            saveToCookie(app.CurrentDay);
            loadFromCookie(n);
        },
        switchToPrint:function () {
            window.open("PrintFile.html", "PrintFile",'location=no,menubar=no,toolbar=no');
        }
    }
});