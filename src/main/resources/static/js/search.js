// $(document).ready()를 명시적으로 사용하여 문서 로딩 완료 후 스크립트를 실행합니다.
$(document).ready(function() {

    /**
     * 도서 검색 페이지의 모든 기능을 관리하는 모듈 객체
     */
    const SearchModule = {

        /**
         * 1. 설정 및 상태 초기화
         * - 고정 설정값과 동적 상태값을 정의합니다.
         */
        config: {
            edgeUrl: $('#edgeServiceUrl').val() || 'http://localhost:9000',
            selectors: {
                q: '#q',
                searchBtn: '#searchBtn',
                popular: '#popular',
                grid: '#grid',
                empty: '#empty',
                loading: '#loading',
                metaText: '#metaText',
                pageSize: '#pageSize',
                refreshBtn: '#refreshBtn',
                loadMore: '#loadMore',
            },
        },

        state: {
            q: '',
            page: 0,
            size: 10,
            total: 0,
            last: false,
            loading: false,
        },

        // API 엔드포인트와 jQuery로 캐싱된 DOM 요소를 저장할 객체
        api: {},
        elements: {},

        /**
         * 2. 모듈 초기화 함수
         * - 애플리케이션의 시작점으로, 필요한 모든 준비 작업을 수행합니다.
         */
        init: function() {
            // API URL 설정
            this.api.SEARCH = `${this.config.edgeUrl}/api/search`;
            this.api.POPULAR = `${this.config.edgeUrl}/api/search/popular`;

            // DOM 요소 캐싱
            // this.config.selectors의 각 키에 해당하는 실제 DOM 요소를 찾아 this.elements에 저장합니다.
            for (const key in this.config.selectors) {
                this.elements[key] = $(this.config.selectors[key]);
            }

            // 페이지 크기 초기값 설정
            this.state.size = parseInt(this.elements.pageSize.val(), 10) || 10;

            // 이벤트 핸들러 바인딩
            this.bindEvents();

            // 초기 데이터 로드
            this.loadPopular();
        },

        /**
         * 3. 이벤트 핸들러 바인딩
         * - 모든 사용자 인터랙션 이벤트를 여기에 등록합니다.
         */
        bindEvents: function() {
            // .bind(this)를 사용하여 이벤트 핸들러 내부의 'this'가 SearchModule 객체를 가리키도록 합니다.
            this.elements.searchBtn.on('click', this.handleSearch.bind(this));
            this.elements.q.on('keydown', this.handleKeydown.bind(this));
            this.elements.pageSize.on('change', this.handlePageSizeChange.bind(this));
            this.elements.refreshBtn.on('click', this.handleRefresh.bind(this));
            this.elements.loadMore.on('click', this.handleLoadMore.bind(this));

            // 이벤트 위임: 동적으로 생성될 .chip 요소들의 클릭 이벤트를 처리합니다.
            this.elements.popular.on('click', '.chip', this.handleChipClick.bind(this));
        },

        /**
         * 4. 이벤트 핸들러 메소드
         * - bindEvents에서 등록한 각 이벤트가 실행할 로직입니다.
         */
        handleSearch: function() {
            this.state.q = this.elements.q.val();
            this.resetAndSearch();
        },

        handleKeydown: function(e) {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        },

        handlePageSizeChange: function() {
            this.state.size = parseInt(this.elements.pageSize.val(), 10) || 10;
            if (this.state.q.trim()) {
                this.resetAndSearch();
            }
        },

        handleRefresh: function() {
            if (this.state.q.trim()) {
                this.resetAndSearch();
            }
        },

        handleLoadMore: function() {
            this.doSearch(false);
        },

        handleChipClick: function(e) {
            // 이벤트 위임 시, 'e.currentTarget'은 이벤트가 바인딩된 요소(.chip)를 가리킵니다.
            const keyword = $(e.currentTarget).data('k');
            this.elements.q.val(keyword);
            this.state.q = keyword;
            this.resetAndSearch();
        },

        /**
         * 5. 핵심 로직 메소드
         */
        setLoading: function(isLoading) {
            this.state.loading = isLoading;
            this.elements.loading.css('display', isLoading ? 'flex' : 'none');
            this.elements.searchBtn.add(this.elements.loadMore).prop('disabled', isLoading);
        },

        doSearch: function(isFirst = false) {
            if (this.state.loading || this.state.last) return;

            const q = this.state.q.trim();
            if (!q) {
                this.elements.metaText.text('검색어를 입력해 주세요');
                this.elements.empty.show();
                this.elements.grid.empty();
                return;
            }

            this.setLoading(true);
            const url = `${this.api.SEARCH}?q=${encodeURIComponent(q)}&page=${this.state.page}&size=${this.state.size}`;

            $.getJSON(url)
                .done(data => this.renderResults(data, isFirst)) // 성공 시 렌더링 함수 호출
                .fail(this.handleAjaxError.bind(this))
                .always(() => this.setLoading(false));
        },

        // AJAX 성공 시 결과를 화면에 렌더링하는 역할만 담당
        renderResults: function(data, isFirst) {
            const list = data.items || data.content || [];
            this.state.total = data.totalElements ?? data.total ?? list.length;
            this.state.last = data.last ?? (data.number + 1 >= data.totalPages);

            this.elements.metaText.text(`총 ${this.state.total}건 / 페이지 ${this.state.page + 1}${this.state.last ? ' (마지막)' : ''}`);

            if (isFirst && list.length === 0) {
                this.elements.grid.empty();
                this.elements.empty.show();
                this.elements.loadMore.hide();
                return;
            }

            this.elements.empty.hide();
            const newCardsHtml = list.map(this.cardTemplate).join('');
            this.elements.grid.append(newCardsHtml);
            this.elements.loadMore.css('display', this.state.last ? 'none' : 'inline-flex');

            this.state.page++;
        },

        handleAjaxError: function() {
            console.error("데이터 요청 중 오류가 발생했습니다.");
            this.elements.metaText.text('데이터 요청 중 오류가 발생했습니다.');
        },

        resetAndSearch: function() {
            this.state.page = 0;
            this.state.total = 0;
            this.state.last = false;
            this.elements.grid.empty();
            this.elements.empty.hide();
            this.doSearch(true);
        },

        loadPopular: function() {
            $.getJSON(this.api.POPULAR)
                .done(list => {
                    const chipsHtml = list.map(k => `<span class="chip" data-k="${k}"># ${k}</span>`).join('');
                    this.elements.popular.html(chipsHtml);
                });
        },

        cardTemplate: function(item) {
            const {
                title = '(제목 없음)', subtitle = '', author = '-',
                publisher = '-', publishedDate: pub = '-', isbn = '-',
                imageUrl: img = 'https://placehold.co/136x192?text=Book'
            } = item;
            return `
      <article class="card">
        <img class="thumb" src="${img}" alt="${title}" />
        <div class="card-body">
          <div class="book-title" title="${title}">${title}</div>
          <div class="book-sub" title="${subtitle}">${subtitle}</div>
          <div class="book-meta">
            <span>${author}</span><span>·</span>
            <span>${publisher}</span><span>·</span>
            <span>${pub}</span>
          </div>
          <div class="isbn">ISBN: ${isbn}</div>
        </div>
      </article>`;
        }
    };

    // 모듈 초기화 함수를 호출하여 애플리케이션을 시작합니다.
    SearchModule.init();

});