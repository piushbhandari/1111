(function (SmartSearch) {
    var _defaults = {
        pagingSelector: '.filterForm [data-target]',
        paginationTargetAttribute: 'target',
        paginationTargetInputSelector: '#Pagination_TargetPage',
        searchButtonSelector: '.filterForm #btnSubmit',
        clearButtonSelector: '.filterForm #btnClear'
    };

    SmartSearch.init = function (options) {
        options = $.extend({}, _defaults, options || {});

        $(options.pagingSelector).click(function (e) {
            var data = $(this).data(),
                form = $(this).closest("form");

            e.preventDefault();

            if (data && data[options.paginationTargetAttribute] && form) {
                $(options.paginationTargetInputSelector).val(data[options.paginationTargetAttribute]);
                $(form).submit();
            }
        });

        $(options.searchButtonSelector).click(function (e) {
            var form = $(this).closest("form");

            e.preventDefault();

            if (form) {
                $(form).find(options.paginationTargetInputSelector).val('1');
                $(form).submit();
            }
        });

        $(options.clearButtonSelector).click(function (e) {
            var form = $(this).closest("form");

            e.preventDefault();

            if (form) {
                $(form).find('select, input:not([type=button], [type=submit])').val('');
                $(form).find(options.paginationTargetInputSelector).val('1');
                $(form).submit();
            }
        });
    };
})(window.SmartSearch = window.SmartSearch || {});
