(function ($) {
    $.fn.applyFiltering = function (options) {
        // Default settings
        var settings = $.extend({
            currentPageUrl: '',
            targetContainerSelector: '#target-list',
            buildQueryString: true,
            url: ''
        }, options);

        var onSuccess = function (data) {
            if (settings.targetContainerSelector) {
                var doc = new DOMParser().parseFromString(data, "text/html");
                var result = doc.querySelector(settings.targetContainerSelector);
                $(settings.targetContainerSelector).html(result);
            } else {
                console.log('ERROR: Missing configuration for target container in view');
            }
        }

        var getAjaxParameters = function (htmlControl) {
            var $form = $(htmlControl).closest('form');

            return {
                url: $form.attr('action'),
                method: $form.attr('method'),
                data: $form.serialize()
            }
        }

        var buildQueryString = function (htmlControl) {
            var $form = $(htmlControl).closest('form');
            var formData = new FormData();
            for (var pair of new FormData($form[0]).entries()) {
                if (pair[1]) {
                    formData.set(pair[0].replace('Filter.', ''), pair[1]);
                }
            }

            return new URLSearchParams(formData).toString().toLowerCase();
        }

        var handleFormSubmit = function () {
            if (settings.buildQueryString == 'True') {
                var queryString = buildQueryString(this);
                window.location.href = settings.currentPageUrl + "?" + queryString;
            } else {
                var ajaxParams = getAjaxParameters(this);
                $.ajax({
                    method: ajaxParams.method,
                    url: ajaxParams.url,
                    data: ajaxParams.data,
                    success: onSuccess
                });
            }

        }

        return this.click(handleFormSubmit);
    };
})(jQuery);
