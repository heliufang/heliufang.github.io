//随机背景线条 https://blog.csdn.net/qq526362801/article/details/108863458
function DynamicLine() {
    function n(n, e, t) {
        return n.getAttribute(e) || t
    }

    function e(n) {
        return document.getElementsByTagName(n)
    }

    function t() {
        var t = e("script"),
            o = t.length,
            i = t[o - 1];
        return {
            l: o,
            z: n(i, "zIndex", -1),
            o: n(i, "opacity", .5),
            c: n(i, "color", "0,0,50"), //颜色rgb
            n: n(i, "count", 99)
        }
    }

    function o() {
        a = m.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
            c = m.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }

    function i() {
        r.clearRect(0, 0, a, c);
        var n, e, t, o, m, l;
        s.forEach(function (i, x) {
            for (i.x += i.xa, i.y += i.ya, i.xa *= i.x > a || i.x < 0 ? -1 : 1, i.ya *= i.y > c || i.y < 0 ? -1 : 1, r.fillRect(
                i.x - .5, i.y - .5, 1, 1), e = x + 1; e < u.length; e++) n = u[e],
                    null !== n.x && null !== n.y && (o = i.x - n.x, m = i.y - n.y,
                        l = o * o + m * m, l < n.max && (n === y && l >= n.max / 2 && (i.x -= .03 * o, i.y -= .03 * m),
                            t = (n.max - l) / n.max, r.beginPath(), r.lineWidth = t / 2, r.strokeStyle = "rgba(" + d.c + "," + (t + .2) +
                            ")", r.moveTo(i.x, i.y), r.lineTo(n.x, n.y), r.stroke()))
        }),
            x(i)
    }
    var a, c, u, m = document.createElement("canvas"),
        d = t(),
        l = "c_n" + d.l,
        r = m.getContext("2d"),
        x = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window
            .oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function (n) {
                window.setTimeout(n, 1e3 / 45)
            },
        w = Math.random,
        y = {
            x: null,
            y: null,
            max: 2e4
        };
    m.id = l, m.style.cssText = "position:fixed;top:0;left:0;z-index:" + d.z + ";opacity:" + d.o, e("body")[0].appendChild(
        m), o(), window.onresize = o,
        window.onmousemove = function (n) {
            n = n || window.event, y.x = n.clientX, y.y = n.clientY
        },
        window.onmouseout = function () {
            y.x = null, y.y = null
        };
    for (var s = [], f = 0; d.n > f; f++) {
        var h = w() * a,
            g = w() * c,
            v = 2 * w() - 1,
            p = 2 * w() - 1;
        s.push({
            x: h,
            y: g,
            xa: v,
            ya: p,
            max: 6e3
        })
    }
    u = s.concat([y]),
        setTimeout(function () {
            i()
        }, 100)
}
DynamicLine() //调用随机背景线条

//鼠标点击特效 原文链接：https://blog.csdn.net/ungoing/article/details/125071691
function clickEffect() {
    let balls = [];
    let longPressed = false;
    let longPress;
    let multiplier = 0;
    let width, height;
    let origin;
    let normal;
    let ctx;
    const colours = ["#F73859", "#14FFEC", "#00E0FF", "#FF99FE", "#FAF15D"];
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.setAttribute("style", "width: 100%; height: 100%; top: 0; left: 0; z-index: 99999; position: fixed; pointer-events: none;");
    const pointer = document.createElement("span");
    pointer.classList.add("pointer");
    document.body.appendChild(pointer);

    if (canvas.getContext && window.addEventListener) {
        ctx = canvas.getContext("2d");
        updateSize();
        window.addEventListener('resize', updateSize, false);
        loop();
        window.addEventListener("mousedown", function (e) {
            pushBalls(randBetween(10, 20), e.clientX, e.clientY);
            document.body.classList.add("is-pressed");
            longPress = setTimeout(function () {
                document.body.classList.add("is-longpress");
                longPressed = true;
            }, 500);
        }, false);
        window.addEventListener("mouseup", function (e) {
            clearInterval(longPress);
            if (longPressed == true) {
                document.body.classList.remove("is-longpress");
                pushBalls(randBetween(50 + Math.ceil(multiplier), 100 + Math.ceil(multiplier)), e.clientX, e.clientY);
                longPressed = false;
            }
            document.body.classList.remove("is-pressed");
        }, false);
        window.addEventListener("mousemove", function (e) {
            let x = e.clientX;
            let y = e.clientY;
            pointer.style.top = y + "px";
            pointer.style.left = x + "px";
        }, false);
    } else {
        console.log("canvas or addEventListener is unsupported!");
    }


    function updateSize() {
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(2, 2);
        width = (canvas.width = window.innerWidth);
        height = (canvas.height = window.innerHeight);
        origin = {
            x: width / 2,
            y: height / 2
        };
        normal = {
            x: width / 2,
            y: height / 2
        };
    }
    class Ball {
        constructor(x = origin.x, y = origin.y) {
            this.x = x;
            this.y = y;
            this.angle = Math.PI * 2 * Math.random();
            if (longPressed == true) {
                this.multiplier = randBetween(14 + multiplier, 15 + multiplier);
            } else {
                this.multiplier = randBetween(6, 12);
            }
            this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle);
            this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle);
            this.r = randBetween(8, 12) + 3 * Math.random();
            this.color = colours[Math.floor(Math.random() * colours.length)];
        }
        update() {
            this.x += this.vx - normal.x;
            this.y += this.vy - normal.y;
            normal.x = -2 / window.innerWidth * Math.sin(this.angle);
            normal.y = -2 / window.innerHeight * Math.cos(this.angle);
            this.r -= 0.3;
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
    }

    function pushBalls(count = 1, x = origin.x, y = origin.y) {
        for (let i = 0; i < count; i++) {
            balls.push(new Ball(x, y));
        }
    }

    function randBetween(min, max) {
        return Math.floor(Math.random() * max) + min;
    }

    function loop() {
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < balls.length; i++) {
            let b = balls[i];
            if (b.r < 0) continue;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, false);
            ctx.fill();
            b.update();
        }
        if (longPressed == true) {
            multiplier += 0.2;
        } else if (!longPressed && multiplier >= 0) {
            multiplier -= 0.4;
        }
        removeBall();
        requestAnimationFrame(loop);
    }

    function removeBall() {
        for (let i = 0; i < balls.length; i++) {
            let b = balls[i];
            if (b.x + b.r < 0 || b.x - b.r > width || b.y + b.r < 0 || b.y - b.r > height || b.r < 0) {
                balls.splice(i, 1);
            }
        }
    }
}
clickEffect();//调用特效函数

//更新页脚年份
document.querySelector("#currentYear").innerText = new Date().getFullYear();
//计算网站运行天数
var days = moment().diff($("#runDays")[0].dataset.sinceDate,"days");
$("#runDays").html(days);
$("#runDaysFooter").html(days);
//设置网站最后更新时间
var lastUpdate = moment($("#lastUpdate")[0].dataset.lastUpdate,"YYYY-MM-DD HH:mm:ss").locale("zh-CN").fromNow();
$("#lastUpdate").html(lastUpdate);
$("#lastUpdateFooter").html(lastUpdate);


//置顶  增加scrollTop的动画效果,使用定时器，将scrollTop的值每次减少50(减少六十分之一)，直到减少到0，则动画完毕
$("#toTopBtn").click(function () {
    var oTop = $(window).scrollTop();
    var t = parseInt(oTop / 60); //每次六十分之一
    var time = setInterval(function () {
        //console.log('toTopBtn...setInterval',$(window).scrollTop())
        $(window).scrollTop($(window).scrollTop() - t);
        if ($(window).scrollTop() === 0) {
            clearInterval(time);
        }
    }, 1);
})
$.event.add(window, "scroll", function () {
    //显示与隐藏置顶按钮   transition: all 0.5s;
    $("#toTopBtn").css('transform', $(window).scrollTop() > 0 ? 'translateX(-85px)' : 'translateX(85px)');
    $("#toTopBtn").css('transition', "all 0.5s");
})
//隐藏loading
$("#loadingBox").hide(); 
$("body").css('overflow', 'auto');