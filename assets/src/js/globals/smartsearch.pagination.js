(function (Search) {
	var validatePagination = function (options) {
		if (!options) throw "Options not found";

		if (!options.id) throw "Id has not been initialized";
		if (!options.aClassName) throw "aClassName has not been initialized";
		if (!options.targetPageId) throw "TargetPageId has not been initialized";

		return true;
	};

	Search.InitPagination = function (options) {
		validatePagination(options);

		var id = options.id;
		var aClassName = options.aClassName;
		var targetPageId = options.targetPageId;

		$("a." + aClassName).click(function (e) {
			var aData = $(this).data();

			e.preventDefault();

			if (aData && aData.target)
				$("input#" + targetPageId).val(aData.target);

			$("form#" + id).submit();
		});
	};

})(window.Search = window.Search || {});
