/*
    Custom Mendix Widget
    "jQueryUIDateTimePicker"
    Apache License 2.0
    Copyright 2017 Marcus Groen
    Copyright 2017 Bart Rikers
*/
require({
    packages: [
        { name: "jquery",
            location: "../../widgets/jQueryUIDateTimePicker/lib",
            main: "jquery-1.12.4" },
        { name: "jquery-ui",
            location: "../../widgets/jQueryUIDateTimePicker/lib",
            main: "jquery-ui" },
        { name: "jquery-ui-sliderAccess",
            location: "../../widgets/jQueryUIDateTimePicker/lib",
            main: "jquery-ui-sliderAccess" },
        { name: "jquery-ui-timepicker-addon",
            location: "../../widgets/jQueryUIDateTimePicker/lib",
            main: "jquery-ui-timepicker-addon" }
    ]
}, [
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/on",
    "jquery",
    "dojo/text!jQueryUIDateTimePicker/widget/template/jQueryUIDateTimePicker.html",
    "jquery-ui",
    "jquery-ui-sliderAccess",
    "jquery-ui-timepicker-addon"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoOn, $, widgetTemplate) {
    "use strict";

    return declare("jQueryUIDateTimePicker.widget.jQueryUIDateTimePicker", [
        _WidgetBase,
        _TemplatedMixin
    ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        pickerType: "",
        dateFormat: "",
        showButtonBar: "",
        showMonthYearMenu: "",
        showWeekNr: "",
        firstDay: "",
        yearRange: "",
        defaultDate: "",

        /* Timepicker options*/
        /* http://trentrichardson.com/examples/timepicker/ */
        timeFormat: "",
        /* @TODO: add timeRange etc. */

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _contextObj: null,
        _datePicker: null,
        _params: null,
        _seven: 7,

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this._datePicker = this.domNode.appendChild(
                dom.create("input", {
                    class: "form-control jQueryUIDateTimePicker"
                })
            );
            this._setParams();
            switch (this.pickerType) {
            case "DatePicker":
                $(this._datePicker).datepicker(this.params);
                break;
            case "TimePicker":
                $(this._datePicker).timepicker(this.params);
                break;
            case "DateTimePicker":
                $(this._datePicker).datetimepicker(this.params);
                break;
            default:
                $(this._datePicker).datetimepicker(this.params);
                break;
            }
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._updateDatepicker(this.domNode, obj.get(this.dateAttribute));
            this._resetSubscriptions();
            callback();
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function() {
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }
        },

        _setParams: function() {
            var params = {
                showButtonPanel: this.showButtonBar,
                onSelect: function(date, i) {
                    if (date !== i.lastVal) {
                        /* jQueryUIDateTimePicker doesn't trigger onchange event
                           so we must trigger it manually in the onSelect function */
                        dojoOn.emit(this, "change", {
                            bubbles: true,
                            cancelable: true
                        });
                    }
                }
            };

            if (this.pickerType === "DatePicker" || this.pickerType === "DateTimePicker") {
                params.dateFormat = this.dateFormat;
                params.changeMonth = this.showMonthYearMenu;
                params.changeYear = this.showMonthYearMenu;
                params.yearRange = this.yearRange === "" ? "-100:+0" : this.yearRange;
                params.defaultDate = this.defaultDate;
                params.showWeek = this.showWeekNr;
                params.firstDay = this.firstDay === "Monday" ? 1 : this._seven;
            }

            if (this.pickerType === "TimePicker" || this.pickerType === "DateTimePicker") {
                params.timeInput = true;
                params.timeFormat = this.timeFormat;
                params.minTime = this.minTime === "" ? null : this.minTime;
                params.maxTime = this.maxTime === "" ? null : this.maxTime;
                params.addSliderAccess = true;
                params.sliderAccessArgs = { touchonly: false };
            }
            this.params = params;
        },

        _updateDatepicker: function(element, value) {
            if (value) {
                var date = new Date(value),
                    datepicker = $(element)
                        .children(".jQueryUIDateTimePicker")
                        .first();
                datepicker.datepicker("setDate", date);
            }
        },

        _onChange: function(datePickerElement) {
            var myDate = $(datePickerElement).datepicker("getDate");
            if (myDate) {
                this._contextObj.set(this.dateAttribute, myDate);
            } else {
                this._contextObj.set(this.dateAttribute, "");
            }
        },

        _setupEvents: function() {
            this.connect(this._datePicker, "change", this._onChange.bind(this, this._datePicker));
        },

        _resetSubscriptions: function() {
            // Release handle on previous object, if any.
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }
            if (this._contextObj) {
                // subscribe to changes in object attribute by other widgets
                this._handle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.dateAttribute,
                    callback: function(guid, attr, value) {
                        if (value) {
                            this._updateDatepicker(this.domNode, value);
                        }
                    }
                });
            }
        }
    });
});
