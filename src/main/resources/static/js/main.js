// $(document).ready()를 사용하여 문서가 완전히 로드된 후 스크립트가 실행되도록 합니다.
$(document).ready(function () {

    // 전체 로직을 즉시 실행 함수(IIFE)로 감싸 전역 변수 충돌을 방지합니다.
    (function () {

        /**
         * 1. 설정 (Configuration)
         * - 애플리케이션의 고정 값들을 관리합니다.
         */
        const config = {
            edgeUrl: $('#edgeServiceUrl').val() || 'http://localhost:9000',
            selectors: {
                grid: '#grid',
                loading: '#loading',
                empty: '#empty',
                totalMeta: '#totalMeta',
                pageSize: '#pageSize',
                refreshBtn: '#refreshBtn',
                sentinel: '#sentinel', // 무한 스크롤 감지 대상
            },
            scrollOptions: {
                // IntersectionObserver가 트리거될 뷰포트 확장 마진
                observerRootMargin: '800px 0px',
                // 스크롤 이벤트에서 하단으로 간주할 여유 픽셀
                scrollNearBottomMargin: 400,
            }
        };
        config.api = `${config.edgeUrl}/api/books`;

        /**
         * 2. DOM 요소 캐싱
         * - 자주 사용하는 jQuery 객체를 미리 찾아 변수에 저장하여 성능을 최적화합니다.
         */
        const elements = {
            grid: $(config.selectors.grid),
            loading: $(config.selectors.loading),
            empty: $(config.selectors.empty),
            totalMeta: $(config.selectors.totalMeta),
            pageSize: $(config.selectors.pageSize),
            refreshBtn: $(config.selectors.refreshBtn),
            // IntersectionObserver는 순수 DOM 요소를 필요로 하므로 [0]으로 접근합니다.
            sentinel: $(config.selectors.sentinel)[0],
        };

        /**
         * 3. 애플리케이션 상태 (State)
         * - 동적으로 변하는 모든 데이터를 중앙에서 관리합니다.
         */
        let state = {
            page: 0,
            size: 10,
            totalElements: 0,
            isLoading: false,
            isFinished: false, // 모든 데이터를 로드했는지 여부
        };

        /**
         * 4. UI 관리 객체
         * - UI를 변경하는 모든 함수를 모아 관리합니다.
         */
        const ui = {
            showLoading: () => elements.loading.show(),
            hideLoading: () => elements.loading.hide(),
            showEmptyMessage: () => {
                elements.grid.empty();
                elements.empty.show();
            },
            hideEmptyMessage: () => elements.empty.hide(),
            updateTotal: () => elements.totalMeta.text(`총 ${state.totalElements}권`),
            resetGrid: () => {
                elements.grid.empty();
                state.totalElements = 0;
                ui.updateTotal();
            },
            renderBooks: (books) => {
                const booksHtml = books.map(templates.bookCard).join('');
                elements.grid.append(booksHtml);
            },
        };

        /**
         * 5. 템플릿 함수
         * - HTML 문자열 생성을 담당합니다.
         */
        const templates = {
            fmtDate: (iso) => {
                if (!iso) return '-';
                try {
                    const d = new Date(iso);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } catch {
                    return '-';
                }
            },
            imageOrPlaceholder: (book) => book.imageUrl || 'https://placehold.co/136x192?text=Book',
            bookCard: (book) => {
                const { isbn = '-', title = '(제목 없음)', subtitle = '', author = '-', publisher = '-', publishedDate } = book;
                return `
          <article class="card">
            <img class="thumb" src="${templates.imageOrPlaceholder(book)}" alt="${title}" />
            <div class="card-body">
              <div class="book-title" title="${title}">${title}</div>
              <div class="book-sub" title="${subtitle}">${subtitle}</div>
              <div class="book-meta">
                <span>${author}</span><span>·</span>
                <span>${publisher}</span><span>·</span>
                <span>${templates.fmtDate(publishedDate)}</span>
              </div>
              <div class="isbn">ISBN: ${isbn}</div>
            </div>
          </article>`;
            }
        };

        /**
         * 6. 핵심 로직 (Core Logic)
         */

        // 데이터 요청 및 처리
        function fetchPage() {
            if (state.isLoading || state.isFinished) return;

            state.isLoading = true;
            ui.showLoading();

            const url = `${config.api}?page=${state.page}&size=${state.size}`;
            console.log('[FETCH]', url);

            $.getJSON(url)
                .done(handleFetchSuccess)
                .fail(handleFetchError)
                .always(() => {
                    state.isLoading = false;
                    ui.hideLoading();
                });
        }

        // 데이터 요청 성공 시 처리
        function handleFetchSuccess(pageJson) {
            console.log('[PAGE JSON]', pageJson);
            const books = pageJson.content || [];

            state.totalElements = pageJson.totalElements ?? state.totalElements;
            ui.updateTotal();

            if (state.page === 0 && books.length === 0) {
                ui.showEmptyMessage();
                state.isFinished = true;
                return;
            }

            ui.hideEmptyMessage();
            ui.renderBooks(books);

            state.page++;
            if (pageJson.last === true) {
                state.isFinished = true;
            }
        }

        // 데이터 요청 실패 시 처리
        function handleFetchError(jqXHR, textStatus, errorThrown) {
            console.error('목록 조회 실패:', textStatus, errorThrown);
            // 필요하다면 사용자에게 에러 메시지를 보여주는 로직 추가
        }

        // 첫 로드 시 화면이 꽉 차지 않으면 스크롤이 불가능하므로 추가 데이터를 로드
        function ensureScrollable() {
            // setTimeout을 사용하여 렌더링이 완료된 후 높이를 계산
            setTimeout(() => {
                const docHeight = $(document).height();
                const winHeight = $(window).height();
                if (!state.isFinished && docHeight <= winHeight + 50) {
                    console.log('[ensureScrollable] Fetching more data to fill the screen.');
                    fetchPage();
                }
            }, 100); // 렌더링을 위한 약간의 지연
        }

        // 상태를 초기화하고 첫 페이지를 로드
        function resetAndLoad() {
            state.page = 0;
            state.size = parseInt(elements.pageSize.val(), 10) || 10;
            state.isFinished = false;

            ui.resetGrid();
            fetchPage();
            ensureScrollable(); // 초기화 후에도 화면 채움 확인
        }

        /**
         * 7. 이벤트 핸들러 및 초기화
         */

        // 이벤트 바인딩
        function bindEvents() {
            elements.pageSize.on('change', resetAndLoad);
            elements.refreshBtn.on('click', resetAndLoad);

            // 스크롤 폴백 이벤트
            let scrollTicking = false;
            $(window).on('scroll', () => {
                if (scrollTicking) return;
                scrollTicking = true;
                requestAnimationFrame(() => {
                    const nearBottom = ($(window).height() + $(window).scrollTop()) >= ($(document).height() - config.scrollOptions.scrollNearBottomMargin);
                    if (nearBottom) fetchPage();
                    scrollTicking = false;
                });
            });
        }

        // IntersectionObserver 설정
        function setupInfiniteScroll() {
            if (!elements.sentinel) return;

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchPage();
                }
            }, { root: null, rootMargin: config.scrollOptions.observerRootMargin });

            observer.observe(elements.sentinel);
        }

        // 애플리케이션 시작
        function init() {
            state.size = parseInt(elements.pageSize.val(), 10) || 10;
            bindEvents();
            setupInfiniteScroll();
            fetchPage(); // 최초 데이터 로드
            ensureScrollable();
        }

        init(); // 실행!

    })(); // IIFE 끝
});