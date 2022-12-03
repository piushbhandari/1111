(function ($) {
    window.initCalendar = function (events) {
        const calendarEl = document.getElementById('js-calendar');
        const calendarDateEl = document.getElementById('js-calendar-date');
        const calendarPrev = document.getElementById('js-calendar-prev');
        const calendarNext = document.getElementById('js-calendar-next');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            plugins: ['dayGrid'],
            contentHeight: 'auto',
            eventLimit: false, // allow "more" link when too many events
            header: false,
            events,
            eventRender: info => {
                const {
                    title,
                    extendedProps: { location },
                    extendedProps: { extra }
                } = info.event;

                info.el.innerHTML = `
                ${title ?
                        `<div class="event-title">${title}</div>` : ''
                    }
                ${extra ?
                        `<div class="event-extra">${extra}</div>` : ''
                    }
                ${location ?
                        `<div class="event-location">
                        <svg aria-hidden="true" focusable="false">
                            <use xlink:href="/assets/dist/images/svg-legend.svg#icon-location" />
                        </svg>
                        ${location}
                    </div>` : ''
                    }
            `;
            },
            datesRender: info => {
                setHeaderDate(calendar.getDate());
                $('.fc-day-grid-event').matchHeight();
            },
        });

        function setHeaderDate(date) {
            const dateString = date.toLocaleString('en-us', {
                month: 'long',
                year: 'numeric'
            });

            calendarDateEl.textContent = dateString;
        }

        calendarPrev.addEventListener('click', e => calendar.prev());
        calendarNext.addEventListener('click', e => calendar.next());

        calendarEl.innerHTML = '';
        calendar.render();
    }
})(jQuery);
