let activeTypeListDiv = null;
let typeDropdownOutsideCloseBound = false;


function createTypeDropdown(typeList=[],typeInput,row) {
    // 创建类型下拉列表容器
        const typeDropdownDiv = document.createElement('div');
        typeDropdownDiv.className = 'type-list-div';
        typeDropdownDiv.style.display = 'none';
        row.appendChild(typeDropdownDiv);


        function placeTypeDropdownBelowInput() {
            const top = typeInput.offsetTop + typeInput.offsetHeight + 4;
            const left = typeInput.offsetLeft;
            typeDropdownDiv.style.top = `${top}px`;
            typeDropdownDiv.style.left = `${left}px`;
        }

    
        typeList.forEach(typeOption => {
            const option = document.createElement('button');
            option.className = 'type-option';
            option.textContent = typeOption;
            typeDropdownDiv.appendChild(option);

            option.addEventListener('click', function(e) {
                e.stopPropagation();
                typeInput.value = typeOption;
                closeActiveTypeDropdown();
                
            });
        });
        //下拉列表触发
        typeInput.addEventListener('click', function(e) {
            e.stopPropagation();
            if (activeTypeListDiv && activeTypeListDiv !== typeDropdownDiv) {
                activeTypeListDiv.style.display = 'none';
            }
            placeTypeDropdownBelowInput();
            typeDropdownDiv.style.display = 'block';
            activeTypeListDiv = typeDropdownDiv;
        });
        return typeDropdownDiv;
}


function closeActiveTypeDropdown() {
    if (!activeTypeListDiv) {
        return;
    }
    activeTypeListDiv.style.display = 'none';
    activeTypeListDiv = null;
}

function setupTypeDropdownClose() {
    if (typeDropdownOutsideCloseBound) {
        return;
    }
    document.addEventListener('click', closeActiveTypeDropdown);
    typeDropdownOutsideCloseBound = true;
}

export { createTypeDropdown, closeActiveTypeDropdown, setupTypeDropdownClose };