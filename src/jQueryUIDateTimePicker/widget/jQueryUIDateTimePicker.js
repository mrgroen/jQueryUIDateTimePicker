/*
    Custom Mendix Widget
    "jQueryUIDateTimePicker"
    Apache License 2.0
    Copyright 2017 Marcus Groen (added functionality)
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
    "dojo/dom-construct",
    "dojo/html",
    "jquery",
    "dojo/text!jQueryUIDateTimePicker/widget/template/jQueryUIDateTimePicker.html",
    "jquery-ui",
    "jquery-ui-sliderAccess",
    "jquery-ui-timepicker-addon"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoOn, dojoConstruct, dojoHtml, $, widgetTemplate) {
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
        iconTooltip: "",
        placeholderText: "",
        showMonthYearMenu: "",
        showWeekNr: "",
        firstDay: "",
        yearRange: "",
        defaultDate: "",
        onChangeMicroflow: "",

        /* Timepicker options*/
        /* http://trentrichardson.com/examples/timepicker/ */
        timeFormat: "",
        /* @TODO: add timeRange etc. */

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _alertDiv: null,
        _contextObj: null,
        _datePicker: null,
        _datePickerButton: null,
        _params: null,
        _seven: 7,
        _readOnly: false,

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function postCreate() {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
                this._readOnly = true;
            }

            this._datePickerButton = $(this.domNode)
                .find("button.mx-dateinput-select-button")
                .first()
                .get(0);
            $(this._datePickerButton).attr("title", this.iconTooltip);

            this._datePicker = $(this.domNode)
                .find("input.mx-dateinput-input")
                .first()
                .get(0);
            $(this._datePicker).attr("placeholder", this.placeholderText);

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
        update: function update(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._updateDatepicker(this._datePicker, obj.get(this.dateAttribute));
            this._resetSubscriptions();
            callback();
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function uninitialize() {
            logger.debug(this.id + ".uninitialize");
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }
        },

        _triggerFocus: function _triggerFocus(element) {
            logger.debug(this.id + "._triggerFocus");
            $(element).trigger("focus");
        },

        _setParams: function _setParams() {
            logger.debug(this.id + "._setParams");
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

        _updateDatepicker: function _updateDatepicker(element, value) {
            logger.debug(this.id + "._updateDatepicker");
            if (value) {
                var date = new Date(value);
                $(element).datepicker("setDate", date);
            }
        },

        _onChange: function _onChange(datePickerElement) {
            logger.debug(this.id + "._onChange");
            var myDate = $(datePickerElement).datepicker("getDate");
            if (myDate) {
                this._contextObj.set(this.dateAttribute, myDate);
                if (this.onChangeMicroflow.length > 0) {
                    this._runMicroflow(this._contextObj, this.onChangeMicroflow);
                }
            } else {
                this._contextObj.set(this.dateAttribute, "");
            }
        },

        _addValidation: function _addValidation(message) {
            logger.debug(this.id + "._showValidation");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return;
            }
            this._alertDiv = dojoConstruct.create("div", {
                class: "alert alert-danger",
                innerHTML: message
            });
            dojoConstruct.place(this._alertDiv, this.domNode);
        },

        _clearValidations: function _clearValidations() {
            logger.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
            $(this.domNode).removeClass("has-error");
            this._alertDiv = null;
        },

        _handleValidation: function _handleValidation(validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

            var validation = validations[0],
                message = validation.getReasonByAttribute(this.dateAttribute);

            if (this._readOnly) {
                validation.removeAttribute(this.dateAttribute);
            } else if (message) {
                $(this.domNode).addClass("has-error");
                this._addValidation(message);
                validation.removeAttribute(this.dateAttribute);
            }
        },

        _setupEvents: function _setupEvents() {
            this.connect(this._datePickerButton, "click", this._triggerFocus.bind(this, this._datePicker));
            this.connect(this._datePicker, "change", this._onChange.bind(this, this._datePicker));
        },

        _resetSubscriptions: function _resetSubscriptions() {
            // Release handles on previous object, if any.
            this.unsubscribeAll();
            // Assign new handles if an object exists.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.dateAttribute,
                    callback: function(guid, attr, value) {
                        if (value) {
                            this._updateDatepicker(this.domNode, value);
                        }
                    }
                });
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: this._handleValidation.bind(this)
                });
            }
        },

        _runMicroflow: function _runMicroflow(obj, mf, cb) {
            if (mf) {
                var params = {
                    applyto: "selection",
                    actionname: mf,
                    guids: []
                };
                if (obj) {
                    params.guids = [ obj.getGuid() ];
                }
                mx.data.action({
                    params: params,
                    callback: function callback(objects) {
                        if (cb) {
                            cb(objects);
                        }
                    },
                    error: function error(errorObject) {
                        if (cb) {
                            cb();
                        }
                        mx.ui.error("Error executing microflow " + mf + " : " + errorObject.message);
                        logger.warn(errorObject.description);
                    }
                }, this);
            } else if (cb) {
                cb();
            }
        }
    });
});
