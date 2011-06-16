(function($) {
	// suggestion/completion/prediction/recognition
	// Think final name will be - jQuery prediction plugin
	suggestObject = function(element, options) {
		this.options	= options;
		this.$element	= element;
		
		this.init();
	};
	
	suggestObject.prototype = {
		init: function() {
			var self = this;
			
			this.$element.bind('blur keydown click', function(event) {
				// Clear our timeour no matter what the event might be.
				clearTimeout(self.delay);
				
				var key = event.keyCode || event.which;

				switch (event.type) {
					case 'click':
					case 'blur':
						if(self.hasSuggestion()) {
							self.removeSuggestion(false);
						}
						break;
					case 'keydown':
						// Here we might want to check for event.ctrlKey || event.metaKey
						switch (key) {
							case 16:		// SHIFT
								// DO NOTHING
								return true;
								break;
							case 9:		// Tab
							case 39:		// NEXT
								if(self.hasSuggestion()) {
									self.useSuggestion();
									return false;
								}
							   break;
							default:
								if(self.hasSuggestion()) {
									self.removeSuggestion(true);
									
									if(key == 8) {
										return false;
									}
								}
							   break;
						}

						// Here we will check if we should suggest anything at all.
						// So far we just suggest on [0-9a-z].
						// When we change this consider if we need to check if caret start and end is the same.
						// Check is caret is at the end or the next char is the chunk splitter.
						if (key >= 48 && key <= 105 && !event.ctrlKey && !event.metaKey){
							self.delay = setTimeout(function() {
								if(self.$element.val().length) {
									self.suggest();
								}
							}, 250);
						}
						break;
				}
			});
		},
		
		suggest: function() {
			var caret			= this.getCaret();
			var text				= this.$element.val();
			var string			= false;
			
			// Replace linebreaks with spaces in our text before making it into chunks.
			text = text.replace(/\n/g, " ");
			
			// make the text into chunks
			var chunks = text.split(" ");
			
			// Lets find the string.
			if(caret.start == text.length) {
				string = chunks[chunks.length-1];
			} else if(caret.start <= chunks[0].length) {
				string = chunks[0];
			} else {
				var length = 0;
				
				$.each(chunks, function(key, value) {
					// TODO: rename the length variable.
					length = length + value.length + 1; // TODO: +1 should be changed with chunk seperator length
					
					if(caret.start <= length) {
						string = chunks[key];
						return false;
					}
				});
			}

			// TODO: Here we should remove ending chars from string, such as ,.!?
			
			var suggestions	= ['ActionScript','AppleScript','ASP','BASIC','Batch','COBOL','ColdFusion','Delphi','ECMAScript','Erlang','F-Script','GLBasic','HTML','IronRuby','Java','JavaScript','JQuery','Limbo'];
			var suggestion		= suggestions.filter(function(suggestion, index, array) {
				return (suggestion.toLowerCase().substr(0, this.string.length) == this.string.toLowerCase() && suggestion.length != this.string.length)
			}, {string: string})[0];

			if(suggestion) {
				suggestion = '‎' + suggestion.substr(string.length, suggestion.length) + '‎';
				// TODO: Make it posible to insetAtCaret wthout settings caret, or with defining caret position so we wont set it twice.
				this.insertAtCaret(suggestion);
				this.setCaret(this.$element.val().indexOf('‎'), this.$element.val().lastIndexOf('‎'));
			}
		},
		
		hasSuggestion: function() {
			return this.$element.val().match(/‎(.*)‎/g);
		},
		
		removeSuggestion: function(setCaret) {
			var text			= this.$element.val();
			var caret		= this.getCaret();
			var scrollTop	= this.$element.scrollTop();
			
			this.$element.val(text.replace(/‎(.*)‎/g, ""));
			
			if(setCaret) {
				this.$element.scrollTop(scrollTop).focus();
				this.setCaret(caret.start);
			}
		},
		
		useSuggestion: function() {
			var text			= this.$element.val();
			var caret		= this.getCaret();
			var scrollTop	= this.$element.scrollTop();
			
			this.$element.val(text.replace(/‎(.*)‎/g, "$1"))
				.scrollTop(scrollTop)
				.focus();
			
			this.setCaret(caret.end-1);
		},
		
		/*
		* CARET
		*/
		getCaret: function() {
			// TODO: make cross browser.
			var caret = {};

			if (this.$element.get(0).setSelectionRange) {
				caret.start	= this.$element.get(0).selectionStart;
				caret.end	= this.$element.get(0).selectionEnd;
			}

			return caret;
		},
		
		setCaret: function(start, end) {
			// TODO: make cross browser.
			var element = this.$element;
			
			start	= parseInt(start);
			end	= (end) ? Math.max(start, parseInt(end)) : start;

			if (element.get(0).setSelectionRange) {
				element.focus();
				element.get(0).setSelectionRange(start, end);
			} else if (element.get(0).createTextRange) {
				var range = element.get(0).createTextRange();
				
				range.collapse(true);
				range.moveEnd('character', end);
				range.moveStart('character', start);
				range.select();
			}
		},
		
		insertAtCaret: function(string) {
			// TODO: make cross browser.
			var element = this.$element;
			var caret	= this.getCaret();
			
			if(caret.start || caret.start === 0) {
				var value	= element.val().substr(0, caret.start) + string + element.val().substr(caret.end);
				var scroll	= {
					left: element.get(0).scrollLeft,
					top: element.get(0).scrollTop
				};
				
				// Insert the new value and focus.
				element.val(value).focus();
				
				// Set caret.
				// TODO: Use this.setCaret() instead
				element.get(0).selectionStart = caret.start+string.length;
				element.get(0).selectionEnd	= caret.start+string.length;
				
				// If we are at the end we set scroll to max.
				if(caret.start+string.length >= value.length) {
					scroll = {
						left:	Math.max(element.get(0).scrollWidth, element.innerWidth()),
						top:	Math.max(element.get(0).scrollHeight, element.innerHeight())
					};
				}
				
				// Scroll into to space.
				element.get(0).scrollLeft		= scroll.left;
				element.get(0).scrollTop		= scroll.top;
			}
		}
	};
	
	$.fn.suggest = function(options) {		
		if(options == true) {
			return get_or_create($(this));
		}
		
		options = (typeof options === 'object' || typeof options === 'undefined') ? $.extend({}, $.fn.suggest.defaults, options) : options;
		
		// Focus event handler.
		this[options.live ? 'live' : 'bind']('focus', function() {
			var object = get_or_create($(this));
		});
		
		// Get or create the object.
		function get_or_create(element){
			var object = $.data(element.get(0), 'suggest');

			if (!object) {
				var object = new suggestObject(element, options);
				$.data(element.get(0), 'suggest', object);
			}
		
			return object;
		};
	};
	
	$.fn.suggest.defaults = {
		live: false
	};
})(jQuery);