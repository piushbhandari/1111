(function ($, talonUtil) {
    $('.hero-slider-container').each(function () {
        const slider = this.querySelector('.hero-slider');
        const prevBtn = this.querySelector('.hero-slider-btn--prev');
        const nextBtn = this.querySelector('.hero-slider-btn--next');

        const a11ySlider = new A11YSlider(slider, {
            container: false,
            prevBtn,
            nextBtn,
            adaptiveHeight: true,
            autoplay: true,
            autoplayHoverPause: false
        });
    });

    $('.slider-section').each(function () {
        const slider = this.querySelector('.slider');
        const prevBtn = this.querySelector('.slider-btn--prev');
        const nextBtn = this.querySelector('.slider-btn--next');

        const a11ySlider = new A11YSlider(slider, {
            container: false,
            prevBtn,
            nextBtn,
            autoplay: true,
            autoplayHoverPause: false
        });
    });

    /* JS pagination */
    $('.js-pagination-inner').each(function(){
        var $this = $(this);
        $this.jPages({
            containerID: "paginated-listing",
            perPage: 8,
            previous: 'button.js-pagination__previous',
            next: 'button.js-pagination__next',
            minHeight:false,
            callback: function (pages, items) {
                if(pages.count <= 1){
                    $this.closest('.js-pagination').hide();
                }
            }
        });
    });

    $('#js-print').on('click', () => {
        window.print();
    });

    /** List Tool on load */
    $('.list-tool.expand-list, .list-tool.accordion-list').each(function(){
        var $this = $(this);

        $this.find('.item:first-child > a').addClass('active');
        $this.find('.item .item-content').hide();
        $this.find('.item:first-child .item-content').show();
    });

    $('.talon-tabs').each(function(){
        var $this = $(this);

        $this.find('.talon-tab:first-child > a').addClass('active');
        $this.find('.talon-tab-pane').hide();
        $this.find('.talon-tab-pane:first-child').show();
    });

    /** Stop referrer Phishing hack + ADA */
    $("a[target=_blank], a[target=new]").each(function () {
        $(this)
            .attr("rel", "noopener noreferrer")
            .append("<span class='visually-hidden'>(Opens in a new window)</span>");
    });

    /* used on sites that need a cookie consent */
    $('#cookie-consent-form').submit(function (e) {
        e.preventDefault();

        var form = $(this);
        var url = form.attr('action');

        $.ajax({
            type: 'POST',
            url: url,
            data: form.serialize(),
            success: function (data) {
                $('.cookie-consent').fadeOut();
            }
        });
    });

    talonUtil.vendorPlugins();
    talonUtil.setupToggles();
    talonUtil.setupScrollPointerBlocker();
    talonUtil.setupUserBinds();
    talonUtil.setupKenticoForms();
})(jQuery, window.talonUtil);
