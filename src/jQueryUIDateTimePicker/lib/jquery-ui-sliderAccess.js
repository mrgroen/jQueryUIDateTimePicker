/*
 * jQuery UI Slider Access
 * By: Trent Richardson [http://trentrichardson.com]
 * Version 0.3
 * Last Modified: 10/20/2012
 *
 * Copyright 2011 Trent Richardson
 * Dual licensed under the MIT and GPL licenses.
 * http://trentrichardson.com/Impromptu/GPL-LICENSE.txt
 * http://trentrichardson.com/Impromptu/MIT-LICENSE.txt
 *
 */
/*
    Modified to be used with AMD loaders.
    By: Marcus Groen
*/
(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([
            "jQueryUIDateTimePicker/lib/jquery-1.12.4",
            "jQueryUIDateTimePicker/lib/jquery-ui"
        ], factory);
    } else {
        factory(jQuery);
    }
}(function($) {
    "use strict";
    $.fn.extend({
        sliderAccess: function(options) {
            options = options || {};
            /* by default only show it if touch device */
            options.touchonly = (typeof options.touchonly !== "undefined") ? options.touchonly : true;

            if (options.touchonly === true && !("ontouchend" in document)) {
                return $(this);
            }

            return $(this).each(function(i, obj) {
                var $t = $(this),
                    o = $.extend({}, {
                        where: "after",
                        step: $t.slider("option", "step"),
                        upIcon: "ui-icon-plus",
                        downIcon: "ui-icon-minus",
                        text: false,
                        upText: "+",
                        downText: "-",
                        buttonset: true,
                        buttonsetTag: "span",
                        isRTL: false
                    }, options),
                    $buttons = $("<" + o.buttonsetTag + ' class="ui-slider-access">' +
                    '<button data-icon="' + o.downIcon +
                    '" data-step="' + (o.isRTL ? o.step : o.step * -1) + '">' + o.downText + "</button>" +
                    '<button data-icon="' + o.upIcon +
                    '" data-step="' + (o.isRTL ? o.step * -1 : o.step) + '">' + o.upText + "</button>" +
                    "</" + o.buttonsetTag + ">");

                $buttons.children("button").each(function(j, jobj) {
                    var $jt = $(this);
                    $jt.button({
                        text: o.text,
                        icons: { primary: $jt.data("icon") }
                    }).click(function(e) {
                        var step = $jt.data("step"),
                            curr = $t.slider("value"),
                            newval = curr += Number(step),
                            minval = $t.slider("option", "min"),
                            maxval = $t.slider("option", "max"),
                            slidee = $t.slider("option", "slide") || function() {},
                            stope = $t.slider("option", "stop") || function() {};

                        e.preventDefault();

                        if (newval < minval || newval > maxval) { 
                            return;
                        }

                        $t.slider("value", newval);

                        slidee.call($t, null, { value: newval });
                        stope.call($t, null, { value: newval });
                    });
                });

                // before or after
                $t[o.where]($buttons);

                if (o.buttonset) {
                    $buttons.removeClass("ui-corner-right").removeClass("ui-corner-left").buttonset();
                    $buttons.eq(0).addClass("ui-corner-left");
                    $buttons.eq(1).addClass("ui-corner-right");
                }

                // adjust the width so we don't break the original layout
                var bOuterWidth = $buttons.css({
                    marginLeft: ((o.where === "after" && !o.isRTL) || (o.where === "before" && o.isRTL) ? 10 : 0),
                    marginRight: ((o.where === "before" && !o.isRTL) || (o.where === "after" && o.isRTL) ? 10 : 0)
                }).outerWidth(true) + 5;
                var tOuterWidth = $t.outerWidth(true);
                $t.css("display", "inline-block").width(tOuterWidth - bOuterWidth);
            });
        }
    });
}));
