/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console */
/*mendix */
/*
    jQueryUIDatepicker
    ========================

    @file      : jQueryUIDatepicker.js
    @version   : 2.0
    @author    : Bart Rikers / Joppe van Gisbergen
    @date      : 09-08-2017
    @copyright : Bart Rikers
    @license   : Apache 2

    Documentation
    ========================
    A simple alternative to the built-in Mendix datepicker, that uses the jQueryUI Datepicker and Trent Richardson's Timepicker addon (http://trentrichardson.com/examples/timepicker/).
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require({
	packages: [
	{name: 'jquery', location: '../../widgets/jQueryUIDatepicker/lib', main: 'jquery-1.11.2.min' },
	{name: 'jquery-ui', location: '../../widgets/jQueryUIDatepicker/lib', main: 'jquery-ui.min' },
	{name: 'jquery-ui-timepicker', location: '../../widgets/jQueryUIDatepicker/lib', main: 'jquery-ui-timepicker.min' }
	]
}, [
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/dom-class', 'dojo/dom-attr', 'dojo/dom-construct', 'dojo/text', 'dojo/on',
    'jquery', 'jquery-ui', 'jquery-ui-timepicker', 'dojo/text!jQueryUIDatepicker/widget/template/jQueryUIDatepicker.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domClass, domAttr, dojoConstruct, text, dojoOn, $, jqueryui, jqueryuiTimepicker, widgetTemplate) {
    'use strict';
    
    // Declare widget's prototype.
    return declare('jQueryUIDatepicker.widget.jQueryUIDatepicker', [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

		// DOM elements
        inputLabel: null,
		jQueryUIDatepicker: null,
		
        // Parameters configured in the Modeler.
        pickerType: "",
		dateFormat: "",
		showButtonBar: "",
		showMonthYearMenu: "",
		showWeekNr: "",
		firstDay: "",
        yearRange: "",
        defaultDate: "",
		
		/*Timepicker options*/
		/* http://trentrichardson.com/examples/timepicker/ */
		timeFormat: "",
		
		/* Label options */
		labelCaption: "",
        labelWidth: "",
        displayEnum: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _contextObj: null,
        _objProperty: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            this._objProperty = {};
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            console.log(this.id + '.postCreate');

			var params = {
							showButtonPanel: this.showButtonBar,
							onSelect: function(d,i){
								if(d !== i.lastVal){
									//jQueryUIDatepicker doesn't trigger onchange event
									//so we must trigger it manually in the onSelect function
									dojoOn.emit(this, 'change', {
										bubbles: true,
										cancelable: true
									});
								}
							 }
						};
			
			// Configure the Date properties
			if (this.pickerType == 'DatePicker' || this.pickerType == 'DateTimePicker') {
				params.dateFormat = this.dateFormat;
				params.changeMonth = this.showMonthYearMenu;
				params.changeYear = this.showMonthYearMenu;
				params.yearRange = this.yearRange == '' ? '-100:+0' : this.yearRange;
				params.defaultDate = this.defaultDate;
				params.showWeek = this.showWeekNr;
				params.firstDay = this.firstDay == 'Monday' ? 1 : 7;
			}
			
			// Configure the Time properties
			if (this.pickerType == 'TimePicker' || this.pickerType == 'DateTimePicker') {
				params.timeInput = true;
				params.timeFormat = this.timeFormat;
				params.minTime = this.minTime == '' ? null : this.minTime;
				params.maxTime = this.maxTime == '' ? null : this.maxTime;
				params.addSliderAccess = false; //ToDo: add SliderAccess later on
				//params.sliderAccessArgs = { touchonly: false };
			}

			// Initialize the picker
			switch(this.pickerType) {
				case 'DatePicker':
					$(this.jQueryUIDatepicker).datepicker(params);
					domAttr.set(this.jQueryUIDatepicker, 'placeholder', this.dateFormat);
					break;
				case 'TimePicker':
					$(this.jQueryUIDatepicker).timepicker(params);
					domAttr.set(this.jQueryUIDatepicker, 'placeholder', this.timeFormat);
					break;
				case 'DateTimePicker':
					$(this.jQueryUIDatepicker).datetimepicker(params);
					domAttr.set(this.jQueryUIDatepicker, 'placeholder', this.dateFormat + ' ' + this.timeFormat);
			}
			
			// Set label
			if (this.labelCaption && this.labelCaption.trim().length) {
                this.inputLabel.innerHTML = this.labelCaption;
            } else {
                dojoConstruct.destroy(this.inputLabel);
            }

            if (this.displayEnum === "horizontal") {
                domClass.add(this.inputLabel, "col-sm-" + this.labelWidth);
                domClass.add(this.jQueryUIDatepickerInputWrapper, "col-sm-" + (12 - this.labelWidth));
            }
			
            this._setupEvents();
        },
		
		_updateDateTimepicker: function(element, value){
			if (value){
				var d = new Date(value);
				
				switch(this.pickerType) {
					case 'DatePicker':
						$(this.jQueryUIDatepicker).datepicker("setDate" , d);
						break;
					case 'TimePicker':
						$(this.jQueryUIDatepicker).timepicker("setDate" , d);
						break;
					case 'DateTimePicker':
						$(this.jQueryUIDatepicker).datetimepicker("setDate" , d);
				}
			}
		},
		
        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            console.log(this.id + '.update');

            this._contextObj = obj;
			
			//get current value and set value in datepicker
			var dateValue = this._contextObj.get(this.dateAttribute);
			this._updateDateTimepicker(this.domNode, dateValue);
			
            this._resetSubscriptions();
            this._updateRendering();

            callback();
        },
		
        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {

        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {

        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {

        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        _setupEvents: function () {
			//var datepicker = $(this.domNode).children('.jQueryUIDatepicker').get(0);
			this.connect(this.jQueryUIDatepicker, 'change', function (e) {
				console.log(this.id + '.datepicker change');
				
				var datePicker = $(e.target);
				var myDate = datePicker.datepicker('getDate');
				
				if (myDate){
					this._contextObj.set(this.dateAttribute,myDate);
				}
				else{
					this._contextObj.set(this.dateAttribute,'');
				}
            });
        },

        _updateRendering: function () {
            this.inputLabel.disabled = this._readOnly;
        },

        _resetSubscriptions: function () {
           // Release handle on previous object, if any.
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }

            if (this._contextObj) {
                this._handle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: this._updateRendering
                });
				
				//subscribe to changes in object attribute by other widgets
				this._handle = this.subscribe({
					guid: this._contextObj.getGuid(),
					attr: this.dateAttribute,
					callback : function(guid, attr, value) {
						if (value){
							this._updateDateTimepicker(this.domNode, value);
						}
					}
				});
            }
        }
    });
});
