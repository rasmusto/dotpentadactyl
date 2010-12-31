
let wrapped = [];
function wrap(obj, overrides) {
    overrides = update(Object.create(Object.create(obj)), overrides);
    wrapped.push([obj, overrides]);

    for (let [k, v] in Iterator(overrides)) {
        overrides.__proto__[k] = obj[k];
        obj[k] = v;
    }
}
function onUnload() {
    for (let [obj, overrides] in values(wrapped))
        for (let [k, v] in iter(Object.getPrototypeOf(overrides)))
            obj[k] = v;
}

options.add(["scrolltime", "st"],
    "The time, in milliseconds, in which to smooth scroll to a new position",
    "number", 100);
options.add(["scrollsteps", "ss"],
    "The number of steps to in which to smooth scroll to a new position",
    "number", 5);

function left(elem) "scrollDestX" in elem ? elem.scrollDestX : elem.scrollLeft;
function top(elem)  "scrollDestX" in elem ? elem.scrollDestY : elem.scrollTop;

function smoothScroll(elem, x, y) {
    let time = options["scrolltime"];
    let steps = options["scrollsteps"];

    if (elem.dactylScrollTimer)
        elem.dactylScrollTimer.cancel();

    x = elem.scrollDestX = Math.min(x, elem.scrollWidth  - elem.clientWidth);
    y = elem.scrollDestY = Math.min(y, elem.scrollHeight - elem.clientHeight);
    let [startX, startY] = [elem.scrollLeft, elem.scrollTop];
    let n = 0;
    (function next() {
        if (n++ === steps) {
            elem.scrollLeft = x;
            elem.scrollTop  = y;
            delete elem.scrollDestX;
            delete elem.scrollDestY;
        }
        else {
            elem.scrollLeft = startX + (x - startX) / steps * n;
            elem.scrollTop  = startY + (y - startY) / steps * n;
            elem.dactylScrollTimer = util.timeout(next, time / steps);
        }
    }).call(this);
}

wrap(Buffer, {
    // TODO: Use a single scrollTo function internally
    scrollVertical: function scrollVertical(elem, increment, number) {
        elem = elem || Buffer.findScrollable(number, false);
        let fontSize = parseInt(util.computedStyle(elem).fontSize);
        if (increment == "lines")
            increment = fontSize;
        else if (increment == "pages")
            increment = elem.clientHeight - fontSize;
        else
            throw Error();

        dactyl.assert(number < 0 ? elem.scrollTop > 0 : elem.scrollTop < elem.scrollHeight - elem.clientHeight);
        smoothScroll(elem, left(elem), top(elem) + number * increment);
    },

    scrollHorizontal: function scrollHorizontal(elem, increment, number) {
        elem = elem || Buffer.findScrollable(number, true);
        let fontSize = parseInt(util.computedStyle(elem).fontSize);
        if (increment == "columns")
            increment = fontSize; // Good enough, I suppose.
        else if (increment == "pages")
            increment = elem.clientWidth - fontSize;
        else
            throw Error();

        dactyl.assert(number < 0 ? left(elem) > 0 : left(elem) < elem.scrollWidth - elem.clientWidth);
        smoothScroll(elem, left(elem) + number * increment, top(elem));
    },

    scrollElemToPercent: function scrollElemToPercent(elem, horizontal, vertical) {
        elem = elem || Buffer.findScrollable();
        marks.add("'", true);

        smoothScroll(elem,
                     horizontal == null ? left(elem)
                                        : (elem.scrollWidth - elem.clientWidth) * (horizontal / 100),
                     vertical   == null ? top(elem)
                                        : (elem.scrollHeight - elem.clientHeight) * (vertical / 100));
    },
    scrollToPercent: function scrollToPercent(horizontal, vertical) {
        let win = Buffer.findScrollableWindow();
        let h, v;

        if (horizontal == null)
            h = win.scrollX;
        else
            h = win.scrollMaxX / 100 * horizontal;

        if (vertical == null)
            v = win.scrollY;
        else
            v = win.scrollMaxY / 100 * vertical;

        marks.add("'", true);
        smoothScroll(win.document.documentElement, h, v);
    }
});
