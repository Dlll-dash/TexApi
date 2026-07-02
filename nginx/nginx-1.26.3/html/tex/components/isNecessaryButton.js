
export function getIsNecessaryButton() {
    const isNecessaryButton = document.createElement('button');
    const isNecessaryTip = document.createElement('span'); 
    isNecessaryButton.innerHTML = '<i class="bi bi-asterisk"></i>';
    isNecessaryButton.className = 'is-necessary-btn';
    isNecessaryTip.className = 'is-necessary-tip';
    isNecessaryTip.textContent = '是否必须';
    isNecessaryTip.style.display = 'none';

    isNecessaryButton.addEventListener('mouseover', function(){
            isNecessaryTip.style.display = 'block';
    });
    isNecessaryButton.addEventListener('mouseout', function(){
        isNecessaryTip.style.display = 'none';
    });
    isNecessaryButton.addEventListener('click', function(){
        if(isNecessaryButton.classList.contains('active')){
            isNecessaryButton.classList.remove('active');
            isNecessaryTip.textContent = '是否必须';
        } else {
            isNecessaryButton.classList.add('active');
            isNecessaryTip.textContent = '必须';
        }
    });
    isNecessaryButton.appendChild(isNecessaryTip);

    return isNecessaryButton;
}
