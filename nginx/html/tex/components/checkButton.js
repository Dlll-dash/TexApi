
const dashSquareIcon = '<i class="bi bi-dash-square"></i>';
const checkSquareIcon = '<i class="bi bi-check-square"></i>';
const squareIcon = '<i class="bi bi-square"></i>';

function getCheckButton() {
    const checkButton = document.createElement('button');
    checkButton.innerHTML = checkSquareIcon;
    checkButton.className = 'check-button active';
    // 初始状态为选中状态
    /**
     * 点击之后就会切换状态，要么激活，要么非激活
     * 激活与非激活只有颜色的差别
     * 激活状态只有两种，全部取消或者选中
     * 非激活状态只有一种，就是未选中
     */
    checkButton.addEventListener('click', function() {
        if (checkButton.classList.contains('active')) {
            checkButton.classList.remove('active');
            toSquare(checkButton);
        } else {
            checkButton.classList.add('active');
            toCheckSquare(checkButton);
        }
    });
    return checkButton;
}

function toDashSquare(checkButton) {
    checkButton.innerHTML= dashSquareIcon;
}

function toCheckSquare(checkButton) {
    checkButton.innerHTML= checkSquareIcon;
}

function toSquare(checkButton) {
    checkButton.innerHTML= squareIcon;
}

export { getCheckButton, toDashSquare, toCheckSquare, toSquare, dashSquareIcon, checkSquareIcon, squareIcon };