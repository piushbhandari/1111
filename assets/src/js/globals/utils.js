/* ================================================================
        POLYFILLS
    ================================================================ */

/** iOS FIX to incorrect focus bug with keyboard not showing up and then the last touchup element gets clicked. **/
if (/iPad|iPhone|iPod/g.test(navigator.userAgent)) {
    (function ($) {
        return $.fn.focus = function () {
            return arguments[0];
        };
    })(jQuery);
}

/* ================================================================
 UTILITY FUNCTIONS AND GLOBAL VARS
================================================================ */

(function ($, talonUtil, undefined) {
    "use strict";

    // Fast for most debouncers, etc. but for transitions try and match typicall css transition length
    talonUtil.speeds = {
        fast: 200,
        transition: 300,
        long: 500
    };

    // Generate Random ID
    talonUtil.generateID = function () {
        var globalIdCounter = 0;
        return function (baseStr) {
            baseStr = baseStr ? baseStr : "generatedID-";
            return baseStr + globalIdCounter++;
        };
    }();

    // Initialize vendor plugins that requires little to no configuration
    talonUtil.vendorPlugins = function() {

        /** Cross browser SVG loading support **/
        svg4everybody();

        /** FocusOverlay **/
        const fo = new FocusOverlay(document.body);

        /** Lazy loading */
        window.lazyLoader = new Blazy({
            loadInvisible: true,
            offset: 0,
            success: el => {
                setTimeout(() => {
                    el.classList.add('b-done');
                // For images that are wrapped in aspect ratio containers
                if ($(el).parent().hasClass('lazy-aspect-ratio')) {
                    $(el).parent().addClass('lazy-aspect-ratio-done');
                }

                // Adding another class for a non-instant CSS transitions
                }, talonUtil.speeds.fast);
            },
            error: (el, msg) => {
                console.log(msg, el);
            }
        });

        // Lazy load after slide changes
        window.addEventListener('afterChange', () => lazyLoader.revalidate(), true);


        // Sticky Header
        if (document.querySelector('.site-header').classList.contains('sticky-header')) {
            const body = document.body;
            const scrollUp = "sticky-header-up";
            const scrollDown = "sticky-header-down";
            let lastScroll = 0;

            var stickyHeader = talonUtil.debounce(function () {
                const currentScroll = window.pageYOffset;
                const headerHeight = document.querySelector('.site-header').offsetHeight;

                if (currentScroll <= headerHeight) {
                    body.classList.remove(scrollUp);
                    body.classList.remove(scrollDown);
                    return;
                }

                if (currentScroll > lastScroll && !body.classList.contains(scrollDown) && currentScroll >= headerHeight) {
                    // down
                    body.classList.remove(scrollUp);
                    body.classList.add(scrollDown);
                } 
                else if ( currentScroll < lastScroll && body.classList.contains(scrollDown) && currentScroll >= headerHeight) {
                    // up
                    body.classList.remove(scrollDown);
                    body.classList.add(scrollUp);
                }

                lastScroll = currentScroll;
            }, 250);

            window.addEventListener('scroll', stickyHeader);
        }
    }

    /**
     * Setup expanding functionality for [data-expander] elements (e.g. accordions,
     * tabs, expanders, menus, etc.)
     */
    talonUtil.setupToggles = function() {
        $("[data-expander]:not([data-expander-loaded])").each(function (key) {
            var $this = $(this),
                $toggle, // Toggle element
                $target, // Target element
                $relatedToggles, // All toggles with same target ID
                toggleID, // ID of toggle
                animateTime, // Animation duration (ms)
                useCss, // If CSS animations will be used instead of JS
                isOverlay, // If toggle should be used for site overlay
                isHold, // If toggle should remain active on outside clicks
                isNoFocus, // If should not focus inside after opening
                isActive, // If $toggle is active
                standAlone, // If no unique ID is specified
                existingTabindex, // If the target element already has a tabindex
                $html = $("html");

            /**
             * Setting toggle/target depending on if an ID is specified or not.
             * If no ID is supplied then it is treated as an expander container.
             */
            if ( $this.data("expander").length > 0 ) {
                $toggle = $this;
                $relatedToggles = $("[data-expander='" + $this.data("expander") + "']").not(this);
                $target = $("#" + $this.data("expander") );
            } else {
                $toggle = $this.find("[data-expander-toggle]").first();
                $target = $this.find("[data-expander-target]").first();

                standAlone = true;
            }

            // Setting up expander configurations for later
            toggleID = $this.attr("id");
            animateTime = $this.data("expander-time") || 300;
            useCss = $this.is("[data-expander-css]");
            isOverlay = $this.is("[data-expander-overlay]");
            isHold = $this.is("[data-expander-hold]");
            isNoFocus = $this.is("[data-expander-nofocus]");
            isActive = $this.hasClass("active");

            // By default `jsAnimation` will be used unless data-expander-css is added
            var jsAnimation = {
                hide: function($el) {
                    $el = $el || $target;

                    // Remove `active` state after slide animation
                    $el.slideUp(animateTime, function() {
                        $el.removeClass("active");

                        // Update a11y to describe as closed
                        $toggle.add($relatedToggles).attr("aria-expanded", "false");
                    });
                },
                show: function($el) {
                    $el = $el || $target;

                    // Add `active` state after slide animation
                    $el.slideDown(animateTime, function() {
                        $el.addClass("active");
                    });
                }
            }

            /**
             * Only used if data-expander-css is added to the toggle. Should be
             * used with appropriate show/hide CSS animations if you go this route
             */
            var cssAnimation = {
                hide: function($el) {
                    $el = $el || $target;

                    /**
                     * Classes to use CSS animation for show/hiding.
                     * This will also allow us to set display to block/none
                     */
                    $el.removeClass("target-show");
                    $el.addClass("target-hide");

                    setTimeout(function() {
                        // At the end of the animation timer remove classes
                        $el.removeClass("active");
                        $el.removeClass("target-hide");

                        // Update a11y to describe as closed
                        $toggle.add($relatedToggles).attr("aria-expanded", "false");
                    }, animateTime);
                },
                show: function($el) {
                    $el = $el || $target;

                    // Should set to display block
                    $el.addClass("active");

                    // CSS animation for show/hiding.
                    $el.addClass("target-show");
                }
            }

            // Functionality for showing/hiding
            function toggleTarget() {
                // Clear out handler for easy exit of toggle if it exists
                $html.off("click touchstart keyup", dataToggleHandler);
                $html.off("click touchstart keyup", checkOutsideClick);

                if ( $target.hasClass("active") ) {
                    // If the current clicked element is a tab do nothing
                    if  ( !$toggle.is("[data-expander-tabs]") ) {
                        $toggle.add($relatedToggles).removeClass("active");

                        // Removing class on wrapper element if it exists
                        if (standAlone === true) $this.removeClass("active");

                        // Removing class on html element for site overlay effects
                        if ( isOverlay ) {
                            $html.removeClass("js-data-toggled");
                            $("html").removeClass("js-data-toggled-" + $target.attr("id"));
                        }

                        // Show/hide animation depending on if you want to use CSS animations or not
                        useCss ? cssAnimation.hide() : jsAnimation.hide();
                    }
                } else {
                    $toggle.add($relatedToggles).addClass("active");

                    // Adding class on wrapper element if it exists
                    if (standAlone === true) $this.addClass("active");

                    // Adding class on html element for site overlay effects
                    if ( isOverlay ) {
                        $html.addClass("js-data-toggled");
                        $("html").addClass("js-data-toggled-" + $target.attr("id"));
                    }

                    // Hide other expanders if 'tabs' is enabled
                    if  ( $toggle.is("[data-expander-tabs]") ) {
                        var $otherTabs = $("[data-expander-tabs]").not($toggle);

                        $otherTabs.each(function () {
                            var $this = $(this),
                                $newTarget;

                            if ($this.data("expander").length > 0) {
                                $newTarget = $("#" + $this.data("expander")).not($target);
                            } else {
                                $newTarget = $this.find("[data-expander-target]").not($target);
                            }

                            $this.not($relatedToggles).removeClass("active");

                            useCss ? cssAnimation.hide($newTarget) : jsAnimation.hide($newTarget);
                        });
                    }

                    // Show/hide animation depending on if you want to use CSS animations or not
                    useCss ? cssAnimation.show() : jsAnimation.show();

                    // Update a11y to describe as opened
                    $toggle.attr("aria-expanded", "true");

                    /**
                     * Setup `later` timeout functionality to make sure
                     * we can clearout if other data toggles are pressed.
                     * Then we focus an item inside (input, select, etc)
                     * otherwise focusable the whole target
                     */
                    var later = function() {
                        var $focusable = $target.find("input:visible, select:visible, textarea:visible, a:visible").first();

                        if (isNoFocus !== true) {
                            if ( $focusable.length > 0 ) {
                                $focusable.focus();
                            } else {
                                $target.focus();
                            }
                        }
                    };

                    // Timeout preferably same as or longer than the animation's duration
                    window.dataExpTimeOut = setTimeout(later, animateTime);

                    /**
                     * If isHold is true then when a user clicks outside of the $target
                     * nothing will happen. If false then add event listener to check for
                     * clicks outside the $target.
                     */
                    if ( !isHold ) $html.on("click touchstart keyup", dataToggleHandler);
                }
            }

            /**
             * Namespaced function for use in $html event checks
             * @param {Object} event Click/keyboard event object
             */
            function dataToggleHandler(e) {
                if ( e.which === 27 ) {
                    // If ESC is pressed or a click happens then trigger the target
                    $toggle.focus();
                    triggerTarget();
                } else {
                    // Otherwise check if touch/click is outside of bounds of $target
                    checkOutsideClick(e);
                }
            }

            /**
             * Checks if the click/keyboard event happened outside of the bounds of $target
             * @param {Object} event Click/keyboard event object
             */
            function checkOutsideClick(e) {
                var $eTarget = $(e.target);

                if ( $eTarget.closest($target).length <= 0 && $eTarget.closest("#" + toggleID).length <= 0 ) {
                    triggerTarget();
                }
            }

            /**
             * Trigger function to toggle the target while also refreshing the timeout
             */
            function triggerTarget() {
                // Show/hide $target
                toggleTarget();

                // Clear timeout to help prevent focus / other data toggle press conflicts
                window.dataExpTimeOut = null;
            }

            // If target element exist run the data-expander functionality
            if ( $target.length > 0 ) {
                // Set global timeout to null so it doesn't conflict with other targets
                window.dataExpTimeOut = null;

                // Make sure there is an ID set for the toggle for a11y purposes
                if ( !toggleID ) {
                    $toggle.first().attr("id", "data-expander-" + key);
                    toggleID = $toggle.attr("id");
                }

                // Finish up a11y setup for related element
                $target.attr({ "aria-labelledby": toggleID });

                // Setup proper roles for a11y and then bind interaction functionality
                $toggle.attr({
                    "role": "button",
                    "aria-expanded": isActive ? "true" : "false"
                }).on("click keypress", function (e) {
                    if (talonUtil.a11yClick(e) === true) {
                        e.preventDefault();
                        toggleTarget();
                    }
                });

                if ( !isHold && isActive ) $html.on("click touchstart keyup", checkOutsideClick);

                // Add attr to target for CSS to hook onto
                $target.attr("data-expander-target", "");

                /**
                 * Make sure the target can be focused if no items inside
                 * are not auto-focused when opened. Also makes sure the toggle element
                 * is visible so extra tabindexes on all screen sizes are avoided.
                 * Debounced because this will be ran on page load and resize
                 */
                var addRequiredTabIndex = talonUtil.debounce(function () {
                    /**
                     * If a tabindex already exists exit. Related $relatedToggles
                     * targeting the same element will also not interfere.
                     */
                    if (existingTabindex) return;

                    // Look to see if any of the toggles are visible
                    
                    if ($toggle.add($relatedToggles).is(":visible") || $target.is(":hidden")) {
                        $target.attr("tabindex", "0");
                    } else {
                        $target.removeAttr("tabindex");
                    }

                }, 250);

                $(window).on("load resize", addRequiredTabIndex);

                // After everything is done add this so other JS can interact
                $this.attr("data-expander-loaded", "");
            }
        });
    };

    //Debouncer to be used for scrolling and resize bindings
    talonUtil.debounce = function (func, wait, immediate) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            var later = function later() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };


    //Get correct viewport size helper - don't use $(window).width();
    talonUtil.getViewportW = window.getViewportW || function () {
        var win = typeof window != 'undefined' && window,
            doc = typeof document != 'undefined' && document,
            docElem = doc && doc.documentElement;

        var a = docElem.clientWidth,
            b = win.innerWidth;
        return a < b ? b : a;
    };


    //For faux buttons, etc. to handle keyboard events such as space and enter on top of click/touch
    talonUtil.a11yClick = function (event) {
        if (event.type === 'click' || event.type === 'touchstart') {
            return true;
        } else if (event.type === 'keypress') {
            var code = event.charCode || event.keyCode;

            if (code === 32) {
                event.preventDefault();
            }

            if (code === 32 || code === 13) {
                return true;
            }
        } else {
            return false;
        }
    };


    // Remove pointer events when scrolling via overlay div to assist with FPS
    talonUtil.setupScrollPointerBlocker = function () {
        var body = document.body,
            cover = document.createElement('div'),
            timer;

        cover.setAttribute('class', 'scroll-cover');

        window.addEventListener('scroll', function () {
            clearTimeout(timer);
            body.appendChild(cover);

            timer = setTimeout(function () {
                body.removeChild(cover);
            }, talonUtil.speeds.fast);
        }, false);
    };

    /** Click vs. Keyboard user **/
    talonUtil.setupUserBinds = function () {
        var $body = $("body"),
            $html = $("html");

        if (!$html.hasClass("js-user-bind-init")) {
            $html.addClass("js-user-bind-init");
            $body.on("keyup", function () {
                if (!$html.hasClass("js-keyboard-user")) {
                    $html.removeClass("js-click-user").addClass("js-keyboard-user");
                }
            });

            $body.on("click", function () {
                if (!$html.hasClass("js-click-user")) {
                    $html.removeClass("js-keyboard-user").addClass("js-click-user");
                }
            });
        }
    };

    // Default Kentico form ADA and styling adjustments
    talonUtil.setupKenticoForms = function () {
        $('.FormPanel').each(function () {
            const $form = $(this);
            const $rows = $form.find('.FieldLabel').closest('tr');

            // Add specific styling classes for controls that need extra styling options
            // All fields will have a label except the submit field
            $rows.each(function () {
                const $row = $(this);

                // Single checkbox
                if ($row.find('.CheckBoxField').length > 0) {
                    let $labels = $row.find('label');

                    $row.addClass('single-checkbox-field');

                    /**
                     * ADA: By default Kentico adds 2 labels for the same control
                     * so we're removing the extra one. (Starting from last in DOM)
                     */
                    if ($labels.length > 1) {
                        $($labels.get().reverse()).each(function() {
                            const forAttr = $(this).attr('for');

                            if ($labels.not($(this)).is(`[for='${forAttr}']`)) {
                                $(this).remove();
                                $labels = $labels.not($(this));
                            }
                        });
                    }
                }

                // Multi checkbox
                if ($row.find('[class*="checkbox-list"]').length > 0) {
                    const labelText = $row.find('.EditingFormLabel').text().replace(':', '');

                    $row.addClass('multi-checkbox-field');
                    $row.attr('role', 'group');
                    $row.attr('aria-label', labelText);
                }

                // Radio button group
                if ($row.find('[class*="radio-list"]').length > 0) {
                    const labelText = $row.find('.EditingFormLabel').text().replace(':', '');

                    $row.addClass('radio-list-field');
                    $row.attr('role', 'radiogroup');
                    $row.attr('aria-label', labelText);
                }

                // Date picker and ADA fixes
                if ($row.find('.CalendarTextBox').length > 0) {
                    const $input = $row.find('input');
                    const $calendarBtn = $row.find('button[title="Calendar"]');
                    let $popup;

                    $row.addClass('date-picker-field');

                    /**
                     * When clicking on the calendar button the focus will automatically
                     * be placed on the newly opened calendar popup. Settimeout added because
                     * of the slight delay of the popup being interactive.
                     */
                    $calendarBtn.on('click keypress', e => {
                        $popup = $('#ui-datepicker-div');

                        if (talonUtil.a11yClick(e) === true) {
                            setTimeout(() => {
                                $popup.attr('tabindex', '0');
                                $popup.focus();
                                $popup.on('click focusout', handlePopup);
                            }, 250);
                        }
                    });

                    /**
                     * When clicking on a date number it will automatically be assigned,
                     * close the popup, and re-focus the initial input. Clicking or tabbing
                     * outside the popup will also re-focus the intial input.
                     */
                    const handlePopup = e => {
                        const $target = $(e.target);
                        const $relatedTarget = $(e.relatedTarget);
                        const $calendarSubmit = $popup.find('.action-buttons .btn-primary');

                        // Automatically submit calendar date when clicking an item
                        if (talonUtil.a11yClick(e) === true && $target.is('.datetime-ui-state-default')) {
                            $calendarSubmit.trigger('click');
                        }

                        // If the focus is outside of the popup close it and focus it's related input
                        if ($relatedTarget.closest($popup).length <= 0) {
                            $input.focus();
                            $popup.hide();
                            $popup.off('click', handlePopup);
                        }
                    }
                }

                // Security code
                if ($row.find('.CaptchaTable').length > 0) $row.addClass('captcha-field');

                // Phone (Nothing to really target so a pseudo check)
                if ($row.find('[class*="input-width-"]').length === 3) $row.addClass('phone-field');

                // Select dropdowns and multiples
                if ($row.find('select').length > 0) {
                    const $allSelects = $row.find('select');

                    // Wrap selects in a DIV for additional styling
                    $allSelects.each(function () {
                        const $select = $(this);
                        const multi = $select.attr("multiple") || false;

                        $select.wrap(`<div class="select ${multi ? 'select-multi' : ''}"></div>`);
                    });

                    $row.addClass('dropdown-field');
                }
            });
        });
    };
})(jQuery, window.talonUtil = window.talonUtil || {});
