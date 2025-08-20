$(document).ready(() => {
    setupAjax();
    checkout();
});

function  setupAjax () {
    // 모든 Ajax 요청에 JWT Access Token을 포함
    $.ajaxSetup({
        beforeSend: function(xhr) {
            let token = localStorage.getItem('accessToken'); // 저장된 Access Token 가져오기
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token); // Authorization 헤더에 Access Token 추가
            }
        }
    });
}

function checkout() {
    let token = localStorage.getItem('accessToken');
    if (!token || token.trim() === '') {
        localStorage.removeItem('accessToken');
        handleTokenExpiration();
    }
}

function handleTokenExpiration() {
    $.ajax({
        type: 'POST',
        url: '/auth/tokens',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: (response) => {
            localStorage.setItem('accessToken', response.accessToken);
            setupAjax(); // 새 토큰 적용
            location.reload();
        },
        error: (error) => {
            console.log('handleTokenExpiration error :: ', error);
            localStorage.removeItem('accessToken');
        }
    });
}